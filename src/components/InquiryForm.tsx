"use client";

import { useState } from "react";

type Props = { districtSlug: string; districtName: string };

export default function InquiryForm({ districtSlug, districtName }: Props) {
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (!fd.get("gdpr")) {
      setState("error");
      setError("Bez súhlasu so spracovaním údajov nemôžeme dopyt odoslať.");
      return;
    }
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          districtSlug,
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          message: fd.get("message"),
          website: fd.get("website"), // honeypot
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setState("error");
        setError(data.error ?? "Odoslanie zlyhalo. Skúste to znova.");
        return;
      }
      setState("ok");
    } catch {
      setState("error");
      setError("Odoslanie zlyhalo. Skontrolujte pripojenie a skúste znova.");
    }
  }

  if (state === "ok") {
    return (
      <div className="border-l-4 border-jcb bg-paper p-6 text-asphalt">
        <p className="text-lg font-medium">Ďakujeme, dopyt bol odoslaný.</p>
        <p className="mt-2 text-muted">
          Firma z okresu {districtName} vás bude čoskoro kontaktovať.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      {/* honeypot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm uppercase tracking-[0.05em] text-paper/80">
            Meno *
          </span>
          <input
            name="name"
            required
            className="w-full border border-paper/30 bg-asphalt-2 px-3 py-2 text-paper focus:border-jcb focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm uppercase tracking-[0.05em] text-paper/80">
            Telefón
          </span>
          <input
            name="phone"
            type="tel"
            className="w-full border border-paper/30 bg-asphalt-2 px-3 py-2 text-paper focus:border-jcb focus:outline-none"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm uppercase tracking-[0.05em] text-paper/80">
          E-mail *
        </span>
        <input
          name="email"
          type="email"
          required
          className="w-full border border-paper/30 bg-asphalt-2 px-3 py-2 text-paper focus:border-jcb focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm uppercase tracking-[0.05em] text-paper/80">
          Správa *
        </span>
        <textarea
          name="message"
          required
          rows={5}
          className="w-full border border-paper/30 bg-asphalt-2 px-3 py-2 text-paper focus:border-jcb focus:outline-none"
        />
      </label>

      <label className="flex items-start gap-3 text-sm text-paper/80">
        <input name="gdpr" type="checkbox" value="1" className="mt-1" required />
        <span>
          Súhlasím so spracovaním osobných údajov za účelom vybavenia môjho
          dopytu v súlade s platnými predpismi.
        </span>
      </label>

      {error && <p className="text-sm text-jcb">{error}</p>}

      <div>
        <button
          type="submit"
          disabled={state === "sending"}
          className="bg-jcb px-6 py-3 text-sm font-medium uppercase tracking-[0.05em] text-jcb-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {state === "sending" ? "Odosielam…" : "Odoslať dopyt"}
        </button>
      </div>
    </form>
  );
}
