import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-asphalt text-paper">
      <header className="border-b border-asphalt-2">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <Link href="/" className="text-lg uppercase tracking-[0.06em]">
            Zemné a výkopové práce
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-20">
        <div className="max-w-lg text-center">
          <p className="text-sm uppercase tracking-[0.1em] text-jcb">Chyba 404</p>
          <h1 className="mt-4 text-4xl uppercase sm:text-5xl">
            Túto stránku sa nám nepodarilo nájsť
          </h1>
          <p className="mt-4 text-paper/80">
            Možno došlo k preklepu v adrese. Skúste nájsť svoj okres v katalógu,
            alebo sa vráťte na domovskú stránku.
          </p>

          <form action="/okresy" className="mx-auto mt-8 flex max-w-sm">
            <input
              type="text"
              name="q"
              placeholder="Hľadáte svoju obec alebo okres?"
              className="w-full border border-paper/30 bg-asphalt-2 px-4 py-3 text-paper placeholder:text-paper/50 focus:border-jcb focus:outline-none"
            />
            <button className="bg-jcb px-4 py-3 text-sm font-medium uppercase tracking-[0.05em] text-jcb-ink hover:opacity-90">
              Hľadať
            </button>
          </form>

          <div className="mt-8">
            <Link
              href="/"
              className="inline-block border-2 border-paper/40 px-6 py-3 text-sm font-medium uppercase tracking-[0.05em] hover:border-jcb hover:text-jcb"
            >
              Späť na domovskú stránku
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
