// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
// Storage of the portal backend on Layer 1, through the `@junctura/server-client`
// SDK as the registered backend application (`health-portal-backend`):
//   - bang-tin: entries of the coordination notice board,
//   - ghi-chu: notes on a cross-facility record,
//   - tep-dinh-kem: metadata records of attachments; the bytes themselves live
//     in /v2/objects under a random UUID and the original file name only ever
//     appears in the metadata record, never as an API input of the object store.
import { randomUUID } from "node:crypto";

export const COLLECTIONS = Object.freeze({ notices: "bang-tin", notes: "ghi-chu", files: "tep-dinh-kem" });

// The npm SDK release does not know `listRecords(order, cursor)` yet, so listing
// goes through `request()` directly, matching the /v2/data list contract.
const MAX_PAGES = 5;
const PAGE_SIZE = 100;
const MAX_NOTES = 100;

const text = value => (typeof value === "string" ? value : "");
const authorOf = value => {
  const author = value?.author;
  return author && typeof author.displayName === "string" && typeof author.facility === "string"
    ? { displayName: author.displayName, facility: author.facility } : null;
};

/** The latest notice-board entries, newest first, at most 20 (one page). */
export async function latestNotices(junctura) {
  const response = await junctura.request(`/v2/data/${COLLECTIONS.notices}?limit=20&order=desc`);
  const { items } = await response.json();
  return (items ?? []).flatMap(item => {
    const author = authorOf(item.data);
    if (!item?.id || !item.data || !author) return [];
    return [{ id: item.id, title: text(item.data.title), body: text(item.data.body), author, createdAt: text(item.data.createdAt) || item.created_at }];
  });
}

/** Notes of one record, oldest first, at most 100 (up to five pages, then filtered). */
export async function notesForExecution(junctura, executionId) {
  const items = [];
  let cursor;
  for (let page = 0; page < MAX_PAGES && items.length < MAX_NOTES; page++) {
    const query = new URLSearchParams({ limit: String(PAGE_SIZE), order: "asc" });
    if (cursor) query.set("cursor", cursor);
    const result = await (await junctura.request(`/v2/data/${COLLECTIONS.notes}?${query}`)).json();
    for (const item of result.items ?? []) {
      const author = authorOf(item.data);
      if (item?.id && item.data && author && item.data.executionId === executionId) {
        items.push({ id: item.id, executionId, text: text(item.data.text), author, createdAt: text(item.data.createdAt) || item.created_at });
        if (items.length >= MAX_NOTES) break;
      }
    }
    cursor = result.nextCursor;
    if (!cursor) break;
  }
  return items;
}

/** Attachment metadata of one record, oldest first (up to five pages, then filtered). */
export async function filesForExecution(junctura, executionId) {
  const items = [];
  let cursor;
  for (let page = 0; page < MAX_PAGES; page++) {
    const query = new URLSearchParams({ limit: String(PAGE_SIZE), order: "asc" });
    if (cursor) query.set("cursor", cursor);
    const result = await (await junctura.request(`/v2/data/${COLLECTIONS.files}?${query}`)).json();
    for (const item of result.items ?? []) {
      const author = authorOf(item.data);
      if (item?.id && item.data && author && item.data.executionId === executionId) {
        items.push({
          id: item.id, executionId, name: text(item.data.name), type: text(item.data.type),
          bytes: Number.isInteger(item.data.bytes) ? item.data.bytes : 0, author,
          createdAt: text(item.data.createdAt) || item.created_at,
        });
      }
    }
    cursor = result.nextCursor;
    if (!cursor) break;
  }
  return items;
}

export async function createNotice(junctura, { title, body, author, createdAt }) {
  const record = await junctura.createRecord(COLLECTIONS.notices, { title, body, author, createdAt });
  return { id: record.id, title, body, author, createdAt };
}

export async function createNote(junctura, { executionId, text: note, author, createdAt }) {
  const record = await junctura.createRecord(COLLECTIONS.notes, { executionId, text: note, author, createdAt });
  return { id: record.id, executionId, text: note, author, createdAt };
}

/**
 * Uploads the bytes under a fresh UUID with `putObject` and stores the metadata
 * (including the original file name) as a record; the record id is the fileId
 * the API hands out.
 */
export async function createFile(junctura, { executionId, name, type, bytes, author, createdAt }) {
  const objectId = randomUUID();
  await junctura.putObject(objectId, bytes);
  const record = await junctura.createRecord(COLLECTIONS.files,
    { executionId, objectId, name, type, bytes: bytes.length, author, createdAt });
  return { id: record.id, executionId, name, type, bytes: bytes.length, author, createdAt };
}

/** The metadata record and the bytes of one attachment; null when it is gone. */
export async function readFile(junctura, fileId) {
  const record = await junctura.getRecord(COLLECTIONS.files, fileId);
  const data = record?.data;
  if (!data || typeof data.objectId !== "string" || !data.objectId) return null;
  const bytes = Buffer.from(await junctura.getObject(data.objectId));
  return { name: text(data.name), type: text(data.type), bytes };
}
