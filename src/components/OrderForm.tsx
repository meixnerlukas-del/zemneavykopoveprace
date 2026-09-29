"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { computeOrderTotal, formatEur, PRICE_PER_DISTRICT, additionalDistrictPrice } from "@/lib/pricing";

type DistrictItem = { slug: string; name: string; region: string; occupied: boolean };
type Props = { districts: DistrictItem[]; regions: readonly string[]; base?: number };

export default function OrderForm({ districts, regions, base = PRICE_PER_DISTRICT }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const selectedList = useMemo(
    () => districts.filter((d) => selected.has(d.slug)),
    [districts, selected],
  );
  const total = computeOrderTotal(selected.size, base);

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  const occupiedCount = districts.filter((d) => d.occupied).length;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (selected.size === 0) {
      setError("Vyberte aspoň jeden okres.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    if (!fd.get("terms")) {
      setError("Musíte súhlasiť s obchodnými podmienkami.");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: fd.get("contactName"),
          companyName: fd.get("companyName"),
          ico: fd.get("ico"),
          dic: fd.get("dic"),
          icDph: fd.get("icDph"),
          billingAddr: fd.get("billingAddr"),
          phone: fd.get("phone"),
          email: fd.get("email"),
          note: fd.get("note"),
          website: fd.get("website"),
          termsAccepted: !!fd.get("terms"),
          districts: [...selected],
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
        <h2 className="text-2xl uppercase">Objednávka odoslaná</h2>
        <p className="mt-3 text-asphalt/90">
          Ďakujeme. Zašleme vám faktúru a požiadavku na podklady. Po úhrade a dodaní
          podkladov zverejníme profil do 5 pracovných dní. Objednávku môžete
          stornovať do 3 dní e-mailom na metracosro@gmail.com.
        </p>
        <Link href="/" className="mt-4 inline-block text-jcb underline">
          Späť na domovskú stránku
        </Link>
      </div>
    );
  }

  const inputCls =
    "w-full border border-concrete bg-paper px-3 py-2 focus:border-jcb focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="grid gap-6" noValidate>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      {/* Fakturačné údaje */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm uppercase tracking-[0.05em] text-muted">Meno</span>
          <input name="contactName" className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm uppercase tracking-[0.05em] text-muted">Názov firmy *</span>
          <input name="companyName" required className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm uppercase tracking-[0.05em] text-muted">IČO *</span>
          <input name="ico" required className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm uppercase tracking-[0.05em] text-muted">DIČ *</span>
          <input name="dic" required className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm uppercase tracking-[0.05em] text-muted">IČ DPH</span>
          <input name="icDph" className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm uppercase tracking-[0.05em] text-muted">Tel. číslo *</span>
          <input name="phone" type="tel" required className={inputCls} />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm uppercase tracking-[0.05em] text-muted">Fakturačná adresa *</span>
        <textarea name="billingAddr" required rows={2} className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm uppercase tracking-[0.05em] text-muted">E-mail *</span>
        <input name="email" type="email" required className={inputCls} />
      </label>

      {/* Výber okresu */}
      <fieldset className="border border-concrete p-4">
        <legend className="px-2 text-sm uppercase tracking-[0.05em] text-muted">
          Vyberte okres/y *
        </legend>
        {occupiedCount > 0 && (
          <p className="mb-2 text-xs text-muted">
            Okresy označené <span className="text-jcb">obsadené</span> už majú zhotoviteľa a nedajú sa objednať.
          </p>
        )}
        <div className="mt-2 grid gap-x-6 gap-y-6 md:grid-cols-2">
          {regions.map((region) => {
            const inRegion = districts.filter((d) => d.region === region);
            if (inRegion.length === 0) return null;
            return (
              <div key={region}>
                <p className="mb-2 text-xs uppercase tracking-[0.08em] text-jcb">{region}</p>
                <ul className="space-y-1">
                  {inRegion.map((d) => (
                    <li key={d.slug}>
                      <label
                        className={`flex items-center gap-2 ${d.occupied ? "cursor-not-allowed text-muted" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(d.slug)}
                          disabled={d.occupied}
                          onChange={() => toggle(d.slug)}
                        />
                        <span className={d.occupied ? "line-through" : ""}>{d.name}</span>
                        {d.occupied && (
                          <span className="text-xs uppercase tracking-[0.05em] text-jcb">obsadené</span>
                        )}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </fieldset>

      {/* Priebežný prepočet ceny */}
      <div className="border-l-4 border-jcb bg-concrete-2 p-4">
        {selected.size === 0 ? (
          <p className="text-muted">Zatiaľ nie je vybraný žiadny okres.</p>
        ) : (
          <>
            <p className="mb-2 font-medium">Vybrané okresy ({selected.size}):</p>
            <ul className="mb-3 text-sm text-asphalt/90">
              {selectedList.map((d, i) => (
                <li key={d.slug} className="flex justify-between">
                  <span>{i === 0 ? d.name : `${d.name} (−25 %)`}</span>
                  <span>{formatEur(i === 0 ? base : additionalDistrictPrice(base))}</span>
                </li>
              ))}
            </ul>
            <p className="flex justify-between border-t border-concrete pt-2 text-lg font-medium">
              <span>Spolu / rok s DPH:</span>
              <span>{formatEur(total)}</span>
            </p>
          </>
        )}
      </div>

      <label className="block">
        <span className="mb-1 block text-sm uppercase tracking-[0.05em] text-muted">Doplňujúce informácie</span>
        <textarea name="note" rows={3} className={inputCls} />
      </label>

      <label className="flex items-start gap-3 text-sm">
        <input name="terms" type="checkbox" value="1" required className="mt-1" />
        <span>
          Súhlasím, že spoločnosť Metraco, s.r.o. môže spracovávať moje firemné údaje
          (uvedené v tomto formulári) za účelom vystavenia faktúry a spracovania mojej
          objednávky v súlade s platnými právnymi predpismi. Zároveň potvrdzujem, že
          súhlasím s{" "}
          <Link href="/obchodne-podmienky" className="text-jcb underline" target="_blank">
            Obchodnými podmienkami
          </Link>{" "}
          a objednávam vybranú službu. *
        </span>
      </label>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <div>
        <button
          type="submit"
          disabled={state === "sending"}
          className="bg-jcb px-8 py-3 text-sm font-medium uppercase tracking-[0.05em] text-jcb-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {state === "sending" ? "Odosielam…" : "Odoslať objednávku"}
        </button>
      </div>
    </form>
  );
}
