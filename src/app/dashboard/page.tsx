"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, CalendarClock, Table2, XCircle } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Card } from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/error-message";
import { LoadingState } from "@/components/ui/loading-state";
import { ReservaTable } from "@/components/reservas/reserva-table";
import { fetchDashboardStats, fetchProximasReservas } from "@/lib/supabase/queries";
import { normalizeError, todayInputDate } from "@/lib/utils";
import type { DashboardStats, VistaReserva } from "@/types/database";

const statCards = [
  {
    key: "reservas_activas",
    label: "Reservas activas",
    icon: CalendarCheck,
    color: "text-emerald-700 bg-emerald-50 border-emerald-100",
  },
  {
    key: "reservas_hoy",
    label: "Reservas de hoy",
    icon: CalendarClock,
    color: "text-[#cf5b40] bg-[#fff3ed] border-[#f3d5cb]",
  },
  {
    key: "mesas_ocupadas",
    label: "Mesas ocupadas",
    icon: Table2,
    color: "text-sky-700 bg-sky-50 border-sky-100",
  },
  {
    key: "reservas_canceladas",
    label: "Reservas canceladas",
    icon: XCircle,
    color: "text-rose-700 bg-rose-50 border-rose-100",
  },
] as const;

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <DashboardContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reservas, setReservas] = useState<VistaReserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const [dashboardStats, proximasReservas] = await Promise.all([
          fetchDashboardStats(),
          fetchProximasReservas(todayInputDate()),
        ]);

        if (active) {
          setStats(dashboardStats);
          setReservas(proximasReservas);
        }
      } catch (caughtError) {
        if (active) {
          setError(normalizeError(caughtError, "No se pudo cargar el dashboard."));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#cf5b40]">Panel administrativo</p>
        <h1 className="mt-2 font-serif text-5xl text-stone-950">Dashboard</h1>
        <p className="mt-3 max-w-2xl text-stone-600">
          Resumen operativo del restaurante basado en las vistas de Supabase.
        </p>
      </div>

      {error ? <ErrorMessage message={error} /> : null}
      {loading ? <LoadingState text="Cargando métricas y próximas reservas..." /> : null}

      {!loading && stats ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            const value = stats[card.key];

            return (
              <Card className="p-5" key={card.key}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-stone-500">{card.label}</p>
                    <p className="mt-3 font-serif text-5xl text-stone-950">{value}</p>
                  </div>
                  <div className={`rounded-2xl border p-3 ${card.color}`}>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                </div>
              </Card>
            );
          })}
        </section>
      ) : null}

      {!loading ? (
        <section className="space-y-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-serif text-3xl text-stone-950">Próximas reservas</h2>
              <p className="mt-1 text-sm text-stone-600">
                Reservas confirmadas ordenadas por fecha y hora.
              </p>
            </div>
          </div>
          <ReservaTable reservas={reservas} compact />
        </section>
      ) : null}
    </div>
  );
}
