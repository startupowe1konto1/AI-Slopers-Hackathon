import type { Adres } from '../../contracts';

// Format kolumnowy public/pack/adresy/adresy.json (O2-B1). Wiersz i = adres i.
export type PaczkaAdresow = {
  ulice: string[]; dzielnice: string[]; id: string[]; u: number[]; nr: string[]; dz: number[]; lat: number[]; lon: number[];
};

const PRZEDROSTKI = /^(ul|al|pl|os|rondo|aleja|plac|osiedle|skwer)\.?\s+/;
// Jeden collator zamiast localeCompare z opcjami: ta sama kolejność, a krótkie zapytanie (np. „s”) nie blokuje ekranu.
const porownajNumery = new Intl.Collator('pl', { numeric: true }).compare;
export const normalizuj = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l')
    .replace(PRZEDROSTKI, '').replace(/\s+/g, ' ').trim();

export const adres = (p: PaczkaAdresow, i: number): Adres => ({
  id: p.id[i], ulica: p.ulice[p.u[i]], numer: p.nr[i], dzielnica: p.dzielnice[p.dz[i]], lat: p.lat[i], lon: p.lon[i],
});

export function szukaj(p: PaczkaAdresow, q: string, limit: number): Adres[] {
  const m = normalizuj(q).match(/^(.*?)(?:\s+(\d+[a-z]?(?:\/\d+)?))?$/);
  if (!m || !m[1]) return [];
  const slowa = m[1].split(' ');
  const numer = m[2]?.toLowerCase();
  const ulice = new Set<number>();
  p.ulice.forEach((u, i) => {
    const w = normalizuj(u).split(' ');
    if (slowa.every((s) => w.some((x) => x.startsWith(s)))) ulice.add(i);
  });
  const wynik: number[] = [];
  for (let i = 0; i < p.id.length; i++) {
    if (!ulice.has(p.u[i])) continue;
    if (numer && !p.nr[i].toLowerCase().startsWith(numer)) continue;
    wynik.push(i);
  }
  wynik.sort((a, b) => Number(p.nr[b].toLowerCase() === numer) - Number(p.nr[a].toLowerCase() === numer)
    || porownajNumery(p.nr[a], p.nr[b]));
  return wynik.slice(0, limit).map((i) => adres(p, i));
}
