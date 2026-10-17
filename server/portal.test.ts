// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BladPortalu, blad, odpowiedz, portal } from './portal';

afterEach(() => vi.unstubAllGlobals());

const rodzajBledu = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e) {
    return e instanceof BladPortalu ? e.rodzaj : 'inny';
  }
  return 'brak bledu';
};

describe('portal', () => {
  it('wysyła POST z kluczem w nagłówku Authorization', async () => {
    const fetch = vi.fn(async () => Response.json([{ a: 1 }]));
    vi.stubGlobal('fetch', fetch);
    expect(await portal('get_zom_pogoda', {}, 'klucz')).toEqual([{ a: 1 }]);
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://dane.um.warszawa.pl/api/action/get_zom_pogoda');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('klucz');
  });

  it('bez klucza rzuca klucz_lub_usluga', async () => {
    expect(await rodzajBledu(portal('get_zom_pogoda', {}, undefined))).toBe('klucz_lub_usluga');
  });

  it('500 z portalu (także przy złym kluczu) to klucz_lub_usluga', async () => {
    vi.stubGlobal('fetch', async () => new Response('Service unavailable', { status: 500 }));
    expect(await rodzajBledu(portal('get_zom_pogoda', {}, 'zly'))).toBe('klucz_lub_usluga');
  });

  it('odpowiedź, która nie jest listą, to schemat', async () => {
    vi.stubGlobal('fetch', async () => Response.json({ error: 'x' }));
    expect(await rodzajBledu(portal('get_zom_pogoda', {}, 'klucz'))).toBe('schemat');
  });

  it('brak połączenia to timeout', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('fetch failed');
    });
    expect(await rodzajBledu(portal('get_zom_pogoda', {}, 'klucz'))).toBe('timeout');
  });
});

describe('odpowiedz i blad', () => {
  it('odpowiedz opakowuje dane w StanLive z cache', async () => {
    const r = odpowiedz([1], 'ZTM', 15);
    const body = await r.json();
    expect(body).toMatchObject({ dane: [1], zrodlo: 'ZTM', zCache: false });
    expect(Number.isNaN(Date.parse(body.stanNa))).toBe(false);
    expect(r.headers.get('Cache-Control')).toBe('public, s-maxage=15');
  });

  it('blad zwraca 502 z rodzajem i nie ujawnia treści', async () => {
    const r = blad(new BladPortalu('schemat', 'get_zom_pogoda'));
    expect(r.status).toBe(502);
    expect(await r.json()).toEqual({ blad: 'schemat' });
    expect(await blad(new Error('x')).json()).toEqual({ blad: 'nieznany' });
  });
});
