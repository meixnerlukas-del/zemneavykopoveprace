import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/auth";

const NAV = [
  { href: "/admin", label: "Okresy" },
  { href: "/admin/objednavky", label: "Objednávky" },
  { href: "/admin/dopyty", label: "Dopyty" },
  { href: "/admin/expiracie", label: "Expirácie" },
  { href: "/admin/nastavenia", label: "Nastavenia" },
];

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-concrete-2">
      <header className="bg-asphalt text-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/admin" className="text-sm uppercase tracking-[0.06em]">
              Admin · zemneavykopoveprace.sk
            </Link>
            <nav>
              <ul className="flex flex-wrap gap-4 text-sm">
                {NAV.map((n) => (
                  <li key={n.href}>
                    <Link href={n.href} className="text-paper/80 hover:text-jcb">
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-paper/70 hover:text-jcb" target="_blank">
              Web ↗
            </Link>
            <span className="text-paper/50">{session.user?.email}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/admin/login" });
              }}
            >
              <button className="border border-paper/30 px-3 py-1 uppercase tracking-[0.05em] hover:border-jcb hover:text-jcb">
                Odhlásiť
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
