// Klient Účto+ Open API — prenesený z overenej integrácie (Scopiq), testovanej voči
// sandboxu. Aktívny len ak je nastavený UCTOPLUS_API_KEY; inak volajúci doklad preskočí.
//
// Endpoint: https://api.moje.uctoplus.sk/{sandbox|production}/v3/invoice/add
//
// PASCE (overené voči sandboxu):
//  - items[].discount MUSÍ byť prítomné, aj keď je 0 (inak HTTP 400 "Sorry, this error…").
//  - items[].type (merná jednotka, napr. "ks") je povinné.
//  - dateDelivery je povinné pri invoiceType "INVOICE", pri "PROFORMA_INVOICE" nie —
//    posielame ho vždy (predfaktúra ho prijme bez problému).
//  - Odpoveď je OBALENÁ: { success, model: { id, invoiceNumber } } — čítať z model.
//    Prázdne id = chyba; success:false = chyba aj pri HTTP 200.
//  - Kľúč príjemcu je "reciever" (zámerný preklep — tak to API vyžaduje).

const UCTOPLUS_ENV = process.env.UCTOPLUS_ENV ?? "production"; // "sandbox" | "production"
const UCTOPLUS_API_KEY = process.env.UCTOPLUS_API_KEY ?? "";

export function uctoplusEnabled(): boolean {
  return !!UCTOPLUS_API_KEY;
}

// Injektovateľná HTTP vrstva (testy podsunú fake — žiadne reálne volania).
export type HttpFn = (
  url: string,
  init: { method: string; headers: Record<string, string>; body?: string },
) => Promise<{ status: number; json: Record<string, unknown> }>;

export const defaultHttp: HttpFn = async (url, init) => {
  const res = await fetch(url, { method: init.method, headers: init.headers, body: init.body });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: res.status, json };
};

export interface InvoiceReceiver {
  name: string;
  street?: string | null;
  city?: string | null;
  zip?: string | null;
  country?: string | null; // ISO 3166-1 alpha-3, napr. "SVK"
  sk_ico?: number | null;
  sk_dic?: number | null;
  vat?: string | null;
}

export interface InvoiceIssuer {
  name: string;
  street?: string | null;
  city?: string | null;
  zip?: string | null;
  country?: string | null;
  sk_ico?: string | number | null;
  sk_dic?: string | number | null;
  vat?: string | null;
}

export interface InvoiceItem {
  name: string;
  quantity: number;
  priceWithoutTax: number;
  taxPercentage: number;
  type?: string; // merná jednotka; default "ks"
  discount?: number; // zľava v %; POVINNÉ, default 0
}

export interface CreateInvoiceParams {
  kind: "issued" | "proforma";
  // Odkaz na poradovník (číselný rad) v Účto+ — Účto+ pridelí ďalšie číslo v poradí.
  // Ak nie je zadané, použije sa fallback: vlastné číslo (invoiceNumber string).
  counterId?: number | null;
  invoiceNumber?: string; // fallback vlastné číslo (keď counterId nie je nastavené)
  issuer: InvoiceIssuer;
  receiver: InvoiceReceiver;
  items: InvoiceItem[];
  paymentType?: string; // napr. "TRANSFER"
  variableSymbol?: string;
  dateIssue?: string; // yyyy-mm-dd
  dateDue?: string;
  dateDelivery?: string; // pri ostrej faktúre povinný
  currency?: string;
  note1?: string;
}

export interface CreatedInvoice {
  id: string;
  invoiceNumber: string;
  variableSymbol?: string;
}

export interface UctoCounter {
  id: number;
  name: string;
  format?: string;
  invoiceType?: string;
}

const TYPE_ISSUED = "INVOICE";
const TYPE_PROFORMA = "PROFORMA_INVOICE";

export class UctoPlusClient {
  private base: string;
  constructor(private http: HttpFn = defaultHttp) {
    this.base = `https://api.moje.uctoplus.sk/${UCTOPLUS_ENV}`;
  }

  private headers() {
    return { "api-key": UCTOPLUS_API_KEY, "content-type": "application/json" };
  }

  buildBody(p: CreateInvoiceParams) {
    const today = new Date().toISOString().slice(0, 10);
    const invoiceType = p.kind === "issued" ? TYPE_ISSUED : TYPE_PROFORMA;
    // Ak je zadaný poradovník (counterId), pošleme invoiceNumber ako OBJEKT { id }
    // → Účto+ pridelí ďalšie číslo z radu (správne pre účtovanie). Inak fallback string.
    // Podľa Účto+ (helpdesk + OpenAPI): invoiceNumber je oneOf[string, {id,...}];
    // pri poradovníku stačí { id }. Inak fallback vlastné číslo (string).
    const invoiceNumber = p.counterId != null ? { id: p.counterId } : p.invoiceNumber;
    return {
      invoiceType,
      invoiceNumber,
      dateIssue: p.dateIssue ?? today,
      dateDue: p.dateDue ?? today,
      dateDelivery: p.dateDelivery ?? p.dateIssue ?? today,
      currency: p.currency ?? "EUR",
      variableSymbol: p.variableSymbol, // Účto+ vyžaduje VS vždy
      paymentType: p.paymentType ?? "TRANSFER",
      issuer: p.issuer,
      reciever: p.receiver, // pozn.: Účto+ používa práve tento (pre)pis kľúča (overené)
      items: p.items.map((it) => ({
        name: it.name,
        quantity: it.quantity,
        priceWithoutTax: it.priceWithoutTax,
        taxPercentage: it.taxPercentage,
        type: it.type ?? "ks",
        discount: it.discount ?? 0, // POVINNÉ aj keď 0
      })),
      note1: p.note1,
    };
  }

  // POST /v3/invoice/add — vytvorí ostrú faktúru alebo predfaktúru.
  async createInvoice(p: CreateInvoiceParams): Promise<CreatedInvoice> {
    const r = await this.http(`${this.base}/v3/invoice/add`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(this.buildBody(p)),
    });
    if (r.status >= 300 || (r.json as { success?: boolean })?.success === false) {
      throw new Error(`Účto+ /invoice/add ${r.status}: ${JSON.stringify(r.json).slice(0, 300)}`);
    }
    const m = ((r.json as { model?: Record<string, unknown> })?.model ?? r.json ?? {}) as Record<
      string,
      unknown
    >;
    const id = String(m.id ?? m.invoice_id ?? "");
    if (!id) {
      throw new Error(`Účto+ /invoice/add: odpoveď bez id — ${JSON.stringify(r.json).slice(0, 300)}`);
    }
    // invoiceNumber môže prísť ako string alebo objekt (pri poradovníku) — vytiahni text.
    const numRaw = m.invoiceNumber ?? m.invoice_number ?? m.number ?? "";
    let invoiceNumber = "";
    if (typeof numRaw === "string") invoiceNumber = numRaw;
    else if (numRaw && typeof numRaw === "object") {
      const o = numRaw as Record<string, unknown>;
      invoiceNumber = String(o.formatted ?? o.number ?? o.name ?? o.format ?? "");
    }
    return {
      id,
      invoiceNumber,
      variableSymbol: String(m.variableSymbol ?? m.variable_symbol ?? "") || undefined,
    };
  }

  // GET /v2/dial/invoice-type/{invoiceType}/counters — poradovníky pre daný typ (plain array).
  async getCounters(invoiceType: "INVOICE" | "PROFORMA_INVOICE"): Promise<UctoCounter[]> {
    const url = `${this.base}/v2/dial/invoice-type/${invoiceType}/counters`;
    const r = await this.http(url, { method: "GET", headers: this.headers() });
    if (r.status >= 300 || (r.json as { success?: boolean })?.success === false) {
      throw new Error(`Účto+ /counters ${r.status}: ${JSON.stringify(r.json).slice(0, 300)}`);
    }
    const j = r.json as Record<string, unknown>;
    const arr = (j.model ?? j.data ?? j.counters ?? j) as unknown;
    const list = Array.isArray(arr) ? arr : [];
    return list.map((c) => {
      const o = c as Record<string, unknown>;
      return {
        id: Number(o.id),
        name: String(o.name ?? o.format ?? o.id ?? ""),
        format: o.format != null ? String(o.format) : undefined,
        invoiceType: o.invoiceType != null ? String(o.invoiceType) : invoiceType,
      };
    });
  }
}
