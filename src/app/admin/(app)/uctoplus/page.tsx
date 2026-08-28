import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { listAllCounters } from "@/lib/invoicing";

export const dynamic = "force-dynamic";

export default async function UctoplusCountersPage() {
  if (!(await auth())) redirect("/admin/login");
  const data = await listAllCounters();

  return (
    <div>
      <h1 className="text-2xl uppercase">Účto+ poradovníky (číselné rady)</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Čísla faktúr prideľuje Účto+ z vybraného poradovníka. Nižšie sú vaše číselné rady s ich{" "}
        <strong>ID</strong>. Vybrané ID nastavte vo Verceli ako{" "}
        <code>UCTOPLUS_PROFORMA_COUNTER_ID</code> (pre predfaktúry) a{" "}
        <code>UCTOPLUS_INVOICE_COUNTER_ID</code> (pre ostré faktúry). Kým ich nenastavíte, appka
        posiela vlastné číslo (dočasné).
      </p>

      {!data.enabled && (
        <p className="mt-6 border-l-4 border-red-600 bg-paper p-4 text-sm text-red-700">
          Účto+ nie je nastavené (chýba <code>UCTOPLUS_API_KEY</code>) — poradovníky sa nedajú načítať.
        </p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="border border-concrete bg-paper p-3 text-sm">
          <p><strong>Aktuálne nastavené:</strong></p>
          <p>Predfaktúra (UCTOPLUS_PROFORMA_COUNTER_ID): <strong>{data.configured.proforma ?? "— nenastavené —"}</strong></p>
          <p>Ostrá faktúra (UCTOPLUS_INVOICE_COUNTER_ID): <strong>{data.configured.invoice ?? "— nenastavené —"}</strong></p>
        </div>
      </div>

      {data.enabled && (
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <CounterList title="Predfaktúry (PROFORMA_INVOICE)" counters={data.proforma} envName="UCTOPLUS_PROFORMA_COUNTER_ID" />
          <CounterList title="Ostré faktúry (INVOICE)" counters={data.invoice} envName="UCTOPLUS_INVOICE_COUNTER_ID" />
        </div>
      )}
    </div>
  );
}

function CounterList({
  title,
  counters,
  envName,
}: {
  title: string;
  counters: { id: number; name: string; format?: string }[];
  envName: string;
}) {
  return (
    <section>
      <h2 className="section-title text-lg uppercase">{title}</h2>
      <p className="mt-1 text-xs text-muted">→ {envName}</p>
      {counters.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Žiadne poradovníky (alebo sa nepodarilo načítať).</p>
      ) : (
        <table className="mt-3 w-full border border-concrete bg-paper text-sm">
          <thead>
            <tr className="border-b border-concrete text-left">
              <th className="p-2">ID</th>
              <th className="p-2">Názov</th>
              <th className="p-2">Formát</th>
            </tr>
          </thead>
          <tbody>
            {counters.map((c) => (
              <tr key={c.id} className="border-b border-concrete/50">
                <td className="p-2 font-mono font-bold">{c.id}</td>
                <td className="p-2">{c.name}</td>
                <td className="p-2 text-muted">{c.format ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
