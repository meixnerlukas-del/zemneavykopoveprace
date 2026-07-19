"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

type Props = {
  lat: number;
  lng: number;
  label: string;
};

export default function SeatMap({ lat, lng, label }: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const initedRef = useRef(false);

  useEffect(() => {
    if (initedRef.current || !divRef.current) return;
    initedRef.current = true;

    let cleanup = () => {};
    (async () => {
      const L = (await import("leaflet")).default;
      if (!divRef.current) return;
      const map = L.map(divRef.current, {
        center: [lat, lng],
        zoom: 13,
        scrollWheelZoom: false,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: '<div style="width:18px;height:18px;background:#F2B01E;border:2px solid #16181A"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      L.marker([lat, lng], { icon }).addTo(map).bindPopup(label);

      cleanup = () => map.remove();
    })();

    return () => cleanup();
  }, [lat, lng, label]);

  return (
    <div
      ref={divRef}
      className="h-72 w-full bg-concrete"
      role="application"
      aria-label={`Mapa sídla firmy: ${label}`}
    />
  );
}
