import { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Kafelek } from '../contracts';

// Sprzątanie warstwy może przyjść, gdy MapView już usunął mapę (onMapa(null) jest przed map.remove()).
// Usunięta mapa nie ma stylu i removeLayer rzuca: wtedy nie ma już czego sprzątać.
function bezpiecznie(f: () => void) {
  try {
    f();
  } catch {
    // mapa już usunięta
  }
}

// Rząd przycisków nad mapą jak w Google Maps. Domyślnie wszystko wyłączone: mapa pusta.
export function Kafelki({ kafelki, mapa }: { kafelki: Kafelek[]; mapa: MapLibreMap | null }) {
  const [wlaczone, setWlaczone] = useState<ReadonlySet<string>>(new Set());
  const sprzatanie = useRef(new Map<string, () => void>());

  useEffect(
    () => () => {
      sprzatanie.current.forEach(bezpiecznie);
      sprzatanie.current.clear();
      setWlaczone(new Set());
    },
    [mapa],
  );

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
    <nav className="kafelki" aria-label="Warstwy na mapie">
      {kafelki.map((k) => (
        <button key={k.id} aria-pressed={wlaczone.has(k.id)} disabled={!mapa} onClick={() => przelacz(k)}>
          <span className="kropka" style={{ background: k.kolor }} aria-hidden="true" />
          {k.etykieta}
        </button>
      ))}
    </nav>
  );
}
