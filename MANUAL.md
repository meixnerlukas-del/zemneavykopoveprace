# Manuál — zemneavykopoveprace.sk

Kompletný návod na prevádzku, správu a prípadný **predaj** webu. Písané pre netechnického majiteľa.

> **Prístupové heslá a kľúče** nie sú v tomto súbore (aby sa nedostali na verejnosť). Sú v samostatnom súkromnom súbore **`PRISTUPY-SUKROMNE.md`** (neposielaj ho nikomu okrem kupca pri predaji).

---

## 1. Čo to je

Katalóg firiem na **zemné a výkopové práce** na Slovensku. Model: **1 okres = 1 partner** (exkluzivita), 79 okresov, cena **196,80 € s DPH / rok / okres**, −25 % za každý ďalší okres. Partneri nemajú vlastné prihlásenie — **všetko spravuje majiteľ cez admin panel**. Na webe nie sú cudzie reklamy.

- Verejný web: **https://www.zemneavykopoveprace.sk**
- Admin panel: **https://www.zemneavykopoveprace.sk/admin**

---

## 2. Kde čo beží (architektúra)

Web sa skladá z niekoľkých bezplatných služieb. Predstav si to takto:

| Časť | Služba | Čo robí |
|---|---|---|
| **Kód webu** | GitHub | Sklad zdrojového kódu |
| **Beh webu (hosting)** | Vercel | Rozbieha web, automaticky nasadzuje zmeny z GitHubu, vydáva SSL |
| **Databáza** | Neon (PostgreSQL) | Ukladá okresy, profily, objednávky, dopyty |
| **Doména + DNS** | HostCreators | Vlastníctvo domény a nasmerovanie na Vercel |
| **Mapa** | Google Cloud (Maps) | Interaktívna mapa okresov na homepage |
| **Fotky** | Vercel Blob *(treba dozapnúť)* | Trvalé úložisko nahratých fotiek |
| **E-maily** | Resend *(treba nastaviť)* | Odosielanie e-mailov z formulárov |

**Ako to spolu funguje:** GitHub = sklad kódu → Vercel = motor, ktorý ho rozbehne → doména (HostCreators DNS) ukazuje na Vercel → databáza (Neon) drží dáta.

---

## 3. Prístupy a prihlásenia (kde sa prihlásiť)

Reálne e-maily/heslá sú v `PRISTUPY-SUKROMNE.md`. Tu je, **kde** sa prihlásiť a čo ktorá služba ovláda:

| Služba | Kde sa prihlásiť | Čo tam spravuješ |
|---|---|---|
| **Admin webu** | `www.zemneavykopoveprace.sk/admin` | Profily okresov, objednávky, dopyty, texty, heslo |
| **Vercel** | https://vercel.com | Hosting, nasadenia, env premenné, doména, databáza, Blob |
| **GitHub** | https://github.com | Kód webu (repo `zemneavykopoveprace`) |
| **Neon** | cez Vercel → Storage, alebo https://neon.tech | Databáza, zálohy, SQL |
| **Google Cloud** | https://console.cloud.google.com | Google Maps kľúč, billing |
| **HostCreators** | https://www.hostcreators.sk | Doména, DNS, e-mailové schránky |
| **Resend** *(keď nastavíš)* | https://resend.com | Odosielanie e-mailov |

Vercel, Neon aj Google sa prihlasujú tlačidlom **„Continue with GitHub"** / cez Google účet — netreba extra heslá.

---

## 4. Admin panel — každodenná práca

Prihlás sa na `/admin` (údaje v `PRISTUPY-SUKROMNE.md`). V menu hore máš: **Okresy, Objednávky, Dopyty, Expirácie, Texty, Nastavenia**.

### 4.1 Zverejniť profil partnerovi (po zaplatení)
Toto je hlavný predajný proces:
1. **Okresy** → nájdi okres (filter/hľadanie) → **Upraviť**.
2. Vyplň údaje partnera: **Zobrazovaný názov**, tagline, telefón, e-mail (sem chodia dopyty), web, FB, adresu sídla, súradnice (lat/lng), **O nás**.
3. Nahraj **Hero obrázok** a **Logo** (tlačidlo pri poli).
4. Nižšie pridaj **Služby**, **Vozový park** (s fotkami), **Galériu**, **Video** (YouTube URL), **Recenzie**.
5. Hore nastav **Stav = Publikovaný**, vyplň **Zaplatené** a **Expiruje** (dátumy).
6. Vyplň **Partner (fakturačné údaje)** — názov firmy, IČO, DIČ, adresa.
7. **Uložiť profil**. Okres je teraz na webe žltý (obsadený), s plným profilom.

**Stavy okresu:** Voľný (predajné CTA) · Čaká na platbu · Čaká na podklady · **Publikovaný** (na webe) · Expirovaný (skrytý) · Pozastavený.

### 4.2 Objednávky
**Objednávky** — zoznam prišlých objednávok z formulára. Rozbaľ detail, po vybavení klikni **„Označiť ako vybavené"**.

### 4.3 Dopyty (leady)
**Dopyty** — správy od návštevníkov (z profilov aj z kontaktného formulára). Filter podľa okresu, **Export CSV**. *(Kým nie je nastavený Resend, e-maily sa neodosielajú, ale všetky dopyty sú tu uložené — kontroluj túto stránku.)*

### 4.4 Expirácie
**Expirácie** — profily zoradené podľa dátumu expirácie, zvýraznené do 30 dní. Podľa toho fakturuj predĺženie.

### 4.5 Texty
**Texty** — vizuálny editor (Tiptap) na úpravu textov na homepage a stránke Spolupráca. Zmeny sa prejavia okamžite.

### 4.6 Nastavenia
**Nastavenia** — **zmena admin hesla**. (Odporúčam zmeniť predvolené heslo hneď.)

---

## 5. Zmeny na webe (kód) — ako sa nasadzujú

Web sa nasadzuje **automaticky**: keď sa zmení kód v GitHub repozitári (vetva `main`), Vercel to do ~1 minúty sám postaví a nasadí. Nie je treba nič ručne „nahrávať".

- Bežné obsahové zmeny (profily, texty, fotky) robíš **v admine**, netreba zasahovať do kódu.
- Zmeny kódu (dizajn, funkcie) robí vývojár → commit + push do GitHubu → Vercel nasadí.

---

## 6. Environment premenné (nastavenia služby)

Sú vo **Vercel → Settings → Environment Variables**. Nemeň ich bezdôvodne. Význam:

| Premenná | Význam |
|---|---|
| `DATABASE_URL_UNPOOLED` | Pripojenie na Neon databázu (nastavené automaticky) |
| `AUTH_SECRET` | Tajný kľúč prihlasovania do admina |
| `CRON_SECRET` | Ochrana automatického upozorňovania na expirácie |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Kľúč pre Google mapu |
| `RESEND_API_KEY` | *(prázdne)* — doplniť pri nastavení e-mailov |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Použité len pri prvotnom vytvorení admina |

Konkrétne hodnoty sú v `PRISTUPY-SUKROMNE.md`.

---

## 7. Databáza (Neon)

- PostgreSQL databáza `neon-bisque-engine`, región Frankfurt, **free tier**.
- Prístup: Vercel → **Storage** → databáza → **Open in Neon** (SQL editor, tabuľky, zálohy).
- Obsahuje: okresy (79), profily, partnerov, služby/stroje/galériu/video/recenzie, objednávky, dopyty, admin používateľa.
- **Zálohy:** Neon má automatickú históriu (point-in-time restore). Pre istotu vieš spraviť aj SQL export z Neon konzoly.

---

## 8. Doména a DNS (HostCreators → Vercel), SSL

Doména `zemneavykopoveprace.sk` je registrovaná na **HostCreators**, ale web beží na **Vercel**. Prepojenie cez DNS:

| Záznam | Hodnota | Účel |
|---|---|---|
| `zemneavykopoveprace.sk` **A** | `216.198.79.1` | apex → Vercel |
| `www` **CNAME** | `7e5c06f788693ae3.vercel-dns-017.com` | www → Vercel |

Apex sa presmeruje (308) na **www**. **SSL certifikát** vydáva Vercel automaticky. E-mailové záznamy (SPF, DMARC, smtp/imap/pop3) sú **nedotknuté** — e-maily fungujú ako predtým.

> Ak by Vercel v Domains ukazoval „DNS Change Recommended", zobrazí presnú hodnotu, ktorú treba prepísať v HostCreators → DNS.

---

## 9. Google Maps kľúč (Google Cloud)

- Projekt `zemneavykopovepr-...`, kľúč „Maps Platform API Key".
- **Obmedzený na doménu** (HTTP referrers): `zemneavykopoveprace.sk/*`, `*.zemneavykopoveprace.sk/*`, `localhost:3000/*` — nedá sa zneužiť inde.
- **Billing** je zapnutý (Paid account) — mapa preto funguje aj návštevníkom. Google Maps má štedrý mesačný free kredit; pri tejto návštevnosti sa doň zmestíš.
- Ak pridáš ďalšiu doménu, pridaj ju do referrers (GCP → APIs & Services → Credentials → kľúč).

---

## 10. E-maily (Resend) — ako zapnúť odosielanie

Zatiaľ **nie je nastavené** → formuláre sa **ukladajú do admina** (`/admin/dopyty`, `/admin/objednavky`), ale e-maily sa neodosielajú. Ako zapnúť:
1. Vytvor účet na https://resend.com (cez GitHub).
2. Pridaj a **over doménu** `zemneavykopoveprace.sk` (Resend dá DNS záznamy — SPF/DKIM — ktoré pridáš v HostCreators → DNS).
3. Vygeneruj **API kľúč**.
4. Vo Vercel → Environment Variables pridaj `RESEND_API_KEY` = ten kľúč. (Voliteľne uprav `MAIL_FROM`, napr. `noreply@zemneavykopoveprace.sk`.)
5. Vercel sa sám prenasadí — e-maily z formulárov začnú chodiť na `metracosro@gmail.com` a potvrdenia objednávateľom.

---

## 11. Fotky (Vercel Blob) — ako zapnúť trvalé úložisko

Aby nahraté fotky vydržali (bez toho by po nasadení zmizli):
1. Vercel → **Storage** → **Create Database** → **Blob** → odsúhlas podmienky → **Create**.
2. Prepoj Blob s projektom (pribudne premenná `BLOB_READ_WRITE_TOKEN`).
3. Vercel sa prenasadí — upload fotiek v admine odteraz ukladá do Blobu (trvalé, cez CDN).

Kým to nezapneš, ukážkový profil beží na placeholder fotkách (picsum).

---

## 12. Náklady

Pri tejto veľkosti je prevádzka prakticky **zadarmo**:
- **Vercel** Hobby – zadarmo.
- **Neon** free tier – zadarmo (0,5 GB).
- **Google Maps** – free kredit mesačne (billing musí byť aktívny, ale pri tejto návštevnosti bez poplatku).
- **Vercel Blob** – ~1 GB zadarmo, nad limit pár centov/GB.
- **Resend** – veľký free tier na e-maily.
- **Doména** HostCreators – ročný poplatok (existujúci).

---

## 13. Odovzdanie pri PREDAJI webu — checklist

Web tvoria online účty. Máš dve možnosti:

**A) Previesť účty na kupca (najčistejšie):**
- [ ] **GitHub** – previesť repo `zemneavykopoveprace` na účet kupca (Settings → Transfer), alebo pridať kupca ako vlastníka.
- [ ] **Vercel** – previesť projekt na kupcov účet/tím (Project Settings → Transfer), alebo pridať kupca do tímu.
- [ ] **Neon** databáza – prejde s Vercel projektom, alebo znovu prepojiť na kupcov Vercel.
- [ ] **Google Cloud** projekt (Maps kľúč, billing) – previesť projekt / kupec si napojí vlastný billing, prípadne vygeneruje nový kľúč a obmedzí na doménu.
- [ ] **Doména** `zemneavykopoveprace.sk` – previesť na kupcu u HostCreators (alebo transfer k inému registrátorovi).
- [ ] **Resend** (ak nastavený) – kupec si spraví vlastný účet + doménu.
- [ ] Odovzdať **`PRISTUPY-SUKROMNE.md`** (bezpečne) a tento **`MANUAL.md`**.
- [ ] Zmeniť **admin heslo** a nové odovzdať kupcovi.

**B) Kupec si vytvorí vlastné účty a namigruje:**
- Kupec: vlastný GitHub + Vercel + Neon + Google Maps kľúč. Import repa, prenos databázy (SQL dump z Neon), nastavenie env premenných, prepnutie DNS domény na svoj Vercel. Tento manuál obsahuje všetky potrebné hodnoty a postupy.

**Čo má kupec vždy dostať:** zdrojový kód (GitHub), tento manuál, súkromné prístupy, a informáciu o firemných/fakturačných údajoch prevádzkovateľa (Metraco s.r.o.) — tie treba v kóde/faktúrach vymeniť za jeho.

---

## 14. Riešenie problémov

| Problém | Riešenie |
|---|---|
| **E-mail z formulára neprišiel** | Resend nie je nastavený (kap. 10). Správy sú v `/admin/dopyty`. |
| **Mapa hlási chybu** | Doména nie je v povolených referrers Maps kľúča (kap. 9), alebo je vypnutý billing. |
| **Doména neukazuje nový web** | DNS/SSL propagácia (pár min–hodín). Skontroluj DNS (kap. 8) a vo Vercel → Domains klikni „Refresh". |
| **„DNS Change Recommended" vo Verceli** | Prepíš A/CNAME v HostCreators na hodnoty, ktoré Vercel zobrazí. |
| **Nahraté fotky zmizli** | Nie je zapnutý Vercel Blob (kap. 11). |
| **Nefunguje prihlásenie do admina** | Skontroluj `AUTH_SECRET` vo Verceli; heslo cez `ADMIN_PASSWORD` sa nastavuje len pri seedovaní — meň ho v `/admin/nastavenia`. |
| **Chcem vrátiť zmenu kódu** | Vercel → Deployments → staršie nasadenie → „Promote to Production" (rollback). |

---

## 15. Technické zhrnutie (pre vývojára)

- **Stack:** Next.js 15 (App Router, TS), Tailwind v4, Prisma 6 + PostgreSQL, Auth.js v5, Resend, Vercel Blob, Google Maps JS, Leaflet.
- **Repo:** `github.com/…/zemneavykopoveprace`, vetva `main` → auto-deploy na Vercel.
- **DB migrácie:** `prisma/migrations` (PostgreSQL). Lokálny beh: `npm install && npm run dev` (potrebuje `DATABASE_URL_UNPOOLED` v `.env`).
- **Seed:** `npm run db:seed` (79 okresov + admin), `npm run db:seed:demo` (ukážka Nitra).
- Podrobnosti v `README.md` a `DEPLOY.md` v repozitári.
