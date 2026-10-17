import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../offline/live-cache', () => ({ fetchLive: vi.fn() }));
import { fetchLive } from '../../offline/live-cache';
import {
  najblizszyOdjazd,
  opisPlanu,
  opisPrzejazdu,
  planKomunikacji,
  planuj,
  type DaneKomunikacji,
  type LiniaKierunek,
  type PlanKomunikacji,
  type Przejazd,
  type PrzystanekK,
} from './komunikacja';

// Start i cel ok. 3,3 km od siebie (ta sama długość geograficzna). 0,001° szerokości to ok. 111 m.
const START = { lat: 52.23, lon: 21.0 };
const CEL = { lat: 52.26, lon: 21.0 };

const p = (id: string, nazwa: string, lat: number): PrzystanekK => ({ id, nazwa, lat, lon: 21.0 });
const PRZYSTANKI: PrzystanekK[] = [
  p('a1', 'Start 01', 52.231), // ~111 m od startu
  p('a2', 'Start 02', 52.2335), // ~389 m od startu
  p('m1', 'Metro Start', 52.2295), // ~56 m od startu
  p('x1', 'Środek 01', 52.245),
  p('b1', 'Cel 01', 52.259), // ~111 m od celu
  p('b2', 'Cel 02', 52.2555), // ~500 m od celu
  p('m2', 'Metro Cel', 52.2605), // ~56 m od celu
  p('z1', 'Daleko 01', 52.3),
];
const l = (linia: string, typ: LiniaKierunek['typ'], kierunek: string, przystanki: string[], czasy: number[]): LiniaKierunek => ({
  linia,
  typ,
  kierunek,
  przystanki,
  czasy,
});
const LINIE: LiniaKierunek[] = [
  l('175', 'autobus', 'Cel', ['a1', 'x1', 'b1'], [0, 6, 12]), // razem 2 + 5 + 12 + 2 = 21
  l('175', 'autobus', 'Start', ['b1', 'x1', 'a1'], [0, 6, 12]), // w przeciwną stronę
  l('175', 'autobus', 'Cel 02', ['a2', 'x1', 'b2'], [0, 5, 10]), // ta sama linia, gorszy kierunek: 30
  l('500', 'autobus', 'Start', ['b1', 'x1', 'a1'], [0, 6, 12]), // jeździ tylko w przeciwną stronę
  l('128', 'autobus', 'Cel', ['a1', 'a2', 'x1', 'b2', 'b1'], [0, 8, 10, 16, 18]), // najlepiej z a2 do b1: 7 + 5 + 10 + 2 = 24
  l('4', 'tramwaj', 'Cel', ['a2', 'x1', 'b2'], [0, 5, 10]), // 7 + 5 + 10 + 8 = 30
  l('M1', 'metro', 'Młociny', ['m1', 'x1', 'm2'], [0, 3, 6]), // 1 + 3 + 6 + 1 = 11
  l('999', 'autobus', 'Daleko', ['a1', 'z1'], [0, 15]), // nie dojeżdża w pobliże celu
];
const DANE: DaneKomunikacji = { przystanki: PRZYSTANKI, linie: LINIE };

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe('planuj', () => {
  it('liczy dojście, czekanie, przejazd i zejście dla linii jadącej we właściwą stronę', () => {
    const plan = planuj(DANE, START, CEL, { blackout: false });
    const w = plan.warianty.find((x) => x.linia === '175')!;
    expect(w).toMatchObject({
      typ: 'autobus',
      kierunek: 'Cel',
      liczbaPrzystankow: 2,
      dojscieM: 140,
      dojscieMin: 2,
      czekanieMin: 5,
      przejazdMin: 12,
      zejscieM: 140,
      zejscieMin: 2,
      razemMin: 21,
    });
    expect(w.z).toEqual(PRZYSTANKI[0]);
    expect(w.do).toEqual(PRZYSTANKI[4]);
    expect(w.przystanki.map((x) => x.id)).toEqual(['a1', 'x1', 'b1']);
  });

  it('linia jeżdżąca tylko w przeciwną stronę odpada', () => {
    const plan = planuj(DANE, START, CEL, { blackout: true });
    expect(plan.warianty.map((w) => w.linia)).not.toContain('500');
  });

  it('wybiera parę przystanków z najkrótszym czasem razem, nie najbliższy przystanek', () => {
    const plan = planuj(DANE, START, CEL, { blackout: true });
    const w = plan.warianty.find((x) => x.linia === '128')!;
    // z a1: 2 + 5 + 18 + 2 = 27; z a2: 7 + 5 + 10 + 2 = 24
    expect([w.z.id, w.do.id]).toEqual(['a2', 'b1']);
    expect(w.liczbaPrzystankow).toBe(3);
    expect(w.dojscieM).toBe(510);
    expect(w.dojscieMin).toBe(7);
    expect(w.razemMin).toBe(24);
  });

  it('do 3 wariantów posortowanych po czasie, metro czeka 3 min', () => {
    const plan = planuj(DANE, START, CEL, { blackout: false });
    expect(plan.warianty.map((w) => [w.linia, w.razemMin])).toEqual([
      ['M1', 11],
      ['175', 21],
      ['128', 24],
    ]);
    expect(plan.warianty[0].czekanieMin).toBe(3);
    expect(plan.blackout).toBe(false);
  });

  it('przy blackoucie tylko autobusy, jedna linia daje jeden wariant', () => {
    const plan = planuj(DANE, START, CEL, { blackout: true });
    expect(plan.warianty.map((w) => w.linia)).toEqual(['175', '128']);
    expect(plan.warianty.every((w) => w.typ === 'autobus')).toBe(true);
    expect(plan.blackout).toBe(true);
  });

  it('podaje drogę pieszo (linia prosta × 1,3, 5 km/h) i że komunikacją szybciej', () => {
    const plan = planuj(DANE, START, CEL, { blackout: false });
    expect(plan.pieszoM).toBe(4340);
    expect(plan.pieszoMin).toBe(53);
    expect(plan.pieszoSzybciej).toBe(false);
  });

  it('na krótkim dystansie pieszo jest szybciej, nawet gdy jest połączenie', () => {
    const plan = planuj(DANE, START, { lat: 52.2335, lon: 21.0 }, { blackout: false });
    expect(plan.warianty.map((w) => w.linia)).toEqual(['128']);
    expect(plan.pieszoMin).toBe(7);
    expect(plan.pieszoSzybciej).toBe(true);
  });

  it('bez przystanków przy celu: brak wariantów i pieszo szybciej', () => {
    const plan = planuj(DANE, START, { lat: 52.2, lon: 21.0 }, { blackout: false });
    expect(plan.warianty).toEqual([]);
    expect(plan.pieszoSzybciej).toBe(true);
  });
});

describe('najblizszyOdjazd', () => {
  const stan = (odjazdy: string[], zCache = false) => ({
    dane: { przystanek: 'a1', linia: '175', odjazdy },
    stanNa: '2026-10-17T12:00:00Z',
    zrodlo: 'ZTM',
    zCache,
  });

  it('wybiera pierwszy odjazd od teraz i podaje, za ile minut', async () => {
    vi.mocked(fetchLive).mockResolvedValue(stan(['13:58', '14:05', '14:12', '14:27']));
    expect(await najblizszyOdjazd('a1', '175', new Date(2026, 9, 17, 14, 7))).toEqual({ godzina: '14:12', zaMin: 5, zCache: false });
    expect(fetchLive).toHaveBeenCalledWith('odjazdy?przystanek=a1&linia=175');
  });

  it('odjazd 24:15 po 23:50 to 00:15 za 25 min', async () => {
    vi.mocked(fetchLive).mockResolvedValue(stan(['23:20', '23:45', '24:15'], true));
    expect(await najblizszyOdjazd('a1', '175', new Date(2026, 9, 17, 23, 50))).toEqual({ godzina: '00:15', zaMin: 25, zCache: true });
  });

  it('po ostatnim odjeździe: null', async () => {
    vi.mocked(fetchLive).mockResolvedValue(stan(['22:10', '23:20']));
    expect(await najblizszyOdjazd('a1', '175', new Date(2026, 9, 17, 23, 50))).toBeNull();
  });

  it('metro: null bez zapytania', async () => {
    expect(await najblizszyOdjazd('m1', 'M1', new Date(2026, 9, 17, 14, 7))).toBeNull();
    expect(fetchLive).not.toHaveBeenCalled();
  });

  it('brak danych albo błąd: null', async () => {
    vi.mocked(fetchLive).mockResolvedValue(null);
    expect(await najblizszyOdjazd('a1', '175')).toBeNull();
    vi.mocked(fetchLive).mockRejectedValue(new Error('x'));
    expect(await najblizszyOdjazd('a1', '175')).toBeNull();
  });
});

const przejazd = (zmiany: Partial<Przejazd>): Przejazd => ({
  linia: '175',
  typ: 'autobus',
  kierunek: 'Pl. Piłsudskiego',
  z: p('s1', 'Centrum 05', 52.23),
  do: p('s2', 'Plac Zbawiciela 02', 52.22),
  przystanki: [],
  liczbaPrzystankow: 6,
  dojscieM: 240,
  dojscieMin: 3,
  czekanieMin: 5,
  przejazdMin: 12,
  zejscieM: 300,
  zejscieMin: 4,
  razemMin: 24,
  ...zmiany,
});

describe('opisPrzejazdu', () => {
  it('opisuje cały przejazd jednym zdaniem', () => {
    expect(opisPrzejazdu(przejazd({}))).toBe(
      'Autobus 175, kierunek Pl. Piłsudskiego: 240 m pieszo do przystanku Centrum 05, 6 przystanków (ok. 12 min), wysiadka Plac Zbawiciela 02, potem 300 m pieszo. Razem ok. 24 min.',
    );
  });

  it('nazywa tramwaj i metro', () => {
    expect(opisPrzejazdu(przejazd({ linia: '4', typ: 'tramwaj' }))).toMatch(/^Tramwaj 4, kierunek /);
    expect(opisPrzejazdu(przejazd({ linia: 'M1', typ: 'metro' }))).toMatch(/^Metro M1, kierunek /);
  });

  it('odmienia „przystanek”', () => {
    const n = (liczba: number) => opisPrzejazdu(przejazd({ liczbaPrzystankow: liczba })).match(/, (\d+ \S+) \(ok\./)![1];
    expect([1, 2, 4, 5, 12, 14, 22, 25].map(n)).toEqual([
      '1 przystanek',
      '2 przystanki',
      '4 przystanki',
      '5 przystanków',
      '12 przystanków',
      '14 przystanków',
      '22 przystanki',
      '25 przystanków',
    ]);
  });
});

describe('opisPlanu', () => {
  const plan = (zmiany: Partial<PlanKomunikacji>): PlanKomunikacji => ({
    warianty: [przejazd({})],
    pieszoM: 2500,
    pieszoMin: 40,
    pieszoSzybciej: false,
    blackout: false,
    ...zmiany,
  });

  it('bez połączenia podaje czas pieszo', () => {
    expect(opisPlanu(plan({ warianty: [], pieszoSzybciej: true }))).toBe('W pobliżu nie ma bezpośredniego połączenia. Pieszo ok. 40 min.');
  });

  it('gdy pieszo szybciej, mówi to wprost', () => {
    expect(opisPlanu(plan({ pieszoMin: 9, pieszoSzybciej: true }))).toBe('Pieszo będzie szybciej: ok. 9 min.');
  });

  it('wskazuje najszybszy wariant', () => {
    expect(opisPlanu(plan({}))).toBe('Najszybciej autobusem 175: ok. 24 min. Pieszo ok. 40 min.');
    expect(opisPlanu(plan({ warianty: [przejazd({ linia: 'M1', typ: 'metro', razemMin: 11 })] }))).toBe(
      'Najszybciej metrem M1: ok. 11 min. Pieszo ok. 40 min.',
    );
  });

  it('przy blackoucie zawsze dopisuje, że pokazuje tylko autobusy', () => {
    const dopisek = ' Jeśli zabraknie prądu, tramwaje i metro staną. Pokazuję tylko autobusy.';
    expect(opisPlanu(plan({ blackout: true }))).toBe(`Najszybciej autobusem 175: ok. 24 min. Pieszo ok. 40 min.${dopisek}`);
    expect(opisPlanu(plan({ warianty: [], pieszoSzybciej: true, blackout: true }))).toBe(
      `W pobliżu nie ma bezpośredniego połączenia. Pieszo ok. 40 min.${dopisek}`,
    );
  });
});

describe('planKomunikacji', () => {
  it('pobiera oba pliki z paczki raz, a po błędzie próbuje ponownie', async () => {
    // W pliku przystanków jest też pole `linie`; planer go nie potrzebuje.
    const zPliku = PRZYSTANKI.map((x) => ({ ...x, linie: ['175'] }));
    const f = vi.fn(async (url: string) =>
      url === '/pack/transport/przystanki.json' ? Response.json(zPliku) : url === '/pack/transport/linie.json' ? Response.json(LINIE) : new Response('', { status: 404 }),
    );
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })));
    await expect(planKomunikacji(START, CEL, { blackout: true })).rejects.toThrow();

    vi.stubGlobal('fetch', f);
    const plan = await planKomunikacji(START, CEL, { blackout: true });
    expect(plan.warianty.map((w) => w.linia)).toEqual(['175', '128']);
    expect(plan.warianty[0].z).toEqual(PRZYSTANKI[0]);
    expect(f.mock.calls.map(([u]) => u).sort()).toEqual(['/pack/transport/linie.json', '/pack/transport/przystanki.json']);

    await planKomunikacji(START, CEL, { blackout: false });
    expect(f).toHaveBeenCalledTimes(2);
  });
});
