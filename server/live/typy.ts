import type { Wsp } from '../../src/contracts';

// Typy używane tylko w pasie O4 (server/live/* i src/modules/live/). Wspólne typy są w src/contracts.ts.

// /api/live/powietrze: stacje pomiaru jakości powietrza (µg/m³), null = stacja nie mierzy tego pyłu
export type Powietrze = Wsp & { stacja: string; pm10: number | null; pm25: number | null; czas: string };

// /api/live/rowery: stacje Veturilo
export type StacjaRowerowa = Wsp & { nazwa: string; rowery: number; wypozycza: boolean };

// /api/live/utrudnienia: linie [lon, lat] (jak w GeoJSON) i punkty
export type Utrudnienie = {
  id: string;
  nazwa: string;
  od: string; // 'YYYY-MM-DD HH:MM:SS', czas warszawski
  do: string; // '' = bez daty końca (do odwołania)
  ulice: string[];
  linie: [number, number][][];
  punkty: [number, number][];
};
