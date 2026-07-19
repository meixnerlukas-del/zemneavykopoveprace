# zemneavykopoveprace.sk

Katalóg firiem na **zemné a výkopové práce** v SR. Jeden okres = jeden Partner (exkluzivita).
Prevádzkovateľ: **Metraco s.r.o.** Profily needitujú firmy, ale prevádzkovateľ cez admin.

## Tech stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS v4** (tokeny cez `@theme` v `src/app/globals.css`)
- **Prisma 6** + SQLite (dev) → PostgreSQL (produkcia)
- **Auth.js (NextAuth v5)** — jeden admin, credentials + bcrypt
- **Resend** (e-maily), **sharp** (obrázky), **Google Maps JS** (mapa okresov), **Leaflet/OSM** (mapka sídla)

## Lokálne spustenie

Vyžaduje **Node.js 18+**.

```bash
npm install
npm approve-scripts --all        # npm 11 blokuje install-scripty (prisma/sharp)
cp .env.example .env.local        # doplň hodnoty (viď nižšie)
cp .env.example .env              # Prisma CLI číta DATABASE_URL z .env

npx prisma migrate dev            # vytvorí SQLite DB + tabuľky
npm run db:seed                   # 79 okresov + FREE profily + admin
npm run db:seed:demo              # ukážkový profil Nitra (Bager NR s.r.o.) – voliteľné

npm run dev                       # http://localhost:3000
```

Admin: `http://localhost:3000/admin` (email = `ADMIN_EMAIL`, heslo = `ADMIN_PASSWORD`).
Po prvom prihlásení zmeň heslo v `/admin/nastavenia`.

## Premenné prostredia

Pozri `.env.example`. Kľúčové:

| Premenná | Popis |
|---|---|
| `DATABASE_URL` | SQLite (`file:./dev.db`) alebo PostgreSQL connection string |
| `AUTH_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | admin účet (seed) |
| `RESEND_API_KEY`, `MAIL_FROM`, `OPERATOR_EMAIL` | e-maily (bez kľúča sa len logujú) |
| `CRON_SECRET` | ochrana cron endpointu |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps JS kľúč |

### ⚠️ Google Maps kľúč

Kľúč je viditeľný vo frontende (normálne pre Maps JS). **Obmedz ho v GCP:**
*APIs & Services → Credentials →* Application restrictions = **HTTP referrers**
(`zemneavykopoveprace.sk/*`, `*.zemneavykopoveprace.sk/*`, `localhost:3000/*`),
API restrictions = len **Maps JavaScript API**. Vyžaduje zapnutý **billing** (aj vo free tier).

### E-maily (Resend) a DNS

Pri produkcii over doménu v Resende a nastav DNS podľa ich pokynov:
- **SPF**, **DKIM** (Resend dodá záznamy), prípadne **DMARC** (`v=DMARC1; p=none; rua=...`).
Bez overenej domény pošty končia v spame.

## Produkčné nasadenie

### Vercel (odporúčané)

1. Prepni Prisma na PostgreSQL: v `prisma/schema.prisma` zmeň `provider = "postgresql"`,
   nastav `DATABASE_URL` (napr. Neon/Supabase/Vercel Postgres).
2. `npx prisma migrate deploy` proti produkčnej DB, potom `npm run db:seed`.
3. Nastav env premenné vo Vercel projekte (vrátane `AUTH_SECRET`, `NEXTAUTH_URL` = produkčná URL).
4. **Cron** je v `vercel.json` (`/api/cron/expirations` denne o 07:00) — chránený `CRON_SECRET`.
5. Deploy. `sharp` a upload do `/public/uploads` fungujú; pre trvalé úložisko obrázkov
   v serverless zvážiť S3/UploadThing (na Verceli je FS efemérny).

### VPS

`npm run build && npm run start` za reverznou proxy (nginx) + PostgreSQL + PM2/systemd.
Priečinok `public/uploads` je perzistentný.

## Migrácia z existujúceho WordPressu

1. Vyexportuj staré URL (WP sitemap / Screaming Frog).
2. Namapuj **301 redirecty** v `next.config.ts` → `redirects()` (šablóna je pripravená).
   Koncové lomítko rieši `trailingSlash: false` (auto 308 `/x/` → `/x`).
3. Prenes reálne texty (obchodné podmienky, spolupráca) — už zapracované z podkladov.
4. Ak sú na starom webe publikované profily, dohodni prenos do DB (admin editor).
5. Pred prepnutím DNS: over redirecty, `sitemap.xml`, pridaj web do Google Search Console.

## Pre-launch checklist

- [ ] Prisma na PostgreSQL, `migrate deploy` + seed 79 okresov
- [ ] `AUTH_SECRET`, `NEXTAUTH_URL`, `RESEND_API_KEY`, `CRON_SECRET` nastavené v produkcii
- [ ] Admin heslo zmenené (nie `admin1234`)
- [ ] Google Maps kľúč obmedzený na produkčnú doménu + billing zapnutý
- [ ] Resend doména overená (SPF/DKIM)
- [ ] 301 redirecty z WP doplnené a otestované
- [ ] Reálne fotky nahradené za placeholder (picsum) v ukážkovom profile
- [ ] GDPR text doplnený právnikom (miesta `[na doplnenie]`)
- [ ] Web pridaný do Search Console, `sitemap.xml` odoslaný

## Známe zjednodušenia (MVP)

- **Globálne texty (Tiptap)** homepage/spolupráce sa editujú v kóde, nie v admine
  (model `PageContent` je pripravený na neskoršie napojenie).
- **Susedné okresy** = okresy toho istého kraja (nie skutočný graf susednosti).
- Ukážkový profil Nitra používa **placeholder fotky (picsum)** a placeholder YouTube ID.
- Rate limiting je in-memory (pre viac inštancií nahradiť Redis-om).

## NPM skripty

| Skript | Popis |
|---|---|
| `npm run dev` | vývojový server |
| `npm run build` / `start` | produkčný build / štart |
| `npm run db:migrate` | Prisma migrácia (dev) |
| `npm run db:seed` | 79 okresov + admin |
| `npm run db:seed:demo` | ukážkový profil Nitra |
| `npm run db:studio` | Prisma Studio |
