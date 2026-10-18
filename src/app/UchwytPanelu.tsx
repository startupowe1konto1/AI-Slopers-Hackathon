import { useLayoutEffect, useRef, useState } from 'react';

// Uchwyt między mapą a panelem: przeciągnięcie (palcem albo myszą) lub strzałki zmieniają wysokość panelu, mapa zajmuje resztę.
// Ustawia --panel na .aplikacja zamiast stanu w App, żeby przeciąganie nie przerysowywało kart i mapy. Wysokość nie jest zapisywana.
const MIN = 15;
const MAX = 80;
const KROK = 10; // procent wysokości ekranu
const ogranicz = (w: number) => Math.min(MAX, Math.max(MIN, Math.round(w)));

export function UchwytPanelu() {
  const [wysokosc, setWysokosc] = useState(48);
  const ref = useRef<HTMLDivElement>(null);
  const start = useRef<{ y: number; w: number } | null>(null);

  useLayoutEffect(() => {
    ref.current?.parentElement?.style.setProperty('--panel', `${wysokosc}dvh`);
  }, [wysokosc]);

  return (
    <div
      ref={ref}
      className="uchwyt-panelu"
      role="separator"
      aria-orientation="horizontal"
      aria-label="Wysokość panelu z wynikami"
      aria-valuemin={MIN}
      aria-valuemax={MAX}
      aria-valuenow={wysokosc}
      tabIndex={0}
      onPointerDown={(e) => {
        start.current = { y: e.clientY, w: wysokosc };
        e.currentTarget.setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (start.current) setWysokosc(ogranicz(start.current.w + ((start.current.y - e.clientY) / window.innerHeight) * 100));
      }}
      onPointerUp={() => (start.current = null)}
      onPointerCancel={() => (start.current = null)}
      onKeyDown={(e) => {
        const zmiana = e.key === 'ArrowUp' ? KROK : e.key === 'ArrowDown' ? -KROK : 0;
        if (!zmiana) return;
        e.preventDefault();
        setWysokosc((w) => ogranicz(w + zmiana));
      }}
    />
  );
}
