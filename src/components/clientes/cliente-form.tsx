"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorMessage } from "@/components/ui/error-message";
import type { Cliente, ClientePayload } from "@/types/database";
import { normalizeError } from "@/lib/utils";

interface ClienteFormProps {
  initialCliente?: Cliente | null;
  onCancel: () => void;
  onSubmit: (payload: ClientePayload) => Promise<void>;
}

interface ClienteErrors {
  nombre?: string;
  correo_electronico?: string;
}

export function ClienteForm({ initialCliente, onCancel, onSubmit }: ClienteFormProps) {
  const [nombre, setNombre] = useState(initialCliente?.nombre ?? "");
  const [correoElectronico, setCorreoElectronico] = useState(initialCliente?.correo_electronico ?? "");
  const [telefono, setTelefono] = useState(initialCliente?.telefono ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<ClienteErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  function validate() {
    const nextErrors: ClienteErrors = {};

    if (!nombre.trim()) {
      nextErrors.nombre = "El nombre del cliente es obligatorio.";
    }

    if (correoElectronico.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoElectronico)) {
      nextErrors.correo_electronico = "Ingresa un correo electrónico válido.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await onSubmit({
        nombre: nombre.trim(),
        correo_electronico: correoElectronico.trim() || null,
        telefono: telefono.trim() || null,
      });

      if (!initialCliente) {
        setNombre("");
        setCorreoElectronico("");
        setTelefono("");
      }
    } catch (caughtError) {
      setFormError(normalizeError(caughtError, "No se pudo guardar el cliente."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {formError ? <ErrorMessage message={formError} /> : null}

      <Input
        error={errors.nombre}
        label="Nombre"
        name="nombre"
        onChange={(event) => setNombre(event.target.value)}
        placeholder="María González"
        value={nombre}
      />

      <Input
        error={errors.correo_electronico}
        label="Correo electrónico"
        name="correo_electronico"
        onChange={(event) => setCorreoElectronico(event.target.value)}
        placeholder="cliente@correo.com"
        type="email"
        value={correoElectronico}
      />

      <Input
        label="Teléfono"
        name="telefono"
        onChange={(event) => setTelefono(event.target.value)}
        placeholder="+57 300 000 0000"
        value={telefono}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={submitting}>
          <Save className="h-4 w-4" aria-hidden="true" />
          {submitting ? "Guardando..." : initialCliente ? "Guardar cambios" : "Crear cliente"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
