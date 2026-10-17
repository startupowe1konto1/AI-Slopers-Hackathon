import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchLive } from './live-cache';

const stan = { dane: [1, 2], stanNa: '2026-10-17T14:02:00Z', zrodlo: 'test', zCache: false };

function ustawSiec(online: boolean, szukaj = '') {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online);
  history.replaceState(null, '', `/${szukaj}`);
}

afterEach(() => vi.restoreAllMocks());

describe('fetchLive', () => {
  it('online: zwraca odpowiedź API i ją zapisuje', async () => {
    ustawSiec(true);
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(stan)));
    expect(await fetchLive('a')).toEqual(stan);
  });

  it('offline: zwraca ostatni zapisany stan z zCache', async () => {
    ustawSiec(true);
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(stan)));
    await fetchLive('b');
    ustawSiec(false);
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    expect(await fetchLive('b')).toEqual({ ...stan, zCache: true });
    expect(f).not.toHaveBeenCalled();
  });

  it('?offline=1: nie pyta API nawet przy sieci', async () => {
    ustawSiec(true);
    vi.stubGlobal('fetch', vi.fn(async () => Response.json(stan)));
    await fetchLive('c');
    ustawSiec(true, '?offline=1');
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    expect((await fetchLive('c'))?.zCache).toBe(true);
    expect(f).not.toHaveBeenCalled();
  });

  it('błąd API i brak zapisu: null', async () => {
    ustawSiec(true);
    vi.stubGlobal('fetch', vi.fn(async () => new Response('x', { status: 502 })));
    expect(await fetchLive('d')).toBeNull();
  });
});
