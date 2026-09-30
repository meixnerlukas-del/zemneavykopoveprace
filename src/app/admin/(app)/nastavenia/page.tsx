import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import {
  getPriceInfo,
  setBasePriceWithVat,
  setOriginalPriceWithVat,
  setPriceValidUntil,
} from "@/lib/settings";
import { formatEur, PRICE_PER_DISTRICT } from "@/lib/pricing";

export const dynamic = "force-dynamic";

// Globálna štandardná cena za okres (s DPH). Platí pre nové objednávky; už existujúce
// objednávky majú cenu zafixovanú (Order.basePriceWithVat), preto sa nezmenia.
async function changeBasePrice(formData: FormData) {
  "use server";
  if (!(await auth())) throw new Error("Neautorizované");
  const raw = String(formData.get("price") ?? "").trim().replace(",", ".");
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    redirect("/admin/nastavenia?error=cena");
  }
  await setBasePriceWithVat(Math.round(value * 100) / 100);

  // Nepovinná akcia: pôvodná (preškrtnutá) cena + dátum platnosti.
  const origRaw = String(formData.get("originalPrice") ?? "").trim().replace(",", ".");
  const origVal = origRaw === "" ? null : Number(origRaw);
  await setOriginalPriceWithVat(
    origVal != null && Number.isFinite(origVal) && origVal > 0 ? Math.round(origVal * 100) / 100 : null,
  );
  const validUntil = String(formData.get("validUntil") ?? "").trim();
  await setPriceValidUntil(validUntil || null);

  redirect("/admin/nastavenia?ok=cena");
}

async function changePassword(formData: FormData) {
  "use server";
  const session = await auth();
  if (!session?.user?.email) throw new Error("Neautorizované");

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (next.length < 8 || next !== confirm) {
    redirect("/admin/nastavenia?error=validacia");
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) {
    redirect("/admin/nastavenia?error=heslo");
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(next, 10) },
  });
  redirect("/admin/nastavenia?ok=1");
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error, ok } = await searchParams;
  const session = await auth();
  const price = await getPriceInfo();
  const basePrice = price.base;
  const validUntilInput = price.validUntil ? price.validUntil.toISOString().slice(0, 10) : "";
  const field = "w-full border border-concrete px-3 py-2 text-sm focus:border-jcb focus:outline-none";
  const lbl = "mb-1 block text-sm uppercase tracking-[0.05em] text-muted";

  return (
    <div className="max-w-md">
      <h1 className="text-2xl uppercase">Nastavenia</h1>
      <p className="mt-2 text-sm text-muted">Prihlásený: {session?.user?.email}</p>

      <h2 className="mt-8 border-b-2 border-asphalt pb-1 text-lg uppercase">Cena za okres</h2>
      <p className="mt-2 text-sm text-muted">
        Jednotná štandardná cena za prvý okres (s DPH). Každý ďalší okres v jednej objednávke
        má automaticky zľavu 25 %. Zmena platí len pre <strong>nové</strong> objednávky — už
        vystavené a existujúce objednávky si zachovajú pôvodnú cenu.
      </p>
      {ok === "cena" && <p className="mt-3 border-l-4 border-jcb bg-paper p-3 text-sm">Cena bola uložená.</p>}
      {error === "cena" && <p className="mt-3 text-sm text-red-700">Zadajte platnú cenu väčšiu ako 0.</p>}
      <p className="mt-3 text-sm">
        Aktuálna cena: <strong>{formatEur(basePrice)}</strong> s DPH / okres / rok
        {Math.abs(basePrice - PRICE_PER_DISTRICT) > 0.001 && (
          <span className="text-muted"> (pôvodná {formatEur(PRICE_PER_DISTRICT)})</span>
        )}
      </p>
      <form action={changeBasePrice} className="mt-3 grid gap-3 sm:max-w-lg">
        <div className="flex flex-wrap items-end gap-3">
          <label>
            <span className={lbl}>Nová cena s DPH (€)</span>
            <input
              name="price"
              defaultValue={String(basePrice)}
              inputMode="decimal"
              required
              className={`${field} w-40`}
            />
          </label>
        </div>

        <p className="mt-2 text-sm text-muted">
          Nepovinná akcia — ak chceš na webe ukázať zľavu. Pôvodnú cenu necháš prázdnu,
          ak sa nemá zobraziť. Dátum necháš prázdny, ak nemá byť žiadne obmedzenie platnosti.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label>
            <span className={lbl}>Pôvodná cena (preškrtnutá, €)</span>
            <input
              name="originalPrice"
              defaultValue={price.original != null ? String(price.original) : ""}
              inputMode="decimal"
              placeholder="napr. 249"
              className={`${field} w-40`}
            />
          </label>
          <label>
            <span className={lbl}>Cena platí do (nepovinné)</span>
            <input
              name="validUntil"
              type="date"
              defaultValue={validUntilInput}
              className={`${field} w-48`}
            />
          </label>
        </div>

        <div>
          <button className="bg-jcb px-6 py-3 text-sm font-medium uppercase tracking-[0.05em] text-jcb-ink hover:opacity-90">
            Uložiť cenu
          </button>
        </div>
      </form>

      <h2 className="mt-8 border-b-2 border-asphalt pb-1 text-lg uppercase">Zmena hesla</h2>
      {ok === "1" && <p className="mt-3 border-l-4 border-jcb bg-paper p-3 text-sm">Heslo bolo zmenené.</p>}
      {error === "heslo" && <p className="mt-3 text-sm text-red-700">Nesprávne súčasné heslo.</p>}
      {error === "validacia" && <p className="mt-3 text-sm text-red-700">Nové heslo musí mať aspoň 8 znakov a zhodovať sa.</p>}

      <form action={changePassword} className="mt-4 grid gap-4">
        <label><span className={lbl}>Súčasné heslo</span><input name="current" type="password" required autoComplete="current-password" className={field} /></label>
        <label><span className={lbl}>Nové heslo (min. 8 znakov)</span><input name="next" type="password" required autoComplete="new-password" className={field} /></label>
        <label><span className={lbl}>Nové heslo znova</span><input name="confirm" type="password" required autoComplete="new-password" className={field} /></label>
        <div>
          <button className="bg-jcb px-6 py-3 text-sm font-medium uppercase tracking-[0.05em] text-jcb-ink hover:opacity-90">Zmeniť heslo</button>
        </div>
      </form>
    </div>
  );
}
