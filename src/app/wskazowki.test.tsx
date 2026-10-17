import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { KontekstWskazowek, Modul, Wskazowka } from '../contracts';
import { useWskazowki } from './wskazowki';

const karta = (id: string, kolejnosc: number): Wskazowka => ({ id, kolejnosc, tytul: id, poziom: 'ok', tekst: id, akcje: [], zrodlo: 'test' });
const adres = { id: '1', ulica: 'Grochowska', numer: '200', dzielnica: 'Praga-Południe', lat: 52.2457, lon: 21.0874 };
const k: KontekstWskazowek = { miejsce: { rola: 'dom', etykieta: 'Dom', adres }, miejsca: [], online: true };
const Panel = () => <div />;

afterEach(() => {
  vi.restoreAllMocks();
});

it('zbiera karty, sortuje po kolejności, błąd modułu zamienia na kartę „brak” na miejscu modułu', async () => {
  const moduly: Modul[] = [
    { id: 'live', nazwa: 'Na żywo', Panel, wskazowki: async () => [karta('powietrze', 40)] },
    { id: 'syreny', nazwa: 'Syreny', Panel, wskazowki: async () => [karta('syreny', 10)] },
    { id: 'punkty', nazwa: 'Pomoc', Panel, wskazowki: async () => Promise.reject(new Error('x')) },
    { id: 'transport', nazwa: 'Dojazd', Panel },
  ];
  const blad = vi.spyOn(console, 'error').mockImplementation(() => {});
  const pierwszyRender: number[][] = [];
  const { result } = renderHook(() => {
    const r = useWskazowki(moduly, k, 0);
    pierwszyRender.push(r.ladowanie);
    return r;
  });
  // już pierwszy render (przed efektem) pokazuje szkielety na miejscach kart (punkty mają dwie: 20 i 30), a nie „Brak wskazówek”
  expect(pierwszyRender[0]).toEqual([10, 20, 30, 40]);
  expect(result.current.ladowanie).toEqual([10, 20, 30, 40]);
  await waitFor(() => expect(result.current.ladowanie).toEqual([]));
  expect(result.current.karty.map((w) => w.id)).toEqual(['syreny', 'blad-punkty', 'powietrze']);
  expect(result.current.karty[1]).toMatchObject({ poziom: 'brak', tytul: 'Pomoc', kolejnosc: 20 });
  expect(blad).toHaveBeenCalledWith('[karty]', 'punkty', expect.any(Error));
});

it('gotowy moduł zastępuje swoje szkielety, reszta czeka na swoich miejscach', async () => {
  let oddajSyreny!: (w: Wskazowka[]) => void;
  const moduly: Modul[] = [
    { id: 'syreny', nazwa: 'Syreny', Panel, wskazowki: () => new Promise((r) => (oddajSyreny = r)) },
    { id: 'punkty', nazwa: 'Pomoc', Panel, wskazowki: async () => [karta('schronienie', 20), karta('medyczna', 30)] },
    { id: 'transport', nazwa: 'Dojazd', Panel, wskazowki: () => new Promise(() => {}) },
  ];
  const { result } = renderHook(() => useWskazowki(moduly, k, 0));
  await waitFor(() => expect(result.current.karty.map((w) => w.id)).toEqual(['schronienie', 'medyczna']));
  expect(result.current.ladowanie).toEqual([10, 50]);
  await act(async () => oddajSyreny([karta('syreny', 10)]));
  expect(result.current.ladowanie).toEqual([50]);
});

it('odświeżenie po akcji (tylko proba) zostawia stare karty do czasu nowych', async () => {
  let oddaj!: (w: Wskazowka[]) => void;
  const wskazowki = vi.fn(async () => [karta('powietrze', 40)]);
  const moduly: Modul[] = [{ id: 'live', nazwa: 'Na żywo', Panel, wskazowki }];
  const { result, rerender } = renderHook(({ proba }) => useWskazowki(moduly, k, proba), { initialProps: { proba: 0 } });
  await waitFor(() => expect(result.current.karty).toHaveLength(1));
  wskazowki.mockReturnValueOnce(new Promise((r) => (oddaj = r)));
  rerender({ proba: 1 });
  expect(result.current).toEqual({ karty: [karta('powietrze', 40)], ladowanie: [] });
  await act(async () => oddaj([{ ...karta('powietrze', 40), tekst: 'nowa' }]));
  expect(result.current.karty[0].tekst).toBe('nowa');
});

it('bez kontekstu nic nie ładuje', () => {
  const { result } = renderHook(() => useWskazowki([], null, 0));
  expect(result.current).toEqual({ karty: [], ladowanie: [] });
});
