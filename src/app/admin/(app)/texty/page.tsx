import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { EDITABLE_BLOCKS, getBlockHtml } from "@/lib/pageContent";
import RichTextEditor from "@/components/admin/RichTextEditor";

export const dynamic = "force-dynamic";

async function saveBlock(key: string, formData: FormData) {
  "use server";
  if (!(await auth())) throw new Error("Neautorizované");
  const body = String(formData.get("body") ?? "");
  await prisma.pageContent.upsert({
    where: { key },
    update: { body },
    create: { key, body },
  });
  revalidatePath("/admin/texty");
  revalidatePath("/");
  revalidatePath("/spolupraca");
}

export default async function TextyPage() {
  const blocks = await Promise.all(
    EDITABLE_BLOCKS.map(async (b) => ({ ...b, html: await getBlockHtml(b.key) })),
  );

  return (
    <div>
      <h1 className="text-2xl uppercase">Globálne texty</h1>
      <p className="mt-2 text-muted">
        Úprava textových blokov na verejných stránkach. Zmeny sa prejavia okamžite.
      </p>

      <div className="mt-8 space-y-10">
        {blocks.map((b) => (
          <form key={b.key} action={saveBlock.bind(null, b.key)} className="bg-paper p-5">
            <h2 className="mb-3 text-lg uppercase tracking-[0.04em]">{b.label}</h2>
            <RichTextEditor name="body" initialHtml={b.html} />
            <div className="mt-3">
              <button className="bg-jcb px-6 py-2 text-sm font-medium uppercase tracking-[0.05em] text-jcb-ink hover:opacity-90">
                Uložiť
              </button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
