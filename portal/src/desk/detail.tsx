// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useRef, useState } from "react";
import { Badge, Button, ConfirmDialog, TextAreaField, formatDateTime, formatNumber, type Tone } from "@junctura/health-ui";
import { isDeskApiError, useDesk } from "./context";
import {
  urgencyOf,
  waitsForFacility,
  workflowFor,
  type CaseNote,
  type ExecutionDetail,
  type ExecutionItem,
  type ExecutionList,
  type FileList,
  type FileMeta,
  type NoteList,
} from "./data";
import { DeskPage } from "./layout";
import { DeskError, DeskLoading } from "./states";
import { deskStrings as s, facilityLabel, statusLabel, urgencyLabel, type ExecutionStatus } from "./strings";

const STATUS_TONES: Readonly<Record<ExecutionStatus, Tone>> = {
  running: "brand",
  completed: "ok",
  cancelled: "neutral",
};

/** Case detail: the workflow steps with progress, the complete action, the form fields, the notes and the attachments. */
export function CaseDetailPage({ id }: { id: string }) {
  const { api, staff } = useDesk();
  const [detail, setDetail] = useState<ExecutionDetail | null>(null);
  const [item, setItem] = useState<ExecutionItem | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [confirming, setConfirming] = useState(false);
  const [completing, setCompleting] = useState(false);

  const load = useCallback(() => {
    setError(null);
    return Promise.all([
      api.getJson<ExecutionDetail>(`/v1/workflows/executions/${id}`),
      api.getJson<ExecutionList>("/v1/workflows/executions?limit=100"),
    ])
      .then(([detailResult, listResult]) => {
        setDetail(detailResult);
        setItem(listResult.items.find(candidate => candidate.id === id) ?? null);
      })
      .catch(setError);
  }, [api, id]);

  useEffect(() => { void load(); }, [load]);

  const complete = async () => {
    setCompleting(true);
    try {
      await api.postJson(`/v1/workflows/executions/${id}/complete`, {});
      await load();
    } catch (completeError) {
      setError(completeError);
      setItem(null);
      setDetail(null);
    } finally {
      setCompleting(false);
      setConfirming(false);
    }
  };

  if (error) {
    return (
      <DeskPage title={s.detail.title} current={`/ho-so/${id}`}>
        <DeskError error={error} onRetry={() => void load()} />
      </DeskPage>
    );
  }
  if (!detail) {
    return (
      <DeskPage title={s.detail.title} current={`/ho-so/${id}`}>
        <DeskLoading />
      </DeskPage>
    );
  }

  const workflow = workflowFor(item?.definition.key ?? "");
  const currentName = item?.currentStep?.name ?? null;
  const currentIndex = currentName === null || !workflow ? -1 : workflow.steps.findIndex(step => step.name === currentName);
  const canComplete = item != null && waitsForFacility(item, staff.facility);
  const openedBy = typeof detail.input?.openedBy === "string" ? detail.input.openedBy : null;
  const reference = typeof detail.input?.reference === "string" ? detail.input.reference : null;
  const mucKhan = urgencyOf(detail.input?.mucKhan);
  const coSoNhan = typeof detail.input?.coSoNhan === "string" ? detail.input.coSoNhan : null;
  const ghiChu = typeof detail.input?.ghiChu === "string" ? detail.input.ghiChu : null;

  return (
    <DeskPage title={s.detail.title} current={`/ho-so/${id}`}>
      <p><a href="#/ho-so" className="text-sm font-medium text-brand hover:underline">← {s.detail.backToList}</a></p>

      <div className="mt-6 rounded-lg border border-line bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{item?.title ?? reference ?? detail.id}</h2>
          <Badge tone={STATUS_TONES[detail.status]}>{statusLabel[detail.status]}</Badge>
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">{s.detail.reference}</dt>
            <dd className="mt-0.5 font-mono text-sm">{reference ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">{s.detail.openedBy}</dt>
            <dd className="mt-0.5 text-sm">{openedBy ? facilityLabel(openedBy) : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">{s.detail.workflow}</dt>
            <dd className="mt-0.5 text-sm">{item?.definition.name ?? detail.definitionId}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">{s.detail.updated}</dt>
            <dd className="mt-0.5 text-sm">{item?.updatedAt ?? "—"}</dd>
          </div>
        </dl>
        {item?.currentStep && (
          <p className="mt-4 text-sm text-ink-2">
            <span className="font-medium">{s.detail.currentStep}: </span>
            {item.currentStep.name}
            {item.currentStep.assignee ? ` (${item.currentStep.assignee})` : ""}
          </p>
        )}
        {staff.facility === "so-y-te" && <p className="mt-4 text-sm text-muted">{s.detail.readonly}</p>}
        {canComplete && (
          <div className="mt-5">
            <Button onClick={() => setConfirming(true)} loading={completing}>
              {s.detail.completeStep} {currentName}
            </Button>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-line bg-surface p-5 shadow-card">
        <h3 className="text-base font-semibold">{s.detail.form.title}</h3>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">{s.detail.form.mucKhan}</dt>
            <dd className="mt-0.5 text-sm">{mucKhan ? urgencyLabel(mucKhan) : s.detail.form.none}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted">{s.detail.form.coSoNhan}</dt>
            <dd className="mt-0.5 text-sm">{coSoNhan ? facilityLabel(coSoNhan) : s.detail.form.none}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wide text-muted">{s.detail.form.ghiChu}</dt>
            <dd className="mt-0.5 whitespace-pre-line text-sm">{ghiChu ?? s.detail.form.none}</dd>
          </div>
        </dl>
      </div>

      {workflow && (
        <div className="mt-6 rounded-lg border border-line bg-surface p-5 shadow-card">
          <h3 className="text-base font-semibold">{s.detail.steps}</h3>
          <ol className="mt-4 space-y-3">
            {workflow.steps.map((step, index) => {
              const done = detail.status === "completed" || (currentIndex >= 0 && index < currentIndex);
              const current = detail.status === "running" && index === currentIndex;
              return (
                <li key={step.id} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className={
                      done
                        ? "grid size-7 shrink-0 place-items-center rounded-full bg-ok-soft text-sm font-semibold text-ok"
                        : current
                          ? "grid size-7 shrink-0 place-items-center rounded-full bg-brand text-sm font-semibold text-on-brand"
                          : "grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-sm font-semibold text-muted"
                    }
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {step.name || step.id}
                      {done && <span className="ml-2 text-xs font-normal text-ok">{s.detail.stepDone}</span>}
                      {current && <span className="ml-2 text-xs font-normal text-brand">{s.detail.stepCurrent}</span>}
                      {!done && !current && <span className="ml-2 text-xs font-normal text-muted">{s.detail.stepFuture}</span>}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      <span className="sr-only">{s.detail.currentStep}: </span>
                      {step.groups.length > 0 ? step.groups.map(facilityLabel).join(", ") : s.detail.stepNoGroups}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <CaseNotes id={id} />
        <CaseFiles id={id} />
      </div>

      <ConfirmDialog
        open={confirming}
        title={s.detail.confirmTitle}
        description={s.detail.confirmDescription}
        confirmLabel={s.detail.confirmLabel}
        loading={completing}
        onConfirm={() => void complete()}
        onCancel={() => setConfirming(false)}
      />
    </DeskPage>
  );
}

/** P · Trao đổi: the exchange notes of the case, oldest first, plus the input for a new note. */
function CaseNotes({ id }: { id: string }) {
  const { api } = useDesk();
  const [notes, setNotes] = useState<readonly CaseNote[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [text, setText] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    setError(null);
    return api.getJson<NoteList>(`/api/ho-so/${id}/ghi-chu`)
      .then(list => setNotes(list.items))
      .catch(setError);
  }, [api, id]);

  useEffect(() => { void load(); }, [load]);

  const send = async () => {
    const value = text.trim();
    if (!value) return;
    setSendError(null);
    setSending(true);
    try {
      const created = await api.postJson<CaseNote>(`/api/ho-so/${id}/ghi-chu`, { text: value });
      setText("");
      if (created) setNotes(current => [...(current ?? []), created]);
      else await load();
    } catch {
      setSendError(s.detail.notes.failed);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-lg border border-line bg-surface shadow-card">
      <header className="border-b border-line px-5 py-3">
        <h3 className="text-base font-semibold">{s.detail.notes.title}</h3>
        <p className="mt-0.5 text-xs text-muted">{s.detail.notes.lead}</p>
      </header>
      <div className="px-5 py-4">
        {error ? (
          <DeskError error={error} onRetry={() => void load()} />
        ) : notes === null ? (
          <DeskLoading lines={3} />
        ) : notes.length === 0 ? (
          <p className="text-sm text-ink-2">{s.detail.notes.empty}</p>
        ) : (
          <ol className="space-y-3">
            {notes.map(note => (
              <li key={note.id} className="rounded-lg border border-line bg-surface-2 px-4 py-3">
                <p className="whitespace-pre-line text-sm">{note.text}</p>
                <p className="mt-1 text-xs text-muted">
                  {note.author.displayName} · {facilityLabel(note.author.facility)} · {formatDateTime(note.createdAt)}
                </p>
              </li>
            ))}
          </ol>
        )}
        <form
          className="mt-4 space-y-3 border-t border-line pt-4"
          onSubmit={event => { event.preventDefault(); void send(); }}
        >
          <TextAreaField
            label={s.detail.notes.input}
            hint={s.detail.notes.inputHint}
            error={sendError ?? undefined}
            value={text}
            maxLength={1000}
            rows={3}
            onChange={event => { setText(event.target.value); setSendError(null); }}
          />
          <Button type="submit" loading={sending} disabled={text.trim().length === 0}>
            {sending ? s.detail.notes.submitting : s.detail.notes.submit}
          </Button>
        </form>
      </div>
    </div>
  );
}

/** The attachment kinds the gateway accepts and the byte cap it enforces. */
const ALLOWED_FILE_TYPES = new Set(["application/pdf", "image/png", "image/jpeg"]);
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_FILE_NAME = 120;

/** P · Tệp đính kèm: the attachments of the case, with a validated upload and a blob download. */
function CaseFiles({ id }: { id: string }) {
  const { api } = useDesk();
  const [files, setFiles] = useState<readonly FileMeta[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setError(null);
    return api.getJson<FileList>(`/api/ho-so/${id}/tep`)
      .then(list => setFiles(list.items))
      .catch(setError);
  }, [api, id]);

  useEffect(() => { void load(); }, [load]);

  /** Checks kind, size and name length before anything is sent. */
  const problemOf = (candidate: File): string | null => {
    if (!ALLOWED_FILE_TYPES.has(candidate.type)) return s.detail.files.wrongType;
    if (candidate.size > MAX_FILE_BYTES) return s.detail.files.tooLarge;
    if (candidate.name.length > MAX_FILE_NAME) return s.detail.files.nameTooLong;
    return null;
  };

  const pick = (candidate: File | null) => {
    setFile(candidate);
    setMessage(null);
  };

  const upload = async () => {
    if (!file) {
      setMessage(s.detail.files.noFile);
      return;
    }
    const problem = problemOf(file);
    if (problem) {
      setMessage(problem);
      return;
    }
    setMessage(null);
    setBusy(true);
    try {
      await api.postBytes<FileMeta>(`/api/ho-so/${id}/tep`, file, {
        "Content-Type": file.type,
        "X-File-Name": encodeURIComponent(file.name),
      });
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setMessage(s.detail.files.uploaded);
      await load();
    } catch (uploadError) {
      if (isDeskApiError(uploadError) && uploadError.status === 422) setMessage(s.detail.files.malware);
      else if (isDeskApiError(uploadError) && uploadError.status === 413) setMessage(s.detail.files.tooLarge);
      else if (isDeskApiError(uploadError) && uploadError.status === 415) setMessage(s.detail.files.wrongType);
      else setMessage(s.detail.files.failed);
    } finally {
      setBusy(false);
    }
  };

  /** Downloads with the session token via getBlob, hands the blob to the browser, revokes the URL. */
  const download = async (meta: FileMeta) => {
    setMessage(null);
    try {
      const blob = await api.getBlob(`/api/tep/${meta.id}`);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = meta.name;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setMessage(s.detail.files.downloadFailed);
    }
  };

  return (
    <div className="rounded-lg border border-line bg-surface shadow-card">
      <header className="border-b border-line px-5 py-3">
        <h3 className="text-base font-semibold">{s.detail.files.title}</h3>
        <p className="mt-0.5 text-xs text-muted">{s.detail.files.lead}</p>
      </header>
      <div className="px-5 py-4">
        {error ? (
          <DeskError error={error} onRetry={() => void load()} />
        ) : files === null ? (
          <DeskLoading lines={3} />
        ) : files.length === 0 ? (
          <p className="text-sm text-ink-2">{s.detail.files.empty}</p>
        ) : (
          <ul className="space-y-3">
            {files.map(fileMeta => (
              <li key={fileMeta.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-lg border border-line bg-surface-2 px-4 py-3">
                <span className="min-w-0 break-all font-medium">{fileMeta.name}</span>
                <span className="text-xs text-muted">{formatNumber(fileMeta.bytes)} {s.detail.files.bytes}</span>
                <Button variant="secondary" onClick={() => void download(fileMeta)}>{s.detail.files.download}</Button>
              </li>
            ))}
          </ul>
        )}
        <form
          className="mt-4 space-y-3 border-t border-line pt-4"
          onSubmit={event => { event.preventDefault(); void upload(); }}
        >
          <label className="block">
            <span className="text-sm font-medium">{s.detail.files.choose}</span>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              aria-describedby={message ? "case-file-message" : undefined}
              onChange={event => pick(event.target.files?.[0] ?? null)}
              className="mt-1 block w-full rounded-lg border border-control bg-surface px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-soft file:px-3 file:py-1 file:text-sm file:font-medium file:text-brand"
            />
          </label>
          {message && <p id="case-file-message" role="alert" className="text-sm text-danger">{message}</p>}
          <Button type="submit" loading={busy}>{busy ? s.detail.files.submitting : s.detail.files.submit}</Button>
        </form>
      </div>
    </div>
  );
}
