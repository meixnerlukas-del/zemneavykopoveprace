"use client";

import { useState } from "react";

type Props = {
  name: string;
  seo: string;
  defaultValue?: string | null;
  label?: string;
};

export default function UploadInput({ name, seo, defaultValue, label }: Props) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("seo", seo);
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Upload zlyhal");
        return;
      }
      setUrl(data.url);
    } catch {
      setError("Upload zlyhal");
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
          <img src={url} alt="" className="h-14 w-14 border border-concrete object-cover" />
        )}
        <input type="file" accept="image/*" onChange={onFile} disabled={busy} className="text-sm" />
        {busy && <span className="text-sm text-muted">Nahrávam…</span>}
      </div>
      <input type="text" name={name} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL obrázka" className="mt-2 w-full border border-concrete px-3 py-2 text-sm focus:border-jcb focus:outline-none" />
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}
