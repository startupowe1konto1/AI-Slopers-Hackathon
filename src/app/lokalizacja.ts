import type { MiejsceUzytkownika, Wsp } from '../contracts';
import { najblizszyAdres } from '../modules/adresy';

// ?lokalizacja=52.2297,21.0122 (lat,lon) zastępuje GPS na demo i w testach e2e.
export function lokalizacjaZAdresu(search: string): Wsp | null {
  const v = new URLSearchParams(search).get('lokalizacja')?.split(',').map(Number);
  return v && v.length === 2 && v.every(Number.isFinite) ? { lat: v[0], lon: v[1] } : null;
}

function gps(): Promise<Wsp> {
  return new Promise((ok, blad) => {
    if (!navigator.geolocation) return blad(new Error('Ta przeglądarka nie udostępnia lokalizacji. Wpisz adres.'));
    navigator.geolocation.getCurrentPosition(
      (p) => ok({ lat: p.coords.latitude, lon: p.coords.longitude }),
      (e) => blad(new Error(e.code === 1 ? 'Brak zgody na lokalizację. Wpisz adres.' : 'Nie udało się ustalić lokalizacji. Wpisz adres.')),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  });
}

// „Tutaj” = najbliższy punkt adresowy z paczki, więc syreny i punkty liczą się jak dla wpisanego adresu.
export async function miejsceTutaj(): Promise<MiejsceUzytkownika> {
  const wsp = lokalizacjaZAdresu(location.search) ?? (await gps());
  const adres = await najblizszyAdres(wsp).catch(() => {
    throw new Error('Nie udało się wczytać adresów z paczki (brak sieci?). Pobierz paczkę offline i spróbuj ponownie.');
  });
  if (!adres) throw new Error('Jesteś poza Warszawą albo daleko od adresu z naszej paczki. Wpisz adres.');
  return { rola: 'tutaj', etykieta: 'Tutaj', adres };
}

export function zTutaj(miejsca: MiejsceUzytkownika[], tutaj: MiejsceUzytkownika): MiejsceUzytkownika[] {
  return [tutaj, ...miejsca.filter((m) => m.rola !== 'tutaj')];
}
