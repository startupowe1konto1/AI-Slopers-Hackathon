import type { Wiatr } from '../../src/contracts';
import { blad, odpowiedz, portal } from '../portal';

type Surowy = {
  lokalizacja: string;
  lat: number;
  lon: number;
  czas: string;
  pred_wiatru: number | null;
  kier_wiatru: number | null;
};

// kier_wiatru to kierunek, Z KTÓREGO wieje (konwencja meteo).
export function mapujWiatr(s: Surowy[]): Wiatr[] {
  return s
    .filter((x) => x.pred_wiatru != null && x.kier_wiatru != null)
    .map((x) => ({
      stacja: x.lokalizacja,
      lat: x.lat,
      lon: x.lon,
      kierunekDeg: x.kier_wiatru!,
      predkoscMs: x.pred_wiatru!,
      czas: x.czas,
    }));
}

export async function handler(_req: Request, env: { WARSAW_API_TOKEN?: string }): Promise<Response> {
  try {
    const d = await portal('get_zom_pogoda', {}, env.WARSAW_API_TOKEN);
    return odpowiedz(mapujWiatr(d as Surowy[]), 'Stacje pogodowe m.st. Warszawy przez dane.um.warszawa.pl', 300);
  } catch (e) {
    return blad(e);
  }
}
