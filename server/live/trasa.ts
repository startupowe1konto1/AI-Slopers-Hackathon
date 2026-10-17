import type { Trasa } from '../../src/contracts';
import { BladPortalu, blad } from '../portal';

// Publiczne serwery OSRM FOSSGIS (routing.openstreetmap.de); jeden profil na serwer, „driving” w ścieżce to stała nazwa.
const OSRM = {
  pieszo: 'https://routing.openstreetmap.de/routed-foot/route/v1/driving',
  rower: 'https://routing.openstreetmap.de/routed-bike/route/v1/driving',
} as const;
// Zasady serwera wymagają identyfikacji aplikacji.
const UA = 'warszawa-kryzys (hackathon; https://github.com/startupowe1konto1/AI-Slopers-Hackathon)';
const LON = [20.85, 21.28];
const LAT = [52.09, 52.37];
const DOBA_S = 86_400;
const TIMEOUT_MS = 8000;
const LICZBA = /^-?\d+(\.\d+)?$/;

export type OdpowiedzTrasy = Pick<Trasa, 'dystansM' | 'czasMin' | 'linia'>;
type Osrm = { code: string; routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[] };

// „lon,lat” (dokładnie dwie liczby) w bbox Warszawy → „lon,lat” z 5 miejscami (ok. 1 m; te same trasy trafiają w cache) albo null.
export function punkt(v: string | null): string | null {
  const czesci = (v ?? '').split(',');
  if (czesci.length !== 2 || !czesci.every((c) => LICZBA.test(c))) return null;
  const [lon, lat] = czesci.map(Number);
  if (lon < LON[0] || lon > LON[1] || lat < LAT[0] || lat > LAT[1]) return null;
  return `${lon.toFixed(5)},${lat.toFixed(5)}`;
}

export function mapujTrase(d: Osrm): OdpowiedzTrasy {
  const r = d.routes?.[0];
  if (d.code !== 'Ok' || !r) throw new BladPortalu('schemat', `osrm: ${d.code}`);
  const linia = r.geometry?.coordinates;
  const punktOk = (p: unknown) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]);
  if (!Number.isFinite(r.distance) || !Number.isFinite(r.duration) || !Array.isArray(linia) || linia.length === 0 || !linia.every(punktOk)) {
    throw new BladPortalu('schemat', 'osrm: niepełna trasa');
  }
  return { dystansM: Math.round(r.distance), czasMin: Math.max(1, Math.round(r.duration / 60)), linia };
}

// Cache Workera (Cloudflare). W `npm run dev` i w testach go nie ma.
const cacheWorkera = (): Cache | undefined => (globalThis as { caches?: { default?: Cache } }).caches?.default;

// Cache jest tylko przyspieszeniem: jego błąd nigdy nie zmienia odpowiedzi.
async function zCache(cache: Cache | undefined, klucz: Request): Promise<Response | undefined> {
  try {
    return await cache?.match(klucz);
  } catch {
    return undefined;
  }
}
async function doCache(cache: Cache | undefined, klucz: Request, odp: Response): Promise<void> {
  try {
    await cache?.put(klucz, odp);
  } catch {
    // ignorujemy: brak zapisu to tylko brak przyspieszenia
  }
}

export async function handler(req: Request, _env: { WARSAW_API_TOKEN?: string }): Promise<Response> {
  const q = new URL(req.url).searchParams;
  const od = punkt(q.get('od'));
  const do_ = punkt(q.get('do'));
  const profil = q.get('profil');
  if (!od || !do_ || (profil !== 'pieszo' && profil !== 'rower')) return Response.json({ blad: 'parametry' }, { status: 400 });

  const klucz = new Request(`https://trasa.cache/${profil}/${od};${do_}`);
  const cache = cacheWorkera();
  const zapisana = await zCache(cache, klucz);
  if (zapisana) return zapisana;

  try {
    let r: Response;
    try {
      r = await fetch(`${OSRM[profil]}/${od};${do_}?overview=full&geometries=geojson`, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      throw new BladPortalu('timeout', 'osrm');
    }
    let dane: Osrm | undefined;
    try {
      dane = (await r.json()) as Osrm;
    } catch {
      dane = undefined;
    }
    if (!r.ok) {
      // OSRM odpowiada NoRoute itp. kodem 4xx z JSON-em: to „brak trasy” (schemat), nie awaria usługi.
      if (r.status >= 400 && r.status < 500 && typeof dane?.code === 'string' && dane.code !== 'Ok') {
        throw new BladPortalu('schemat', `osrm: ${dane.code}`);
      }
      throw new BladPortalu('klucz_lub_usluga', `osrm: HTTP ${r.status}`);
    }
    if (!dane || typeof dane !== 'object') throw new BladPortalu('schemat', 'osrm: nie JSON');
    const odp = Response.json(mapujTrase(dane), { headers: { 'Cache-Control': `public, s-maxage=${DOBA_S}` } });
    await doCache(cache, klucz, odp.clone());
    return odp;
  } catch (e) {
    return blad(e);
  }
}
