"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Globe2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorMessage } from "@/components/ui/error-message";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { normalizeError } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function redirectAuthenticatedUser() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();

      if (active && data.user) {
        router.replace("/dashboard");
      }
    }

    redirectAuthenticatedUser();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      router.replace("/dashboard");
    } catch (caughtError) {
      setError(normalizeError(caughtError, "No se pudo iniciar sesión."));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (signInError) {
        throw signInError;
      }
    } catch (caughtError) {
      setError(normalizeError(caughtError, "No se pudo iniciar sesión con Google."));
      setGoogleLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fbf7f2] px-4 py-10">
      <div className="w-full max-w-md">
        <Link className="mb-8 block text-center font-serif text-4xl text-[#cf5b40]" href="/">
          Reservas
        </Link>

        <Card className="p-8">
          <div className="mb-7 text-center">
            <h1 className="font-serif text-4xl text-stone-950">Iniciar sesión</h1>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              Acceso exclusivo para administradores registrados en la tabla admin.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            {error ? <ErrorMessage message={error} /> : null}

            <Input
              label="Correo electrónico"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@restaurante.com"
              required
              type="email"
              value={email}
            />

            <Input
              label="Contraseña"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Tu contraseña"
              required
              type="password"
              value={password}
            />

            <Button type="submit" disabled={loading} fullWidth>
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {loading ? "Validando..." : "Iniciar sesión"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-stone-400">
            <div className="h-px flex-1 bg-stone-200" />
            o
            <div className="h-px flex-1 bg-stone-200" />
          </div>

          <Button variant="outline" onClick={handleGoogleLogin} disabled={googleLoading} fullWidth>
            <Globe2 className="h-4 w-4" aria-hidden="true" />
            {googleLoading ? "Redirigiendo..." : "Continuar con Google"}
          </Button>

          <p className="mt-6 rounded-xl bg-stone-50 px-4 py-3 text-center text-sm text-stone-600">
            No hay registro público. La creación de administradores se controla desde Supabase.
          </p>
        </Card>
      </div>
    </main>
  );
}
