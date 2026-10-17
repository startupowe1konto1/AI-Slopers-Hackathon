import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MiejsceUzytkownika } from '../contracts';
import { najblizszyAdres } from '../modules/adresy';
import { BladLokalizacji, lokalizacjaZAdresu, miejsceTutaj, zTutaj } from './lokalizacja';

vi.mock('../modules/adresy', () => ({ najblizszyAdres: vi.fn() }));

it('czyta ?lokalizacja=lat,lon (demo i testy)', () => {
  expect(lokalizacjaZAdresu('?lokalizacja=52.2297,21.0122')).toEqual({ lat: 52.2297, lon: 21.0122 });
  expect(lokalizacjaZAdresu('?lokalizacja=abc')).toBeNull();
  expect(lokalizacjaZAdresu('?offline=1')).toBeNull();
});

const adres = { id: '1', ulica: 'Grochowska', numer: '200', dzielnica: 'Praga-Południe', lat: 52.2457, lon: 21.0874 };

it('„Tutaj” trafia na początek listy i zastępuje poprzednią lokalizację', () => {
  const dom: MiejsceUzytkownika = { rola: 'dom', etykieta: 'Dom', adres };
  const stare: MiejsceUzytkownika = { rola: 'tutaj', etykieta: 'Tutaj', adres };
  const nowe: MiejsceUzytkownika = { ...stare, adres: { ...adres, id: '2' } };
  expect(zTutaj([dom, stare], nowe)).toEqual([nowe, dom]);
});

describe('miejsceTutaj', () => {
  const ustawGps = (g: Partial<Geolocation> | undefined) =>
    Object.defineProperty(navigator, 'geolocation', { value: g, configurable: true });
  const odpowiedzGps = (kod?: number) =>
    ustawGps({
      getCurrentPosition: (ok, blad) =>
        kod
          ? blad?.({ code: kod } as GeolocationPositionError)
          : ok({ coords: { latitude: 52.25, longitude: 21.05 } } as GeolocationPosition),
    });

  afterEach(() => {
    history.replaceState(null, '', '/');
    ustawGps(undefined);
    vi.resetAllMocks();
  });

  it('z ?lokalizacja= szuka najbliższego adresu i daje miejsce „Tutaj” bez pytania GPS', async () => {
    history.replaceState(null, '', '/?lokalizacja=52.2457,21.0874');
    vi.mocked(najblizszyAdres).mockResolvedValue(adres);
    expect(await miejsceTutaj()).toEqual({ rola: 'tutaj', etykieta: 'Lokalizacja', adres });
    expect(najblizszyAdres).toHaveBeenCalledWith({ lat: 52.2457, lon: 21.0874 });
  });

  it('bez parametru bierze pozycję z GPS przeglądarki', async () => {
    odpowiedzGps();
    vi.mocked(najblizszyAdres).mockResolvedValue(adres);
    expect((await miejsceTutaj()).adres).toBe(adres);
    expect(najblizszyAdres).toHaveBeenCalledWith({ lat: 52.25, lon: 21.05 });
  });

  it('brak zgody, brak GPS i inny błąd GPS dają czytelny komunikat po polsku (bez „co dalej”, to dopisuje ekran)', async () => {
    odpowiedzGps(1);
    await expect(miejsceTutaj()).rejects.toThrow(new BladLokalizacji('Brak zgody na lokalizację.'));
    await expect(miejsceTutaj()).rejects.toBeInstanceOf(BladLokalizacji);
    odpowiedzGps(2);
    await expect(miejsceTutaj()).rejects.toThrow(new BladLokalizacji('Nie udało się ustalić lokalizacji.'));
    ustawGps(undefined);
    await expect(miejsceTutaj()).rejects.toThrow(new BladLokalizacji('Ta przeglądarka nie udostępnia lokalizacji.'));
    expect(najblizszyAdres).not.toHaveBeenCalled();
  });

  it('poza Warszawą (brak adresu w promieniu 1 km) kończy się komunikatem, nie pustym wynikiem', async () => {
    history.replaceState(null, '', '/?lokalizacja=52.5,21.0');
    vi.mocked(najblizszyAdres).mockResolvedValue(null);
    await expect(miejsceTutaj()).rejects.toThrow(/poza Warszawą/);
  });

  it('gdy paczka adresów się nie wczytała (np. brak sieci), daje komunikat o paczce', async () => {
    history.replaceState(null, '', '/?lokalizacja=52.2457,21.0874');
    vi.mocked(najblizszyAdres).mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(miejsceTutaj()).rejects.toThrow(/paczk/);
  });
});
