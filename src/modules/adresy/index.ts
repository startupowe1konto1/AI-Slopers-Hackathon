import type { Adres } from '../../contracts';

// Atrapa ze szkieletu (3 adresy z persony Kasi). O2 podmienia ją wyszukiwaniem w paczce (O2-A1).
const TEST: Adres[] = [
  { id: 't1', ulica: 'ul. Powstańców Śląskich', numer: '10', dzielnica: 'Bemowo', lat: 52.2385, lon: 20.9131 },
  { id: 't2', ulica: 'rondo Ignacego Daszyńskiego', numer: '1', dzielnica: 'Wola', lat: 52.2302, lon: 20.984 },
  { id: 't3', ulica: 'ul. Grochowska', numer: '200', dzielnica: 'Praga-Południe', lat: 52.2457, lon: 21.0911 },
];

export async function znajdzAdres(q: string, limit = 10): Promise<Adres[]> {
  const s = q.toLowerCase().trim();
  if (!s) return [];
  return TEST.filter((a) => `${a.ulica} ${a.numer}`.toLowerCase().includes(s)).slice(0, limit);
}
