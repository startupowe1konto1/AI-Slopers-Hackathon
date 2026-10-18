import type { Manifest, Zrodlo } from '../contracts';

// Atrybucje wymagane zawsze (docs/SPEC.md §7), niezależnie od tego, co jest w paczce.
export const STALE_ZRODLA: Zrodlo[] = [
  {
    nazwa: '© OpenStreetMap contributors, Protomaps (mapa)',
    licencja: 'ODbL',
    url: 'https://www.openstreetmap.org/copyright',
    pobrano: '2026-10-17',
  },
  {
    nazwa: 'Dane: KG PSP, SOIA, wersja danych 2026.05 (Zenodo 10.5281/zenodo.21921103); przycięte do granic m.st. Warszawy (TERYT 1465011) przez zespół hackathonowy. Źródła składowe: OpenStreetMap contributors (ODbL), GUS, GUGiK',
    licencja: 'CC BY 4.0',
    url: 'https://doi.org/10.5281/zenodo.21921103',
    pobrano: '2026-10-17',
  },
  {
    nazwa: 'm.st. Warszawa: dane.um.warszawa.pl i WFS',
    licencja: 'CC BY',
    url: 'https://dane.um.warszawa.pl',
    pobrano: '2026-10-17',
  },
  {
    nazwa: 'Miejsca schronienia według PSP (gdziesieukryc.pl)',
    licencja: 'ponowne wykorzystywanie informacji sektora publicznego (art. 14 ustawy o otwartych danych)',
    url: 'https://gdziesieukryc.pl',
    pobrano: '2026-10-17',
  },
  {
    nazwa: 'Trasy: OSRM (routing.openstreetmap.de, FOSSGIS), © OpenStreetMap contributors',
    licencja: 'ODbL',
    url: 'https://routing.openstreetmap.de',
    pobrano: '2026-10-17',
  },
];

// Stałe atrybucje + źródła z manifestu paczki, bez powtórzeń nazw.
export function zrodlaDoStopki(manifest: Manifest | null): Zrodlo[] {
  const wynik = [...STALE_ZRODLA];
  const nazwy = new Set(wynik.map((z) => z.nazwa));
  for (const z of Object.values(manifest?.zrodla ?? {})) {
    if (!nazwy.has(z.nazwa)) {
      nazwy.add(z.nazwa);
      wynik.push(z);
    }
  }
  return wynik;
}
