import Link from "next/link";

const NAV = [
  { href: "/okresy", label: "Okresy" },
  { href: "/spolupraca", label: "Spolupráca" },
  { href: "/kontakt", label: "Kontakt" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-asphalt text-paper border-b border-asphalt-2">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link
          href="/"
          className="font-[family-name:var(--font-heading)] text-lg uppercase tracking-[0.06em] text-paper"
        >
          Zemné a výkopové práce
        </Link>
        <nav aria-label="Hlavná navigácia">
          <ul className="flex items-center gap-6 text-sm uppercase tracking-[0.05em]">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-paper/80 transition-colors hover:text-jcb"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
