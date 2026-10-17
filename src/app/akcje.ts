import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Akcja, Trasa, Wsp } from '../contracts';
import { pokazPlan, pokazTrase, type OdcinekPlanu } from '../map/trasaNaMapie';
import { najblizszyOdjazd, opisPlanu, opisPrzejazdu, planKomunikacji, type PlanKomunikacji } from '../modules/transport/komunikacja';
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
  if (t.zrodlo === 'prosta') return `${odleglosc(t.dystansM)} w linii prostej, ${jak} ok. ${t.czasMin} min. Nie mamy teraz trasy po ulicach.`;
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
// aktualne(): czy kliknięcie jest wciąż ostatnie. Spóźniona trasa nic nie rysuje i nie przesuwa mapy.
export async function wykonajNaMapie(
  a: Akcja,
  mapa: MapLibreMap,
  od: Wsp,
  aktualne: () => boolean = () => true,
): Promise<{ sprzatanie: () => void; opis?: string }> {
  if (a.typ === 'mapa') return { sprzatanie: rysujGdyGotowa(mapa, () => a.pokaz(mapa)) };
  if (a.typ === 'trasa') {
    const t = await trasa(od, a.cel, a.profil ?? 'pieszo');
    if (!aktualne()) return { sprzatanie: () => {} };
    return { sprzatanie: rysujGdyGotowa(mapa, () => pokazTrase(mapa, t)), opis: opisTrasy(t) };
  }
  return { sprzatanie: () => {} };
}

// Godzina odjazdu to dodatek: nie czekamy na nią dłużej niż 3 s.
const ODJAZD_MS = 3000;
const zLimitem = <T>(p: Promise<T>, ms: number): Promise<T | null> =>
  Promise.race([p.catch(() => null), new Promise<null>((r) => setTimeout(() => r(null), ms))]);

const tekstOdjazdu = (o: { godzina: string; zaMin: number }) => ` Najbliższy odjazd: ${o.godzina} (za ${o.zaMin} min, według rozkładu).`;

export type WynikKomunikacji = { sprzatanie: () => void; opis?: string; szczegoly?: string[] };

// Trasa komunikacją bez przesiadek: dojście pieszo, przejazd po przystankach linii, zejście do celu.
// Bez połączenia rysuje trasę pieszo. Nigdy się nie odrzuca; spóźniony wynik nic nie rysuje.
export async function wykonajKomunikacje(
  mapa: MapLibreMap,
  od: Wsp,
  cel: Wsp,
  blackout: boolean,
  aktualne: () => boolean = () => true,
): Promise<WynikKomunikacji> {
  let plan: PlanKomunikacji;
  try {
    plan = await planKomunikacji(od, cel, { blackout });
  } catch {
    return { sprzatanie: () => {}, opis: 'Nie mam danych o komunikacji. Pobierz paczkę offline, gdy będzie sieć.' };
  }
  if (!plan.warianty.length) {
    const w = await wykonajNaMapie({ typ: 'trasa', cel, nazwa: '' }, mapa, od, aktualne);
    if (!aktualne()) return { sprzatanie: w.sprzatanie };
    return { sprzatanie: w.sprzatanie, opis: opisPlanu(plan), szczegoly: w.opis ? [w.opis] : undefined };
  }
  // Odjazdy wszystkich wariantów naraz. Linie, które dziś jeszcze jadą, idą na początek (metro jeździ do nocy, bez rozkładu w API).
  const odjazdy = await Promise.all(
    plan.warianty.map((w) => (w.typ === 'metro' ? Promise.resolve(null) : zLimitem(najblizszyOdjazd(w.z.id, w.linia), ODJAZD_MS))),
  );
  const warianty = plan.warianty.map((w, i) => ({ w, odjazd: odjazdy[i], brak: w.typ !== 'metro' && !odjazdy[i] }));
  const [{ w: p, odjazd, brak }, ...inne] = [...warianty].sort((a, b) => Number(a.brak) - Number(b.brak));
  const brakOdjazdu = navigator.onLine ? 'Według rozkładu ta linia dziś już nie jedzie.' : 'Bez sieci nie pokażę godziny odjazdu.';
  const [dojscie, zejscie] = await Promise.all([trasa(od, p.z, 'pieszo'), trasa(p.do, cel, 'pieszo')]);
  if (!aktualne()) return { sprzatanie: () => {} };
  const odcinki: OdcinekPlanu[] = [
    { rodzaj: 'pieszo', linia: dojscie.linia },
    { rodzaj: p.typ, linia: p.przystanki.map((s) => [s.lon, s.lat]) },
    { rodzaj: 'pieszo', linia: zejscie.linia },
  ];
  const przystanki: [number, number][] = [[p.z.lon, p.z.lat], [p.do.lon, p.do.lat]];
  const szczegoly = [
    ...(plan.pieszoSzybciej || plan.blackout ? [opisPlanu(plan)] : []),
    ...(brak ? [brakOdjazdu] : []),
    ...inne.map((x) => `Inna opcja: ${opisPrzejazdu(x.w)}${x.odjazd ? tekstOdjazdu(x.odjazd) : x.brak ? ` ${brakOdjazdu}` : ''}`),
  ];
  return {
    sprzatanie: rysujGdyGotowa(mapa, () => pokazPlan(mapa, odcinki, przystanki)),
    opis: opisPrzejazdu(p) + (odjazd ? tekstOdjazdu(odjazd) : ''),
    szczegoly: szczegoly.length ? szczegoly : undefined,
  };
}
