"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { ReservaForm, type ReservaFormPayload } from "@/components/reservas/reserva-form";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { LoadingState } from "@/components/ui/loading-state";
import {
  cancelReserva,
  fetchClienteById,
  fetchMesaById,
  fetchReservaById,
  updateReserva,
} from "@/lib/supabase/queries";
import { normalizeError } from "@/lib/utils";
import type { Cliente, Mesa, Reserva } from "@/types/database";

export default function EditarReservaPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <EditarReservaContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function EditarReservaContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const idReserva = params.id;
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [mesa, setMesa] = useState<Mesa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadReserva() {
      setLoading(true);
      setError(null);

      try {
        const reservationRow = await fetchReservaById(idReserva);
        const [clientRow, tableRow] = reservationRow
          ? await Promise.all([
              fetchClienteById(reservationRow.id_cliente),
              fetchMesaById(reservationRow.id_mesa),
            ])
          : [null, null];

        if (active) {
          setReserva(reservationRow);
          setCliente(clientRow);
          setMesa(tableRow);
        }
      } catch (caughtError) {
        if (active) {
          setError(normalizeError(caughtError, "No se pudo cargar la reserva."));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadReserva();

    return () => {
      active = false;
    };
  }, [idReserva]);

  async function handleUpdate(payload: ReservaFormPayload) {
    if (!payload.id_cliente) {
      throw new Error("Selecciona un cliente antes de guardar.");
    }

    await updateReserva(idReserva, {
      id_cliente: payload.id_cliente,
      id_mesa: payload.id_mesa,
      fecha: payload.fecha,
      hora: payload.hora,
      num_personas: payload.num_personas,
      estado: payload.estado,
    });

    router.push("/reservas");
  }

  async function handleCancel() {
    const confirmed = window.confirm("¿Cancelar esta reserva? El registro no se eliminará.");

    if (!confirmed) {
      return;
    }

    await cancelReserva(idReserva);
    router.push("/reservas");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#cf5b40]">Editar reserva</p>
        <h1 className="mt-2 font-serif text-5xl text-stone-950">Modificar reserva</h1>
        <p className="mt-3 text-stone-600">
          Cambia cliente, mesa, fecha, hora, número de personas o estado; las cancelaciones se
          guardan como estado cancelada.
        </p>
      </div>

      {error ? <ErrorMessage message={error} /> : null}
      {loading ? <LoadingState text="Cargando reserva..." /> : null}

      {!loading && !reserva ? (
        <EmptyState
          title="Reserva no encontrada"
          description="Verifica que el identificador exista en la tabla reserva."
        />
      ) : null}

      {!loading && reserva ? (
        <Card className="p-6 sm:p-8">
          <ReservaForm
            mode="edit"
            initialReserva={reserva}
            initialCliente={cliente}
            initialMesa={mesa}
            onSubmit={handleUpdate}
            onCancelReserva={handleCancel}
          />
        </Card>
      ) : null}
    </div>
  );
}
