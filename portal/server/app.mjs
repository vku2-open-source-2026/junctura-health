// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
// Request handler of the portal backend, the JSON API of `/api` behind Junctura
// sign-in. Every dependency is injected, so the router is testable without any
// network: `verifyToken` (JWKS), `junctura` (the SDK client of the backend
// application), `fetchExecution` (profile existence on Layer 1 with the caller's
// token), `staffFor` (seed accounts) and `now`. Errors are `{ error: code }`.
// Nothing is ever logged here: no tokens, no note or file content.
import { AuthError } from "./jwt.mjs";
import { COLLECTIONS, createFile, createNote, createNotice, filesForExecution, latestNotices, notesForExecution, readFile } from "./store.mjs";

export class ApiError extends Error {
  constructor(status, code) {
    super(code);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

const EXECUTION_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const MAX_JSON = 64 * 1024;
const MAX_FILE = 5 * 1024 * 1024;
const FILE_TYPES = new Set(["application/pdf", "image/png", "image/jpeg"]);
const NOTICE_TITLE = { min: 1, max: 120 };
const NOTICE_BODY = { min: 1, max: 2000 };
const NOTE_TEXT = { min: 1, max: 1000 };

const lengthOf = value => [...String(value)].length;
const authorOf = staff => ({ displayName: staff.displayName, facility: staff.facility });

const within = (value, { min, max }) => typeof value === "string" && lengthOf(value) >= min && lengthOf(value) <= max;

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    ...headers,
  });
  res.end(body === undefined ? "" : JSON.stringify(body));
};

/** A JSON body of a write: `application/json` only, at most 64 KiB, one object. */
async function readJson(req) {
  if (!/^application\/json\b/i.test(String(req.headers["content-type"] ?? ""))) throw new ApiError(415, "unsupported_type");
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_JSON) throw new ApiError(413, "too_large");
    chunks.push(chunk);
  }
  let parsed;
  try {
    parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ApiError(400, "invalid_input");
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new ApiError(400, "invalid_input");
  return parsed;
}

/** Raw attachment bytes: an allowed media type, a decodable `X-File-Name` of at most 120 characters, at most 5 MiB. */
async function readFileBody(req) {
  const type = String(req.headers["content-type"] ?? "").split(";")[0].trim().toLowerCase();
  if (!FILE_TYPES.has(type)) throw new ApiError(415, "unsupported_type");
  let name;
  try {
    name = decodeURIComponent(String(req.headers["x-file-name"] ?? ""));
  } catch {
    throw new ApiError(400, "invalid_input");
  }
  if (!name || lengthOf(name) > 120 || /[\r\n\0]/.test(name)) throw new ApiError(400, "invalid_input");
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_FILE) throw new ApiError(413, "too_large");
    chunks.push(chunk);
  }
  const bytes = Buffer.concat(chunks);
  if (bytes.length === 0) throw new ApiError(400, "invalid_input");
  return { name, type, bytes };
}

/** The route returns a response, or throws. `token` is the caller's access token. */
export function createApp({ verifyToken, junctura, fetchExecution, staffFor, now = () => new Date() }) {
  async function authenticate(req) {
    const match = /^Bearer (\S+)$/.exec(String(req.headers.authorization ?? ""));
    if (!match) throw new ApiError(401, "unauthorized");
    const claims = await verifyToken(match[1]);
    const staff = staffFor(claims?.preferred_username);
    if (!staff) throw new ApiError(403, "forbidden");
    return { staff, token: match[1] };
  }

  /** The record must exist on Layer 1, checked with the caller's own token. */
  async function needExecution(executionId, token) {
    const outcome = await fetchExecution(executionId, token);
    if (outcome?.status === 404) throw new ApiError(404, "not_found");
    if (!outcome?.ok) throw new ApiError(503, "junctura_unavailable");
  }

  async function route(req, url, { staff, token }) {
    const { method } = req;
    const path = url.pathname;
    const segments = path.split("/").filter(Boolean);
    const stamp = () => now().toISOString();

    if (path === "/api/me" && method === "GET") {
      return [200, { username: staff.username, displayName: staff.displayName, facility: staff.facility }];
    }

    if (path === "/api/bang-tin") {
      if (method === "GET") return [200, { items: await latestNotices(junctura) }];
      if (method === "POST") {
        if (staff.facility !== "so-y-te") throw new ApiError(403, "forbidden");
        const input = await readJson(req);
        if (!within(input.title, NOTICE_TITLE) || !within(input.body, NOTICE_BODY)) throw new ApiError(400, "invalid_input");
        const notice = await createNotice(junctura, { title: input.title, body: input.body, author: authorOf(staff), createdAt: stamp() });
        return [201, notice];
      }
      return [404, { error: "not_found" }];
    }

    // /api/ho-so/{executionId}/ghi-chu and /api/ho-so/{executionId}/tep
    if (segments.length === 4 && segments[0] === "api" && segments[1] === "ho-so" && (segments[3] === "ghi-chu" || segments[3] === "tep")) {
      const executionId = segments[2];
      if (!EXECUTION_ID.test(executionId)) throw new ApiError(400, "invalid_input");
      await needExecution(executionId, token);
      if (segments[3] === "ghi-chu") {
        if (method === "GET") return [200, { items: await notesForExecution(junctura, executionId) }];
        if (method === "POST") {
          const input = await readJson(req);
          if (!within(input.text, NOTE_TEXT)) throw new ApiError(400, "invalid_input");
          const note = await createNote(junctura, { executionId, text: input.text, author: authorOf(staff), createdAt: stamp() });
          return [201, note];
        }
      } else if (method === "GET") {
        return [200, { items: await filesForExecution(junctura, executionId) }];
      } else if (method === "POST") {
        const { name, type, bytes } = await readFileBody(req);
        const meta = await createFile(junctura, { executionId, name, type, bytes, author: authorOf(staff), createdAt: stamp() });
        return [201, meta];
      }
      return [404, { error: "not_found" }];
    }

    // /api/tep/{fileId}
    if (segments.length === 3 && segments[0] === "api" && segments[1] === "tep" && method === "GET") {
      const fileId = segments[2];
      if (!EXECUTION_ID.test(fileId)) throw new ApiError(400, "invalid_input");
      const file = await readFile(junctura, fileId);
      if (!file) throw new ApiError(404, "not_found");
      const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`;
      return [200, file.bytes, {
        "content-type": FILE_TYPES.has(file.type) ? file.type : "application/octet-stream",
        "content-disposition": disposition,
        "content-length": String(file.bytes.length),
      }];
    }

    return null;
  }

  return async function handler(req, res) {
    let url;
    try {
      url = new URL(req.url, "http://portal.local");
    } catch {
      return send(res, 400, { error: "invalid_input" });
    }
    try {
      if (url.pathname === "/api" || !url.pathname.startsWith("/api/") || url.pathname.includes("//")) return send(res, 404, { error: "not_found" });
      const caller = await authenticate(req);
      const outcome = await route(req, url, caller);
      if (!outcome) return send(res, 404, { error: "not_found" });
      const [status, body, headers] = outcome;
      if (Buffer.isBuffer(body)) {
        res.writeHead(status, { "x-content-type-options": "nosniff", ...headers });
        return res.end(body);
      }
      return send(res, status, body, headers);
    } catch (error) {
      if (error instanceof ApiError) return send(res, error.status, { error: error.code });
      if (error instanceof AuthError) return send(res, 401, { error: "unauthorized" });
      const upstream = error?.name === "JuncturaError";
      if (upstream && error.status === 404) return send(res, 404, { error: "not_found" });
      if (upstream && (error.status === 422 || error.code === "malware_detected")) return send(res, 422, { error: "malware_detected" });
      return send(res, 503, { error: "junctura_unavailable" });
    }
  };
}
