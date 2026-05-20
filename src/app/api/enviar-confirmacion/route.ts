import { Resend } from "resend";

type TipoConfirmacion = "creada" | "modificada";

interface ConfirmacionReservaBody {
  correoCliente: string;
  nombreCliente: string;
  fecha: string;
  hora: string;
  nombreMesa: string;
  numPersonas: number;
  tipo: TipoConfirmacion;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseBody(body: unknown): ConfirmacionReservaBody | null {
  if (!isRecord(body)) {
    return null;
  }

  const {
    correoCliente,
    nombreCliente,
    fecha,
    hora,
    nombreMesa,
    numPersonas,
    tipo,
  } = body;

  if (
    typeof correoCliente !== "string" ||
    typeof nombreCliente !== "string" ||
    typeof fecha !== "string" ||
    typeof hora !== "string" ||
    typeof nombreMesa !== "string" ||
    typeof numPersonas !== "number" ||
    (tipo !== "creada" && tipo !== "modificada")
  ) {
    return null;
  }

  const tipoConfirmacion: TipoConfirmacion = tipo;
  const payload: ConfirmacionReservaBody = {
    correoCliente: correoCliente.trim(),
    nombreCliente: nombreCliente.trim(),
    fecha: fecha.trim(),
    hora: hora.trim(),
    nombreMesa: nombreMesa.trim(),
    numPersonas,
    tipo: tipoConfirmacion,
  };

  if (
    !payload.correoCliente ||
    !isValidEmail(payload.correoCliente) ||
    !payload.nombreCliente ||
    !payload.fecha ||
    !payload.hora ||
    !payload.nombreMesa ||
    !Number.isInteger(payload.numPersonas) ||
    payload.numPersonas < 1
  ) {
    return null;
  }

  return payload;
}

function buildEmailContent(payload: ConfirmacionReservaBody) {
  const accion = payload.tipo === "creada" ? "creada" : "modificada";
  const asunto =
    payload.tipo === "creada" ? "Confirmación de reserva" : "Actualización de reserva";

  const nombreCliente = escapeHtml(payload.nombreCliente);
  const fecha = escapeHtml(payload.fecha);
  const hora = escapeHtml(payload.hora);
  const nombreMesa = escapeHtml(payload.nombreMesa);
  const numPersonas = String(payload.numPersonas);

  const text = [
    `Hola ${payload.nombreCliente},`,
    "",
    `Tu reserva fue ${accion} correctamente.`,
    "",
    `Fecha: ${payload.fecha}`,
    `Hora: ${payload.hora}`,
    `Mesa asignada: ${payload.nombreMesa}`,
    `Número de personas: ${payload.numPersonas}`,
    "",
    "Te esperamos en el restaurante.",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1c1917; line-height: 1.6;">
      <h1 style="color: #cf5b40; margin-bottom: 8px;">${asunto}</h1>
      <p>Hola <strong>${nombreCliente}</strong>,</p>
      <p>Tu reserva fue <strong>${accion}</strong> correctamente.</p>
      <div style="background: #fbf7f2; border: 1px solid #e7e0d8; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 8px;"><strong>Fecha:</strong> ${fecha}</p>
        <p style="margin: 0 0 8px;"><strong>Hora:</strong> ${hora}</p>
        <p style="margin: 0 0 8px;"><strong>Mesa asignada:</strong> ${nombreMesa}</p>
        <p style="margin: 0;"><strong>Número de personas:</strong> ${numPersonas}</p>
      </div>
      <p>Te esperamos en el restaurante.</p>
    </div>
  `;

  return { asunto, html, text };
}

export async function POST(request: Request) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey || !fromEmail) {
    return Response.json(
      {
        success: false,
        error: "Faltan RESEND_API_KEY o RESEND_FROM_EMAIL en el entorno del servidor.",
      },
      { status: 500 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: "El cuerpo de la petición debe ser JSON válido." },
      { status: 400 },
    );
  }

  const payload = parseBody(body);

  if (!payload) {
    return Response.json(
      { success: false, error: "Datos incompletos o inválidos para enviar la confirmación." },
      { status: 400 },
    );
  }

  const resend = new Resend(resendApiKey);
  const { asunto, html, text } = buildEmailContent(payload);

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: payload.correoCliente,
      subject: asunto,
      html,
      text,
    });

    if (error) {
      return Response.json(
        { success: false, error: error.message ?? "Resend no pudo enviar el correo." },
        { status: 502 },
      );
    }

    return Response.json({ success: true, id: data?.id ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo enviar el correo.";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
