"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { nearestDistrict, type DistrictPoint } from "@/lib/geo";
import { districtProfileSlug } from "@/lib/districts";

type Props = { points: DistrictPoint[] };

const OCCUPIED_COLOR = "#F2B01E"; // --jcb
const FREE_COLOR = "#C4C2BC"; // voľný okres (kap. 5)
const INK = "#16181A"; // --asphalt

type Tooltip = { x: number; y: number; name: string; firm: string | null };
type GeoResult = {
  name: string;
  slug: string;
  occupied: boolean;
  distanceKm: number;
};

export default function DistrictMap({ points }: Props) {
  const router = useRouter();
  const mapDivRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [geo, setGeo] = useState<GeoResult | null>(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const occupiedCount = points.filter((p) => p.occupied).length;
  const freeCount = points.length - occupiedCount;

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setStatus("error");
      return;
    }
    let cancelled = false;
    setOptions({ key: apiKey, v: "weekly" });

    importLibrary("maps")
      .then(async ({ Map }) => {
        const { Marker } = await importLibrary("marker");
        if (cancelled || !mapDivRef.current) return;

        const map = new Map(mapDivRef.current, {
          center: { lat: 48.7, lng: 19.6 },
          zoom: 7,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "cooperative",
          clickableIcons: false,
          backgroundColor: "#E8E6E1",
        });
        mapRef.current = map;

        for (const p of points) {
          const marker = new Marker({
            map,
            position: { lat: p.lat, lng: p.lng },
            title: p.name,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: p.occupied ? OCCUPIED_COLOR : FREE_COLOR,
              fillOpacity: 1,
              strokeColor: INK,
              strokeWeight: 1,
            },
          });

          marker.addListener("mouseover", (e: google.maps.MapMouseEvent) => {
            const dom = e.domEvent as MouseEvent;
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            setTooltip({
              x: dom.clientX - rect.left,
              y: dom.clientY - rect.top,
              name: p.name,
              firm: p.occupied ? p.displayName : null,
            });
          });
          marker.addListener("mouseout", () => setTooltip(null));
          marker.addListener("click", () => {
            router.push(`/${districtProfileSlug(p.slug)}`);
          });
        }

        // Kontajner mohol mať pri inicializácii ešte nulový rozmer — vynúť prekreslenie
        requestAnimationFrame(() => {
          google.maps.event.trigger(map, "resize");
          map.setCenter({ lat: 48.7, lng: 19.6 });
        });

        if (!cancelled) setStatus("ready");
      })
      .catch((err) => {
        console.error("Google Maps sa nepodarilo načítať:", err);
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [points, router]);

  const handleGeolocate = useCallback(() => {
    setGeoError(null);
    setGeo(null);
    if (!("geolocation" in navigator)) {
      setGeoError("Váš prehliadač nepodporuje zisťovanie polohy.");
      return;
    }
    setGeoBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoBusy(false);
        const res = nearestDistrict(
          pos.coords.latitude,
          pos.coords.longitude,
          points,
          true,
        );
        if (!res) {
          setGeoError("Nepodarilo sa určiť okres. Vyberte okres na mape.");
          return;
        }
        setGeo({
          name: res.district.name,
          slug: res.district.slug,
          occupied: res.isOccupied,
          distanceKm: Math.round(res.distanceKm),
        });
        if (mapRef.current) {
          mapRef.current.panTo({
            lat: res.district.lat,
            lng: res.district.lng,
          });
          mapRef.current.setZoom(9);
        }
      },
      () => {
        setGeoBusy(false);
        setGeoError(
          "Nepodarilo sa určiť polohu. Vyberte okres na mape alebo v zozname.",
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }, [points]);

  return (
    <div>
      {/* Legenda + geolokácia */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-6 text-sm uppercase tracking-[0.05em]">
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ background: OCCUPIED_COLOR }}
            />
            Obsadené: <strong>{occupiedCount}</strong>
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ background: FREE_COLOR }}
            />
            Voľné: <strong>{freeCount}</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={handleGeolocate}
          disabled={geoBusy}
          className="border-2 border-asphalt bg-paper px-4 py-2 text-sm font-medium uppercase tracking-[0.05em] text-asphalt transition-colors hover:border-jcb hover:text-jcb disabled:opacity-50"
        >
          {geoBusy ? "Zisťujem polohu…" : "Nájsť najbližšieho zhotoviteľa"}
        </button>
      </div>

      {/* Výsledok geolokácie */}
      {geo && (
        <div className="mb-4 border-l-4 border-jcb bg-asphalt px-4 py-3 text-paper">
          {geo.occupied ? (
            <p>
              Najbližší zhotoviteľ je v okrese <strong>{geo.name}</strong> (~
              {geo.distanceKm} km).{" "}
              <a
                href={`/${districtProfileSlug(geo.slug)}`}
                className="text-jcb underline"
              >
                Zobraziť profil
              </a>
            </p>
          ) : (
            <p>
              Vo vašom okolí zatiaľ nie je zhotoviteľ. Najbližší okres je{" "}
              <strong>{geo.name}</strong> (~{geo.distanceKm} km) —{" "}
              <a
                href={`/${districtProfileSlug(geo.slug)}`}
                className="text-jcb underline"
              >
                tento okres je voľný
              </a>
              .
            </p>
          )}
        </div>
      )}
      {geoError && (
        <p className="mb-4 border-l-4 border-muted bg-concrete-2 px-4 py-3 text-sm text-asphalt">
          {geoError}
        </p>
      )}

      {/* Mapa + tooltip */}
      <div ref={containerRef} className="relative">
        <div
          ref={mapDivRef}
          className="h-[420px] w-full bg-concrete sm:h-[520px]"
          role="application"
          aria-label="Interaktívna mapa okresov Slovenska"
        />

        {status === "loading" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-concrete/80 text-muted">
            Načítavam mapu…
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 flex items-center justify-center bg-concrete-2 p-6 text-center text-muted">
            <p className="max-w-md">
              Mapu sa nepodarilo načítať. Vyberte svoj okres v zozname nižšie.
              <br />
              <span className="text-xs">
                (Skontrolujte, či je v Google Cloud povolené Maps JavaScript
                API.)
              </span>
            </p>
          </div>
        )}

        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full border-l-[3px] border-jcb bg-asphalt px-3 py-2 text-sm text-paper shadow-lg"
            style={{ left: tooltip.x, top: tooltip.y - 12 }}
          >
            <span className="block font-medium uppercase tracking-[0.04em]">
              Okres {tooltip.name}
            </span>
            <span className="text-paper/80">
              {tooltip.firm ?? "Voľný okres"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
