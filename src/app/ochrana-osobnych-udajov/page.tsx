import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ochrana osobných údajov",
  description:
    "Zásady spracovania a ochrany osobných údajov na portáli zemneavykopoveprace.sk v súlade s GDPR.",
};

export default function GdprPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl uppercase sm:text-4xl">Ochrana osobných údajov</h1>
      <p className="mt-4 text-muted">
        Tieto zásady popisujú, ako prevádzkovateľ spracúva osobné údaje v súlade s
        Nariadením (EÚ) 2016/679 (GDPR) a zákonom č. 18/2018 Z. z.
      </p>

      <div className="mt-6 border-l-4 border-jcb bg-concrete-2 p-4 text-sm text-asphalt/80">
        <strong>Poznámka:</strong> Tento text je rozumný základ, nie právne
        poradenstvo. Pred zverejnením ho musí skontrolovať právnik a doplniť miesta
        označené <em>[na doplnenie]</em>.
      </div>

      <div className="mt-10 space-y-8">
        <section>
          <h2 className="mb-3 text-xl uppercase">1. Prevádzkovateľ</h2>
          <p className="text-asphalt/90">
            Metraco s.r.o., Dolné Obdokovce 64, 951 02, IČO: 50 010 221. Kontakt:
            metracosro@gmail.com, +421 944 208 204.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl uppercase">2. Aké údaje spracúvame</h2>
          <ul className="list-disc space-y-1 pl-5 text-asphalt/90">
            <li>
              <strong>Kontaktný / dopytový formulár:</strong> meno, e-mail, telefón,
              text správy.
            </li>
            <li>
              <strong>Objednávkový formulár:</strong> meno, názov firmy, IČO, DIČ, IČ
              DPH, fakturačná adresa, telefón, e-mail.
            </li>
            <li>
              <strong>Technické údaje:</strong> IP adresa a základné logy pre
              bezpečnosť a prevádzku.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl uppercase">3. Účel a právny základ</h2>
          <ul className="list-disc space-y-1 pl-5 text-asphalt/90">
            <li>Vybavenie dopytu alebo objednávky — plnenie zmluvy / predzmluvné vzťahy.</li>
            <li>Vystavenie faktúry a účtovníctvo — plnenie zákonných povinností.</li>
            <li>Prevádzka a bezpečnosť portálu — oprávnený záujem.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl uppercase">4. Doba uchovávania</h2>
          <p className="text-asphalt/90">
            Údaje uchovávame len po dobu nevyhnutnú na daný účel, resp. po zákonom
            stanovenú dobu (napr. účtovné doklady 10 rokov). <em>[na doplnenie: konkrétne
            lehoty pre dopyty a objednávky]</em>.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl uppercase">5. Príjemcovia a sprostredkovatelia</h2>
          <p className="text-asphalt/90">
            Údaje neposkytujeme tretím stranám na marketingové účely. Sprostredkovatelia:
            poskytovateľ hostingu, e-mailová služba <em>[na doplnenie: konkrétni
            poskytovatelia — hosting, e-mail]</em>. Dopyt zadaný cez profil okresu sa
            zasiela príslušnému Partnerovi.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl uppercase">6. Vaše práva</h2>
          <p className="text-asphalt/90">
            Máte právo na prístup, opravu, vymazanie, obmedzenie spracovania,
            prenosnosť údajov a namietať proti spracovaniu, a právo podať sťažnosť na
            Úrad na ochranu osobných údajov SR. Žiadosti smerujte na metracosro@gmail.com.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl uppercase">7. Cookies</h2>
          <p className="text-asphalt/90">
            Portál používa len technicky nevyhnutné cookies. Ak bude nasadená
            analytika, použije sa riešenie bez potreby súhlasu, prípadne doplníme cookie
            lištu. <em>[na doplnenie podľa nasadenej analytiky]</em>.
          </p>
        </section>
      </div>
    </div>
  );
}
