"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: fd.get("email"),
      password: fd.get("password"),
      redirect: false,
    });
    setBusy(false);
    if (res?.error) {
      setError("Nesprávny e-mail alebo heslo.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-asphalt px-4">
      <div className="w-full max-w-sm bg-paper p-8">
        <h1 className="text-2xl uppercase">Administrácia</h1>
        <p className="mt-1 text-sm text-muted">zemneavykopoveprace.sk</p>
        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          <label className="block">
            <span className="mb-1 block text-sm uppercase tracking-[0.05em] text-muted">
              E-mail
            </span>
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              className="w-full border border-concrete px-3 py-2 focus:border-jcb focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm uppercase tracking-[0.05em] text-muted">
              Heslo
            </span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full border border-concrete px-3 py-2 focus:border-jcb focus:outline-none"
            />
          </label>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="bg-jcb px-6 py-3 text-sm font-medium uppercase tracking-[0.05em] text-jcb-ink hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Prihlasujem…" : "Prihlásiť sa"}
          </button>
        </form>
      </div>
    </div>
  );
}
