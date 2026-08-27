import { redirect } from "next/navigation";
import { getPartner } from "@/lib/partnerAuth";
import PartnerLoginForm from "@/components/partner/PartnerLoginForm";

export const dynamic = "force-dynamic";

export default async function PartnerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const partner = await getPartner();
  if (partner) redirect("/partner/profily");
  const { error } = await searchParams;

  return (
    <div>
      <h1 className="text-3xl uppercase">Prihlásenie partnera</h1>
      <p className="mt-3 max-w-md text-muted">
        Zadajte e-mail, na ktorý ste si objednali okres. Pošleme vám prihlasovací odkaz —
        žiadne heslo netreba.
      </p>
      {error === "link" && (
        <p className="mt-4 max-w-md border-l-4 border-red-600 bg-paper p-3 text-sm text-red-700">
          Prihlasovací odkaz je neplatný alebo expiroval. Požiadajte o nový nižšie.
        </p>
      )}
      <div className="mt-6">
        <PartnerLoginForm />
      </div>
    </div>
  );
}
