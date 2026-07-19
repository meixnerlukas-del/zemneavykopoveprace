# zemneavykopoveprace.sk — projektový kontext

> **Toto je samostatný projekt, oddelený od Verejný Oznam.sk.** Nadradený `../CLAUDE.md`
> (Verejný Oznam zadanie) sa NETÝKA tohto projektu — riaď sa výhradne týmto súborom
> a zadaním v `zadanie-zemneavykopoveprace.md` (kópia v `Desktop/zemneavykopoveprace.sk2/`).

## Čo to je
Katalóg firiem na **zemné a výkopové práce** v SR. Prevádzkovateľ **Metraco s.r.o.**
Model: **1 okres = 1 Partner** (exkluzivita), **79 okresov**, cena **196,80 € s DPH / rok / okres**,
−25 % za každý ďalší okres. Partneri **nemajú login** — profily edituje len admin (Metraco).
Nikde neuvádzať 169 €. Predávajú sa len okresy, nie kraje.

## Tech stack (rozhodnuté)
- **Next.js 15** (App Router) + TypeScript, `src/`, alias `@/*`
- **Tailwind v4** — tokeny cez `@theme` v `src/app/globals.css` (žiadny `tailwind.config`)
- **Prisma 6** (NIE 7 — v7 zrušila `url` v schéme) + **SQLite** dev → **PostgreSQL** prod
- Auth.js (jeden admin, bcrypt), Resend/Nodemailer (formuláre)
- **Google Maps JS API** na homepage mapu (79 pinov), `next/image`

## Kľúčové rozhodnutia zadávateľa (odklon od pôvodného zadania)
- **Mapa = Google Maps**, 79 pinov (1 okres = 1 pin), geolokácia zobrazí najbližšieho
  zhotoviteľa. NIE inline SVG (kap. 5), NIE Leaflet. Kľúč v `.env.local` ako
  `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (GCP projekt `zemneavykopovepr-1728944350747`).
  **Kľúč treba v GCP obmedziť na doménu.**
- **Žiadny číselník obcí** — len okresy. `Municipality` model vypustený, hero = výber okresu.

## Dizajn (kap. 3 zadania — dodržať presne)
Paleta: `--asphalt #16181A`, `--concrete #E8E6E1`, `--paper #fff`, `--jcb #F2B01E` (len akcie/
obsadené), `--jcb-ink #412402`, `--muted #7A7C7E`. Fonty **Oswald** (nadpisy, VEĽKÉ, letter-spacing)
+ **Inter** (text). `border-radius: 0` všade, žiadne tiene/gradienty. WCAG AA, focus stavy,
`prefers-reduced-motion`, responzívne od 360 px, `lang="sk"`.

## PASCE PROSTREDIA (Windows, tento stroj)
- **Node PATH:** tool-shelly nemajú Node v PATH (načítali env pred inštaláciou). V každom
  PowerShell príkaze prefix: `$env:Path = "C:\Program Files\nodejs;" + $env:Path`. (Po reštarte
  session zmizne.)
- **npm approve-scripts:** npm 11 blokuje install-scripty → po installe balíka s postinstall
  (prisma/sharp/esbuild) spusti `npm approve-scripts --all`.

## Postup po fázach (zadanie kap. 15) — po každej počkaj na schválenie
1. ✅ Design plán · 2. ✅ Skeleton (seed 79 okresov, layout) · 3. ⬜ Homepage + Google mapa +
geolokácia + efekt kurzora · 4. Profil okresu · 5. Predaj/objednávka · 6. Admin ·
7. SEO · 8. Migrácia z WP + nasadenie (HostCreators, domain id 44933).

Reálne texty (obch. podmienky, spolupráca, objednávkový formulár) sú v
`Desktop/zemneavykopoveprace.sk2/2026/` — neprepisovať, len formátovať.
