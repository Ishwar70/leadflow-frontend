"use client";

import * as RD from "@radix-ui/react-dialog";
import * as DM from "@radix-ui/react-dropdown-menu";
import { X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const widths = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <RD.Root open={open} onOpenChange={onOpenChange}>
      <RD.Portal>
        <RD.Overlay className="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-[2px] animate-fade-in" />
        <RD.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-line bg-white shadow-pop animate-slide-up focus:outline-none",
            widths[size],
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
            <div>
              <RD.Title className="text-base font-semibold text-slate-900">{title}</RD.Title>
              {description ? (
                <RD.Description className="mt-0.5 text-sm text-slate-500">{description}</RD.Description>
              ) : (
                <RD.Description className="sr-only">{typeof title === "string" ? title : "Dialog"}</RD.Description>
              )}
            </div>
            <RD.Close className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">
              <X className="h-4 w-4" />
            </RD.Close>
          </div>
          <div className="overflow-y-auto px-6 py-5 scrollbar-thin">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-line bg-slate-50/60 px-6 py-3.5 rounded-b-2xl">{footer}</div>}
        </RD.Content>
      </RD.Portal>
    </RD.Root>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  tone = "danger",
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm text-slate-600">{description}</div>
    </Dialog>
  );
}

export function useDisclosure(initial = false) {
  const [open, setOpen] = useState(initial);
  return { open, setOpen, onOpen: () => setOpen(true), onClose: () => setOpen(false) };
}

export const Dropdown = DM.Root;
export const DropdownTrigger = DM.Trigger;

export function DropdownContent({ children, align = "end", className }: { children: ReactNode; align?: "start" | "end" | "center"; className?: string }) {
  return (
    <DM.Portal>
      <DM.Content
        align={align}
        sideOffset={6}
        className={cn("z-50 min-w-48 rounded-xl border border-line bg-white p-1 shadow-pop animate-slide-up", className)}
      >
        {children}
      </DM.Content>
    </DM.Portal>
  );
}

export function DropdownItem({ children, onSelect, danger, disabled }: { children: ReactNode; onSelect?: () => void; danger?: boolean; disabled?: boolean }) {
  return (
    <DM.Item
      disabled={disabled}
      onSelect={onSelect}
      className={cn(
        "flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        danger ? "text-rose-600 data-[highlighted]:bg-rose-50" : "text-slate-700 data-[highlighted]:bg-slate-100",
      )}
    >
      {children}
    </DM.Item>
  );
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return <DM.Label className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{children}</DM.Label>;
}

export function DropdownSeparator() {
  return <DM.Separator className="my-1 h-px bg-line" />;
}
