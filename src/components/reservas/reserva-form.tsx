"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarSearch, Save, XCircle } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { fetchClientesActivos, fetchMesasDisponibles } from "@/lib/supabase/queries";
import {
  cn,
  idToString,
  normalizeError,
  toDateInput,
  toTimeInput,
  todayInputDate,
} from "@/lib/utils";
import type {
  Cliente,
  ClientePayload,
  DbId,
  Mesa,
  Reserva,
  ReservaEstado,
} from "@/types/database";

export interface ReservaFormPayload {
  id_cliente?: DbId;
  nuevo_cliente?: ClientePayload;
  id_mesa: DbId;
  fecha: string;
  hora: string;
  num_personas: number;
  estado: ReservaEstado;
}

interface ReservaFormProps {
  mode: "create" | "edit";
  initialReserva?: Reserva | null;
  initialCliente?: Cliente | null;
  initialMesa?: Mesa | null;
  onSubmit: (payload: ReservaFormPayload) => Promise<void>;
  onCancelReserva?: () => Promise<void>;
}

interface ReservaErrors {
  idCliente?: string;
  nuevoClienteNombre?: string;
  fecha?: string;
  hora?: string;
  numPersonas?: string;
  idMesa?: string;
}

export function ReservaForm({
  mode,
  initialReserva,
  initialCliente,
  initialMesa,
  onSubmit,
  onCancelReserva,
}: ReservaFormProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [clienteMode, setClienteMode] = useState<"existing" | "new">("existing");
  const [idCliente, setIdCliente] = useState(idToString(initialReserva?.id_cliente));
  const [idMesa, setIdMesa] = useState(idToString(initialReserva?.id_mesa));
  const [fecha, setFecha] = useState(toDateInput(initialReserva?.fecha) || todayInputDate());
  const [hora, setHora] = useState(toTimeInput(initialReserva?.hora) || "19:00");
  const [numPersonas, setNumPersonas] = useState(String(initialReserva?.num_personas ?? 2));
  const [estado, setEstado] = useState<ReservaEstado>(initialReserva?.estado ?? "confirmada");
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoCorreo, setNuevoCorreo] = useState("");
  const [nuevoTelefono, setNuevoTelefono] = useState("");
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [loadingMesas, setLoadingMesas] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [errors, setErrors] = useState<ReservaErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const parsedNumPersonas = Number(numPersonas);
  const initialSlot = useMemo(
    () => ({
      fecha: toDateInput(initialReserva?.fecha),
      hora: toTimeInput(initialReserva?.hora),
    }),
    [initialReserva],
  );

  useEffect(() => {
    let active = true;

    async function loadClientes() {
      setLoadingClientes(true);

      try {
        const activeClients = await fetchClientesActivos();
        const nextClientes =
          initialCliente &&
          !activeClients.some((cliente) => idToString(cliente.id_cliente) === idToString(initialCliente.id_cliente))
            ? [initialCliente, ...activeClients]
            : activeClients;

        if (active) {
          setClientes(nextClientes);
        }
      } catch (caughtError) {
        if (active) {
          setFormError(normalizeError(caughtError, "No se pudieron cargar los clientes."));
        }
      } finally {
        if (active) {
          setLoadingClientes(false);
        }
      }
    }

    loadClientes();

    return () => {
      active = false;
    };
  }, [initialCliente]);

  useEffect(() => {
    let active = true;

    async function loadMesasDisponibles() {
      if (!fecha || !hora || !parsedNumPersonas || parsedNumPersonas < 1) {
        setMesas([]);
        return;
      }

      setLoadingMesas(true);

      try {
        const availableTables = await fetchMesasDisponibles(fecha, hora, parsedNumPersonas);
        const sameSlotAsInitial =
          mode === "edit" && fecha === initialSlot.fecha && hora === initialSlot.hora;
        const shouldIncludeInitialMesa =
          sameSlotAsInitial &&
          initialMesa &&
          Number(initialMesa.capacidad) >= parsedNumPersonas &&
          !availableTables.some((mesa) => idToString(mesa.id_mesa) === idToString(initialMesa.id_mesa));

        const nextMesas = shouldIncludeInitialMesa
          ? [initialMesa, ...availableTables].sort((a, b) => a.capacidad - b.capacidad)
          : availableTables;

        if (active) {
          setMesas(nextMesas);
          setIdMesa((currentMesa) =>
            currentMesa && nextMesas.some((mesa) => idToString(mesa.id_mesa) === currentMesa)
              ? currentMesa
              : "",
          );
        }
      } catch (caughtError) {
        if (active) {
          setFormError(normalizeError(caughtError, "No se pudieron consultar las mesas disponibles."));
        }
      } finally {
        if (active) {
          setLoadingMesas(false);
        }
      }
    }

    loadMesasDisponibles();

    return () => {
      active = false;
    };
  }, [fecha, hora, parsedNumPersonas, mode, initialMesa, initialSlot.fecha, initialSlot.hora]);

  function validate() {
    const nextErrors: ReservaErrors = {};

    if (clienteMode === "existing" && !idCliente) {
      nextErrors.idCliente = "Selecciona un cliente.";
    }

    if (clienteMode === "new" && !nuevoNombre.trim()) {
      nextErrors.nuevoClienteNombre = "El nombre del cliente nuevo es obligatorio.";
    }

    if (!fecha) {
      nextErrors.fecha = "Selecciona la fecha.";
    }

    if (!hora) {
      nextErrors.hora = "Selecciona la hora.";
    }

    if (!parsedNumPersonas || parsedNumPersonas < 1) {
      nextErrors.numPersonas = "Indica un número de personas válido.";
    }

    if (!idMesa) {
      nextErrors.idMesa = "Selecciona una mesa disponible.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const selectedMesa = mesas.find((mesa) => idToString(mesa.id_mesa) === idMesa);
    const selectedCliente = clientes.find((cliente) => idToString(cliente.id_cliente) === idCliente);

    if (!selectedMesa) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        idMesa: "La mesa seleccionada ya no está disponible.",
      }));
      return;
    }

    if (clienteMode === "existing" && !selectedCliente) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        idCliente: "El cliente seleccionado no está disponible.",
      }));
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await onSubmit({
        id_cliente: clienteMode === "existing" ? selectedCliente?.id_cliente : undefined,
        nuevo_cliente:
          clienteMode === "new"
            ? {
                nombre: nuevoNombre.trim(),
                correo_electronico: nuevoCorreo.trim() || null,
                telefono: nuevoTelefono.trim() || null,
                activo: true,
              }
            : undefined,
        id_mesa: selectedMesa.id_mesa,
        fecha,
        hora,
        num_personas: parsedNumPersonas,
        estado,
      });
    } catch (caughtError) {
      setFormError(normalizeError(caughtError, "No se pudo guardar la reserva."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelReserva() {
    if (!onCancelReserva) {
      return;
    }

    setCanceling(true);
    setFormError(null);

    try {
      await onCancelReserva();
    } catch (caughtError) {
      setFormError(normalizeError(caughtError, "No se pudo cancelar la reserva."));
    } finally {
      setCanceling(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {formError ? <ErrorMessage message={formError} /> : null}

      {mode === "create" ? (
        <div className="grid grid-cols-2 rounded-xl bg-stone-100 p-1 text-sm font-semibold text-stone-600">
          <button
            className={cn(
              "rounded-lg px-3 py-2 transition",
              clienteMode === "existing" && "bg-white text-[#cf5b40] shadow-sm",
            )}
            onClick={() => setClienteMode("existing")}
            type="button"
          >
            Cliente existente
          </button>
          <button
            className={cn(
              "rounded-lg px-3 py-2 transition",
              clienteMode === "new" && "bg-white text-[#cf5b40] shadow-sm",
            )}
            onClick={() => setClienteMode("new")}
            type="button"
          >
            Cliente nuevo
          </button>
        </div>
      ) : null}

      {clienteMode === "existing" ? (
        <Select
          disabled={loadingClientes}
          error={errors.idCliente}
          label="Cliente"
          name="id_cliente"
          onChange={(event) => setIdCliente(event.target.value)}
          value={idCliente}
        >
          <option value="">{loadingClientes ? "Cargando clientes..." : "Selecciona un cliente"}</option>
          {clientes.map((cliente) => (
            <option key={idToString(cliente.id_cliente)} value={idToString(cliente.id_cliente)}>
              {cliente.nombre}
            </option>
          ))}
        </Select>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Input
            error={errors.nuevoClienteNombre}
            label="Nombre del cliente"
            name="nuevo_nombre"
            onChange={(event) => setNuevoNombre(event.target.value)}
            placeholder="Nombre completo"
            value={nuevoNombre}
          />
          <Input
            label="Correo"
            name="nuevo_correo"
            onChange={(event) => setNuevoCorreo(event.target.value)}
            placeholder="cliente@correo.com"
            type="email"
            value={nuevoCorreo}
          />
          <Input
            label="Teléfono"
            name="nuevo_telefono"
            onChange={(event) => setNuevoTelefono(event.target.value)}
            placeholder="+57 300 000 0000"
            value={nuevoTelefono}
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Input
          error={errors.fecha}
          label="Fecha"
          min={todayInputDate()}
          name="fecha"
          onChange={(event) => setFecha(event.target.value)}
          type="date"
          value={fecha}
        />
        <Input
          error={errors.hora}
          label="Hora"
          name="hora"
          onChange={(event) => setHora(event.target.value)}
          type="time"
          value={hora}
        />
        <Input
          error={errors.numPersonas}
          label="Número de personas"
          min={1}
          name="num_personas"
          onChange={(event) => setNumPersonas(event.target.value)}
          type="number"
          value={numPersonas}
        />
      </div>

      <div className="rounded-2xl border border-stone-200 bg-[#fffaf7] p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-stone-950">Disponibilidad de mesas</h3>
            <p className="text-sm text-stone-600">
              Se consulta la RPC obtener_mesas_disponibles con fecha, hora y número de personas.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 text-sm font-medium text-[#cf5b40]">
            <CalendarSearch className="h-4 w-4" aria-hidden="true" />
            {loadingMesas ? "Consultando..." : `${mesas.length} disponibles`}
          </div>
        </div>

        <Select
          disabled={loadingMesas || mesas.length === 0}
          error={errors.idMesa}
          label="Mesa"
          name="id_mesa"
          onChange={(event) => setIdMesa(event.target.value)}
          value={idMesa}
        >
          <option value="">
            {loadingMesas
              ? "Consultando mesas..."
              : mesas.length === 0
                ? "No hay mesas disponibles"
                : "Selecciona una mesa"}
          </option>
          {mesas.map((mesa) => (
            <option key={idToString(mesa.id_mesa)} value={idToString(mesa.id_mesa)}>
              {mesa.nombre} - capacidad {mesa.capacidad}
            </option>
          ))}
        </Select>
      </div>

      {mode === "edit" ? (
        <Select
          label="Estado"
          name="estado"
          onChange={(event) => setEstado(event.target.value as ReservaEstado)}
          value={estado}
        >
          <option value="confirmada">Confirmada</option>
          <option value="cancelada">Cancelada</option>
        </Select>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={submitting} fullWidth>
          <Save className="h-4 w-4" aria-hidden="true" />
          {submitting ? "Guardando..." : mode === "create" ? "Crear reserva" : "Guardar cambios"}
        </Button>
        <Link className={buttonStyles({ variant: "ghost" })} href="/reservas">
          Volver
        </Link>
      </div>

      {mode === "edit" && onCancelReserva ? (
        <Button
          type="button"
          variant="danger"
          onClick={handleCancelReserva}
          disabled={canceling || estado === "cancelada"}
          fullWidth
        >
          <XCircle className="h-4 w-4" aria-hidden="true" />
          {canceling ? "Cancelando..." : "Cancelar reserva"}
        </Button>
      ) : null}
    </form>
  );
}
