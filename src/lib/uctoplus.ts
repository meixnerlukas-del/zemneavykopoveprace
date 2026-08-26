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
  invoiceNumber: string;
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
    return {
      invoiceType: p.kind === "issued" ? TYPE_ISSUED : TYPE_PROFORMA,
      invoiceNumber: p.invoiceNumber,
      dateIssue: p.dateIssue ?? today,
      dateDue: p.dateDue ?? today,
      dateDelivery: p.dateDelivery ?? p.dateIssue ?? today,
      currency: p.currency ?? "EUR",
      variableSymbol: p.variableSymbol,
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
    return {
      id,
      invoiceNumber: String(m.invoiceNumber ?? m.invoice_number ?? m.number ?? ""),
    };
  }
}
