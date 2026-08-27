"use client";

import { useState } from "react";

export default function PartnerLoginForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    setState("sending");
    try {
      const res = await fetch("/api/partner/login-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setState("error");
        setError(data.error ?? "Odoslanie zlyhalo.");
        return;
      }
      setState("sent");
    } catch {
      setState("error");
      setError("Odoslanie zlyhalo. Skúste znova.");
    }
  }

  if (state === "sent") {
    return (
      <div className="border-l-4 border-jcb bg-paper p-6">
        <h2 className="text-xl uppercase">Skontrolujte e-mail</h2>
        <p className="mt-3 text-asphalt/90">
          Ak je e-mail priradený k profilu, poslali sme naň prihlasovací odkaz. Platí 30 minút.
        </p>
      </div>
    );
  }

  const inputCls =
    "w-full border border-concrete bg-paper px-3 py-2 focus:border-jcb focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4 bg-paper p-6">
      <label className="block">
        <span className="mb-1 block text-sm uppercase tracking-[0.05em] text-muted">
          E-mail (na ktorý ste objednávali)
        </span>
        <input name="email" type="email" required className={inputCls} autoComplete="email" />
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={state === "sending"}
        className="bg-jcb px-8 py-3 text-sm font-medium uppercase tracking-[0.05em] text-jcb-ink hover:opacity-90 disabled:opacity-50"
      >
        {state === "sending" ? "Odosielam…" : "Poslať prihlasovací odkaz"}
      </button>
    </form>
  );
}
