# Celok A — Objednávka, faktúry a obsadenosť

**Dátum:** 2026-08-25
**Projekt:** zemneavykopoveprace.sk (Metraco s.r.o.)
**Rozsah:** Automatická predfaktúra po objednávke, značenie obsadených okresov, admin akcia „platba prijatá" → ostrá faktúra cez Účto+. Partnerský self-service (login + úprava profilu) je **Celok B** — samostatná špecifikácia, nadväzuje na admin akciu „platba prijatá".

---

## 1. Cieľ a kontext

Model webu: 1 okres = 1 Partner (exkluzivita), 79 okresov, cena **196,80 € s DPH / rok / okres**, každý ďalší okres −25 %. Prevádzkovateľ a vystaviteľ faktúr: **Metraco s.r.o.**, IČO 50 010 221, IČ DPH SK2120143707, IBAN SK4602000000004565568056.

Aktuálny tok (existuje): objednávkový formulár → `POST /api/order` vytvorí `Order`, rezervuje voľné okresy (`Profile.status FREE → PENDING_PAYMENT`), pošle e-maily operátorovi aj zákazníkovi. Admin objednávky (`/admin/objednavky`) len prepína `handled`.

Tento celok pridáva **fakturačný tok cez Účto+** a **vizuálnu obsadenosť**.

### Rozhodnutia (odsúhlasené)
- Predfaktúra aj ostrá faktúra idú **cez Účto+** (PROFORMA_INVOICE / INVOICE), prepojené.
- Predfaktúra sa vystaví **automaticky hneď po objednávke**.
- Obsadené okresy sa označia **všade** (mapa, zoznam `/okresy`, objednávkový formulár).
- Po „platba prijatá" profil prejde na **PENDING_CONTENT** (čaká na obsah), nie rovno PUBLISHED.
- Predaj sa neblokuje na výpadku Účto+ — objednávka prejde aj keď doklad zlyhá; admin ho vie dogenerovať.

---

## 2. Dátový model (Prisma)

Nový model `Invoice`:

```prisma
model Invoice {
  id                String   @id @default(cuid())
  orderId           String
  order             Order    @relation(fields: [orderId], references: [id])
  type              String   // "proforma" | "final"
  status            String   @default("pending") // pending | issued | paid | failed
  invoiceNumber     String   @unique              // naše číslo, napr. "PF20260001" / "20260001"
  variableSymbol    String                        // číslice z invoiceNumber
  amountWithoutVat  Decimal
  amountWithVat     Decimal
  vatRate           Int      @default(20)
  currency          String   @default("EUR")
  uctoplusInvoiceId String?                        // id dokladu z Účto+ (uuid)
  uctoplusNumber    String?                        // číslo dokladu vrátené Účto+
  relatedProformaId String?                        // pri type=final → odkaz na Invoice predfaktúry
  pdfUrl            String?                         // ak Účto+ poskytne PDF/odkaz
  lastError         String?                         // posledná chyba Účto+ (pre admin retry)
  issuedAt          DateTime?
  paidAt            DateTime?
  createdAt         DateTime @default(now())
}
```

Zmeny v `Order`: pridať `paidAt DateTime?` a `invoices Invoice[]`.

**Číslovanie:** vlastná ročná postupnosť. Sekvencia sa odvodí z počtu existujúcich dokladov daného typu v aktuálnom roku (`count + 1`), formát: predfaktúra `PF{yyyy}{NNNN}`, ostrá `{yyyy}{NNNN}` (4-miestne poradie, dopĺňané nulami). Variabilný symbol = len číslice (`{yyyy}{NNNN}`). Generovanie v transakcii, aby dve súbežné objednávky nedostali rovnaké číslo.

> **Otvorené (overiť voči Účto+ API):** či Účto+ akceptuje naše `invoiceNumber`, alebo prideľuje vlastné. Scopiq klient `invoiceNumber` posiela ako povinné a zároveň číta vrátené `model.invoiceNumber` — ukladáme oboje (`invoiceNumber` = naše, `uctoplusNumber` = ich).

---

## 3. Tok: objednávka → automatická predfaktúra

Rozšírenie `POST /api/order` (po vytvorení `Order` a rezervácii okresov):

1. Vypočítaj sumy z `pricing.ts`:
   - prvý okres: **164,00 € bez DPH** (+20 % = 196,80),
   - každý ďalší: **123,00 € bez DPH** (+20 % = 147,60; −25 % z prvého).
   - `amountWithoutVat` = súčet netto, `amountWithVat` = súčet brutto (zaokrúhlené na 2 des.).
2. V transakcii vytvor `Invoice(type="proforma", status="pending")` s vygenerovaným `invoiceNumber` + `variableSymbol`.
3. Zavolaj `uctoplus.createInvoice({ kind: "proforma", … })`:
   - úspech → ulož `uctoplusInvoiceId`, `uctoplusNumber`, `status="issued"`, `issuedAt`.
   - zlyhanie / kľúč nenastavený → `status` ostane `"pending"` (resp. `"failed"` + `lastError`), objednávka **aj tak uspeje**.
4. E-mail zákazníkovi = **výzva na úhradu**: suma s DPH, IBAN `SK4602000000004565568056`, **variabilný symbol**, splatnosť (napr. +14 dní), číslo predfaktúry, (ak dostupné) odkaz/PDF. Toto nahrádza/rozširuje existujúci potvrdzovací e-mail.
5. E-mail operátorovi (existuje) doplní číslo predfaktúry a stav vystavenia.

Položky faktúry (Účto+ `items[]`): jedna položka na okres, `name` = „Ročný profil zhotoviteľa — okres {Názov} (zemneavykopoveprace.sk)", `quantity: 1`, `priceWithoutTax` = netto daného okresu, `taxPercentage: 20`, `type: "ks"`, `discount: 0`.

---

## 4. Tok: admin „platba prijatá" → ostrá faktúra

V `/admin/objednavky` pri objednávke, ktorá má vystavenú predfaktúru a ešte nie je zaplatená, pribudne tlačidlo **„Platba prijatá"**. Server action (auth guard):

1. Vytvor `Invoice(type="final", status="pending", relatedProformaId=<proforma.id>)` s ostrým číslom.
2. `uctoplus.createInvoice({ kind: "issued", dateDelivery=<dnes>, … })` — rovnaké položky/sumy ako predfaktúra. Úspech → ulož ids, `status="paid"`, `issuedAt`, `paidAt`.
3. Predfaktúru označ `status="paid"`, `paidAt`.
4. `Order.paidAt = now`.
5. Profily okresov objednávky `PENDING_PAYMENT → PENDING_CONTENT`.
6. E-mail zákazníkovi: potvrdenie úhrady + ostrá faktúra (číslo, suma, odkaz/PDF).
7. **Bod napojenia na Celok B:** tu sa neskôr vygeneruje a odošle partnerovi prístup na úpravu profilu.

Ak Účto+ zlyhá, akcia to zobrazí adminovi (nezmení stavy nezvratne skôr, než je doklad vystavený) a umožní **retry**. Idempotencia: opätovné kliknutie po úspechu nevytvorí druhý doklad (kontrola `Order.paidAt` / existencie final invoice).

---

## 5. Obsadenosť — všade

Pomocná funkcia `isOccupied(profileStatus)` = `status !== "FREE"`. „Voľné" = FREE; „Obsadené" = čokoľvek iné (PENDING_PAYMENT, PENDING_CONTENT, PUBLISHED, EXPIRED*, SUSPENDED). (*EXPIRED sa môže riešiť ako voľné neskôr — mimo rozsahu.)

- **Mapa (`DistrictMap`)**: piny obsadených okresov vizuálne odlíšené (žltá `--jcb` / iný marker + tooltip „Obsadené"), voľné neutrálne. Klik na obsadený → profil (ktorý ukáže „obsadené, pripravuje sa" alebo publikovaný profil).
- **Zoznam `/okresy`**: štítok **„Obsadené"** (jcb) vs **„Voľné"** pri každom okrese.
- **Objednávkový formulár (`OrderForm`)**: obsadené okresy sa **nedajú vybrať** (disabled + vizuálne označené). Backend `/api/order` už neFREE okresy odmieta (ostáva ako poistka).
- **Profil obsadeného, nezverejneného okresu** (PENDING_PAYMENT/PENDING_CONTENT): namiesto predajného CTA ukáž neutrálne „Tento okres je už obsadený, profil sa pripravuje."

---

## 6. Účto+ klient

Prenesenie overeného klienta zo Scopiqu (`scopiq/api/src/billing/uctoplus.ts`) do `src/lib/uctoplus.ts`, prispôsobené na Next.js (čítanie `process.env` priamo, žiadny NestJS `env` objekt).

- Base URL: `https://api.moje.uctoplus.sk/{UCTOPLUS_ENV}` (`sandbox` | `production`), endpoint `POST /v3/invoice/add`.
- Header: `api-key: <UCTOPLUS_API_KEY>`, `content-type: application/json`.
- Telo (camelCase): `invoiceType` (`"INVOICE"` | `"PROFORMA_INVOICE"`), `invoiceNumber`, `dateIssue`, `dateDue`, `dateDelivery`, `currency`, `variableSymbol`, `paymentType: "TRANSFER"`, `issuer`, `reciever` (**zámerný preklep — tak to API vyžaduje**), `items[]` s `discount` (**vždy, aj 0**) a `type` (`"ks"`).
- Odpoveď je **obalená**: `{ success, model: { id, invoiceNumber } }` — čítať z `model`, prázdne `id` = chyba, `success:false` = chyba aj pri HTTP 200.
- Vystaviteľ (`issuer`) = Metraco: name „Metraco s.r.o.", street „Dolné Obdokovce 64", zip „951 02", country „SVK", sk_ico 50010221, vat „SK2120143707". (Konštanta v kóde.)
- `uctoplusEnabled()` = `!!process.env.UCTOPLUS_API_KEY`. Bez kľúča sa `createInvoice` **preskočí** (Invoice ostane `pending`), tok nespadne.

**Pasce (z overenej Scopiq integrácie):** `discount` povinné aj keď 0 (inak HTTP 400 „Sorry, this error surprised us…"); `dateDelivery` povinné pri `INVOICE`, nie pri `PROFORMA_INVOICE` (posielame vždy); odpoveď obalená v `model`; kľúč príjemcu je `reciever`.

**Env premenné (Vercel + `.env.example`):** `UCTOPLUS_API_KEY` (secret, do Vercelu ručne — nie do repa/chatu), `UCTOPLUS_ENV` (default `production`). Typy dokladov konštanty v kóde (`"INVOICE"`, `"PROFORMA_INVOICE"`).

---

## 7. Chyby a hraničné stavy

- Účto+ nedostupné / bez kľúča: objednávka prejde, `Invoice.status="pending"`/`"failed"` + `lastError`; admin má v `/admin/objednavky` tlačidlo **„Vystaviť/opakovať doklad"**.
- Súbežné objednávky: číslovanie v DB transakcii.
- Dvojklik „Platba prijatá": idempotencia cez `Order.paidAt` / existenciu final invoice.
- Čiastočne voľné okresy v objednávke: fakturuj len reálne rezervované (FREE→PENDING) — už rieši `/api/order`.

---

## 8. Testovanie

- Jednotkové: `uctoplus.buildBody` (tvar tela, `discount`/`dateDelivery`/`reciever`), `pricing` netto/brutto výpočty, generovanie čísla+VS.
- Klient s **injektovaným HTTP fake** (ako v Scopiqu) — žiadne reálne volania v testoch.
- E2E manuálne po dodaní kľúča: objednávka → predfaktúra v Účto+, „platba prijatá" → ostrá faktúra, kontrola prepojenia proforma↔final, stavy profilov, e-maily.
- Sandbox Účto+ **rollbackuje** zmeny (potvrdené podporou) — voči sandboxu sa overí len tvar požiadavky/čítanie odpovede, nie vznik dokladu. Ostré overenie na firme s reálnym predplatným.

---

## 9. Čo počká na Účto+ API kľúč

Iba reálne vystavenie dokladov a finálne overenie názvov polí voči aktuálnej Účto+ dokumentácii. Všetko ostatné (model `Invoice`, tok objednávky, admin akcia, obsadenosť, e-maily s platobnými údajmi, číslovanie) je funkčné okamžite; po vložení `UCTOPLUS_API_KEY` do Vercelu začnú chodiť reálne doklady bez ďalšej zmeny kódu.
