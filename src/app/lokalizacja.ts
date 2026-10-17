import type { MiejsceUzytkownika, Wsp } from '../contracts';
import { najblizszyAdres } from '../modules/adresy';

// ?lokalizacja=52.2297,21.0122 (lat,lon) zastępuje GPS na demo i w testach e2e.
export function lokalizacjaZAdresu(search: string): Wsp | null {
  const v = new URLSearchParams(search).get('lokalizacja')?.split(',').map(Number);
  return v && v.length === 2 && v.every(Number.isFinite) ? { lat: v[0], lon: v[1] } : null;
}

// Lokalizacji nie ma, ale adres można wpisać ręcznie. Komunikat bez „co dalej”: dopisuje to ekran (w pasku nie ma pola adresu).
export class BladLokalizacji extends Error {}

function gps(): Promise<Wsp> {
  return new Promise((ok, blad) => {
    if (!navigator.geolocation) return blad(new BladLokalizacji('Ta przeglądarka nie udostępnia lokalizacji.'));
    navigator.geolocation.getCurrentPosition(
      (p) => ok({ lat: p.coords.latitude, lon: p.coords.longitude }),
      (e) => blad(new BladLokalizacji(e.code === 1 ? 'Brak zgody na lokalizację.' : 'Nie udało się ustalić lokalizacji.')),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  });
}

// „Lokalizacja” = najbliższy punkt adresowy z paczki, więc syreny i punkty liczą się jak dla wpisanego adresu.
export async function miejsceTutaj(): Promise<MiejsceUzytkownika> {
  const wsp = lokalizacjaZAdresu(location.search) ?? (await gps());
  const adres = await najblizszyAdres(wsp).catch(() => {
    throw new Error('Nie udało się wczytać adresów z paczki (brak sieci?). Pobierz paczkę offline i spróbuj ponownie.');
  });
  if (!adres) throw new BladLokalizacji('Jesteś poza Warszawą albo daleko od adresu z naszej paczki.');
  return { rola: 'tutaj', etykieta: 'Lokalizacja', adres };
}

export function zTutaj(miejsca: MiejsceUzytkownika[], tutaj: MiejsceUzytkownika): MiejsceUzytkownika[] {
  return [tutaj, ...miejsca.filter((m) => m.rola !== 'tutaj')];
}
