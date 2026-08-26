import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { REGIONS, districtProfileSlug } from "@/lib/districts";

export const metadata: Metadata = {
  title: "Zoznam okresov — zemné a výkopové práce",
  description:
    "Prehľad všetkých 79 okresov Slovenska. Nájdite firmu na zemné a výkopové práce vo svojom okrese alebo zistite, ktoré okresy sú ešte voľné.",
};

// Vždy čerstvé (stav obsadenia sa mení v admine)
export const dynamic = "force-dynamic";

export default async function OkresyPage() {
  const districts = await prisma.district.findMany({
    orderBy: { code: "asc" },
    include: { profile: { select: { status: true, displayName: true } } },
  });

  const isOccupied = (status?: string) => !!status && status !== "FREE";
  const occupied = districts.filter((d) => isOccupied(d.profile?.status)).length;
  const free = districts.length - occupied;

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl uppercase sm:text-4xl">Okresy Slovenska</h1>
      <p className="mt-4 max-w-2xl text-muted">
        Katalóg firiem na zemné a výkopové práce po okresoch. Kliknite na svoj
        okres a zavolajte firme, alebo si voľný okres zarezervujte.
      </p>

      <div className="mt-6 flex gap-6 text-sm uppercase tracking-[0.05em]">
        <span>
          <span className="inline-block h-3 w-3 bg-jcb align-middle" /> Obsadené:{" "}
          <strong>{occupied}</strong>
        </span>
        <span>
          <span className="inline-block h-3 w-3 bg-muted align-middle" /> Voľné:{" "}
          <strong>{free}</strong>
        </span>
      </div>

      <div className="mt-12 space-y-12">
        {REGIONS.map((region) => {
          const inRegion = districts.filter((d) => d.region === region);
          return (
            <section key={region}>
              <h2 className="section-title text-xl">{region}</h2>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
                {inRegion.map((d) => {
                  const occ = isOccupied(d.profile?.status);
                  const published = d.profile?.status === "PUBLISHED";
                  return (
                    <li key={d.id}>
                      <Link
                        href={`/${districtProfileSlug(d.slug)}`}
                        className="group flex items-center gap-2 py-1"
                      >
                        <span
                          className={`inline-block h-2.5 w-2.5 ${occ ? "bg-jcb" : "bg-muted"}`}
                          aria-hidden
                        />
                        <span className="group-hover:text-jcb">{d.name}</span>
                        {published && d.profile?.displayName ? (
                          <span className="truncate text-xs text-muted">
                            · {d.profile.displayName}
                          </span>
                        ) : occ ? (
                          <span className="text-xs uppercase tracking-[0.05em] text-jcb">
                            obsadené
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
