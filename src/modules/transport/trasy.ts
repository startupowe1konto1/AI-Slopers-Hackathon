import KDBush from 'kdbush';
import { around, distance } from 'geokdbush';
import type { MiejsceUzytkownika, RolaMiejsca, TrasaMin, Wsp } from '../../contracts';

// Przystanek z public/pack/transport/przystanki.json (tylko linie autobusowe).
export type Przystanek = Wsp & { id: string; nazwa: string; linie: string[] };
export type IndeksPrzystankow = { idx: KDBush; przystanki: Przystanek[] };

const PARY: [RolaMiejsca, RolaMiejsca][] = [
  ['dom', 'praca'],
  ['dom', 'przedszkole'],
  ['praca', 'przedszkole'],
  ['dom', 'bliska_osoba'],
];
const START_KM = 0.6;
const CEL_KM = 0.5;
const KRETOSC = 1.3; // droga jest dłuższa niż linia prosta
const PIESZO_M_MIN = 83; // 5 km/h
const ROWER_M_MIN = 250; // 15 km/h

export function zbuduj(przystanki: Przystanek[]): IndeksPrzystankow {
  const idx = new KDBush(przystanki.length);
  przystanki.forEach((p) => idx.add(p.lon, p.lat));
  idx.finish();
  return { idx, przystanki };
}

const metry = (a: Wsp, b: Wsp) => Math.round(distance(a.lon, a.lat, b.lon, b.lat) * 1000);

function trasa(i: IndeksPrzystankow, z: MiejsceUzytkownika, cel: MiejsceUzytkownika): TrasaMin {
  const a = z.adres;
  const b = cel.adres;
  const dystansM = metry(a, b);
  const linieCelu = new Set(around(i.idx, b.lon, b.lat, Infinity, CEL_KM).flatMap((id) => i.przystanki[id].linie));
  const autobusy = around(i.idx, a.lon, a.lat, 3, START_KM)
    .map((id) => i.przystanki[id])
    .map((p) => ({ przystanek: p.nazwa, odlegloscM: metry(a, p), linie: p.linie.filter((l) => linieCelu.has(l)) }))
    .filter((x) => x.linie.length > 0);
  return {
    z: z.rola,
    do: cel.rola,
    dystansM,
    pieszoMin: Math.round((dystansM * KRETOSC) / PIESZO_M_MIN),
    rowerMin: Math.round((dystansM * KRETOSC) / ROWER_M_MIN),
    autobusy,
  };
}

export function trasyZ(i: IndeksPrzystankow, miejsca: MiejsceUzytkownika[]): TrasaMin[] {
  const wg = new Map(miejsca.map((m) => [m.rola, m]));
  return PARY.flatMap(([z, cel]) => {
    const mz = wg.get(z);
    const mc = wg.get(cel);
    return mz && mc ? [trasa(i, mz, mc)] : [];
  });
}

export function opisTrasy(t: TrasaMin): string[] {
  const pieszo = `Pieszo ~${t.pieszoMin} min, rowerem ~${t.rowerMin} min`;
  if (!t.autobusy.length) return [pieszo, `Brak bezpośredniego autobusu. Pieszo ~${t.pieszoMin} min.`];
  const autobusy = t.autobusy.map((a) => `Autobusy z przystanku ${a.przystanek} (${a.odlegloscM} m): linie ${a.linie.join(', ')}`);
  return [pieszo, `Przy blackoucie: tramwaje, metro i SKM stoją. ${autobusy[0]}`, ...autobusy.slice(1)];
}

let indeks: Promise<IndeksPrzystankow> | null = null;
export async function trasyMin(miejsca: MiejsceUzytkownika[]): Promise<TrasaMin[]> {
  indeks ??= fetch('/pack/transport/przystanki.json')
    .then((r) => {
      if (!r.ok) throw new Error(`przystanki.json: HTTP ${r.status}`);
      return r.json() as Promise<Przystanek[]>;
    })
    .then(zbuduj)
    .catch((e: unknown) => {
      indeks = null; // następna próba pobierze plik ponownie
      throw e;
    });
  return trasyZ(await indeks, miejsca);
}
