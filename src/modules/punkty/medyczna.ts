import type { KontekstWskazowek, Punkt, RodzajPunktu, Wskazowka } from '../../contracts';
import { godzinyPoPolsku } from './godziny';
import { formatujOdleglosc, najblizsze, odlegloscM } from './najblizsze';

const RODZAJE: { rodzaj: RodzajPunktu; nazwa: string }[] = [
  { rodzaj: 'aed', nazwa: 'AED' },
  { rodzaj: 'sor', nazwa: 'SOR' },
  { rodzaj: 'apteka', nazwa: 'Apteka' },
  { rodzaj: 'przychodnia', nazwa: 'Przychodnia' },
];
const ZRODLO = 'AED i apteki: m.st. Warszawa; SOR: rprm.ezdrowie.gov.pl; przychodnie: © OpenStreetMap contributors (ODbL)';
const krotko = (n: string) => (n === n.toUpperCase() ? n : n.toLowerCase()); // „AED”, „SOR”, „apteka”

export async function kartaMedyczna(k: KontekstWskazowek): Promise<Wskazowka> {
  const baza = { id: 'medyczna', kolejnosc: 30, tytul: 'Pomoc medyczna' };
  const od = k.miejsce.adres;
  const wyniki = await Promise.all(
    RODZAJE.map(async (r) => ({ ...r, p: ((await najblizsze(od, r.rodzaj, 1).catch(() => [])) as Punkt[])[0] })),
  );
  const z = wyniki.filter((w): w is typeof w & { p: Punkt } => Boolean(w.p));
  if (!z.length) {
    const tekst = k.online ? 'Źródło chwilowo niedostępne: nie udało się wczytać punktów pomocy.' : 'Brak sieci i brak pobranej paczki z punktami pomocy.';
    return { ...baza, poziom: 'brak', tekst, akcje: [], zrodlo: ZRODLO };
  }
  const m = (p: Punkt) => formatujOdleglosc(odlegloscM(od, p));
  // Wiele aptek i przychodni nazywa się po prostu „Apteka”, „Przychodnia”: bez „Apteka: Apteka”.
  const nazwa = (w: (typeof z)[number]) => (w.p.nazwa.toLowerCase() === w.nazwa.toLowerCase() ? w.nazwa : `${w.nazwa}: ${w.p.nazwa}`);
  // Opis położenia AED bywa zdaniem z kropką: bez „…od wejścia., 110 m”.
  const adres = (p: Punkt) => (p.adres ? `, ${p.adres.replace(/[\s.,;:]+$/, '')}` : '');
  // Przychodnie mają godziny z OSM („Mo-Fr 08:00-20:00”); pozostałe źródła piszą dostępność po polsku.
  const dostepnosc = (w: (typeof z)[number]) =>
    !w.p.dostepnosc ? '' : w.rodzaj === 'przychodnia' && w.p.dostepnosc !== 'Całodobowa' ? ` Godziny: ${godzinyPoPolsku(w.p.dostepnosc)}` : ` ${w.p.dostepnosc}`;
  const aed = z.find((w) => w.rodzaj === 'aed');
  const blisko = Boolean(aed && odlegloscM(od, aed.p) <= 1000);
  return {
    ...baza,
    poziom: blisko ? 'ok' : 'uwaga',
    tekst: `${z.map((w) => `${krotko(w.nazwa)} ${m(w.p)}`).join(' · ')}.`,
    szczegoly: [
      'W nagłym wypadku dzwoń 112.',
      ...(blisko ? [] : ['Najbliższy AED jest dalej niż 1 km.']),
      ...z.map((w) => `${nazwa(w)}${adres(w.p)}, ${m(w.p)}.${dostepnosc(w)}`),
    ],
    akcje: z.map((w) => ({ typ: 'trasa' as const, cel: { lat: w.p.lat, lon: w.p.lon }, nazwa: nazwa(w), profil: 'pieszo' as const })),
    zrodlo: ZRODLO,
  };
}
