import { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Kafelek } from '../contracts';
import { IkonaRodzaju } from './ikony';

// Sprzątanie warstwy może przyjść, gdy MapView już usunął mapę (onMapa(null) jest przed map.remove()).
// Usunięta mapa nie ma stylu i removeLayer rzuca: wtedy nie ma już czego sprzątać.
function bezpiecznie(f: () => void) {
  try {
    f();
  } catch {
    // mapa już usunięta
  }
}

const PROG_PRZECIAGANIA = 5;

// Kółko myszy daje skoki (linie, strony albo duże piksele), gładzik drobne kroki co klatkę.
// Skok przewijamy płynnie, drobne kroki od razu, żeby gładzik nie „pływał”.
function przewinKolkiem(el: HTMLElement, e: WheelEvent) {
  const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientWidth : 1);
  const skok = e.deltaMode !== 0 || Math.abs(delta) >= 50;
  const ograniczRuch = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  if (skok && !ograniczRuch && typeof el.scrollBy === 'function') el.scrollBy({ left: delta, behavior: 'smooth' });
  else el.scrollLeft += delta;
}

// Rząd przycisków nad mapą jak w Google Maps. Domyślnie wszystko wyłączone: mapa pusta.
// Na laptopie pasek przewija się też kółkiem i przeciąganiem myszą; krawędź z ukrytymi kafelkami jest wygaszona.
export function Kafelki({ kafelki, mapa }: { kafelki: Kafelek[]; mapa: MapLibreMap | null }) {
  const [wlaczone, setWlaczone] = useState<ReadonlySet<string>>(new Set());
  const [wiecejLewo, setWiecejLewo] = useState(false);
  const [wiecejPrawo, setWiecejPrawo] = useState(false);
  const [przeciaganie, setPrzeciaganie] = useState(false);
  const sprzatanie = useRef(new Map<string, () => void>());
  const pasek = useRef<HTMLElement>(null);

  useEffect(
    () => () => {
      sprzatanie.current.forEach(bezpiecznie);
      sprzatanie.current.clear();
      setWlaczone(new Set());
    },
    [mapa],
  );

  useEffect(() => {
    const el = pasek.current;
    if (!el) return;
    const nieMiesciSie = () => el.scrollWidth > el.clientWidth;

    const zmierz = () => {
      setWiecejLewo(el.scrollLeft > 1);
      setWiecejPrawo(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    };

    const naKolko = (e: WheelEvent) => {
      if (!nieMiesciSie() || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      przewinKolkiem(el, e);
    };

    // Przeciąganie tylko myszą: dotyk przewija przeglądarka. Po przeciągnięciu klik nie przełącza kafelka.
    let start: { x: number; scroll: number } | null = null;
    let przeciagniety = false;
    const naDol = (e: PointerEvent) => {
      przeciagniety = false;
      start = e.pointerType === 'mouse' && e.button === 0 && nieMiesciSie() ? { x: e.clientX, scroll: el.scrollLeft } : null;
    };
    const naRuch = (e: PointerEvent) => {
      if (!start) return;
      const dx = e.clientX - start.x;
      if (!przeciagniety) {
        if (Math.abs(dx) <= PROG_PRZECIAGANIA) return;
        przeciagniety = true;
        setPrzeciaganie(true);
        el.setPointerCapture?.(e.pointerId);
      }
      el.scrollLeft = start.scroll - dx;
    };
    const naGore = () => {
      start = null;
      setPrzeciaganie(false);
      // Klik przychodzi zaraz po pointerup; gdyby nie przyszedł, następny (np. z klawiatury) ma działać.
      if (przeciagniety) setTimeout(() => (przeciagniety = false), 0);
    };
    const naKlik = (e: MouseEvent) => {
      if (!przeciagniety) return;
      przeciagniety = false;
      e.preventDefault();
      e.stopPropagation();
    };

    zmierz();
    el.addEventListener('scroll', zmierz, { passive: true });
    el.addEventListener('wheel', naKolko, { passive: false });
    el.addEventListener('pointerdown', naDol);
    el.addEventListener('pointermove', naRuch);
    el.addEventListener('pointerup', naGore);
    el.addEventListener('pointercancel', naGore);
    el.addEventListener('click', naKlik, true);
    // jsdom i starsze przeglądarki nie mają ResizeObserver.
    const obserwator = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(zmierz);
    obserwator?.observe(el);
    return () => {
      el.removeEventListener('scroll', zmierz);
      el.removeEventListener('wheel', naKolko);
      el.removeEventListener('pointerdown', naDol);
      el.removeEventListener('pointermove', naRuch);
      el.removeEventListener('pointerup', naGore);
      el.removeEventListener('pointercancel', naGore);
      el.removeEventListener('click', naKlik, true);
      obserwator?.disconnect();
    };
  }, [kafelki]);

  if (!kafelki.length) return null;

  const przelacz = (k: Kafelek) => {
    if (!mapa) return;
    const nowe = new Set(wlaczone);
    const s = sprzatanie.current.get(k.id);
    if (s) {
      s();
      sprzatanie.current.delete(k.id);
      nowe.delete(k.id);
    } else {
      sprzatanie.current.set(k.id, k.dodajWarstwe(mapa));
      nowe.add(k.id);
    }
    setWlaczone(nowe);
  };

  return (
    <nav
      ref={pasek}
      className="kafelki"
      aria-label="Warstwy na mapie"
      data-wiecej-lewo={wiecejLewo || undefined}
      data-wiecej-prawo={wiecejPrawo || undefined}
      data-przeciaganie={przeciaganie || undefined}
    >
      {kafelki.map((k) => {
        const wlaczony = wlaczone.has(k.id);
        return (
          <button key={k.id} aria-pressed={wlaczony} disabled={!mapa} onClick={() => przelacz(k)}>
            <IkonaRodzaju rodzaj={k.id} kolor={wlaczony ? undefined : k.kolor} />
            {k.etykieta}
          </button>
        );
      })}
    </nav>
  );
}
