import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";

export type ReservationNoticeType = "success" | "warning";

export interface ReservationNoticeValue {
  type: ReservationNoticeType;
  message: string;
}

export function ReservationNotice({ notice }: { notice: ReservationNoticeValue }) {
  const Icon = notice.type === "success" ? CheckCircle2 : AlertTriangle;

  return (
    <div
      className={
        notice.type === "success"
          ? "rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"
          : "rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800"
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p className="text-sm font-medium">{notice.message}</p>
        </div>
        <Link className={buttonStyles({ variant: "outline", size: "sm" })} href="/reservas">
          Ir a reservas
        </Link>
      </div>
    </div>
  );
}
