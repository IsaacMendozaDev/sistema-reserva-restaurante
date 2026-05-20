"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarPlus, Filter } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
import {
  ReservationNotice,
  type ReservationNoticeValue,
} from "@/components/reservas/reservation-notice";
import { ReservaTable } from "@/components/reservas/reserva-table";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/error-message";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { Select } from "@/components/ui/select";
import { enviarConfirmacionReservaDesdeVista } from "@/lib/reservas/confirmacion-email";
import { cancelReserva, fetchReservas, fetchVistaReservaById } from "@/lib/supabase/queries";
import { normalizeError } from "@/lib/utils";
import type { ReservaEstado, VistaReserva } from "@/types/database";

const CANCEL_EMAIL_WARNING_MESSAGE =
  "La reserva fue cancelada, pero no se pudo enviar el correo de cancelación.";

export default function ReservasPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ReservasContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function ReservasContent() {
  const [reservas, setReservas] = useState<VistaReserva[]>([]);
  const [clienteFilter, setClienteFilter] = useState("");
  const [fechaFilter, setFechaFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<ReservaEstado | "todas">("todas");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<ReservationNoticeValue | null>(null);

  const filteredReservas = useMemo(() => {
    const clienteTerm = clienteFilter.trim().toLowerCase();

    return reservas.filter((reserva) => {
      const matchesCliente =
        !clienteTerm ||
        reserva.nombre_cliente.toLowerCase().includes(clienteTerm) ||
        (reserva.correo_electronico?.toLowerCase() ?? "").includes(clienteTerm);
      const matchesFecha = !fechaFilter || reserva.fecha.slice(0, 10) === fechaFilter;
      const matchesEstado = estadoFilter === "todas" || reserva.estado === estadoFilter;

      return matchesCliente && matchesFecha && matchesEstado;
    });
  }, [clienteFilter, estadoFilter, fechaFilter, reservas]);

  const loadReservas = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const reservationRows = await fetchReservas();
      setReservas(reservationRows);
    } catch (caughtError) {
      setError(normalizeError(caughtError, "No se pudieron cargar las reservas."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadInitialReservas() {
      try {
        const reservationRows = await fetchReservas();

        if (active) {
          setReservas(reservationRows);
        }
      } catch (caughtError) {
        if (active) {
          setError(normalizeError(caughtError, "No se pudieron cargar las reservas."));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadInitialReservas();

    return () => {
      active = false;
    };
  }, []);

  async function handleCancel(idReserva: string | number) {
    const confirmed = window.confirm("¿Cancelar esta reserva? El registro se conservará en historial.");

    if (!confirmed) {
      return;
    }

    setNotice(null);
    setError(null);

    try {
      await cancelReserva(idReserva);
    } catch (caughtError) {
      setError(normalizeError(caughtError, "No se pudo cancelar la reserva."));
      return;
    }

    try {
      const reservaCancelada = await fetchVistaReservaById(idReserva);

      if (!reservaCancelada) {
        throw new Error("No se encontró la reserva cancelada.");
      }

      const result = await enviarConfirmacionReservaDesdeVista(reservaCancelada, "cancelada");

      setNotice(
        result.success
          ? {
              type: "success",
              message: "Reserva cancelada y correo enviado correctamente.",
            }
          : {
              type: "warning",
              message: CANCEL_EMAIL_WARNING_MESSAGE,
            },
      );
    } catch {
      setNotice({
        type: "warning",
        message: CANCEL_EMAIL_WARNING_MESSAGE,
      });
    }

    await loadReservas();
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#cf5b40]">Reservas</p>
          <h1 className="mt-2 font-serif text-5xl text-stone-950">Gestión de reservas</h1>
          <p className="mt-3 max-w-2xl text-stone-600">
            Lista reservas desde vista_reservas, filtra por cliente, fecha o estado y cancela sin
            eliminar registros.
          </p>
        </div>
        <Link className={buttonStyles({ variant: "primary" })} href="/reservas/nueva">
          <CalendarPlus className="h-4 w-4" aria-hidden="true" />
          Nueva reserva
        </Link>
      </div>

      {error ? <ErrorMessage message={error} /> : null}
      {notice ? <ReservationNotice notice={notice} /> : null}

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-stone-600">
          <Filter className="h-4 w-4 text-[#cf5b40]" aria-hidden="true" />
          Filtros
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Input
            label="Cliente"
            name="cliente"
            onChange={(event) => setClienteFilter(event.target.value)}
            placeholder="Nombre o correo"
            value={clienteFilter}
          />
          <Input
            label="Fecha"
            name="fecha"
            onChange={(event) => setFechaFilter(event.target.value)}
            type="date"
            value={fechaFilter}
          />
          <Select
            label="Estado"
            name="estado"
            onChange={(event) => setEstadoFilter(event.target.value as ReservaEstado | "todas")}
            value={estadoFilter}
          >
            <option value="todas">Todas</option>
            <option value="confirmada">Confirmada</option>
            <option value="cancelada">Cancelada</option>
          </Select>
        </div>
      </Card>

      {loading ? <LoadingState text="Cargando reservas..." /> : null}

      {!loading ? (
        <ReservaTable
          reservas={filteredReservas}
          showActions
          onCancel={handleCancel}
        />
      ) : null}
    </div>
  );
}
