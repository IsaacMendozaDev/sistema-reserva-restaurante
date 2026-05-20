"use client";

import Link from "next/link";
import { CalendarX, Pencil } from "lucide-react";
import { buttonStyles, Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatDate, formatStatus, formatTime, idToString, statusClasses } from "@/lib/utils";
import type { DbId, VistaReserva } from "@/types/database";

interface ReservaTableProps {
  reservas: VistaReserva[];
  compact?: boolean;
  showCliente?: boolean;
  showActions?: boolean;
  onCancel?: (idReserva: DbId) => Promise<void> | void;
}

export function ReservaTable({
  reservas,
  compact = false,
  showCliente = true,
  showActions = false,
  onCancel,
}: ReservaTableProps) {
  if (reservas.length === 0) {
    return (
      <EmptyState
        title="No hay reservas para mostrar"
        description="Cuando existan reservas que cumplan los filtros aparecerán en esta tabla."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-200">
          <thead className="bg-stone-50">
            <tr>
              {showCliente ? <HeaderCell>Cliente</HeaderCell> : null}
              <HeaderCell>Mesa</HeaderCell>
              <HeaderCell>Fecha</HeaderCell>
              <HeaderCell>Hora</HeaderCell>
              <HeaderCell>Personas</HeaderCell>
              <HeaderCell>Estado</HeaderCell>
              {showActions ? <HeaderCell className="text-right">Acciones</HeaderCell> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 bg-white">
            {reservas.map((reserva) => (
              <tr className="transition hover:bg-[#fffaf7]" key={idToString(reserva.id_reserva)}>
                {showCliente ? (
                  <BodyCell>
                    <div className="font-medium text-stone-950">{reserva.nombre_cliente}</div>
                    {!compact && reserva.correo_electronico ? (
                      <div className="text-xs text-stone-500">{reserva.correo_electronico}</div>
                    ) : null}
                  </BodyCell>
                ) : null}
                <BodyCell>
                  <div className="font-medium text-stone-950">{reserva.nombre_mesa}</div>
                  {!compact ? <div className="text-xs text-stone-500">Cap. {reserva.capacidad}</div> : null}
                </BodyCell>
                <BodyCell>{formatDate(reserva.fecha)}</BodyCell>
                <BodyCell>{formatTime(reserva.hora)}</BodyCell>
                <BodyCell>{reserva.num_personas}</BodyCell>
                <BodyCell>
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
                      statusClasses(reserva.estado),
                    )}
                  >
                    {formatStatus(reserva.estado)}
                  </span>
                </BodyCell>
                {showActions ? (
                  <BodyCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        className={buttonStyles({ variant: "outline", size: "sm" })}
                        href={`/reservas/${idToString(reserva.id_reserva)}/editar`}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Editar
                      </Link>
                      {reserva.estado !== "cancelada" && onCancel ? (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => onCancel(reserva.id_reserva)}
                        >
                          <CalendarX className="h-4 w-4" aria-hidden="true" />
                          Cancelar
                        </Button>
                      ) : null}
                    </div>
                  </BodyCell>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HeaderCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={cn("px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500", className)}>
      {children}
    </th>
  );
}

function BodyCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("whitespace-nowrap px-4 py-4 text-sm text-stone-700", className)}>{children}</td>;
}
