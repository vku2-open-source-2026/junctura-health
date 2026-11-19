// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@junctura/health-ui";
import { isDeskApiError, useDesk } from "./context";
import {
  REFERENCE_PATTERN,
  generateReference,
  latestDefinitionBy,
  type DefinitionItem,
} from "./data";
import { DeskPage } from "./layout";
import { DeskEmpty, DeskError, DeskLoading } from "./states";
import { deskStrings as s } from "./strings";

/** Which facility opens which shared workflow; the others open nothing. */
const OPENERS: Readonly<Record<string, string>> = {
  junctura_chuyen_tuyen: "tram-y-te",
  junctura_xac_minh_don_thuoc: "nha-thuoc",
  junctura_xac_minh_chi_phi: "bao-hiem",
};

/** Short reference-code prefixes per workflow key, for the generated codes. */
const PREFIXES: Readonly<Record<string, string>> = {
  junctura_chuyen_tuyen: "CT-",
  junctura_xac_minh_don_thuoc: "DT-",
  junctura_xac_minh_chi_phi: "CP-",
};

/** Open case: start a shared workflow the staff's facility is allowed to open. */
export function OpenCasePage() {
  const { api, staff } = useDesk();
  const [definitions, setDefinitions] = useState<Record<string, DefinitionItem> | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);

  const load = useCallback(() => {
    setLoadError(null);
    setDefinitions(null);
    return api.getJson<{ items: readonly DefinitionItem[] }>("/v1/workflows/definitions")
      .then(list => setDefinitions(latestDefinitionBy(list.items.filter(item => item.key in OPENERS))))
      .catch(setLoadError);
  }, [api]);

  useEffect(() => { void load(); }, [load]);

  const openableKeys = useMemo(
    () => Object.keys(OPENERS).filter(key => OPENERS[key] === staff.facility),
    [staff.facility],
  );

  if (loadError) {
    return (
      <DeskPage title={s.openCase.title} lead={s.openCase.lead} current="/dieu-phoi/mo-ho-so">
        <DeskError error={loadError} onRetry={() => void load()} />
      </DeskPage>
    );
  }
  if (!definitions) {
    return (
      <DeskPage title={s.openCase.title} lead={s.openCase.lead} current="/dieu-phoi/mo-ho-so">
        <DeskLoading lines={3} />
      </DeskPage>
    );
  }
  if (openableKeys.length === 0 || openableKeys.every(key => !(key in definitions))) {
    return (
      <DeskPage title={s.openCase.title} lead={s.openCase.lead} current="/dieu-phoi/mo-ho-so">
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
  const [formError, setFormError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  // The same key on repeated clicks makes retries safe; a fresh key only on a new case.
  const idempotencyKey = useRef<string | null>(null);

  const changeKey = (nextKey: string) => {
    setKey(nextKey);
    setReference(generateReference(PREFIXES[nextKey] ?? "CT-"));
    setFormError(null);
  };

  const submit = async () => {
    if (!REFERENCE_PATTERN.test(reference)) {
      setFormError(s.openCase.referenceInvalid);
      return;
    }
    setFormError(null);
    setApiError(null);
    setSubmitting(true);
    idempotencyKey.current ??= crypto.randomUUID();
    try {
      const created = await api.postJson<{ id?: string }>("/v1/workflows/executions", {
        definitionId: definitions[key].id,
        input: { reference, openedBy: staff.facility },
      }, { idempotencyKey: idempotencyKey.current });
      if (created?.id) {
        window.location.hash = `#/dieu-phoi/ho-so/${created.id}`;
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
    <DeskPage title={s.openCase.title} lead={s.openCase.lead} current="/dieu-phoi/mo-ho-so">
      <form
        className="max-w-xl space-y-5 rounded-lg border border-line bg-surface p-5 shadow-card"
        onSubmit={event => { event.preventDefault(); void submit(); }}
      >
        <div>
          <label htmlFor="open-key" className="text-sm font-medium">{s.openCase.workflow}</label>
          <select
            id="open-key"
            value={key}
            onChange={event => changeKey(event.target.value)}
            className="mt-1 block w-full rounded-lg border border-control bg-surface px-3 py-2 text-sm"
          >
            {openableKeys.map(option => (
              <option key={option} value={option}>{definitions[option].name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="open-reference" className="text-sm font-medium">{s.openCase.reference}</label>
          <input
            id="open-reference"
            value={reference}
            onChange={event => { setReference(event.target.value); setFormError(null); }}
            aria-invalid={formError ? true : undefined}
            aria-describedby={formError ? "open-reference-error" : "open-reference-hint"}
            className="mt-1 block w-full rounded-lg border border-control bg-surface px-3 py-2 font-mono text-sm uppercase"
          />
          <p id="open-reference-hint" className="mt-1 text-xs text-muted">{s.openCase.referenceHint}</p>
          {formError && <p id="open-reference-error" role="alert" className="mt-1 text-sm text-danger">{formError}</p>}
        </div>
        {apiError ? <DeskError error={apiError} onRetry={() => void submit()} /> : null}
        <Button type="submit" size="lg" loading={submitting}>{submitting ? s.openCase.submitting : s.openCase.submit}</Button>
        <p className="rounded-lg border border-dashed border-line bg-surface-2 px-4 py-3 text-sm text-ink-2">{s.openCase.noPatientNote}</p>
      </form>
    </DeskPage>
  );
}
