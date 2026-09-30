import type { Metadata } from "next";
import { getBasePriceWithVat } from "@/lib/settings";
import { formatEur } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Obchodné podmienky",
  description:
    "Obchodné podmienky spolupráce na portáli zemneavykopoveprace.sk. Účinné od 1. mája 2025.",
};

function getSections(priceLabel: string): { heading: string; items: string[] }[] {
  return [
  {
    heading: "1. Exkluzívne zastúpenie v okrese",
    items: [
      "Portál poskytuje výhradné zastúpenie pre každý okres, pričom na jeden okres je pridelený len jeden Partner.",
      "Partner si môže rezervovať aj viacero okresov, o pridelení rozhoduje poradie úhrad.",
      `Cena za registráciu a zverejnenie v jednom okrese je ${priceLabel} s DPH / rok.`,
      "Zľava 25 % sa uplatňuje pri registrácii ďalšieho okresu alebo pri predĺžení spolupráce o rok a viac.",
    ],
  },
  {
    heading: "2. Priebeh registrácie a zverejnenia",
    items: [
      "Po prejavení záujmu Partner vyplní registračný formulár, ktorý po odsúhlasení obchodných podmienok odošle.",
      "Prevádzkovateľ mu následne zašle faktúru a požiadavku na podklady (fotografie, kontakty, popis služieb a pod.).",
      "Po prijatí platby a kompletných podkladov je Partnerova stránka zverejnená najneskôr do 5 pracovných dní.",
    ],
  },
  {
    heading: "3. Obsah služby",
    items: [
      "Vytvorenie profilovej podstránky Partnera s obsahom: kontaktné údaje, popis služieb, referencie, fotogaléria, video, odkazy na web a sociálne siete.",
      "Marketingová podpora formou zdieľania na sociálnych sieťach Prevádzkovateľa, vizuálna prezentácia na portáli, možnosť účasti na akciách a kampaniach.",
      "Partner má nárok na 1 bezplatnú aktualizáciu podstránok ročne. Každá ďalšia aktualizácia je spoplatnená sumou 10 € s DPH.",
    ],
  },
  {
    heading: "4. Platobné podmienky",
    items: [
      "Služba sa aktivuje až po prijatí úplnej platby.",
      "Platba prebieha na základe faktúry, ktorá je zasielaná e-mailom.",
      "Platnosť služby je ročná, pričom suma je uvedená vrátane DPH.",
      "Prevádzkovateľ si vyhradzuje právo pozastaviť zverejnenie alebo zrušiť spoluprácu, ak nebudú dodržané platobné termíny.",
    ],
  },
  {
    heading: "5. Trvanie a ukončenie spolupráce",
    items: [
      "Služba platí 12 mesiacov od aktivácie, alebo podľa údajov na faktúre.",
      "Partner má možnosť službu predĺžiť do 14 dní od ukončenia platnosti.",
      "V prípade vážnych sťažností od zákazníkov (napr. nedodržiavanie dohôd, nekomunikácia) alebo poškodenia dobrého mena portálu si Prevádzkovateľ vyhradzuje právo službu ukončiť okamžite bez náhrady.",
    ],
  },
  {
    heading: "6. Storno a odstúpenie od zmluvy",
    items: [
      "Partner môže zrušiť objednávku do 3 kalendárnych dní bez poplatku.",
      "Po tomto termíne je platba nevratná.",
      "Zrušenie musí byť oznámené e-mailom na: metracosro@gmail.com.",
      "V prípade, že podstránka už bola zverejnená alebo bola vykonaná akákoľvek práca zo strany Prevádzkovateľa, nie je možné požadovať vrátenie poplatku.",
    ],
  },
  {
    heading: "7. Práva a povinnosti Partnera",
    items: [
      "Partner zodpovedá za pravdivosť, aktuálnosť a úplnosť poskytnutých údajov.",
      "Zmeny údajov je potrebné oznámiť bez zbytočného odkladu.",
      "Partner môže požiadať o úpravy alebo odstránenie svojej podstránky počas trvania služby.",
      "Prevádzkovateľ si vyhradzuje právo odmietnuť zverejniť nevhodný alebo zavádzajúci obsah.",
    ],
  },
  {
    heading: "8. Zodpovednosť a reklamácie",
    items: [
      "Prevádzkovateľ nenesie zodpovednosť za služby alebo správanie Partnera voči zákazníkom.",
      "V prípade sporov medzi Partnerom a tretími stranami nie je Prevádzkovateľ účastníkom ani sprostredkovateľom riešenia.",
      "Sťažnosti na Partnera budú preverované a môžu viesť k ukončeniu spolupráce.",
    ],
  },
  {
    heading: "9. Ochrana osobných údajov (GDPR)",
    items: [
      "Údaje Partnera sú spracúvané v súlade s platnými právnymi predpismi o ochrane osobných údajov (GDPR).",
      "Použitie údajov slúži výhradne na účely prezentácie Partnera na portáli a nie sú poskytované tretím stranám.",
      "Partner má právo na opravu, prístup, obmedzenie spracovania alebo vymazanie údajov.",
      "Partner súhlasí so zverejnením svojich údajov (napr. meno, IČO, kontaktné údaje) na portáli a súhlasí, že ich Prevádzkovateľ môže použiť v rámci online reklamy.",
    ],
  },
  {
    heading: "10. Autorské práva a obsah",
    items: [
      "Všetky podklady dodané Partnerom zostávajú jeho vlastníctvom.",
      "Portál ich využíva na základe poskytnutého súhlasu výhradne v rámci svojej platformy.",
      "Bez písomného súhlasu nebude obsah kopírovaný, zdieľaný ani upravovaný mimo portálu.",
    ],
  },
  {
    heading: "11. Technické obmedzenia a zmeny portálu",
    items: [
      "Prevádzkovateľ negarantuje nepretržitú dostupnosť portálu, avšak v prípade výpadku sa zaväzuje riešiť technické problémy bez zbytočného odkladu.",
      "V prípade zásadných technických zmien alebo prerábky webu bude Partner informovaný.",
      "Prevádzkovateľ si vyhradzuje právo aktualizovať funkcionalitu alebo dizajn portálu bez predchádzajúceho súhlasu Partnerov.",
      "Pokiaľ by bol portál z technických príčin nečinný viac ako 7 pracovných dní, Partner má nárok na náhradu škody predĺžením služby o dobu nečinnosti portálu.",
    ],
  },
  {
    heading: "12. Záverečné ustanovenia",
    items: [
      "Tieto podmienky sú účinné od 1. mája 2025.",
      "Prevádzkovateľ si vyhradzuje právo obchodné podmienky kedykoľvek upraviť, pričom o zmenách informuje Partnerov prostredníctvom e-mailu alebo na portáli.",
      "Právne vzťahy, ktoré nie sú upravené týmito podmienkami, sa riadia zákonmi Slovenskej republiky.",
    ],
  },
  ];
}

export default async function TermsPage() {
  const basePrice = await getBasePriceWithVat();
  const SECTIONS = getSections(formatEur(basePrice));
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl uppercase sm:text-4xl">Obchodné podmienky</h1>
      <p className="mt-4 text-muted">
        Obchodné podmienky spolupráce na portáli www.zemneavykopoveprace.sk medzi
        prevádzkovateľom a Partnermi. Účinné od 1. mája 2025.
      </p>

      <div className="mt-6 border-l-4 border-jcb bg-concrete-2 p-4 text-sm">
        <p className="font-medium">Prevádzkovateľ</p>
        <p>Metraco s.r.o., Dolné Obdokovce 64, 951 02</p>
        <p>IČO: 50 010 221</p>
        <p>Zapísaná v OR Okresného súdu Nitra, oddiel Sro, vložka č. 56497/N</p>
        <p>Web: www.zemneavykopoveprace.sk</p>
      </div>

      <div className="mt-10 space-y-8">
        {SECTIONS.map((s) => (
          <section key={s.heading}>
            <h2 className="mb-3 text-xl uppercase tracking-[0.03em]">{s.heading}</h2>
            <ul className="list-disc space-y-1 pl-5 text-asphalt/90">
              {s.items.map((it, i) => (
                <li key={i}>{it}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
