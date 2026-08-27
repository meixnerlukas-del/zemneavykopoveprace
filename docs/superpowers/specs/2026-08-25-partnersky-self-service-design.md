# Celok B — Partnerský login a self-service editácia profilu

**Dátum:** 2026-08-25
**Projekt:** zemneavykopoveprace.sk (Metraco s.r.o.)
**Nadväzuje na:** Celok A (objednávka/faktúry) — konkrétne na admin akciu „platba prijatá".

> **Odklon od pôvodného modelu:** doteraz platilo „partneri nemajú login, edituje len admin".
> Zadávateľ (2026-08-25) si vyžiadal, aby zaplatený partner mohol svoj profil upravovať sám.

---

## 1. Cieľ

Partner, ktorý zaplatil za okres, dostane vlastné prihlásenie a rozhranie, kde si upraví
a doplní obsah svojho profilu (logo, fotky, popis, služby…). Admin (Metraco) naďalej vidí
a spravuje všetko; partner vidí len svoje okresy a len obsahové polia.

## 2. Rozhodnutia (zvolené)

- **Autentifikácia = magic-link** (e-mail). Bez hesiel — vhodné pre netechnických partnerov;
  Resend už je nasadený. Token jednorazový, časovo obmedzený.
- **Sprístupnenie pri „platba prijatá"** (rozšírenie `markOrderPaidAndInvoice`):
  vytvorí/nájde `Partner` z fakturačných údajov objednávky, prepojí okresy objednávky
  (`Profile.partnerId`), a pošle uvítací e-mail s prihlasovacím odkazom.
- **Rozsah editácie partnera:** obsahové polia profilu (displayName, logoUrl, phone, email,
  facebookUrl, youtubeUrl, websiteUrl, addressLine, lat/lng, heroImageUrl, tagline, aboutText,
  metaTitle, metaDescription) + child kolekcie (services, machines, gallery, videos, reviews).
  **NIE** status, paidAt, expiresAt, freeUpdateUsed, partnerské fakturačné údaje, cena.
- **Zverejnenie:** partner môže po vyplnení profil prepnúť `PENDING_CONTENT → PUBLISHED`
  (a späť na PENDING_CONTENT, ak chce stiahnuť). Iné stavy nemení.

## 3. Dátový model (Prisma)

Partner autentifikácia je oddelená od admin `User` (Auth.js). Pridáme:

```prisma
model Partner {
  // … existujúce polia …
  loginEmail String? @unique  // e-mail na prihlásenie (z objednávky), voliteľné
}

model PartnerLoginToken {
  id        String   @id @default(cuid())
  partnerId String
  partner   Partner  @relation(fields: [partnerId], references: [id])
  tokenHash String   @unique   // hash magic-link tokenu (nie plaintext)
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())
}

model PartnerSession {
  id        String   @id @default(cuid())
  partnerId String
  partner   Partner  @relation(fields: [partnerId], references: [id])
  tokenHash String   @unique   // hash session tokenu v cookie
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

`Partner` už má väzbu `profiles Profile[]`. Doplníme `loginTokens` a `sessions` relácie.

## 4. Toky

**A. Provisioning (pri „platba prijatá"):**
`markOrderPaidAndInvoice` po vystavení ostrej faktúry navyše:
1. `upsert` Partner podľa `ico` (alebo `loginEmail`): vyplní companyName, ico, dic, icDph,
   billingAddr, phone, email, loginEmail = order.email.
2. Prepojí profily okresov objednávky na tohto partnera (`Profile.partnerId`).
3. Vygeneruje magic-link token (uloží hash) a pošle partnerovi uvítací e-mail s odkazom
   `/partner/prihlasenie?token=…`.

**B. Prihlásenie (magic-link):**
1. Partner na `/partner` zadá e-mail → `POST /api/partner/login-link` vygeneruje token,
   pošle odkaz e-mailom (ak e-mail existuje ako `loginEmail`; inak sa tvárime rovnako —
   neprezrádzame existenciu účtu).
2. Klik na `/partner/prihlasenie?token=…` → overí token (hash, expirácia, nepoužitý),
   vytvorí `PartnerSession`, nastaví httpOnly cookie, presmeruje na `/partner/profil`.
3. Rate-limit na žiadosť o link (ako login endpoint).

**C. Self-service editor (`/partner/...`, chránené cookie):**
- `/partner/profily` — zoznam okresov partnera.
- `/partner/profil/[slug]` — editor obsahu (znovupoužije komponenty admin editora, ale
  server actions overujú, že profil patrí prihlásenému partnerovi, a needitujú zakázané polia).
- Upload fotiek cez existujúce `/api/admin/upload`? → potrebuje partnerskú autorizáciu;
  pridáme `/api/partner/upload` (rovnaká logika, iná autorizácia) alebo rozšírime guard.
- Tlačidlo „Zverejniť profil" (PENDING_CONTENT→PUBLISHED) / „Stiahnuť" (späť).

## 5. Bezpečnosť

- Tokeny (magic-link aj session) sa ukladajú **hashované** (SHA-256), plaintext len v e-maile/cookie.
- Magic-link: jednorazový, expirácia napr. 30 min. Session: httpOnly, Secure, SameSite=Lax,
  expirácia napr. 30 dní.
- Každá partnerská server action / API najprv overí session → partnerId → že cieľový profil
  patrí tomuto partnerovi. Žiadny prístup k cudzím profilom ani k admin oblasti.
- Enumeráciu účtov neprezrádzame (login-link vždy „ak e-mail existuje, poslali sme odkaz").

## 6. Testovanie

- Provisioning: po „platba prijatá" vznikne Partner, profily majú partnerId, token+e-mail.
- Magic-link: platný token prihlási, expirovaný/použitý odmietne.
- Autorizácia: partner nevie editovať cudzí profil ani zakázané polia (server-side kontrola).
- E2E proti DB s upratovaním (ako pri Celku A).

## 7. Mimo rozsahu

- Registrácia partnera bez objednávky (partneri vznikajú len platbou).
- Správa viacerých používateľov na jedného partnera (zatiaľ 1 loginEmail = 1 partner).
- Notifikácie o dopytoch v partnerskom rozhraní (dopyty chodia e-mailom ako doteraz).
