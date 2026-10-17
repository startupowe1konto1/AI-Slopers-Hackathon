import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { klasa, ocena } from './wynik';

it('mapuje kody na klasy', () => {
  expect(['3', '2', '1', '0'].map(klasa)).toEqual(['75+', '70-75', '65-70', 'ponizej_65']);
});
it('ocena łączy oba warianty', () => {
  expect(ocena({ adresId: 'x', normalnie: '75+', blackout: 'ponizej_65' }).poziom).toBe('ryzyko_blackout');
  expect(ocena({ adresId: 'x', normalnie: 'ponizej_65', blackout: 'ponizej_65' }).poziom).toBe('nie_slychac');
  expect(ocena({ adresId: 'x', normalnie: '70-75', blackout: '70-75' }).poziom).toBe('slychac');
});

// Paczki w pamięci: wiersz i w syreny.json = wiersz i w adresy.json.
const adresy = {
  ulice: ['ul. Grochowska'], dzielnice: ['Praga-Południe'],
  id: ['1441381', '1441382'], u: [0, 0], nr: ['200', '202'], dz: [0, 0], lat: [52.24, 52.241], lon: [21.09, 21.091],
};
const syreny = { n: '31', b: '01' };

function stubPaczki(syrenyOdp: () => Response = () => Response.json(syreny)) {
  const f = vi.fn(async (url: string) => (url === '/pack/syreny/syreny.json' ? syrenyOdp() : Response.json(adresy)));
  vi.stubGlobal('fetch', f);
  return f;
}

describe('wynikSyreny', () => {
  // Moduły trzymają paczki w pamięci, więc każdy test ładuje je od nowa.
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.unstubAllGlobals());

  it('czyta klasy z wiersza adresu', async () => {
    stubPaczki();
    const { wynikSyreny } = await import('./wynik');
    expect(await wynikSyreny('1441382')).toEqual({ adresId: '1441382', normalnie: '65-70', blackout: '65-70' });
    expect(await wynikSyreny('1441381')).toEqual({ adresId: '1441381', normalnie: '75+', blackout: 'ponizej_65' });
  });

  it('null dla adresu spoza paczki', async () => {
    stubPaczki();
    const { wynikSyreny } = await import('./wynik');
    expect(await wynikSyreny('t1')).toBeNull();
  });

  it('null, gdy syreny.json nie pasuje do adresy.json (za krótki albo zły znak)', async () => {
    stubPaczki(() => Response.json({ n: '3', b: '0' }));
    let { wynikSyreny } = await import('./wynik');
    expect(await wynikSyreny('1441382')).toBeNull();
    vi.resetModules();
    stubPaczki(() => Response.json({ n: '3x', b: '00' }));
    ({ wynikSyreny } = await import('./wynik'));
    expect(await wynikSyreny('1441382')).toBeNull();
  });

  it('błąd paczki odrzuca, a następne wywołanie próbuje znowu', async () => {
    stubPaczki(() => new Response('brak', { status: 404 }));
    const { wynikSyreny } = await import('./wynik');
    await expect(wynikSyreny('1441381')).rejects.toThrow('syreny.json');
    stubPaczki();
    expect((await wynikSyreny('1441381'))?.normalnie).toBe('75+');
  });
});
