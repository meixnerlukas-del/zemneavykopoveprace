import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

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
  const field = "w-full border border-concrete px-3 py-2 text-sm focus:border-jcb focus:outline-none";
  const lbl = "mb-1 block text-sm uppercase tracking-[0.05em] text-muted";

  return (
    <div className="max-w-md">
      <h1 className="text-2xl uppercase">Nastavenia</h1>
      <p className="mt-2 text-sm text-muted">Prihlásený: {session?.user?.email}</p>

      <h2 className="mt-8 border-b-2 border-asphalt pb-1 text-lg uppercase">Zmena hesla</h2>
      {ok && <p className="mt-3 border-l-4 border-jcb bg-paper p-3 text-sm">Heslo bolo zmenené.</p>}
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
