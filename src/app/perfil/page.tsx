"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { AtSign, BadgeCheck, CalendarDays, IdCard, LogOut, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/error-message";
import { LoadingState } from "@/components/ui/loading-state";
import { createClient } from "@/lib/supabase/client";
import { fetchAdminById, getCurrentUser } from "@/lib/supabase/queries";
import { formatDate, normalizeError } from "@/lib/utils";
import type { Admin } from "@/types/database";

export default function PerfilPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <PerfilContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function PerfilContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError(null);

      try {
        const currentUser = await getCurrentUser();
        const adminProfile = currentUser ? await fetchAdminById(currentUser.id) : null;

        if (active) {
          setUser(currentUser);
          setAdmin(adminProfile);
        }
      } catch (caughtError) {
        if (active) {
          setError(normalizeError(caughtError, "No se pudo cargar el perfil."));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-7">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#cf5b40]">Perfil</p>
        <h1 className="mt-2 font-serif text-5xl text-stone-950">Mi perfil</h1>
        <p className="mt-3 text-stone-600">
          Información del usuario autenticado y del registro correspondiente en la tabla admin.
        </p>
      </div>

      {error ? <ErrorMessage message={error} /> : null}
      {loading ? <LoadingState text="Cargando perfil de administrador..." /> : null}

      {!loading ? (
        <>
          <Card className="p-6 sm:p-8">
            <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-[#fff3ed] text-[#cf5b40]">
              <UserRound className="h-12 w-12" aria-hidden="true" />
            </div>

            <div className="grid gap-4">
              <ProfileRow
                icon={UserRound}
                label="Nombre"
                value={admin?.nombre ?? user?.user_metadata?.name ?? "Administrador"}
              />
              <ProfileRow
                icon={AtSign}
                label="Email"
                value={admin?.correo_electronico ?? user?.email ?? "Sin correo"}
              />
              <ProfileRow icon={BadgeCheck} label="Rol" value={admin?.rol ?? "admin"} />
              <ProfileRow icon={IdCard} label="ID de usuario" value={user?.id ?? "Sin sesión"} />
              <ProfileRow icon={CalendarDays} label="Creado en admin" value={formatDate(admin?.creado_en)} />
            </div>
          </Card>

          <Button variant="danger" onClick={handleSignOut} fullWidth>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Cerrar sesión
          </Button>
        </>
      ) : null}
    </div>
  );
}

function ProfileRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-stone-50 p-4">
      <Icon className="h-5 w-5 text-stone-500" aria-hidden={true} />
      <div className="min-w-0">
        <p className="text-sm text-stone-500">{label}</p>
        <p className="break-words font-semibold text-stone-950">{value}</p>
      </div>
    </div>
  );
}
