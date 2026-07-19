import Link from "next/link";
import { DISTRICTS, toSlug, districtProfileSlug, REGIONS } from "@/lib/districts";

export default function SiteFooter() {
  return (
    <footer className="bg-asphalt text-paper">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="max-w-2xl font-[family-name:var(--font-heading)] text-xl uppercase tracking-[0.05em]">
          Zemné a výkopové práce na Slovensku
        </p>
        <p className="mt-2 max-w-2xl text-sm text-paper/70">
          Katalóg overených firiem. Jeden okres = jeden partner, žiadne cudzie
          reklamy.
        </p>

        {/* Okresy podľa krajov */}
        <nav aria-label="Okresy podľa krajov" className="mt-10">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-4">
            {REGIONS.map((region) => (
              <div key={region}>
                <h3 className="mb-2 text-xs uppercase tracking-[0.08em] text-jcb">
                  {region}
                </h3>
                <ul className="space-y-1 text-sm text-paper/70">
                  {DISTRICTS.filter((d) => d.region === region).map((d) => {
                    const slug = toSlug(d.name);
                    return (
                      <li key={d.code}>
                        <Link
                          href={`/${districtProfileSlug(slug)}`}
                          className="hover:text-jcb"
                        >
                          {d.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Prevádzkovateľ + právne */}
        <div className="mt-12 flex flex-col gap-4 border-t border-asphalt-2 pt-6 text-sm text-paper/60 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-paper/80">Metraco s.r.o.</p>
            <p>Dolné Obdokovce 64, 951 02</p>
            <p>IČO: 50 010 221</p>
            <p>
              <a href="mailto:metracosro@gmail.com" className="hover:text-jcb">
                metracosro@gmail.com
              </a>
            </p>
          </div>
          <ul className="space-y-1">
            <li>
              <Link href="/obchodne-podmienky" className="hover:text-jcb">
                Obchodné podmienky
              </Link>
            </li>
            <li>
              <Link href="/ochrana-osobnych-udajov" className="hover:text-jcb">
                Ochrana osobných údajov
              </Link>
            </li>
            <li>
              <Link href="/kontakt" className="hover:text-jcb">
                Kontakt
              </Link>
            </li>
          </ul>
        </div>

        <p className="mt-8 text-xs text-paper/40">
          © {new Date().getFullYear()} Metraco s.r.o. Všetky práva vyhradené.
        </p>
      </div>
    </footer>
  );
}
