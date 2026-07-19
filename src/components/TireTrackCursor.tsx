"use client";

import { useEffect, useRef } from "react";

type Mark = { x: number; y: number; angle: number; t: number };

const LIFETIME = 1500; // ms
const MAX_OPACITY = 0.35;
const SPACING = 18; // px prejdenej vzdialenosti medzi odtlačkami
const TREAD_HALF_WIDTH = 9; // polovica šírky dezénu
const TREAD_DEPTH = 6;

export default function TireTrackCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Vypnúť na dotykových zariadeniach a pri prefers-reduced-motion
    const noHover = window.matchMedia("(hover: none)").matches;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (noHover || reduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = Math.max(1, window.devicePixelRatio || 1);
    const resize = () => {
      dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };
    resize();
    window.addEventListener("resize", resize);

    const marks: Mark[] = [];
    let lastX: number | null = null;
    let lastY: number | null = null;
    let acc = 0;

    const onMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      if (lastX === null || lastY === null) {
        lastX = x;
        lastY = y;
        return;
      }
      const dx = x - lastX;
      const dy = y - lastY;
      const dist = Math.hypot(dx, dy);
      acc += dist;
      if (acc >= SPACING && dist > 0) {
        acc = 0;
        marks.push({ x, y, angle: Math.atan2(dy, dx), t: performance.now() });
      }
      lastX = x;
      lastY = y;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const drawChevron = (m: Mark, alpha: number) => {
      ctx.save();
      ctx.translate(m.x * dpr, m.y * dpr);
      ctx.rotate(m.angle);
      ctx.scale(dpr, dpr);
      ctx.strokeStyle = `rgba(22, 24, 26, ${alpha})`; // --asphalt
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      // šípkový (V) dezén otočený v smere jazdy
      ctx.moveTo(-TREAD_DEPTH / 2, -TREAD_HALF_WIDTH);
      ctx.lineTo(TREAD_DEPTH / 2, 0);
      ctx.lineTo(-TREAD_DEPTH / 2, TREAD_HALF_WIDTH);
      ctx.stroke();
      ctx.restore();
    };

    let raf = 0;
    const loop = () => {
      const now = performance.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = marks.length - 1; i >= 0; i--) {
        const age = now - marks[i].t;
        if (age >= LIFETIME) {
          marks.splice(i, 1);
          continue;
        }
        // ease-out fade z MAX_OPACITY na 0
        const p = age / LIFETIME;
        const eased = 1 - p * p; // ease-out
        drawChevron(marks[i], MAX_OPACITY * eased);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-30"
    />
  );
}
