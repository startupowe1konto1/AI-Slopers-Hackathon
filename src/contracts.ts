// Typy wspólne dla wszystkich modułów (docs/SPEC.md §5).
// Zmiana tylko PR-em "[kontrakt] ...", który przegląda O1.
import type { ReactElement } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';

export type Wsp = { lat: number; lon: number };

export type Adres = Wsp & {
  id: string; // ID punktu adresowego z WFS
  ulica: string; // „ul. Czwartaków”
  numer: string;
  dzielnica: string;
};

export type RolaMiejsca = 'tutaj' | 'dom' | 'praca' | 'przedszkole' | 'bliska_osoba';
export type MiejsceUzytkownika = { rola: RolaMiejsca; etykieta: string; adres: Adres };

export type RodzajPunktu = 'schronienie_psp' | 'metro' | 'aed' | 'apteka' | 'sor' | 'toaleta' | 'przychodnia';
export type Punkt = Wsp & {
  id: string;
  rodzaj: RodzajPunktu;
  nazwa: string;
  adres?: string;
  dostepnosc?: string; // np. „Całodobowa”, godziny AED
  zrodlo: string; // klucz w Manifest.zrodla
};

export type KlasaSyreny = '75+' | '70-75' | '65-70' | 'ponizej_65';
export type WynikSyreny = { adresId: string; normalnie: KlasaSyreny; blackout: KlasaSyreny };

export type TrasaMin = {
  z: RolaMiejsca;
  do: RolaMiejsca;
  dystansM: number;
  pieszoMin: number;
  rowerMin: number;
  autobusy: { przystanek: string; odlegloscM: number; linie: string[] }[];
};

// Trasy (docs/PLAN-v3.md: V5, L1). Linia w kolejności [lon, lat] jak w GeoJSON.
export type Profil = 'pieszo' | 'rower';
export type Trasa = {
  od: Wsp;
  do: Wsp;
  profil: Profil;
  dystansM: number;
  czasMin: number;
  linia: [number, number][];
  zrodlo: 'osrm' | 'osrm-zapisana' | 'prosta';
};

// Karty „Twoja sytuacja” (HANDOFF-v3 §3). Pierwsza akcja typu trasa albo mapa wykonuje się po kliknięciu karty.
export type Poziom = 'ok' | 'uwaga' | 'alarm' | 'brak';
export type Akcja =
  | { typ: 'trasa'; cel: Wsp; nazwa: string; profil?: Profil } // trasa z KontekstWskazowek.miejsce
  | { typ: 'mapa'; pokaz: (map: MapLibreMap) => () => void } // zwraca sprzątanie
  | { typ: 'link'; url: string; etykieta: string }
  | { typ: 'przycisk'; etykieta: string; wykonaj: () => void | Promise<void> }; // po wykonaniu karty się odświeżają
export type Wskazowka = {
  id: string; // 'syreny' | 'schronienie' | 'medyczna' | 'powietrze' | 'bliscy'
  kolejnosc: number; // 10, 20, 30, 40, 50
  tytul: string;
  poziom: Poziom;
  tekst: string; // 1–2 zdania rekomendacji
  szczegoly?: string[];
  akcje: Akcja[];
  zrodlo: string;
  stanNa?: string; // „18:40”, gdy dane są na żywo albo z zapisu
};
export type KontekstWskazowek = { miejsce: MiejsceUzytkownika; miejsca: MiejsceUzytkownika[]; online: boolean };
export type Kafelek = { id: RodzajPunktu; etykieta: string; kolor: string; dodajWarstwe: (map: MapLibreMap) => () => void };

export type StanLive<T> = { dane: T; stanNa: string; zrodlo: string; zCache: boolean };
export type Pojazd = Wsp & { linia: string; typ: 'autobus' | 'tramwaj'; czas: string };
export type Wiatr = Wsp & { stacja: string; kierunekDeg: number; predkoscMs: number; czas: string };

export type Zrodlo = { nazwa: string; licencja: string; url: string; pobrano: string };
export type Manifest = {
  wersja: string;
  zbudowano: string;
  pliki: { sciezka: string; bajty: number; modul: string }[];
  zrodla: Record<string, Zrodlo>;
};

// Rejestracja modułu w src/modules/index.ts
export type ModulProps = { miejsca: MiejsceUzytkownika[]; wybrane: Wsp | null; online: boolean };
export type Modul = {
  id: 'syreny' | 'punkty' | 'transport' | 'live';
  nazwa: string;
  Panel: (p: ModulProps) => ReactElement;
  dodajWarstwy?: (map: MapLibreMap) => () => void; // zwraca sprzątanie
  wskazowki?: (k: KontekstWskazowek) => Promise<Wskazowka[]>;
  kafelki?: Kafelek[];
};
