import type { Powietrze } from './typy';
import { blad, odpowiedz, portal } from '../portal';

type Pomiar = { param_code: string; value: number | null; time: string };
type Surowy = { name: string; lat: number | string; lon: number | string; data: Pomiar[] };

// Stacje miasta podają PM25, GIOŚ i gminy PM2.5. GIOŚ podaje też współrzędne jako tekst.
const PM25 = ['PM25', 'PM2.5'];

export function mapujPowietrze(s: Surowy[]): Powietrze[] {
  return s.flatMap((x) => {
    const pm = x.data.filter((d) => d.value != null && (d.param_code === 'PM10' || PM25.includes(d.param_code)));
    const lat = parseFloat(String(x.lat));
    const lon = parseFloat(String(x.lon));
    if (!pm.length || !Number.isFinite(lat) || !Number.isFinite(lon)) return [];
    const wartosc = (kody: string[]) => pm.find((d) => kody.includes(d.param_code))?.value ?? null;
    return [
      {
        stacja: x.name,
        lat,
        lon,
        pm10: wartosc(['PM10']),
        pm25: wartosc(PM25),
        czas: pm.reduce((a, d) => (d.time > a ? d.time : a), pm[0].time),
      },
    ];
  });
}

export async function handler(_req: Request, env: { WARSAW_API_TOKEN?: string }): Promise<Response> {
  try {
    const d = await portal('get_bopipk_monitoring_jakosci_powietrza', {}, env.WARSAW_API_TOKEN);
    return odpowiedz(
      mapujPowietrze(d as Surowy[]),
      'Monitoring jakości powietrza m.st. Warszawy przez dane.um.warszawa.pl',
      600,
    );
  } catch (e) {
    return blad(e);
  }
}
