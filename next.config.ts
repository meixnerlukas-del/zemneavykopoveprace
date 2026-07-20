import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // /cesta/ → /cesta (308). Zjednocuje staré WP URL s koncovým lomítkom.
  trailingSlash: false,

  images: {
    remotePatterns: [
      // Placeholder fotky pre ukážkové profily (dev/demo).
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      // Reálne nahraté fotky — Vercel Blob (trvalé úložisko).
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },

  async redirects() {
    // 301 redirecty zo starého WordPressu na nové URL.
    // DOPLŇ podľa exportu starých URL (Screaming Frog / WP sitemap).
    // Príklad mapovania – uprav podľa reálnych starých ciest:
    return [
      // { source: "/domov", destination: "/", permanent: true },
      // { source: "/kontakt-2", destination: "/kontakt", permanent: true },
      // { source: "/okres/:slug", destination: "/zemne-a-vykopove-prace-:slug", permanent: true },
    ];
  },
};

export default nextConfig;
