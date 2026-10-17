import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Akcja, Trasa, Wsp } from '../contracts';
import { pokazTrase } from '../map/trasaNaMapie';
import { trasa } from '../offline/trasy';

const odleglosc = (m: number) => (m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`);

export function etykietaAkcji(a: Akcja): string {
  switch (a.typ) {
    case 'trasa':
      return `${a.profil === 'rower' ? 'Trasa rowerem' : 'Trasa pieszo'}: ${a.nazwa}`;
    case 'mapa':
      return 'Pokaż na mapie';
    case 'link':
    case 'przycisk':
      return a.etykieta;
  }
}

export function opisTrasy(t: Trasa): string {
  const jak = t.profil === 'rower' ? 'rowerem' : 'pieszo';
  if (t.zrodlo === 'prosta') return `${odleglosc(t.dystansM)} w linii prostej, ${jak} ok. ${t.czasMin} min. Bez sieci nie mamy trasy po ulicach.`;
  return `${odleglosc(t.dystansM)} po ulicach, ${jak} ok. ${t.czasMin} min${t.zrodlo === 'osrm-zapisana' ? ' (trasa zapisana w telefonie)' : ''}.`;
}

// addSource/addLayer rzucają, gdy styl się jeszcze ładuje, więc rysujemy przy gotowym stylu.
// isStyleLoaded() jest false także w trakcie ładowania kafelków, a 'load' przychodzi tylko raz: czekamy na 'idle',
// które przychodzi po 'load' i po każdym doładowaniu. Wyjątek z modułu zostaje tutaj: nic nie rysujemy, karta zostaje.
// Sprzątanie działa raz i nie rzuca (także po map.remove()).
function rysujGdyGotowa(mapa: MapLibreMap, rysuj: () => () => void): () => void {
  let sprzatanie: (() => void) | null = null;
  let koniec = false;
  const wykonaj = () => {
    if (koniec) return;
    try {
      sprzatanie = rysuj();
    } catch (e) {
      console.error('[karta] nie udało się narysować na mapie', e);
    }
  };
  const czeka = !mapa.isStyleLoaded();
  if (czeka) mapa.once('idle', wykonaj);
  else wykonaj();
  return () => {
    if (koniec) return;
    koniec = true;
    try {
      if (czeka) mapa.off('idle', wykonaj);
      sprzatanie?.();
    } catch {
      // mapa już usunięta: nie ma czego sprzątać
    }
  };
}

// Akcje rysujące na mapie: zwraca sprzątanie i (dla trasy) opis do pokazania pod kartą. Nigdy się nie odrzuca.
export async function wykonajNaMapie(a: Akcja, mapa: MapLibreMap, od: Wsp): Promise<{ sprzatanie: () => void; opis?: string }> {
  if (a.typ === 'mapa') return { sprzatanie: rysujGdyGotowa(mapa, () => a.pokaz(mapa)) };
  if (a.typ === 'trasa') {
    const t = await trasa(od, a.cel, a.profil ?? 'pieszo');
    return { sprzatanie: rysujGdyGotowa(mapa, () => pokazTrase(mapa, t)), opis: opisTrasy(t) };
  }
  return { sprzatanie: () => {} };
}
