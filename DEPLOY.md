# Nasadenie na Vercel + Neon (Postgres)

Doména `zemneavykopoveprace.sk` zostáva na HostCreators (len DNS), aplikácia beží na Vercel.

## Prehľad krokov
1. Kód na GitHub
2. Neon Postgres databáza
3. Import projektu na Vercel + env premenné
4. Prisma migrácia + seed proti Neon DB
5. Prepnutie DNS na HostCreators
6. Po nasadení: doména do Google Search Console, zmena admin hesla

---

## 1. Kód na GitHub
- Vytvor prázdny repozitár na github.com (napr. `zemneavykopoveprace`).
- V projekte:
  ```bash
  git remote add origin https://github.com/<ucet>/zemneavykopoveprace.git
  git branch -M main
  git push -u origin main
  ```

## 2. Neon Postgres
Najjednoduchšie priamo cez Vercel (krok 3, záložka **Storage → Create → Postgres/Neon**),
alebo na neon.tech vytvor projekt a skopíruj **connection string** (`DATABASE_URL`).

## 3. Vercel — import + env premenné
- vercel.com → **Add New → Project** → import GitHub repo.
- Framework: Next.js (autodetekcia). Build/Output nechaj default.
- **Environment Variables** (Production) — vlož:

| Kľúč | Hodnota |
|---|---|
| `DATABASE_URL` | connection string z Neon (pooled) |
| `AUTH_SECRET` | *(dodám v chate)* |
| `NEXTAUTH_URL` | `https://www.zemneavykopoveprace.sk` |
| `ADMIN_EMAIL` | `metracosro@gmail.com` |
| `ADMIN_PASSWORD` | *(zvoľ silné heslo)* |
| `OPERATOR_EMAIL` | `metracosro@gmail.com` |
| `MAIL_FROM` | `noreply@zemneavykopoveprace.sk` |
| `RESEND_API_KEY` | *(neskôr, po overení domény)* |
| `CRON_SECRET` | *(dodám v chate)* |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `AIzaSyBuCrhU4MqnBdHLe8-KLhhw9bj4YECmqKY` |

- Deploy.

## 4. Prisma migrácia + seed (proti Neon)
Schéma sa prepne na PostgreSQL (`provider = "postgresql"`). S `DATABASE_URL` z Neonu:
```bash
npx prisma migrate deploy      # alebo prvý raz: npx prisma migrate dev --name init
npm run db:seed                # 79 okresov + admin
npm run db:seed:demo           # voliteľné: ukážkový profil Nitra
```

## 5. DNS na HostCreators
Vo Vercel projekte **Settings → Domains** pridaj `zemneavykopoveprace.sk` a `www...`.
Vercel ukáže cieľové záznamy. Na HostCreators (DNS) nastav:
- `A` záznam `@` → IP z Vercelu (napr. `76.76.21.21`), alebo podľa pokynov Vercelu
- `CNAME` `www` → `cname.vercel-dns.com`
Vercel vydá SSL automaticky.

## 6. Po nasadení
- Zmeň admin heslo v `/admin/nastavenia`.
- Pridaj doménu do Google Search Console, odošli `sitemap.xml`.
- Google Maps kľúč už je obmedzený na doménu (referrers), billing je zapnutý.

## Poznámky
- **Upload obrázkov**: `/public/uploads` je na Vercel serverless **efemérny** (po redeploy zmizne).
  Pre trvalé fotky nasadiť S3 / UploadThing / Vercel Blob. Demo používa picsum.
- **Cron** (`/api/cron/expirations`) beží podľa `vercel.json` denne o 07:00, chránený `CRON_SECRET`.
