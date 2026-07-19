// Abstrakcia odosielania e-mailov. Ak je nastavený RESEND_API_KEY, použije Resend;
// inak len zaloguje do konzoly (dev), aby vývoj nevyžadoval reálny provider.
import { Resend } from "resend";

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

const FROM = process.env.MAIL_FROM ?? "noreply@zemneavykopoveprace.sk";
const apiKey = process.env.RESEND_API_KEY;

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: SendArgs): Promise<{ ok: boolean; error?: string }> {
  if (!apiKey) {
    console.info(
      `[email:dev] (RESEND_API_KEY nenastavený) → komu: ${to} | predmet: ${subject}`,
    );
    return { ok: false, error: "email-not-configured" };
  }
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      replyTo,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "unknown" };
  }
}

export const OPERATOR_EMAIL =
  process.env.OPERATOR_EMAIL ?? "metracosro@gmail.com";
