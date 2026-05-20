"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchAdminById } from "@/lib/supabase/queries";
import { normalizeError } from "@/lib/utils";
import type { Admin } from "@/types/database";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { LoadingState } from "@/components/ui/loading-state";

function isMissingAuthSession(error: { message?: string; name?: string } | null) {
  return (
    error?.name === "AuthSessionMissingError" ||
    error?.message?.toLowerCase().includes("auth session missing")
  );
}

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifyAdminAccess() {
      setChecking(true);
      setError(null);
      setUnauthorized(false);

      try {
        const supabase = createClient();
        const { data, error: authError } = await supabase.auth.getUser();

        if (authError && !isMissingAuthSession(authError)) {
          throw authError;
        }

        if (!data.user) {
          router.replace("/login");
          return;
        }

        const adminProfile = await fetchAdminById(data.user.id);

        if (!active) {
          return;
        }

        if (!adminProfile) {
          setUnauthorized(true);
          return;
        }

        setAdmin(adminProfile);
      } catch (caughtError) {
        if (active) {
          setError(normalizeError(caughtError, "No se pudo validar la sesión."));
        }
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    }

    verifyAdminAccess();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#fbf7f2] p-6">
        <LoadingState text="Verificando acceso de administrador..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl items-center bg-[#fbf7f2] p-6">
        <div className="w-full space-y-4">
          <ErrorMessage message={error} />
          <Button onClick={handleSignOut}>Cerrar sesión</Button>
        </div>
      </div>
    );
  }

  if (unauthorized || !admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbf7f2] p-6">
        <section className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <ShieldAlert className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="font-serif text-4xl text-stone-950">No autorizado</h1>
          <p className="mt-3 text-stone-600">
            Tu usuario inició sesión correctamente, pero no existe en la tabla admin. Agrega el
            usuario como administrador en Supabase para habilitar el acceso.
          </p>
          <Button className="mt-6" variant="danger" onClick={handleSignOut} fullWidth>
            Cerrar sesión
          </Button>
        </section>
      </div>
    );
  }

  return children;
}
