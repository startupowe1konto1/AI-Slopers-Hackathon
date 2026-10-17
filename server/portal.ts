export type RodzajBledu = 'brak_klucza' | 'klucz_lub_usluga' | 'timeout' | 'schemat';

export class BladPortalu extends Error {
  rodzaj: RodzajBledu;
  constructor(rodzaj: RodzajBledu, msg: string) {
    super(msg);
    this.rodzaj = rodzaj;
  }
}

export async function portal(zbior: string, body: object, token: string | undefined): Promise<unknown> {
  if (!token) throw new BladPortalu('brak_klucza', 'brak WARSAW_API_TOKEN w env');
  let r: Response;
  try {
    r = await fetch(`https://dane.um.warszawa.pl/api/action/${zbior}`, {
      method: 'POST',
      headers: { Authorization: token, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new BladPortalu('timeout', zbior);
  }
  // portal zwraca 500 "Service unavailable" także przy złym kluczu
  if (!r.ok) throw new BladPortalu('klucz_lub_usluga', `${zbior}: HTTP ${r.status}`);
  const d = await r.json();
  if (!Array.isArray(d)) throw new BladPortalu('schemat', zbior);
  return d;
}

export function odpowiedz<T>(dane: T, zrodlo: string, maxAge = 20): Response {
  return Response.json(
    { dane, stanNa: new Date().toISOString(), zrodlo, zCache: false },
    { headers: { 'Cache-Control': `public, s-maxage=${maxAge}` } },
  );
}

export function blad(e: unknown): Response {
  const rodzaj = e instanceof BladPortalu ? e.rodzaj : 'nieznany';
  console.error('portal', rodzaj); // bez klucza i bez treści zapytania
  return Response.json({ blad: rodzaj }, { status: 502 });
}
