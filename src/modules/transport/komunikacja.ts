import KDBush from 'kdbush';
import { around, distance } from 'geokdbush';
import type { Wsp } from '../../contracts';
import { fetchLive } from '../../offline/live-cache';

// Planer komunikacji miejskiej bez przesiadek: jedna linia od przystanku przy starcie do przystanku przy celu.
export type TypLinii = 'autobus' | 'tramwaj' | 'metro';
// Wpis z public/pack/transport/linie.json: jedna linia w jednym kierunku, `czasy` w minutach od pierwszego przystanku.
export type LiniaKierunek = { linia: string; typ: TypLinii; kierunek: string; przystanki: string[]; czasy: number[] };
export type PrzystanekK = Wsp & { id: string; nazwa: string };
export type Przejazd = {
  linia: string;
  typ: TypLinii;
  kierunek: string;
  z: PrzystanekK;
  do: PrzystanekK;
  przystanki: PrzystanekK[]; // od `z` do `do` włącznie, do narysowania odcinka przejazdu
  liczbaPrzystankow: number;
  dojscieM: number;
  dojscieMin: number;
  czekanieMin: number; // szacunek, bez rozkładu
  przejazdMin: number;
  zejscieM: number;
  zejscieMin: number;
  razemMin: number;
};
export type PlanKomunikacji = { warianty: Przejazd[]; pieszoM: number; pieszoMin: number; pieszoSzybciej: boolean; blackout: boolean };
export type DaneKomunikacji = { przystanki: PrzystanekK[]; linie: LiniaKierunek[] };
// Odpowiedź /api/live/odjazdy (rozkład na cały dzień, godziny mogą przekraczać 24:00).
type Odjazdy = { przystanek: string; linia: string; odjazdy: string[] };

const PROMIEN_KM = 0.8;
const KRETOSC = 1.3; // droga jest dłuższa niż linia prosta
const PIESZO_M_MIN = 83; // 5 km/h
const MAKS_WARIANTOW = 3;
const CZEKANIE: Record<TypLinii, number> = { autobus: 5, tramwaj: 5, metro: 3 };

type Indeks = { idx: KDBush; poId: Map<string, PrzystanekK> };
const indeksy = new WeakMap<DaneKomunikacji, Indeks>();

function indeks(dane: DaneKomunikacji): Indeks {
  let i = indeksy.get(dane);
  if (!i) {
    const idx = new KDBush(dane.przystanki.length);
    dane.przystanki.forEach((p) => idx.add(p.lon, p.lat));
    idx.finish();
    i = { idx, poId: new Map(dane.przystanki.map((p) => [p.id, p])) };
    indeksy.set(dane, i);
  }
  return i;
}

type Dojscie = { m: number; min: number };
// Droga piesza w metrach (przed zaokrągleniem) i minutach.
function pieszo(a: Wsp, b: Wsp): Dojscie {
  const m = distance(a.lon, a.lat, b.lon, b.lat) * 1000 * KRETOSC;
  return { m, min: Math.ceil(m / PIESZO_M_MIN) };
}
const do10 = (m: number) => Math.round(m / 10) * 10;

// Przystanki w promieniu 800 m z drogą pieszą do każdego.
function wPoblizu(i: Indeks, dane: DaneKomunikacji, w: Wsp): Map<string, Dojscie> {
  return new Map(
    around(i.idx, w.lon, w.lat, Infinity, PROMIEN_KM).map((k) => {
      const p = dane.przystanki[k];
      return [p.id, pieszo(w, p)];
    }),
  );
}

export function planuj(dane: DaneKomunikacji, od: Wsp, cel: Wsp, opcje: { blackout: boolean }): PlanKomunikacji {
  const i = indeks(dane);
  const A = wPoblizu(i, dane, od);
  const B = wPoblizu(i, dane, cel);
  const najlepsze = new Map<string, Przejazd>(); // jedna linia = jeden wariant
  for (const l of dane.linie) {
    if (opcje.blackout && l.typ !== 'autobus') continue;
    const wA = l.przystanki.flatMap((id, k) => (A.has(id) ? [k] : []));
    const wB = l.przystanki.flatMap((id, k) => (B.has(id) ? [k] : []));
    const klucz = `${l.typ} ${l.linia}`;
    for (const a of wA) {
      for (const b of wB) {
        if (b <= a) continue; // wsiadamy przed wysiadką, więc kierunek zawsze właściwy
        const dojscie = A.get(l.przystanki[a])!;
        const zejscie = B.get(l.przystanki[b])!;
        const przejazdMin = Math.ceil(l.czasy[b] - l.czasy[a]);
        const razemMin = dojscie.min + CZEKANIE[l.typ] + przejazdMin + zejscie.min;
        const dotad = najlepsze.get(klucz);
        if (dotad && dotad.razemMin <= razemMin) continue;
        najlepsze.set(klucz, {
          linia: l.linia,
          typ: l.typ,
          kierunek: l.kierunek,
          z: i.poId.get(l.przystanki[a])!,
          do: i.poId.get(l.przystanki[b])!,
          przystanki: l.przystanki.slice(a, b + 1).flatMap((id) => i.poId.get(id) ?? []),
          liczbaPrzystankow: b - a,
          dojscieM: do10(dojscie.m),
          dojscieMin: dojscie.min,
          czekanieMin: CZEKANIE[l.typ],
          przejazdMin,
          zejscieM: do10(zejscie.m),
          zejscieMin: zejscie.min,
          razemMin,
        });
      }
    }
  }
  const warianty = [...najlepsze.values()].sort((x, y) => x.razemMin - y.razemMin).slice(0, MAKS_WARIANTOW);
  const calosc = pieszo(od, cel);
  return {
    warianty,
    pieszoM: do10(calosc.m),
    pieszoMin: calosc.min,
    pieszoSzybciej: !warianty.length || calosc.min <= warianty[0].razemMin,
    blackout: opcje.blackout,
  };
}

async function pobierz<T>(plik: string): Promise<T> {
  const r = await fetch(`/pack/transport/${plik}`);
  if (!r.ok) throw new Error(`${plik}: HTTP ${r.status}`);
  return r.json() as Promise<T>;
}

let dane: Promise<DaneKomunikacji> | null = null;
export async function planKomunikacji(od: Wsp, cel: Wsp, opcje: { blackout: boolean }): Promise<PlanKomunikacji> {
  dane ??= Promise.all([pobierz<PrzystanekK[]>('przystanki.json'), pobierz<LiniaKierunek[]>('linie.json')])
    // Z przystanki.json bierzemy tylko to, czego potrzebuje planer (bez pola `linie`).
    .then(([p, linie]) => ({ przystanki: p.map(({ id, nazwa, lat, lon }) => ({ id, nazwa, lat, lon })), linie }))
    .catch((e: unknown) => {
      dane = null; // następna próba pobierze pliki ponownie
      throw e;
    });
  return planuj(await dane, od, cel, opcje);
}

// 'HH:MM' na minuty od północy; '24:15' to 1455, czyli 00:15 następnego dnia.
function minuty(g: string): number {
  const [h, m] = g.split(':').map(Number);
  return h * 60 + m;
}
const godzina = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

// Najbliższy odjazd z rozkładu. Metro nie jest w API rozkładów (linie M1, M2), więc dla niego null.
export async function najblizszyOdjazd(
  przystanekId: string,
  linia: string,
  teraz = new Date(),
): Promise<{ godzina: string; zaMin: number; zCache: boolean } | null> {
  if (/^M\d/.test(linia)) return null;
  const s = await fetchLive<Odjazdy>(`odjazdy?przystanek=${encodeURIComponent(przystanekId)}&linia=${encodeURIComponent(linia)}`).catch(() => null);
  if (!s?.dane?.odjazdy) return null;
  const terazMin = teraz.getHours() * 60 + teraz.getMinutes();
  const nast = s.dane.odjazdy.map(minuty).filter((m) => m >= terazMin);
  if (!nast.length) return null;
  const m = Math.min(...nast);
  return { godzina: godzina(m), zaMin: m - terazMin, zCache: s.zCache };
}

const NAZWA: Record<TypLinii, string> = { autobus: 'Autobus', tramwaj: 'Tramwaj', metro: 'Metro' };
const NARZEDNIK: Record<TypLinii, string> = { autobus: 'autobusem', tramwaj: 'tramwajem', metro: 'metrem' };

function przystankow(n: number): string {
  if (n === 1) return 'przystanek';
  const d = n % 10;
  const s = n % 100;
  return d >= 2 && d <= 4 && (s < 12 || s > 14) ? 'przystanki' : 'przystanków';
}

export function opisPrzejazdu(p: Przejazd): string {
  return (
    `${NAZWA[p.typ]} ${p.linia}, kierunek ${p.kierunek}: ${p.dojscieM} m pieszo do przystanku ${p.z.nazwa}, ` +
    `${p.liczbaPrzystankow} ${przystankow(p.liczbaPrzystankow)} (ok. ${p.przejazdMin} min), wysiadka ${p.do.nazwa}, ` +
    `potem ${p.zejscieM} m pieszo. Razem ok. ${p.razemMin} min.`
  );
}

export function opisPlanu(plan: PlanKomunikacji): string {
  const [w] = plan.warianty;
  const opis = !w
    ? `W pobliżu nie ma bezpośredniego połączenia. Pieszo ok. ${plan.pieszoMin} min.`
    : plan.pieszoSzybciej
      ? `Pieszo będzie szybciej: ok. ${plan.pieszoMin} min.`
      : `Najszybciej ${NARZEDNIK[w.typ]} ${w.linia}: ok. ${w.razemMin} min. Pieszo ok. ${plan.pieszoMin} min.`;
  return plan.blackout ? `${opis} Jeśli zabraknie prądu, tramwaje i metro staną. Pokazuję tylko autobusy.` : opis;
}
