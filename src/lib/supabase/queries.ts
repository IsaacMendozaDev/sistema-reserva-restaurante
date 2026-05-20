import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type {
  Admin,
  Cliente,
  ClientePayload,
  DashboardStats,
  DbId,
  Mesa,
  Reserva,
  ReservaPayload,
  VistaReserva,
} from "@/types/database";

function requireData<T>(data: T | null, message: string): T {
  if (!data) {
    throw new Error(message);
  }

  return data;
}

function throwIfError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  throwIfError(error);
  return data.user;
}

export async function fetchAdminById(idAdmin: string): Promise<Admin | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("admin")
    .select("*")
    .eq("id_admin", idAdmin)
    .maybeSingle();

  throwIfError(error);
  return (data ?? null) as Admin | null;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vista_dashboard")
    .select("*")
    .limit(1)
    .maybeSingle();

  throwIfError(error);

  return {
    reservas_activas: Number(data?.reservas_activas ?? 0),
    reservas_hoy: Number(data?.reservas_hoy ?? 0),
    mesas_ocupadas: Number(data?.mesas_ocupadas ?? 0),
    reservas_canceladas: Number(data?.reservas_canceladas ?? 0),
  };
}

export async function fetchProximasReservas(today: string): Promise<VistaReserva[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vista_reservas")
    .select("*")
    .eq("estado", "confirmada")
    .gte("fecha", today)
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true })
    .limit(6);

  throwIfError(error);
  return (data ?? []) as VistaReserva[];
}

export async function fetchReservas(): Promise<VistaReserva[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vista_reservas")
    .select("*")
    .order("fecha", { ascending: false })
    .order("hora", { ascending: false });

  throwIfError(error);
  return (data ?? []) as VistaReserva[];
}

export async function fetchVistaReservaById(idReserva: DbId): Promise<VistaReserva | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vista_reservas")
    .select("*")
    .eq("id_reserva", idReserva)
    .maybeSingle();

  throwIfError(error);
  return (data ?? null) as VistaReserva | null;
}

export async function fetchReservaById(idReserva: DbId): Promise<Reserva | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reserva")
    .select("*")
    .eq("id_reserva", idReserva)
    .maybeSingle();

  throwIfError(error);
  return (data ?? null) as Reserva | null;
}

export async function createReserva(payload: ReservaPayload): Promise<Reserva> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reserva")
    .insert(payload)
    .select("*")
    .single();

  throwIfError(error);
  return requireData(data as Reserva | null, "No se pudo crear la reserva.");
}

export async function updateReserva(idReserva: DbId, payload: ReservaPayload): Promise<Reserva> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reserva")
    .update(payload)
    .eq("id_reserva", idReserva)
    .select("*")
    .single();

  throwIfError(error);
  return requireData(data as Reserva | null, "No se pudo actualizar la reserva.");
}

export async function cancelReserva(idReserva: DbId): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("reserva")
    .update({ estado: "cancelada" })
    .eq("id_reserva", idReserva);

  throwIfError(error);
}

export async function fetchClientesActivos(): Promise<Cliente[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cliente")
    .select("*")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  throwIfError(error);
  return (data ?? []) as Cliente[];
}

export async function fetchClienteById(idCliente: DbId): Promise<Cliente | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cliente")
    .select("*")
    .eq("id_cliente", idCliente)
    .maybeSingle();

  throwIfError(error);
  return (data ?? null) as Cliente | null;
}

export async function createCliente(payload: ClientePayload): Promise<Cliente> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cliente")
    .insert({ ...payload, activo: payload.activo ?? true })
    .select("*")
    .single();

  throwIfError(error);
  return requireData(data as Cliente | null, "No se pudo crear el cliente.");
}

export async function updateCliente(idCliente: DbId, payload: ClientePayload): Promise<Cliente> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cliente")
    .update(payload)
    .eq("id_cliente", idCliente)
    .select("*")
    .single();

  throwIfError(error);
  return requireData(data as Cliente | null, "No se pudo actualizar el cliente.");
}

export async function deactivateCliente(idCliente: DbId): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("cliente")
    .update({ activo: false })
    .eq("id_cliente", idCliente);

  throwIfError(error);
}

export async function fetchHistorialCliente(idCliente: DbId): Promise<VistaReserva[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vista_reservas")
    .select("*")
    .eq("id_cliente", idCliente)
    .order("fecha", { ascending: false })
    .order("hora", { ascending: false });

  throwIfError(error);
  return (data ?? []) as VistaReserva[];
}

export async function fetchMesaById(idMesa: DbId): Promise<Mesa | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("mesa")
    .select("*")
    .eq("id_mesa", idMesa)
    .maybeSingle();

  throwIfError(error);
  return (data ?? null) as Mesa | null;
}

export async function fetchMesasDisponibles(
  fecha: string,
  hora: string,
  numPersonas: number,
): Promise<Mesa[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("obtener_mesas_disponibles", {
    p_fecha: fecha,
    p_hora: hora,
    p_num_personas: numPersonas,
  });

  throwIfError(error);
  return ((data ?? []) as Mesa[]).sort((a, b) => a.capacidad - b.capacidad);
}
