import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
}

export function Select({ className, label, error, id, children, ...props }: SelectProps) {
  const selectId = id ?? props.name;

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-stone-700">{label}</span>
      <select
        id={selectId}
        className={cn(
          "h-12 w-full rounded-xl border border-stone-200 bg-white px-4 text-base text-stone-950 shadow-sm outline-none transition focus:border-[#cf5b40] focus:ring-4 focus:ring-[#cf5b40]/10",
          error && "border-rose-300 focus:border-rose-500 focus:ring-rose-100",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <span className="mt-2 block text-sm text-rose-600">{error}</span> : null}
    </label>
  );
}
