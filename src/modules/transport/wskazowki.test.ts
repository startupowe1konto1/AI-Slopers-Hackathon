import { afterEach, expect, it, vi } from 'vitest';
import type { KontekstWskazowek, MiejsceUzytkownika, Profil, Wsp } from '../../contracts';

vi.mock('../../offline/trasy', () => ({
  trasa: vi.fn(async (od: Wsp, d: Wsp, profil: Profil) => ({ od, do: d, profil, dystansM: 7240, czasMin: profil === 'pieszo' ? 95 : 30, linia: [], zrodlo: 'osrm' })),
}));
vi.mock('../live', () => ({
  najblizszaStacjaZRowerami: vi.fn(async () => ({ nazwa: 'Koneser', wsp: { lat: 52.256, lon: 21.046 }, rowery: 20, odlegloscM: 450 })),
}));
import { trasa } from '../../offline/trasy';
import { najblizszaStacjaZRowerami } from '../live';
import { wskazowkiBliskich } from './wskazowki';

const adres = (id: string, ulica: string, numer: string, lat: number) => ({ id, ulica, numer, dzielnica: 'Praga-Południe', lat, lon: 21.08 });
const dom: MiejsceUzytkownika = { rola: 'dom', etykieta: 'Dom', adres: adres('1', 'Grochowska', '200', 52.245) };
const bliska: MiejsceUzytkownika = { rola: 'bliska_osoba', etykieta: 'Bliska osoba', adres: adres('2', 'Kondratowicza', '8', 52.29) };
const tutaj: MiejsceUzytkownika = { rola: 'tutaj', etykieta: 'Tutaj', adres: adres('3', 'Wiatraczna', '1', 52.24) };
const k = (miejsca: MiejsceUzytkownika[], online = true): KontekstWskazowek => ({ miejsce: dom, miejsca, online });

afterEach(() => vi.clearAllMocks());

it('czas pieszo i rowerem do innych miejsc, stacja Veturilo, dopisek o blackoucie', async () => {
  const [w] = await wskazowkiBliskich(k([dom, bliska]));
  expect(w).toMatchObject({ id: 'bliscy', kolejnosc: 50, tytul: 'Dotarcie do bliskich', poziom: 'ok' });
  expect(w.tekst).toBe('Bliska osoba (Kondratowicza 8): pieszo ok. 95 min, rowerem ok. 30 min. Jeśli zabraknie prądu, tramwaje i metro stoją.');
  expect(w.szczegoly).toContain('Najbliższa stacja Veturilo z rowerami: Koneser, 450 m (wolne rowery: 20).');
  expect(w.akcje.map((a) => a.typ === 'trasa' && `${a.nazwa}/${a.profil}`)).toEqual([
    'Bliska osoba/pieszo',
    'Bliska osoba/rower',
    'Stacja Veturilo Koneser/pieszo',
  ]);
});

it('„Tutaj” nie jest celem; bez innych miejsc karta prosi o dodanie adresu', async () => {
  const [w] = await wskazowkiBliskich(k([tutaj, dom]));
  expect(w.poziom).toBe('brak');
  expect(w.tekst).toMatch(/^Dodaj adres/);
});

it('bez sieci nie pyta o rowery (zapisany stan rowerów jest nieaktualny)', async () => {
  const [w] = await wskazowkiBliskich(k([dom, bliska], false));
  expect(najblizszaStacjaZRowerami).not.toHaveBeenCalled();
  expect(w.szczegoly?.some((s) => s.includes('Veturilo'))).toBe(false);
});

it('stacja Veturilo jest pobierana równolegle z trasami, nie po nich', async () => {
  const domyslna = vi.mocked(trasa).getMockImplementation()!;
  let zwolnij!: () => void;
  const brama = new Promise<void>((r) => (zwolnij = r));
  vi.mocked(trasa).mockImplementation(async (od, d, profil) => {
    await brama;
    return domyslna(od, d, profil);
  });
  const karta = wskazowkiBliskich(k([dom, bliska]));
  try {
    await vi.waitFor(() => expect(najblizszaStacjaZRowerami).toHaveBeenCalledTimes(1));
    expect(trasa).toHaveBeenCalled();
    zwolnij();
    const [w] = await karta;
    expect(w.szczegoly).toContain('Najbliższa stacja Veturilo z rowerami: Koneser, 450 m (wolne rowery: 20).');
  } finally {
    zwolnij();
    await karta.catch(() => undefined);
    vi.mocked(trasa).mockImplementation(domyslna);
  }
});

it('trasa w linii prostej jest tak opisana, a źródłem jest szacunek z odległości', async () => {
  const prosta = async (od: Wsp, d: Wsp, profil: Profil) => ({ od, do: d, profil, dystansM: 7240, czasMin: 40, linia: [], zrodlo: 'prosta' as const });
  vi.mocked(trasa).mockImplementationOnce(prosta).mockImplementationOnce(prosta);
  const [w] = await wskazowkiBliskich(k([dom, bliska], false));
  expect(w.tekst).toContain('pieszo ok. 40 min (w linii prostej), rowerem ok. 40 min (w linii prostej).');
  expect(w.zrodlo).toBe('Szacunek z odległości w linii prostej');
});

it('przy błędzie zwraca szarą kartę z nazwą źródła, nie pustą listę', async () => {
  vi.mocked(trasa).mockRejectedValueOnce(new Error('boom'));
  const [w] = await wskazowkiBliskich(k([dom, bliska]));
  expect(w).toMatchObject({ id: 'bliscy', poziom: 'brak' });
  expect(w.tekst).toMatch(/^Źródło chwilowo niedostępne/);
  expect(w.zrodlo).toMatch(/OSRM/);
});
