"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Mail, Phone, UserRound } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { ReservaTable } from "@/components/reservas/reserva-table";
import { buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { LoadingState } from "@/components/ui/loading-state";
import { fetchClienteById, fetchHistorialCliente } from "@/lib/supabase/queries";
import { formatDate, normalizeError } from "@/lib/utils";
import type { Cliente, VistaReserva } from "@/types/database";

export default function ClienteDetailPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ClienteDetailContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function ClienteDetailContent() {
  const params = useParams<{ id: string }>();
  const idCliente = params.id;
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [reservas, setReservas] = useState<VistaReserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadClienteHistory() {
      setLoading(true);
      setError(null);

      try {
        const [clientData, historyData] = await Promise.all([
          fetchClienteById(idCliente),
          fetchHistorialCliente(idCliente),
        ]);

        if (active) {
          setCliente(clientData);
          setReservas(historyData);
        }
      } catch (caughtError) {
        if (active) {
          setError(normalizeError(caughtError, "No se pudo cargar el historial del cliente."));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadClienteHistory();

    return () => {
      active = false;
    };
  }, [idCliente]);

  return (
    <div className="space-y-7">
      <Link className={buttonStyles({ variant: "ghost" })} href="/clientes">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a clientes
      </Link>

      {error ? <ErrorMessage message={error} /> : null}
      {loading ? <LoadingState text="Cargando datos e historial del cliente..." /> : null}

      {!loading && !cliente ? (
        <EmptyState
          title="Cliente no encontrado"
          description="Verifica que el identificador exista en la tabla cliente."
        />
      ) : null}

      {!loading && cliente ? (
        <>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#cf5b40]">Historial de cliente</p>
            <h1 className="mt-2 font-serif text-5xl text-stone-950">{cliente.nombre}</h1>
            <p className="mt-3 text-stone-600">
              Reservas ordenadas de la más reciente a la más antigua desde vista_reservas.
            </p>
          </div>

          <section className="grid gap-4 md:grid-cols-3">
            <Card className="flex items-start gap-4">
              <UserRound className="mt-1 h-5 w-5 text-[#cf5b40]" aria-hidden="true" />
              <div>
                <p className="text-sm text-stone-500">Estado</p>
                <p className="font-semibold text-stone-950">{cliente.activo ? "Activo" : "Inactivo"}</p>
              </div>
            </Card>
            <Card className="flex items-start gap-4">
              <Mail className="mt-1 h-5 w-5 text-[#cf5b40]" aria-hidden="true" />
              <div>
                <p className="text-sm text-stone-500">Correo</p>
                <p className="font-semibold text-stone-950">
                  {cliente.correo_electronico ?? "Sin correo"}
                </p>
              </div>
            </Card>
            <Card className="flex items-start gap-4">
              <Phone className="mt-1 h-5 w-5 text-[#cf5b40]" aria-hidden="true" />
              <div>
                <p className="text-sm text-stone-500">Teléfono</p>
                <p className="font-semibold text-stone-950">{cliente.telefono ?? "Sin teléfono"}</p>
                <p className="mt-1 text-xs text-stone-500">Creado {formatDate(cliente.creado_en)}</p>
              </div>
            </Card>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-3xl text-stone-950">Reservas del cliente</h2>
            <ReservaTable reservas={reservas} showCliente={false} />
          </section>
        </>
      ) : null}
    </div>
  );
}
