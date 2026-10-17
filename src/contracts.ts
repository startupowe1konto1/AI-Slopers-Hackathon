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

export type RolaMiejsca = 'dom' | 'praca' | 'przedszkole' | 'bliska_osoba';
export type MiejsceUzytkownika = { rola: RolaMiejsca; etykieta: string; adres: Adres };

export type RodzajPunktu = 'schronienie_psp' | 'metro' | 'aed' | 'apteka' | 'sor' | 'toaleta';
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
};
