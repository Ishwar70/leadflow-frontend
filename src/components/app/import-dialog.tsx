"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Download, FileSpreadsheet, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/form";
import { api, errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const FIELDS = [
  { value: "", label: "Don't import" },
  { value: "firstName", label: "First name (or full name)" },
  { value: "lastName", label: "Last name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "companyName", label: "Company" },
  { value: "jobTitle", label: "Job title" },
  { value: "source", label: "Source" },
  { value: "status", label: "Status" },
  { value: "estimatedValue", label: "Estimated value" },
  { value: "city", label: "City" },
  { value: "country", label: "Country" },
  { value: "tags", label: "Tags" },
];

interface Preview {
  headers: string[];
  totalRows: number;
  preview: Record<string, string>[];
  suggestedMapping: Record<string, string>;
}

interface RowIssue {
  row: number;
  message: string;
  data: Record<string, string>;
}

interface Result {
  total: number;
  created: number;
  skipped: RowIssue[];
  errors: RowIssue[];
}

const SAMPLE = `First name,Last name,Email,Phone,Company,Source,Estimated value,City
Rahul,Sharma,rahul.sharma@example.com,9876543210,ABC Hotels,website,250000,Mumbai
Ananya,Iyer,ananya@example.com,+91 98450 12345,Wellspring Health,referral,120000,Bengaluru`;

function downloadText(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function issuesToCsv(issues: RowIssue[]) {
  const headers = Array.from(new Set(issues.flatMap((i) => Object.keys(i.data))));
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [["row", "error", ...headers].join(","), ...issues.map((i) => [i.row, i.message, ...headers.map((h) => i.data[h])].map(esc).join(","))].join("\n");
}

export function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [strategy, setStrategy] = useState<"skip" | "create">("skip");
  const [result, setResult] = useState<Result | null>(null);

  const reset = () => {
    setCsv("");
    setFileName("");
    setPreview(null);
    setMapping({});
    setResult(null);
  };

  const previewMut = useMutation({
    mutationFn: (text: string) => api.post<Preview>("/leads/import/preview", { csv: text }),
    onSuccess: (p) => {
      setPreview(p);
      setMapping(p.suggestedMapping);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const importMut = useMutation({
    mutationFn: () => api.post<Result>("/leads/import", { csv, mapping, duplicateStrategy: strategy }),
    onSuccess: (r) => {
      setResult(r);
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) return toast.error("CSV must be smaller than 2.5 MB");
    const text = await file.text();
    setCsv(text);
    setFileName(file.name);
    previewMut.mutate(text);
  };

  const mappedFirst = Object.values(mapping).includes("firstName");

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setTimeout(reset, 200);
      }}
      title="Import leads from CSV"
      description="Upload a CSV, map the columns and we'll validate every row before importing."
      size="xl"
      footer={
        result ? (
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        ) : preview ? (
          <>
            <Button variant="secondary" onClick={reset}>Choose another file</Button>
            <Button onClick={() => importMut.mutate()} loading={importMut.isPending} disabled={!mappedFirst}>
              Import {preview.totalRows} rows
            </Button>
          </>
        ) : undefined
      }
    >
      {result ? (
        <div>
          <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-900">Import complete</p>
              <p className="text-sm text-emerald-800">Processed {result.total} rows from {fileName}.</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Created", value: result.created, cls: "text-emerald-600" },
              { label: "Duplicates skipped", value: result.skipped.length, cls: "text-amber-600" },
              { label: "Failed", value: result.errors.length, cls: "text-rose-600" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-line p-4">
                <p className={cn("text-2xl font-semibold", s.cls)}>{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
          {(result.errors.length > 0 || result.skipped.length > 0) && (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Row-level report</p>
                <Button size="sm" variant="secondary" onClick={() => downloadText(issuesToCsv([...result.errors, ...result.skipped].sort((a, b) => a.row - b.row)), "import-report.csv")}>
                  <Download className="h-3.5 w-3.5" /> Download report
                </Button>
              </div>
              <div className="max-h-60 overflow-y-auto rounded-lg border border-line scrollbar-thin">
                {[...result.errors.map((e) => ({ ...e, kind: "error" })), ...result.skipped.map((e) => ({ ...e, kind: "skip" }))]
                  .sort((a, b) => a.row - b.row)
                  .slice(0, 200)
                  .map((e) => (
                    <div key={`${e.kind}-${e.row}`} className="flex gap-3 border-b border-line/70 px-3 py-2 text-xs last:border-0">
                      <span className="w-14 shrink-0 font-medium text-slate-500">Row {e.row}</span>
                      <span className={e.kind === "error" ? "text-rose-600" : "text-amber-700"}>{e.message}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : preview ? (
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3 text-sm">
            <FileSpreadsheet className="h-5 w-5 text-brand-600" />
            <span className="font-medium text-slate-800">{fileName}</span>
            <span className="text-slate-500">· {preview.totalRows} rows</span>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-900">Map columns</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {preview.headers.map((h) => (
                <div key={h} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{h}</p>
                    <p className="truncate text-xs text-slate-400">e.g. {preview.preview[0]?.[h] || "—"}</p>
                  </div>
                  <Select value={mapping[h] ?? ""} onChange={(e) => setMapping((m) => ({ ...m, [h]: e.target.value }))} className="w-48">
                    {FIELDS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
            {!mappedFirst && <p className="mt-2 text-xs text-rose-600">Map one column to First name to continue.</p>}
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-900">Preview</p>
            <div className="overflow-x-auto rounded-lg border border-line scrollbar-thin">
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {preview.headers.map((h) => (
                      <th key={h} className="whitespace-nowrap px-3 py-2 text-left font-semibold text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((r, i) => (
                    <tr key={i} className="border-t border-line/70">
                      {preview.headers.map((h) => (
                        <td key={h} className="whitespace-nowrap px-3 py-2 text-slate-700">{r[h]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-900">Duplicates (same email or phone)</p>
            <div className="flex gap-2">
              {(["skip", "create"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStrategy(s)}
                  className={cn("rounded-lg border px-3 py-2 text-sm", strategy === s ? "border-brand-300 bg-brand-50 text-brand-700" : "border-line text-slate-600 hover:bg-slate-50")}
                >
                  {s === "skip" ? "Skip duplicates" : "Import anyway"}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFile(e.dataTransfer.files[0]);
            }}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-slate-50/60 px-6 py-14 text-center transition hover:border-brand-300 hover:bg-brand-50/30"
          >
            <UploadCloud className="h-9 w-9 text-brand-500" />
            <p className="mt-3 text-sm font-medium text-slate-800">{previewMut.isPending ? "Reading file…" : "Drop a CSV here or click to browse"}</p>
            <p className="mt-1 text-xs text-slate-500">Up to 5,000 rows · 2.5 MB</p>
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          <button onClick={() => downloadText(SAMPLE, "leadflow-sample.csv")} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline">
            <Download className="h-3.5 w-3.5" /> Download sample CSV
          </button>
        </div>
      )}
    </Dialog>
  );
}
