import Link from "next/link";
import { DISTRICTS } from "@/lib/districts";

export default function HomePage() {
  const districtCount = DISTRICTS.length;

  return (
    <>
      {/* HERO */}
      <section className="bg-asphalt text-paper">
        <div className="mx-auto max-w-6xl px-4 py-24">
          <p className="text-sm uppercase tracking-[0.08em] text-jcb">
            Zemné a výkopové práce · celé Slovensko
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl uppercase leading-[1.05] sm:text-5xl md:text-6xl">
            Nájdite firmu vo svojom okrese a zavolajte jej
          </h1>
          <p className="mt-6 max-w-xl text-lg text-paper/80">
            Katalóg overených firiem na výkopové práce, dopravu kameniva a
            búranie. {districtCount} okresov, jeden partner na okres, žiadne
            cudzie reklamy.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/okresy"
              className="bg-jcb px-6 py-3 text-sm font-medium uppercase tracking-[0.05em] text-jcb-ink transition-opacity hover:opacity-90"
            >
              Vybrať okres
            </Link>
            <Link
              href="/spolupraca"
              className="border border-paper/30 px-6 py-3 text-sm font-medium uppercase tracking-[0.05em] text-paper transition-colors hover:border-jcb hover:text-jcb"
            >
              Chcem svoj okres
            </Link>
          </div>
        </div>
      </section>

      {/* MAPA — placeholder (Fáza 3: Google Maps s 79 pinmi) */}
      <section className="bg-concrete">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="section-title text-2xl">Mapa okresov</h2>
          <div className="flex min-h-[320px] items-center justify-center border-2 border-dashed border-muted/40 bg-concrete-2 text-center text-muted">
            <p className="max-w-md px-6">
              Tu bude interaktívna Google mapa Slovenska so 79 pinmi — jeden pin
              na okres, geolokácia najbližšieho zhotoviteľa.
              <br />
              <span className="text-sm">(Fáza 3)</span>
            </p>
          </div>
        </div>
      </section>

      {/* PÁS: VÁŠ OKRES JE EŠTE VOĽNÝ? */}
      <section className="bg-jcb text-jcb-ink">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-4 py-12 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl uppercase tracking-[0.04em]">
              Váš okres je ešte voľný?
            </h2>
            <p className="mt-1 text-jcb-ink/80">
              Exkluzivita v okrese · 196,80 € s DPH / rok · zľava 25 % na každý
              ďalší okres.
            </p>
          </div>
          <Link
            href="/spolupraca"
            className="whitespace-nowrap border-2 border-jcb-ink px-6 py-3 text-sm font-medium uppercase tracking-[0.05em] transition-colors hover:bg-jcb-ink hover:text-jcb"
          >
            Zobraziť voľné okresy
          </Link>
        </div>
      </section>
    </>
  );
}
