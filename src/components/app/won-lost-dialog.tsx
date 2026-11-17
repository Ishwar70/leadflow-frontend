"use client";

import { useState } from "react";
import { Trophy, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { toInputDate } from "@/lib/utils";

const REASONS = ["Budget constraints", "Chose a competitor", "No decision made", "Timing not right", "Requirements changed", "Other"];

/** Mount only while open so each opening starts with fresh values. */
export function WonLostDialog({
  mode,
  open,
  onOpenChange,
  defaultAmount,
  currency,
  onSubmit,
  loading,
}: {
  mode: "won" | "lost";
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultAmount: number;
  currency: string;
  onSubmit: (v: { finalAmount?: number; closedAt?: string; lostReason?: string }) => void;
  loading?: boolean;
}) {
  const [amount, setAmount] = useState(String(defaultAmount));
  const [date, setDate] = useState(() => toInputDate(new Date()));
  const [reason, setReason] = useState(REASONS[0]);
  const [detail, setDetail] = useState("");

  const submit = () => {
    if (mode === "won") onSubmit({ finalAmount: Number(amount || 0), closedAt: new Date(`${date}T12:00:00`).toISOString() });
    else onSubmit({ lostReason: reason === "Other" ? detail || "Other" : detail ? `${reason}: ${detail}` : reason });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title={
        <span className="flex items-center gap-2">
          {mode === "won" ? <Trophy className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-rose-600" />}
          {mode === "won" ? "Mark deal as won" : "Mark deal as lost"}
        </span>
      }
      description={mode === "won" ? "A final amount and close date are required." : "Recording why deals are lost improves forecasting."}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant={mode === "won" ? "success" : "danger"} onClick={submit} loading={loading} disabled={mode === "won" ? !amount || !date : reason === "Other" && !detail.trim()}>
            {mode === "won" ? "Mark won" : "Mark lost"}
          </Button>
        </>
      }
    >
      {mode === "won" ? (
        <div className="grid gap-4">
          <Field label={`Final amount (${currency})`} required>
            <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          </Field>
          <Field label="Close date" required>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
      ) : (
        <div className="grid gap-4">
          <Field label="Reason" required>
            <Select value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS.map((r) => <option key={r}>{r}</option>)}
            </Select>
          </Field>
          <Field label={reason === "Other" ? "Describe the reason" : "Details (optional)"} required={reason === "Other"}>
            <Textarea rows={3} value={detail} onChange={(e) => setDetail(e.target.value)} />
          </Field>
        </div>
      )}
    </Dialog>
  );
}
