import type { VistaReserva } from "@/types/database";

export type TipoConfirmacionReserva = "creada" | "modificada" | "cancelada";

export interface ConfirmacionReservaPayload {
  correoCliente: string;
  nombreCliente: string;
  fecha: string;
  hora: string;
  nombreMesa: string;
  numPersonas: number;
  tipo: TipoConfirmacionReserva;
}

export interface ConfirmacionReservaResult {
  success: boolean;
  error?: string;
}

function isConfirmacionResult(value: unknown): value is ConfirmacionReservaResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    typeof (value as { success: unknown }).success === "boolean"
  );
}

export async function enviarConfirmacionReserva(
  payload: ConfirmacionReservaPayload,
): Promise<ConfirmacionReservaResult> {
  try {
    const response = await fetch("/api/enviar-confirmacion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result: unknown = await response.json();

    if (isConfirmacionResult(result)) {
      return {
        success: result.success,
        error: result.error,
      };
    }

    return {
      success: false,
      error: "La respuesta del servidor de correos no tuvo el formato esperado.",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "No se pudo enviar el correo.",
    };
  }
}

export async function enviarConfirmacionReservaDesdeVista(
  reserva: VistaReserva,
  tipo: TipoConfirmacionReserva,
): Promise<ConfirmacionReservaResult> {
  if (!reserva.correo_electronico) {
    return {
      success: false,
      error: "La reserva no tiene correo electrónico de cliente.",
    };
  }

  return enviarConfirmacionReserva({
    correoCliente: reserva.correo_electronico,
    nombreCliente: reserva.nombre_cliente,
    fecha: reserva.fecha,
    hora: reserva.hora,
    nombreMesa: reserva.nombre_mesa,
    numPersonas: reserva.num_personas,
    tipo,
  });
}
