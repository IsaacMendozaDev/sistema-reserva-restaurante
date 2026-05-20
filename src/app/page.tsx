import Link from "next/link";
import { CalendarCheck, Clock3, Table2, UsersRound } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";

const features = [
  {
    title: "Gestión simple",
    description: "Clientes, mesas y reservas en un flujo claro para administración.",
    icon: CalendarCheck,
  },
  {
    title: "Control de mesas",
    description: "Consulta disponibilidad real antes de confirmar cada reserva.",
    icon: Table2,
  },
  {
    title: "Historial completo",
    description: "Cada cliente conserva sus reservas confirmadas y canceladas.",
    icon: Clock3,
  },
  {
    title: "Solo administradores",
    description: "Acceso validado con Supabase Auth y la tabla admin.",
    icon: UsersRound,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fbf7f2] text-stone-950">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/" className="font-serif text-3xl text-[#cf5b40]">
          Reservas
        </Link>
        <nav className="flex items-center gap-3">
          <Link className={buttonStyles({ variant: "ghost" })} href="/login">
            Iniciar sesión
          </Link>
          <Link className={buttonStyles({ variant: "primary" })} href="/login">
            Comenzar
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-92px)] max-w-7xl items-center gap-12 px-4 pb-12 pt-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
        <div>
          <p className="mb-5 inline-flex rounded-full border border-[#efd3c9] bg-white px-4 py-2 text-sm font-semibold text-[#b84f38]">
            Sistema administrativo para restaurante
          </p>
          <h1 className="max-w-3xl font-serif text-5xl leading-tight text-stone-950 sm:text-6xl lg:text-7xl">
            Sistema de Gestión de <span className="text-[#cf5b40]">Reservas</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
            Administra clientes, disponibilidad de mesas, reservas y cancelaciones desde una
            interfaz pensada para una sustentación clara y una operación diaria ordenada.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className={buttonStyles({ variant: "primary", size: "lg" })} href="/login">
              Comenzar ahora
            </Link>
            <Link className={buttonStyles({ variant: "outline", size: "lg" })} href="/login">
              Iniciar sesión
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-white p-4 shadow-xl shadow-stone-200/70">
          <div className="rounded-[1.5rem] bg-[#2f3a32] p-5 text-white">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Hoy</p>
                <p className="font-serif text-3xl">Turno de noche</p>
              </div>
              <span className="rounded-full bg-[#cf5b40] px-3 py-1 text-sm font-semibold">Admin</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="Reservas activas" value="18" />
              <Metric label="Mesas ocupadas" value="9" />
              <Metric label="Reservas hoy" value="12" />
              <Metric label="Canceladas" value="3" />
            </div>

            <div className="mt-5 rounded-2xl bg-white p-4 text-stone-950">
              <p className="mb-3 text-sm font-semibold text-stone-500">Próxima reserva</p>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">María González</p>
                  <p className="text-sm text-stone-500">Mesa 5 · 4 personas</p>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                  20:00
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-16 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <article className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm" key={feature.title}>
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1ea] text-[#cf5b40]">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h2 className="font-serif text-2xl text-stone-950">{feature.title}</h2>
              <p className="mt-3 text-sm leading-6 text-stone-600">{feature.description}</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-sm text-white/65">{label}</p>
      <p className="mt-2 font-serif text-4xl">{value}</p>
    </div>
  );
}
