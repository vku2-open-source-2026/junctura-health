// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, SelectField, TextAreaField, TextField } from "@junctura/health-ui";
import { isDeskApiError, useDesk } from "./context";
import {
  PREFIXES,
  REFERENCE_PATTERN,
  URGENCIES,
  generateReference,
  latestDefinitionBy,
  openableKeysFor,
  participatingFacilities,
  type DefinitionItem,
  type Urgency,
} from "./data";
import { DeskPage } from "./layout";
import { DeskEmpty, DeskError, DeskLoading } from "./states";
import { deskStrings as s, facilityLabel, urgencyLabel } from "./strings";

const MAX_NOTE = 300;

/** Open case: start a shared workflow the staff's facility is allowed to open. */
export function OpenCasePage() {
  const { api, staff } = useDesk();
  const [definitions, setDefinitions] = useState<Record<string, DefinitionItem> | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);

  const load = useCallback(() => {
    setLoadError(null);
    setDefinitions(null);
    return api.getJson<{ items: readonly DefinitionItem[] }>("/v1/workflows/definitions")
      .then(list => setDefinitions(latestDefinitionBy(list.items.filter(item => item.key in PREFIXES))))
      .catch(setLoadError);
  }, [api]);

  useEffect(() => { void load(); }, [load]);

  const openableKeys = useMemo(() => openableKeysFor(staff.facility), [staff.facility]);

  if (loadError) {
    return (
      <DeskPage title={s.openCase.title} lead={s.openCase.lead} current="/ho-so/mo">
        <DeskError error={loadError} onRetry={() => void load()} />
      </DeskPage>
    );
  }
  if (!definitions) {
    return (
      <DeskPage title={s.openCase.title} lead={s.openCase.lead} current="/ho-so/mo">
        <DeskLoading lines={3} />
      </DeskPage>
    );
  }
  if (openableKeys.length === 0 || openableKeys.every(key => !(key in definitions))) {
    return (
      <DeskPage title={s.openCase.title} lead={s.openCase.lead} current="/ho-so/mo">
        <DeskEmpty title={s.openCase.noWorkflow} />
      </DeskPage>
    );
  }
  return <OpenCaseForm definitions={definitions} openableKeys={openableKeys} />;
}

function OpenCaseForm({ definitions, openableKeys }: { definitions: Record<string, DefinitionItem>; openableKeys: readonly string[] }) {
  const { api, staff } = useDesk();
  const [key, setKey] = useState(openableKeys[0]);
  const [reference, setReference] = useState(() => generateReference(PREFIXES[openableKeys[0]] ?? "CT-"));
  const [mucKhan, setMucKhan] = useState<Urgency>("thuong");
  const [coSoNhan, setCoSoNhan] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  // The same key on repeated clicks makes retries safe; a fresh key only on a new case.
  const idempotencyKey = useRef<string | null>(null);

  const receivers = useMemo(() => participatingFacilities(key), [key]);

  const changeKey = (nextKey: string) => {
    setKey(nextKey);
    setReference(generateReference(PREFIXES[nextKey] ?? "CT-"));
    setCoSoNhan("");
    setFormError(null);
  };

  const submit = async () => {
    if (!REFERENCE_PATTERN.test(reference)) {
      setFormError(s.openCase.referenceInvalid);
      return;
    }
    if (ghiChu.length > MAX_NOTE) {
      setFormError(s.openCase.ghiChuLong);
      return;
    }
    setFormError(null);
    setApiError(null);
    setSubmitting(true);
    idempotencyKey.current ??= crypto.randomUUID();
    try {
      const created = await api.postJson<{ id?: string }>("/v1/workflows/executions", {
        definitionId: definitions[key].id,
        input: {
          reference,
          openedBy: staff.facility,
          mucKhan,
          ...(coSoNhan ? { coSoNhan } : {}),
          ...(ghiChu.trim() ? { ghiChu: ghiChu.trim() } : {}),
        },
      }, { idempotencyKey: idempotencyKey.current });
      if (created?.id) {
        window.location.hash = `#/ho-so/${created.id}`;
        return;
      }
      setApiError(null);
      setFormError(s.openCase.failed);
    } catch (error) {
      setApiError(error);
      setFormError(isDeskApiError(error) ? null : s.openCase.failed);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DeskPage title={s.openCase.title} lead={s.openCase.lead} current="/ho-so/mo">
      <form
        className="max-w-xl space-y-5 rounded-lg border border-line bg-surface p-5 shadow-card"
        onSubmit={event => { event.preventDefault(); void submit(); }}
      >
        <SelectField
          label={s.openCase.workflow}
          value={key}
          onChange={event => changeKey(event.target.value)}
          options={openableKeys.map(option => ({ value: option, label: definitions[option].name }))}
        />
        <TextField
          label={s.openCase.reference}
          hint={s.openCase.referenceHint}
          error={formError === s.openCase.referenceInvalid ? formError : undefined}
          value={reference}
          onChange={event => { setReference(event.target.value); setFormError(null); }}
          className="font-mono uppercase"
        />
        <SelectField
          label={s.openCase.urgency}
          value={mucKhan}
          onChange={event => setMucKhan(event.target.value as Urgency)}
          options={URGENCIES.map(value => ({ value, label: urgencyLabel(value) }))}
        />
        {receivers.length > 0 ? (
          <SelectField
            label={s.openCase.coSoNhan}
            hint={s.openCase.coSoNhanHint}
            value={coSoNhan}
            onChange={event => setCoSoNhan(event.target.value)}
            options={receivers.map(value => ({ value, label: facilityLabel(value) }))}
            placeholder={s.openCase.coSoNhanEmpty}
          />
        ) : null}
        <TextAreaField
          label={s.openCase.ghiChu}
          hint={s.openCase.ghiChuHint}
          error={formError === s.openCase.ghiChuLong ? formError : undefined}
          value={ghiChu}
          maxLength={MAX_NOTE}
          rows={3}
          onChange={event => { setGhiChu(event.target.value); setFormError(null); }}
        />
        {apiError ? <DeskError error={apiError} onRetry={() => void submit()} /> : null}
        <Button type="submit" size="lg" loading={submitting}>{submitting ? s.openCase.submitting : s.openCase.submit}</Button>
        <p className="rounded-lg border border-dashed border-line bg-surface-2 px-4 py-3 text-sm text-ink-2">{s.openCase.noPatientNote}</p>
      </form>
    </DeskPage>
  );
}
