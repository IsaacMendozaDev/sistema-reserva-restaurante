import type { ReservaEstado } from "@/types/database";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function normalizeError(error: unknown, fallback = "Ocurrió un error inesperado.") {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return fallback;
}

export function todayInputDate() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

export function toDateInput(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

export function toTimeInput(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value.slice(0, 5);
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Sin fecha";
  }

  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function formatTime(value: string | null | undefined) {
  if (!value) {
    return "Sin hora";
  }

  return value.slice(0, 5);
}

export function formatStatus(status: ReservaEstado) {
  return status === "confirmada" ? "Confirmada" : "Cancelada";
}

export function statusClasses(status: ReservaEstado) {
  return status === "confirmada"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-rose-200 bg-rose-50 text-rose-700";
}

export function idToString(id: string | number | null | undefined) {
  return id === null || id === undefined ? "" : String(id);
}
