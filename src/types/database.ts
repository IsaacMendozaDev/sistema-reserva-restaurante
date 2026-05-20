export type DbId = string | number;

export type ReservaEstado = "confirmada" | "cancelada";

export interface Admin {
  id_admin: string;
  nombre: string | null;
  correo_electronico: string | null;
  rol: string | null;
  creado_en: string | null;
  actualizado_en: string | null;
}

export interface Cliente {
  id_cliente: DbId;
  nombre: string;
  correo_electronico: string | null;
  telefono: string | null;
  activo: boolean;
  creado_en: string | null;
  actualizado_en: string | null;
}

export interface Mesa {
  id_mesa: DbId;
  nombre: string;
  capacidad: number;
  activa: boolean;
  creado_en: string | null;
  actualizado_en: string | null;
}

export interface Reserva {
  id_reserva: DbId;
  id_cliente: DbId;
  id_mesa: DbId;
  id_admin: string;
  fecha: string;
  hora: string;
  num_personas: number;
  estado: ReservaEstado;
  creado_en: string | null;
  actualizado_en: string | null;
}

export interface VistaReserva {
  id_reserva: DbId;
  id_cliente: DbId;
  nombre_cliente: string;
  correo_electronico: string | null;
  telefono: string | null;
  cliente_activo: boolean;
  id_mesa: DbId;
  nombre_mesa: string;
  capacidad: number;
  id_admin: string;
  nombre_admin: string | null;
  fecha: string;
  hora: string;
  num_personas: number;
  estado: ReservaEstado;
  creado_en: string | null;
  actualizado_en: string | null;
}

export interface DashboardStats {
  reservas_activas: number;
  reservas_hoy: number;
  mesas_ocupadas: number;
  reservas_canceladas: number;
}

export interface ClientePayload {
  nombre: string;
  correo_electronico: string | null;
  telefono: string | null;
  activo?: boolean;
}

export interface ReservaPayload {
  id_cliente: DbId;
  id_mesa: DbId;
  id_admin?: string;
  fecha: string;
  hora: string;
  num_personas: number;
  estado: ReservaEstado;
}
