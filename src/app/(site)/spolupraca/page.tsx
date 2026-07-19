import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatEur, PRICE_PER_DISTRICT, additionalDistrictPrice } from "@/lib/pricing";
import { getBlockHtml } from "@/lib/pageContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Spolupráca — staňte sa partnerom vo svojom okrese",
  description:
    "Exkluzívne zastúpenie zemných a výkopových prác vo vašom okrese. Nulová konkurencia, cielení zákazníci, žiadne cudzie reklamy. 196,80 € s DPH/rok.",
};

const BENEFITS = [
  ["Exkluzivita pre váš okres", "Každý okres má len jedno miesto pre dodávateľa — nulová konkurencia."],
  ["Cielení zákazníci", "Návštevníci hľadajú zemné práce priamo vo svojom regióne a vaša firma sa im zobrazí podľa lokality."],
  ["Efektívna reklama", "Vaše služby vidia presne tí, ktorí ich potrebujú — bez ďalších marketingových výdavkov."],
  ["Žiadne cudzie reklamy", "Na portáli nie sú žiadne rušivé reklamy tretích strán."],
  ["Priamy kontakt", "Zákazníci vás kontaktujú priamo cez kontaktný formulár na vašom profile."],
  ["Jednoduchá správa", "Profil je stále viditeľný, bez zložitej administratívy na vašej strane."],
];

export default async function SpolupracaPage() {
  const freeCount = await prisma.district.count({
    where: { profile: { status: "FREE" } },
  });
  const introHtml = await getBlockHtml("spolupraca_intro");

  return (
    <>
      <section className="bg-asphalt text-paper">
        <div className="mx-auto max-w-4xl px-4 py-20">
          <h1 className="text-3xl uppercase leading-tight sm:text-5xl">
            Staňte sa exkluzívnym dodávateľom vo svojom okrese
          </h1>
          <div
            className="mt-6 max-w-2xl text-lg text-paper/80 [&_a]:text-jcb [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: introHtml }}
          />
          <div className="mt-8">
            <Link
              href="/objednavka"
              className="bg-jcb px-6 py-3 text-sm font-medium uppercase tracking-[0.05em] text-jcb-ink hover:opacity-90"
            >
              Objednať okres ({freeCount} voľných)
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="section-title text-2xl">Prečo sa stať partnerom</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(([title, desc]) => (
              <div key={title} className="service-card p-5">
                <h3 className="text-lg">{title}</h3>
                <p className="mt-2 text-sm text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-concrete-2">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <h2 className="section-title text-2xl">Cenník</h2>
          <ul className="space-y-3 text-lg">
            <li className="flex justify-between border-b border-concrete pb-2">
              <span>Prvý okres / rok s DPH</span>
              <strong>{formatEur(PRICE_PER_DISTRICT)}</strong>
            </li>
            <li className="flex justify-between border-b border-concrete pb-2">
              <span>Každý ďalší okres (−25 %)</span>
              <strong>{formatEur(additionalDistrictPrice())}</strong>
            </li>
            <li className="flex justify-between border-b border-concrete pb-2">
              <span>Predĺženie o rok a viac</span>
              <strong>zľava 25 %</strong>
            </li>
            <li className="flex justify-between">
              <span>1 bezplatná aktualizácia profilu ročne, každá ďalšia</span>
              <strong>10 € s DPH</strong>
            </li>
          </ul>
          <p className="mt-6 text-sm text-muted">
            Proces: záujem → objednávkový formulár → faktúra a požiadavka na podklady →
            platba a podklady → zverejnenie do 5 pracovných dní → služba platí 12
            mesiacov. Podrobnosti v{" "}
            <Link href="/obchodne-podmienky" className="text-jcb underline">
              obchodných podmienkach
            </Link>
            .
          </p>
          <div className="mt-8">
            <Link
              href="/objednavka"
              className="bg-jcb px-6 py-3 text-sm font-medium uppercase tracking-[0.05em] text-jcb-ink hover:opacity-90"
            >
              Objednať okres
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
