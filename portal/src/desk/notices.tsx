// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button, Card, TextField, TextAreaField, formatDateTime } from "@junctura/health-ui";
import { isDeskApiError, useDesk } from "./context";
import type { Notice, NoticeList } from "./data";
import { DeskPage } from "./layout";
import { DeskEmpty, DeskError, DeskLoading } from "./states";
import { deskStrings as s, facilityLabel } from "./strings";

/**
 * H · Bảng tin: the notices of the health department for all participating facilities.
 * Only the health department sees the form to publish a notice; everyone else reads.
 */
export function NoticesPage() {
  const { api, staff } = useDesk();
  const [notices, setNotices] = useState<readonly Notice[] | null>(null);
  const [error, setError] = useState<unknown>(null);

  const load = useCallback(() => {
    setError(null);
    return api.getJson<NoticeList>("/api/bang-tin")
      .then(list => setNotices(list.items))
      .catch(setError);
  }, [api]);

  useEffect(() => { void load(); }, [load]);

  return (
    <DeskPage title={s.notices.title} lead={s.notices.lead} current="/lam-viec/bang-tin">
      {staff.facility === "so-y-te" && <NoticeForm onPosted={() => void load()} />}
      {error ? (
        <div className="mt-8"><DeskError error={error} onRetry={() => void load()} /></div>
      ) : notices === null ? (
        <div className="mt-8"><DeskLoading lines={4} /></div>
      ) : notices.length === 0 ? (
        <div className="mt-8"><DeskEmpty title={s.notices.empty} /></div>
      ) : (
        <ul className="mt-8 divide-y divide-line rounded-lg border border-line bg-surface shadow-card">
          {notices.map(notice => (
            <li key={notice.id} className="px-5 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="text-base font-semibold">{notice.title}</h2>
                <p className="text-xs text-muted">{formatDateTime(notice.createdAt)}</p>
              </div>
              <p className="mt-1 whitespace-pre-line text-sm text-ink-2">{notice.body}</p>
              <p className="mt-2 text-xs text-muted">
                {notice.author.displayName} · {facilityLabel(notice.author.facility)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </DeskPage>
  );
}

/** The publish form; rendered only for the health department. */
function NoticeForm({ onPosted }: { onPosted: () => void }) {
  const { api } = useDesk();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [posted, setPosted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setPosted(false);
    setApiError(null);
    if (title.length < 1 || title.length > 120 || body.length < 1 || body.length > 2000) {
      setFormError(s.notices.invalid);
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await api.postJson("/api/bang-tin", { title, body });
      setTitle("");
      setBody("");
      setPosted(true);
      onPosted();
    } catch (publishError) {
      setApiError(
        isDeskApiError(publishError) && publishError.status === 403
          ? s.notices.publishForbidden
          : s.notices.failed,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card title={s.notices.formTitle} className="mb-8">
      <form className="max-w-xl space-y-4" onSubmit={event => void submit(event)}>
        <TextField
          label={s.notices.titleLabel}
          hint={s.notices.titleHint}
          error={formError ?? undefined}
          value={title}
          maxLength={120}
          onChange={event => { setTitle(event.target.value); setFormError(null); }}
        />
        <TextAreaField
          label={s.notices.bodyLabel}
          hint={s.notices.bodyHint}
          value={body}
          maxLength={2000}
          rows={4}
          onChange={event => setBody(event.target.value)}
        />
        {apiError && <p role="alert" className="text-sm text-danger">{apiError}</p>}
        {posted && <p role="status" className="text-sm text-ok">{s.notices.posted}</p>}
        <Button type="submit" loading={submitting}>{submitting ? s.notices.submitting : s.notices.submit}</Button>
        <p className="rounded-lg border border-dashed border-line bg-surface-2 px-4 py-3 text-sm text-ink-2">{s.notices.formNote}</p>
      </form>
    </Card>
  );
}
