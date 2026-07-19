import type { Metadata } from "next";
import { Oswald, Inter } from "next/font/google";
import "./globals.css";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const SITE_URL = "https://www.zemneavykopoveprace.sk";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Zemné a výkopové práce na Slovensku | Katalóg firiem po okresoch",
    template: "%s | Zemné a výkopové práce",
  },
  description:
    "Nájdite firmu na zemné a výkopové práce vo svojom okrese a zavolajte jej. Katalóg overených firiem po celom Slovensku — jeden okres, jeden partner.",
  openGraph: {
    type: "website",
    locale: "sk_SK",
    siteName: "Zemné a výkopové práce",
    url: SITE_URL,
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sk">
      <body className={`${oswald.variable} ${inter.variable} bg-paper antialiased`}>
        {children}
      </body>
    </html>
  );
}
