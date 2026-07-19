"use client";

import { useState } from "react";

const TOPICS = [
  "Všeobecná otázka",
  "Chcem sa stať partnerom",
  "Otázka k objednávke / faktúre",
  "Nahlásenie problému",
  "Iné",
];

export default function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          topic: fd.get("topic"),
          message: fd.get("message"),
          website: fd.get("website"),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setState("error");
        setError(data.error ?? "Odoslanie zlyhalo.");
        return;
      }
      setState("ok");
    } catch {
      setState("error");
      setError("Odoslanie zlyhalo. Skúste znova.");
    }
  }

  if (state === "ok") {
    return (
      <div className="border-l-4 border-jcb bg-concrete-2 p-6">
        <p className="text-lg font-medium">Ďakujeme, správa bola odoslaná.</p>
        <p className="mt-2 text-muted">Ozveme sa vám čo najskôr.</p>
      </div>
    );
  }

  const inputCls =
    "w-full border border-concrete bg-paper px-3 py-2 focus:border-jcb focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm uppercase tracking-[0.05em] text-muted">Meno *</span>
          <input name="name" required className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm uppercase tracking-[0.05em] text-muted">E-mail *</span>
          <input name="email" type="email" required className={inputCls} />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm uppercase tracking-[0.05em] text-muted">Typ správy</span>
        <select name="topic" className={inputCls}>
          {TOPICS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm uppercase tracking-[0.05em] text-muted">Správa *</span>
        <textarea name="message" required rows={5} className={inputCls} />
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div>
        <button
          type="submit"
          disabled={state === "sending"}
          className="bg-jcb px-6 py-3 text-sm font-medium uppercase tracking-[0.05em] text-jcb-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {state === "sending" ? "Odosielam…" : "Odoslať správu"}
        </button>
      </div>
    </form>
  );
}
