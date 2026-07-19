import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Kontaktujte prevádzkovateľa portálu zemneavykopoveprace.sk — Metraco s.r.o. E-mail, telefón, sídlo a kontaktný formulár.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl uppercase sm:text-4xl">Kontakt</h1>
      <p className="mt-4 text-muted">
        Máte otázku k portálu, spolupráci alebo objednávke? Napíšte nám.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <div className="border-l-4 border-jcb bg-concrete-2 p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-muted">E-mail</p>
          <a href="mailto:metracosro@gmail.com" className="mt-1 block hover:text-jcb">
            metracosro@gmail.com
          </a>
        </div>
        <div className="border-l-4 border-jcb bg-concrete-2 p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-muted">Telefón</p>
          <a href="tel:+421944208204" className="mt-1 block hover:text-jcb">
            +421 944 208 204
          </a>
        </div>
        <div className="border-l-4 border-jcb bg-concrete-2 p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-muted">Sídlo</p>
          <p className="mt-1">Metraco s.r.o.<br />Dolné Obdokovce 64, 951 02</p>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="section-title text-2xl">Napíšte nám</h2>
        <ContactForm />
      </div>
    </div>
  );
}
