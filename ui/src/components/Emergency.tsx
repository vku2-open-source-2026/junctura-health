// SPDX-FileCopyrightText: 2026 Junctura Contributors
// SPDX-License-Identifier: Apache-2.0
import { Siren } from "lucide-react";
import { useState } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { TextAreaField } from "./Fields";

/** Persistent bar shown while emergency access is active. */
export function EmergencyBar({ reason, onEnd }: { reason: string; onEnd?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 border-b border-danger-line bg-danger-soft px-4 py-2 text-sm text-danger">
      <Siren aria-hidden className="size-4 shrink-0" />
      <p className="flex-1 font-semibold">Đang truy cập khẩn cấp. Mọi thao tác được ghi nhật ký. Lý do: <span className="font-normal">{reason}</span></p>
      {onEnd && <Button size="md" variant="secondary" onClick={onEnd}>Kết thúc truy cập khẩn cấp</Button>}
    </div>
  );
}

const MIN_REASON = 10;

/** Two steps: write a reason, then confirm. The reason is required and is recorded with the access. */
export function EmergencyDialog({ open, patientLabel, onConfirm, onCancel }: { open: boolean; patientLabel: string; onConfirm: (reason: string) => void; onCancel: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const reset = () => { setStep(1); setReason(""); setError(undefined); };
  const cancel = () => { reset(); onCancel(); };
  const next = () => {
    if (reason.trim().length < MIN_REASON) return setError(`Nhập lý do ít nhất ${MIN_REASON} ký tự.`);
    setError(undefined); setStep(2);
  };
  const confirm = () => { const value = reason.trim(); reset(); onConfirm(value); };

  return (
    <Dialog open={open} title={step === 1 ? "Truy cập khẩn cấp" : "Xác nhận truy cập khẩn cấp"} onClose={cancel}
      footer={step === 1 ? <>
        <Button variant="secondary" onClick={cancel}>Huỷ</Button>
        <Button onClick={next}>Tiếp tục</Button>
      </> : <>
        <Button variant="secondary" onClick={() => setStep(1)} autoFocus>Quay lại</Button>
        <Button variant="danger" onClick={confirm}>Xác nhận truy cập khẩn cấp</Button>
      </>}>
      {step === 1 ? (
        <div className="space-y-3">
          <p>Chỉ dùng khi người bệnh đang nguy kịch và không thể xin đồng ý. Truy cập này sẽ được ghi nhật ký và người bệnh có thể xem lại.</p>
          <TextAreaField label="Lý do truy cập khẩn cấp" required value={reason} error={error} onChange={event => setReason(event.target.value)} />
        </div>
      ) : (
        <p>Bạn sắp truy cập hồ sơ của <strong>{patientLabel}</strong> với lý do: “{reason.trim()}”. Thao tác này được ghi nhật ký và không thể hoàn tác.</p>
      )}
    </Dialog>
  );
}
