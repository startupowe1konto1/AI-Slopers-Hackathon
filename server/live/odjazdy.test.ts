// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { StanLive } from '../../src/contracts';
import type { Odjazdy } from './typy';
import { handlery } from './index';
import { handler, mapujOdjazdy } from './odjazdy';

// próbka z 17.10: linia 523, Marszałkowska 01 (700901), 101 odjazdów w kolejności z API (nieposortowane)
const probka = JSON.parse(readFileSync('dane/probki/ztm_odjazdy_linii_z_przystanku.json', 'utf-8'));
const zapytanie = (q: string) => new Request(`http://x/api/live/odjazdy?${q}`);
const wiersz = (czas: string | null) => [
  { value: null, key: 'symbol_2' },
  { value: '193', key: 'brygada' },
  { value: czas, key: 'czas' },
];

describe('mapujOdjazdy', () => {
  it('z próbki: godziny HH:MM posortowane rosnąco, cały dzień', () => {
    const o = mapujOdjazdy(probka);
    expect(o).toHaveLength(101);
    expect(o.slice(0, 3)).toEqual(['05:15', '05:30', '05:45']);
    expect(o.at(-1)).toBe('23:45');
    expect(o.every((c) => /^\d{2}:\d{2}$/.test(c))).toBe(true);
    expect(o).toEqual([...o].sort());
  });

  it('kursy po północy (np. N25) zostają jako 24:xx i dalej, po 23:xx', () => {
    const o = mapujOdjazdy([wiersz('27:24:00'), wiersz('23:54:00'), wiersz('24:24:00')]);
    expect(o).toEqual(['23:54', '24:24', '27:24']);
  });

  it('pomija wiersze bez poprawnej godziny i wiersze, które nie są listą', () => {
    expect(mapujOdjazdy([wiersz(null), wiersz('abc'), {} as never, wiersz('06:00:00')])).toEqual(['06:00']);
  });
});

describe('handler', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('jest w rejestrze /api/live', () => {
    expect(handlery.odjazdy).toBe(handler);
  });

  it('złe parametry: 400 bez pytania API', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    for (const q of ['linia=523', 'przystanek=700901', 'przystanek=7009&linia=523', 'przystanek=70090a&linia=523', 'przystanek=700901&linia=52345', 'przystanek=700901&linia=5-2']) {
      const r = await handler(zapytanie(q), { WARSAW_API_TOKEN: 'test' });
      expect(r.status).toBe(400);
      expect(await r.json()).toEqual({ blad: 'parametry' });
    }
    expect(f).not.toHaveBeenCalled();
  });

  it('pyta API o zespół, słupek i linię (wielkie litery) i zwraca odjazdy z cache na godzinę', async () => {
    const f = vi.fn(async (_url: string, _init: RequestInit) => Response.json(probka));
    vi.stubGlobal('fetch', f);
    const r = await handler(zapytanie('przystanek=700901&linia=n25'), { WARSAW_API_TOKEN: 'test' });
    expect(r.status).toBe(200);
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('https://dane.um.warszawa.pl/api/action/get_ztm_odjazdy_linii_z_przystanku');
    expect(JSON.parse(init.body as string)).toEqual({ busstopId: '7009', busstopNr: '01', line: 'N25' });
    const stan = (await r.json()) as StanLive<Odjazdy>;
    expect(stan.dane.przystanek).toBe('700901');
    expect(stan.dane.linia).toBe('N25');
    expect(stan.dane.odjazdy).toHaveLength(101);
    expect(stan.zrodlo).toBe('ZTM przez dane.um.warszawa.pl');
    expect(r.headers.get('Cache-Control')).toBe('public, s-maxage=3600');
  });

  it('błąd portalu (500, np. nieznany przystanek albo zły klucz): 502', async () => {
    vi.stubGlobal('fetch', async () => Response.json({ message: 'Service unavailable' }, { status: 500 }));
    const r = await handler(zapytanie('przystanek=999999&linia=523'), { WARSAW_API_TOKEN: 'test' });
    expect(r.status).toBe(502);
    expect(await r.json()).toEqual({ blad: 'klucz_lub_usluga' });
  });

  it('bez klucza: 502 i nie pyta API', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    const r = await handler(zapytanie('przystanek=700901&linia=523'), {});
    expect(r.status).toBe(502);
    expect(await r.json()).toEqual({ blad: 'brak_klucza' });
    expect(f).not.toHaveBeenCalled();
  });
});
