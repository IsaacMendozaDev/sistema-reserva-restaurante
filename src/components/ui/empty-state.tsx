import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-200 bg-white/70 p-8 text-center">
      <h3 className="text-lg font-semibold text-stone-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
