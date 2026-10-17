import type { Adres } from '../../contracts';
import { adres, szukaj, type PaczkaAdresow } from './szukaj';

const URL_PACZKI = '/pack/adresy/adresy.json';

// Paczka ładowana raz. Po błędzie (np. brak sieci i paczki) następne wywołanie próbuje znowu.
let paczka: Promise<PaczkaAdresow> | null = null;
let indeksy: Map<string, number> | null = null;

function wczytaj(): Promise<PaczkaAdresow> {
  paczka ??= fetch(URL_PACZKI)
    .then((r) => {
      if (!r.ok) throw new Error(`Nie pobrano ${URL_PACZKI}`);
      return r.json() as Promise<PaczkaAdresow>;
    })
    .catch((e: unknown) => {
      paczka = null;
      throw e;
    });
  return paczka;
}

export async function znajdzAdres(q: string, limit = 10): Promise<Adres[]> {
  return szukaj(await wczytaj(), q, limit);
}

export async function adresPoIndeksie(i: number): Promise<Adres> {
  return adres(await wczytaj(), i);
}

// Numer wiersza adresu w paczce (ten sam wiersz w syreny.json) albo -1.
export async function indeksAdresu(id: string): Promise<number> {
  const p = await wczytaj();
  indeksy ??= new Map(p.id.map((x, i) => [x, i]));
  return indeksy.get(id) ?? -1;
}
