import { afterEach, expect, it, vi } from 'vitest';
import type { KontekstWskazowek, Punkt, RodzajPunktu, Wsp } from '../../contracts';

vi.mock('./najblizsze', async (o) => ({ ...(await o<typeof import('./najblizsze')>()), najblizsze: vi.fn() }));
import { najblizsze } from './najblizsze';
import { kartaMedyczna } from './medyczna';

const adres = { id: '1', ulica: 'Grochowska', numer: '200', dzielnica: 'Praga-Południe', lat: 52.2457, lon: 21.0874 };
const k = (online = true): KontekstWskazowek => ({ miejsce: { rola: 'dom', etykieta: 'Dom', adres }, miejsca: [], online });
const DLAT: Partial<Record<RodzajPunktu, number>> = { aed: 0.001, sor: 0.02, apteka: 0.003, przychodnia: 0.004 };
const punkt = (rodzaj: RodzajPunktu): Punkt => ({ id: rodzaj, rodzaj, nazwa: `Nazwa ${rodzaj}`, adres: 'Grochowska 1', dostepnosc: 'Całodobowa', lat: adres.lat + DLAT[rodzaj]!, lon: adres.lon, zrodlo: 'x' });

afterEach(() => vi.clearAllMocks());

it('najbliższy AED, SOR, apteka i przychodnia z odległością i trasą do każdego', async () => {
  vi.mocked(najblizsze).mockImplementation(async (_w: Wsp, r: RodzajPunktu) => [punkt(r)]);
  const w = await kartaMedyczna(k());
  expect(w).toMatchObject({ id: 'medyczna', kolejnosc: 30, tytul: 'Pomoc medyczna', poziom: 'ok' });
  expect(w.tekst).toBe('AED 110 m · SOR 2,2 km · apteka 330 m · przychodnia 440 m.');
  expect(w.szczegoly?.[0]).toBe('W nagłym wypadku dzwoń 112.');
  expect(w.szczegoly).toContain('AED: Nazwa aed, Grochowska 1, 110 m. Całodobowa');
  expect(w.akcje.map((a) => a.typ === 'trasa' && a.nazwa)).toEqual(['AED: Nazwa aed', 'SOR: Nazwa sor', 'Apteka: Nazwa apteka', 'Przychodnia: Nazwa przychodnia']);
});

it('godziny przychodni z OSM po polsku; adres z kropką na końcu bez „., 110 m”', async () => {
  vi.mocked(najblizsze).mockImplementation(async (_w: Wsp, r: RodzajPunktu) => [
    r === 'aed'
      ? { ...punkt(r), adres: 'Hol główny, po lewej stronie od wejścia.' }
      : r === 'przychodnia'
        ? { ...punkt(r), dostepnosc: 'Mo-Fr 08:00-20:00; Sa-Su off' }
        : punkt(r),
  ]);
  const w = await kartaMedyczna(k());
  expect(w.szczegoly).toContain('AED: Nazwa aed, Hol główny, po lewej stronie od wejścia, 110 m. Całodobowa');
  expect(w.szczegoly).toContain('Przychodnia: Nazwa przychodnia, Grochowska 1, 440 m. Godziny: pn–pt 08:00–20:00; sob–nd nieczynne');
});

it('AED dalej niż 1 km albo brak AED: „uwaga”; brak wszystkiego bez sieci: „brak”', async () => {
  vi.mocked(najblizsze).mockImplementation(async (_w: Wsp, r: RodzajPunktu) => (r === 'aed' ? [] : [punkt(r)]));
  expect((await kartaMedyczna(k())).poziom).toBe('uwaga');
  vi.mocked(najblizsze).mockRejectedValue(new Error('brak paczki'));
  const w = await kartaMedyczna(k(false));
  expect(w).toMatchObject({ poziom: 'brak', akcje: [] });
  expect(w.tekst).toMatch(/^Brak sieci/);
});

it('„uwaga” mówi dlaczego; nazwa równa rodzajowi („Apteka”) nie powtarza się', async () => {
  vi.mocked(najblizsze).mockImplementation(async (_w: Wsp, r: RodzajPunktu) =>
    r === 'aed' ? [] : [{ ...punkt(r), nazwa: r === 'apteka' ? 'Apteka' : `Nazwa ${r}` }],
  );
  const w = await kartaMedyczna(k());
  expect(w.szczegoly?.slice(0, 2)).toEqual(['W nagłym wypadku dzwoń 112.', 'Najbliższy AED jest dalej niż 1 km.']);
  expect(w.szczegoly).toContain('Apteka, Grochowska 1, 330 m. Całodobowa');
  expect(w.akcje.map((a) => a.typ === 'trasa' && a.nazwa)).toContain('Apteka');
});
