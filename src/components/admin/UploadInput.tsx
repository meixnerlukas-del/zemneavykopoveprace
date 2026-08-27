"use client";

import { useId, useState } from "react";

type Props = {
  name: string;
  seo: string;
  defaultValue?: string | null;
  label?: string;
  endpoint?: string;
};

export default function UploadInput({ name, seo, defaultValue, label, endpoint = "/api/admin/upload" }: Props) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("seo", seo);
    try {
      const res = await fetch(endpoint, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Nahrávanie zlyhalo");
        return;
      }
      setUrl(data.url);
    } catch {
      setError("Nahrávanie zlyhalo");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {label && (
        <span className="mb-1 block text-sm uppercase tracking-[0.05em] text-muted">{label}</span>
      )}

      <div className="flex items-center gap-3">
        {url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-16 w-16 shrink-0 border border-concrete object-cover" />
        )}

        {/* Skryté file pole + viditeľné žlté tlačidlo (label naň klikne) */}
        <input
          id={inputId}
          type="file"
          accept="image/*"
          onChange={onFile}
          disabled={busy}
          className="sr-only"
        />
        <label
          htmlFor={inputId}
          className={`inline-flex cursor-pointer select-none items-center gap-2 border border-jcb bg-jcb px-4 py-2 text-sm font-medium uppercase tracking-[0.05em] text-jcb-ink hover:opacity-90 ${
            busy ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {busy ? "Nahrávam…" : url ? "📷 Zmeniť fotku" : "📷 Nahrať fotku z počítača"}
        </label>

        {url && !busy && (
          <button
            type="button"
            onClick={() => setUrl("")}
            className="text-sm text-muted underline hover:text-asphalt"
          >
            Odstrániť
          </button>
        )}
      </div>

      {/* Alternatíva: vložiť odkaz na obrázok. Aj skutočná hodnota, čo sa uloží. */}
      <label className="mt-2 block">
        <span className="mb-1 block text-xs text-muted">alebo vlož odkaz (URL) na obrázok:</span>
        <input
          type="text"
          name={name}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          className="w-full border border-concrete px-3 py-2 text-sm focus:border-jcb focus:outline-none"
        />
      </label>

      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}
