export type TipoConfirmacionReserva = "creada" | "modificada";

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
