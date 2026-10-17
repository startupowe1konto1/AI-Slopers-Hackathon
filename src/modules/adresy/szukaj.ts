import type { Adres, Wsp } from '../../contracts';

// Format kolumnowy public/pack/adresy/adresy.json (O2-B1). Wiersz i = adres i.
export type PaczkaAdresow = {
  ulice: string[]; dzielnice: string[]; id: string[]; u: number[]; nr: string[]; dz: number[]; lat: number[]; lon: number[];
};

const PRZEDROSTKI = /^(ul|al|pl|os|rondo|aleja|aleje|ulica|plac|osiedle|skwer)\s+/;
// Cudzysłowy, kropki, nawiasy i łączniki jak spacje: al. „Solidarności”, ul. A. Mickiewicza, Bora-Komorowskiego.
const ZNAKI = /[„”“"'’.,()-]/g;
// Jeden collator zamiast localeCompare z opcjami: ta sama kolejność, a krótkie zapytanie (np. „s”) nie blokuje ekranu.
const porownajNumery = new Intl.Collator('pl', { numeric: true }).compare;
export const normalizuj = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l')
    .replace(ZNAKI, ' ').replace(/\s+/g, ' ').trim().replace(PRZEDROSTKI, '');

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
    // Jednoliterowe słowo w nazwie to inicjał: „A.” pasuje do „Adama”. Sam inicjał nie wystarcza,
    // inaczej „Solidarności” trafiałoby w każdą ulicę z „S.” w nazwie.
    const pelne = w.filter((x) => x.length > 1);
    if (slowa.every((s) => w.some((x) => x.startsWith(s) || (x.length === 1 && s.startsWith(x))))
      && slowa.some((s) => pelne.some((x) => x.startsWith(s)))) ulice.add(i);
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

// Najbliższy punkt adresowy w rzucie równoodległościowym (wystarcza w skali miasta) albo -1, gdy dalej niż maksM.
export function najblizszyIndeks(p: PaczkaAdresow, w: Wsp, maksM = 1000): number {
  const kx = Math.cos((w.lat * Math.PI) / 180);
  let naj = -1;
  let najD = Infinity;
  for (let i = 0; i < p.lat.length; i++) {
    const dx = (p.lon[i] - w.lon) * kx;
    const dy = p.lat[i] - w.lat;
    const d = dx * dx + dy * dy;
    if (d < najD) {
      najD = d;
      naj = i;
    }
  }
  return naj >= 0 && Math.sqrt(najD) * 111_195 <= maksM ? naj : -1;
}
