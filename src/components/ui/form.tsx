import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-lg border border-line bg-white px-3 text-sm text-slate-900 shadow-[0_1px_2px_rgb(16_24_40/0.04)] placeholder:text-slate-400 transition focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-500";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  ({ className, invalid, ...props }, ref) => (
    <input ref={ref} className={cn(base, "h-9", invalid && "border-rose-400 focus:border-rose-400 focus:ring-rose-100", className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  ({ className, invalid, ...props }, ref) => (
    <textarea ref={ref} className={cn(base, "min-h-20 py-2", invalid && "border-rose-400", className)} {...props} />
  ),
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  ({ className, invalid, children, ...props }, ref) => (
    <div className="relative">
      <select ref={ref} className={cn(base, "h-9 appearance-none pr-8", invalid && "border-rose-400", className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  ),
);
Select.displayName = "Select";

export function Label({ children, htmlFor, className }: { children: ReactNode; htmlFor?: string; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1.5 block text-[13px] font-medium text-slate-700", className)}>
      {children}
    </label>
  );
}

export function Field({
  label,
  error,
  hint,
  children,
  className,
  htmlFor,
  required,
}: {
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
  required?: boolean;
}) {
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={htmlFor}>
          {label}
          {required && <span className="ml-0.5 text-rose-500">*</span>}
        </Label>
      )}
      {children}
      {error ? (
        <p className="mt-1 text-xs text-rose-600" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function Checkbox({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn("h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-600 accent-brand-600 focus:ring-brand-500", className)}
      {...props}
    />
  );
}
