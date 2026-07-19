import { prisma } from "@/lib/prisma";

// Registry editovateľných textových blokov (spravované v /admin/texty cez Tiptap).
export type EditableBlock = {
  key: string;
  label: string;
  default: string; // fallback HTML, kým admin blok neupraví
};

export const EDITABLE_BLOCKS: EditableBlock[] = [
  {
    key: "home_hero",
    label: "Homepage — úvodný text pod nadpisom",
    default:
      "<p>Katalóg overených firiem na výkopové práce, dopravu kameniva a búranie. Jeden partner na okres, žiadne cudzie reklamy.</p>",
  },
  {
    key: "spolupraca_intro",
    label: "Spolupráca — úvodný text",
    default:
      "<p>Hľadáte spôsob, ako zvýšiť viditeľnosť firmy a získať viac zákaziek? Ponúkame jedinečnú možnosť stať sa jediným dodávateľom zemných a výkopových prác pre váš okres.</p>",
  },
];

const blockByKey = new Map(EDITABLE_BLOCKS.map((b) => [b.key, b]));

/** Vráti HTML bloku z DB, alebo default z registry. */
export async function getBlockHtml(key: string): Promise<string> {
  const fallback = blockByKey.get(key)?.default ?? "";
  const rec = await prisma.pageContent.findUnique({ where: { key } });
  return rec?.body?.trim() ? rec.body : fallback;
}
