"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { ReservaForm, type ReservaFormPayload } from "@/components/reservas/reserva-form";
import { Card } from "@/components/ui/card";
import { createCliente, createReserva, getCurrentUser } from "@/lib/supabase/queries";

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
  const router = useRouter();

  async function handleCreate(payload: ReservaFormPayload) {
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

    router.push("/reservas");
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

      <Card className="p-6 sm:p-8">
        <ReservaForm mode="create" onSubmit={handleCreate} />
      </Card>
    </div>
  );
}
