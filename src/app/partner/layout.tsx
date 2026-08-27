import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Partnerská zóna — zemneavykopoveprace.sk",
  robots: { index: false, follow: false },
};

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-concrete-2">
      <header className="border-b border-concrete bg-asphalt text-paper">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg uppercase tracking-[0.08em]">
            Zemné a výkopové práce
          </Link>
          <span className="text-sm uppercase tracking-[0.05em] text-jcb">Partnerská zóna</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
    </div>
  );
}
