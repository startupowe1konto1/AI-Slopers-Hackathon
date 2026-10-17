import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ZASOBY_MAPY, plikMapy, pobierzPaczke, stanPaczki, zapewnijMape } from './paczka';

// Minimalny OPFS w pamięci.
function opfs() {
  const pliki = new Map<string, Blob>();
  const root = {
    async getFileHandle(nazwa: string, opt?: { create?: boolean }) {
      if (!pliki.has(nazwa) && !opt?.create) throw new DOMException('brak', 'NotFoundError');
      return {
        async getFile() {
          return new File([pliki.get(nazwa) ?? new Blob()], nazwa);
        },
        async createWritable() {
          const czesci: BlobPart[] = [];
          return new WritableStream<Uint8Array<ArrayBuffer>>({
            write: (c) => void czesci.push(c),
            close: () => void pliki.set(nazwa, new Blob(czesci)),
          });
        },
      };
    },
  };
  return { root, pliki };
}

const manifest = {
  wersja: '2026-10-17T15:00',
  zbudowano: '2026-10-17T15:00:00+00:00',
  pliki: [
    { sciezka: 'syreny/syreny.json', bajty: 2, modul: 'syreny' },
    { sciezka: 'punkty/punkty.json', bajty: 2, modul: 'punkty' },
  ],
  zrodla: {},
};

describe('paczka offline', () => {
  beforeEach(() => {
    localStorage.clear();
    const { root } = opfs();
    vi.stubGlobal('navigator', { ...navigator, storage: { getDirectory: async () => root, persist: async () => true } });
  });

  it('bez pobrania: brak mapy i brak stanu', async () => {
    expect(await plikMapy()).toBeNull();
    expect(await stanPaczki()).toBeNull();
  });

  it('pobiera manifest, pliki i mapę, raportuje postęp', async () => {
    const pobrane: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      pobrane.push(url);
      if (url === '/pack/manifest.json') return Response.json(manifest);
      return new Response(url.endsWith('.pmtiles') ? 'MAPA' : '{}');
    }));
    const postep: [number, number][] = [];
    await pobierzPaczke((z, w) => postep.push([z, w]));

    expect(pobrane).toEqual([
      '/pack/manifest.json',
      '/pack/syreny/syreny.json',
      '/pack/punkty/punkty.json',
      ...ZASOBY_MAPY,
      '/map/warszawa.pmtiles',
    ]);
    expect(ZASOBY_MAPY).toContain('/map/fonts/Noto%20Sans%20Medium/256-511.pbf');
    expect(postep.at(-1)).toEqual([3, 3]);
    expect(await (await plikMapy())!.text()).toBe('MAPA');
    expect(await stanPaczki()).toEqual({ wersja: manifest.wersja, zbudowano: manifest.zbudowano });
  });

  it('błąd pliku przerywa i nie zapisuje stanu', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) =>
      url === '/pack/manifest.json' ? Response.json(manifest) : new Response('x', { status: 404 }),
    ));
    await expect(pobierzPaczke(() => {})).rejects.toThrow('syreny/syreny.json');
    expect(await stanPaczki()).toBeNull();
  });

  it('zapewnijMape: pobiera cały plik raz, potem czyta z OPFS', async () => {
    const f = vi.fn(async () => new Response('MAPA'));
    vi.stubGlobal('fetch', f);
    expect(await (await zapewnijMape()).text()).toBe('MAPA');
    expect(await (await zapewnijMape()).text()).toBe('MAPA');
    expect(f).toHaveBeenCalledTimes(1);
    expect(f).toHaveBeenCalledWith('/map/warszawa.pmtiles');
  });
});
