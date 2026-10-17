// @vitest-environment node
import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { wynikSyreny } from './wynik';

// SPEC §10: klasy syren dla 3 znanych adresów, na prawdziwej paczce z public/pack.
afterEach(() => vi.unstubAllGlobals());

it('klasy syren dla 3 znanych adresów z prawdziwej paczki', async () => {
  vi.stubGlobal('fetch', async (url: string) => new Response(readFileSync(`public${url}`)));
  expect(await wynikSyreny('1270798')).toEqual({ adresId: '1270798', normalnie: '75+', blackout: '75+' }); // ul. Powstańców Śląskich 10
  expect(await wynikSyreny('1315198')).toEqual({ adresId: '1315198', normalnie: '65-70', blackout: '65-70' }); // ul. Czwartaków 155
  expect(await wynikSyreny('1441381')).toEqual({ adresId: '1441381', normalnie: '75+', blackout: 'ponizej_65' }); // ul. Grochowska 200
});
