"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Plus, Search, UserMinus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { ClienteForm } from "@/components/clientes/cliente-form";
import { buttonStyles, Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import {
  createCliente,
  deactivateCliente,
  fetchClientesActivos,
  updateCliente,
} from "@/lib/supabase/queries";
import { formatDate, idToString, normalizeError } from "@/lib/utils";
import type { Cliente, ClientePayload } from "@/types/database";

export default function ClientesPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ClientesContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function ClientesContent() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  const filteredClientes = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return clientes;
    }

    return clientes.filter((cliente) => {
      const nombre = cliente.nombre.toLowerCase();
      const correo = cliente.correo_electronico?.toLowerCase() ?? "";
      return nombre.includes(term) || correo.includes(term);
    });
  }, [clientes, search]);

  async function loadClientes() {
    setLoading(true);
    setError(null);

    try {
      const activeClients = await fetchClientesActivos();
      setClientes(activeClients);
    } catch (caughtError) {
      setError(normalizeError(caughtError, "No se pudieron cargar los clientes."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadInitialClientes() {
      try {
        const activeClients = await fetchClientesActivos();

        if (active) {
          setClientes(activeClients);
        }
      } catch (caughtError) {
        if (active) {
          setError(normalizeError(caughtError, "No se pudieron cargar los clientes."));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadInitialClientes();

    return () => {
      active = false;
    };
  }, []);

  function openCreateForm() {
    setEditingCliente(null);
    setShowForm(true);
  }

  function openEditForm(cliente: Cliente) {
    setEditingCliente(cliente);
    setShowForm(true);
  }

  async function handleSubmit(payload: ClientePayload) {
    if (editingCliente) {
      await updateCliente(editingCliente.id_cliente, payload);
    } else {
      await createCliente(payload);
    }

    setShowForm(false);
    setEditingCliente(null);
    await loadClientes();
  }

  async function handleDeactivate(cliente: Cliente) {
    const confirmed = window.confirm(
      `¿Desactivar a ${cliente.nombre}? Sus reservas e historial se conservarán.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deactivateCliente(cliente.id_cliente);
      await loadClientes();
    } catch (caughtError) {
      setError(normalizeError(caughtError, "No se pudo desactivar el cliente."));
    }
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#cf5b40]">Clientes</p>
          <h1 className="mt-2 font-serif text-5xl text-stone-950">Gestión de clientes</h1>
          <p className="mt-3 max-w-2xl text-stone-600">
            Registra clientes, edita datos de contacto y conserva historial desactivando en lugar
            de eliminar.
          </p>
        </div>
        <Button onClick={openCreateForm}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo cliente
        </Button>
      </div>

      {error ? <ErrorMessage message={error} /> : null}

      {showForm ? (
        <Card>
          <div className="mb-5">
            <h2 className="font-serif text-3xl text-stone-950">
              {editingCliente ? "Editar cliente" : "Crear cliente"}
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Los clientes se guardan en la tabla cliente con estado activo.
            </p>
          </div>
          <ClienteForm
            key={editingCliente ? idToString(editingCliente.id_cliente) : "nuevo-cliente"}
            initialCliente={editingCliente}
            onCancel={() => {
              setShowForm(false);
              setEditingCliente(null);
            }}
            onSubmit={handleSubmit}
          />
        </Card>
      ) : null}

      <Card className="p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <Input
            label="Buscar por nombre o correo"
            name="buscar"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar cliente..."
            value={search}
          />
          <div className="flex h-12 items-center gap-2 rounded-xl bg-stone-50 px-4 text-sm font-medium text-stone-600">
            <Search className="h-4 w-4 text-[#cf5b40]" aria-hidden="true" />
            {filteredClientes.length} resultado(s)
          </div>
        </div>
      </Card>

      {loading ? <LoadingState text="Cargando clientes activos..." /> : null}

      {!loading && filteredClientes.length === 0 ? (
        <EmptyState
          title="No hay clientes activos"
          description="Crea un cliente nuevo o ajusta la búsqueda para encontrar coincidencias."
          action={
            <Button onClick={openCreateForm}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Crear cliente
            </Button>
          }
        />
      ) : null}

      {!loading && filteredClientes.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Teléfono
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Creado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-stone-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredClientes.map((cliente) => (
                  <tr className="transition hover:bg-[#fffaf7]" key={idToString(cliente.id_cliente)}>
                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="font-medium text-stone-950">{cliente.nombre}</div>
                      <div className="text-sm text-stone-500">
                        {cliente.correo_electronico ?? "Sin correo"}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-stone-600">
                      {cliente.telefono ?? "Sin teléfono"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-stone-600">
                      {formatDate(cliente.creado_en)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          className={buttonStyles({ variant: "outline", size: "sm" })}
                          href={`/clientes/${idToString(cliente.id_cliente)}`}
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                          Historial
                        </Link>
                        <Button size="sm" variant="secondary" onClick={() => openEditForm(cliente)}>
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                          Editar
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDeactivate(cliente)}>
                          <UserMinus className="h-4 w-4" aria-hidden="true" />
                          Desactivar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
