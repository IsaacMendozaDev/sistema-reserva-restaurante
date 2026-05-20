"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
import {
  ReservationNotice,
  type ReservationNoticeValue,
} from "@/components/reservas/reservation-notice";
import { ReservaForm, type ReservaFormPayload } from "@/components/reservas/reserva-form";
import { Card } from "@/components/ui/card";
import { enviarConfirmacionReserva } from "@/lib/reservas/confirmacion-email";
import {
  createCliente,
  createReserva,
  fetchClienteById,
  fetchMesaById,
  getCurrentUser,
} from "@/lib/supabase/queries";
import type { DbId } from "@/types/database";

const EMAIL_WARNING_MESSAGE =
  "La reserva fue guardada, pero no se pudo enviar el correo de confirmación.";

export default function NuevaReservaPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <NuevaReservaContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function NuevaReservaContent() {
  const [notice, setNotice] = useState<ReservationNoticeValue | null>(null);

  async function sendCreatedReservationEmail({
    idCliente,
    idMesa,
    fecha,
    hora,
    numPersonas,
  }: {
    idCliente: DbId;
    idMesa: DbId;
    fecha: string;
    hora: string;
    numPersonas: number;
  }) {
    try {
      const [cliente, mesa] = await Promise.all([
        fetchClienteById(idCliente),
        fetchMesaById(idMesa),
      ]);

      if (!cliente?.correo_electronico || !cliente.nombre || !mesa?.nombre) {
        setNotice({
          type: "warning",
          message: EMAIL_WARNING_MESSAGE,
        });
        return;
      }

      const result = await enviarConfirmacionReserva({
        correoCliente: cliente.correo_electronico,
        nombreCliente: cliente.nombre,
        fecha,
        hora,
        nombreMesa: mesa.nombre,
        numPersonas,
        tipo: "creada",
      });

      setNotice(
        result.success
          ? {
              type: "success",
              message: "Reserva creada correctamente y correo de confirmación enviado.",
            }
          : {
              type: "warning",
              message: EMAIL_WARNING_MESSAGE,
            },
      );
    } catch {
      setNotice({
        type: "warning",
        message: EMAIL_WARNING_MESSAGE,
      });
    }
  }

  async function handleCreate(payload: ReservaFormPayload) {
    setNotice(null);
    const user = await getCurrentUser();

    if (!user) {
      throw new Error("La sesión expiró. Inicia sesión nuevamente.");
    }

    let idCliente = payload.id_cliente;

    if (payload.nuevo_cliente) {
      const createdClient = await createCliente(payload.nuevo_cliente);
      idCliente = createdClient.id_cliente;
    }

    if (!idCliente) {
      throw new Error("Selecciona o crea un cliente antes de guardar la reserva.");
    }

    await createReserva({
      id_cliente: idCliente,
      id_mesa: payload.id_mesa,
      id_admin: user.id,
      fecha: payload.fecha,
      hora: payload.hora,
      num_personas: payload.num_personas,
      estado: "confirmada",
    });

    await sendCreatedReservationEmail({
      idCliente,
      idMesa: payload.id_mesa,
      fecha: payload.fecha,
      hora: payload.hora,
      numPersonas: payload.num_personas,
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#cf5b40]">Nueva reserva</p>
        <h1 className="mt-2 font-serif text-5xl text-stone-950">Crear reserva</h1>
        <p className="mt-3 text-stone-600">
          La reserva se asocia siempre a un id_cliente y al administrador autenticado.
        </p>
      </div>

      {notice ? <ReservationNotice notice={notice} /> : null}

      <Card className="p-6 sm:p-8">
        <ReservaForm mode="create" onSubmit={handleCreate} />
      </Card>
    </div>
  );
}
