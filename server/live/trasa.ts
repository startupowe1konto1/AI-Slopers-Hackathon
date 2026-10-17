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

// TODO po scaleniu V1 (typ `Trasa` w src/contracts.ts): zamienić na
// `export type OdpowiedzTrasy = Pick<Trasa, 'dystansM' | 'czasMin' | 'linia'>;`
export type OdpowiedzTrasy = { dystansM: number; czasMin: number; linia: [number, number][] };
type Osrm = { code: string; routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[] };

// „lon,lat” w bbox Warszawy → „lon,lat” z 5 miejscami (ok. 1 m; te same trasy trafiają w cache) albo null.
export function punkt(v: string | null): string | null {
  const [lon, lat] = (v ?? '').split(',').map(Number);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  if (lon < LON[0] || lon > LON[1] || lat < LAT[0] || lat > LAT[1]) return null;
  return `${lon.toFixed(5)},${lat.toFixed(5)}`;
}

export function mapujTrase(d: Osrm): OdpowiedzTrasy {
  const r = d.routes?.[0];
  if (d.code !== 'Ok' || !r) throw new BladPortalu('schemat', `osrm: ${d.code}`);
  return { dystansM: Math.round(r.distance), czasMin: Math.max(1, Math.round(r.duration / 60)), linia: r.geometry.coordinates };
}

// Cache Workera (Cloudflare). W `npm run dev` i w testach go nie ma.
const cacheWorkera = (): Cache | undefined => (globalThis as { caches?: { default?: Cache } }).caches?.default;

export async function handler(req: Request, _env: { WARSAW_API_TOKEN?: string }): Promise<Response> {
  const q = new URL(req.url).searchParams;
  const od = punkt(q.get('od'));
  const do_ = punkt(q.get('do'));
  const profil = q.get('profil');
  if (!od || !do_ || (profil !== 'pieszo' && profil !== 'rower')) return Response.json({ blad: 'parametry' }, { status: 400 });

  const klucz = new Request(`https://trasa.cache/${profil}/${od};${do_}`);
  const cache = cacheWorkera();
  const zapisana = await cache?.match(klucz);
  if (zapisana) return zapisana;

  try {
    let r: Response;
    try {
      r = await fetch(`${OSRM[profil]}/${od};${do_}?overview=full&geometries=geojson`, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      throw new BladPortalu('timeout', 'osrm');
    }
    if (!r.ok) throw new BladPortalu('klucz_lub_usluga', `osrm: HTTP ${r.status}`);
    let dane: Osrm;
    try {
      dane = (await r.json()) as Osrm;
    } catch {
      throw new BladPortalu('schemat', 'osrm: nie JSON');
    }
    const odp = Response.json(mapujTrase(dane), { headers: { 'Cache-Control': `public, s-maxage=${DOBA_S}` } });
    await cache?.put(klucz, odp.clone());
    return odp;
  } catch (e) {
    return blad(e);
  }
}
