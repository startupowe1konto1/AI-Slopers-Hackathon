# Handoff v3: ekran „Twoja sytuacja” zamiast zakładek

Stan na sobotę, 19:10. Źródła: rozpiska lidera po wieczornym przeglądzie, transkrypt `kontekst/transkrypty/2026-10-17-rozmowa-zespolu-cz3.txt`, odpowiedzi lidera na pytania doprecyzowujące. Transkrypcje „Hackathon v3” jeszcze nie trafiły do repo; po ich dodaniu ten plik zostanie uzupełniony.

Obowiązuje razem z [docs/SPEC.md](docs/SPEC.md) (dane, zasady treści §7, stany §8) i [CLAUDE.md](CLAUDE.md). Gdzie ten plik zmienia SPEC, wygrywa ten plik. Zadania krok po kroku (testy, kod, kolejność, praca z subagentami): [docs/PLAN-v3.md](docs/PLAN-v3.md).

---

## 1. Co zmieniamy i dlaczego

Zespół na przeglądzie: aplikacja zalewa użytkownika danymi (1000 ikonek na mapie, suche sekcje, zakładka Dojazd niezrozumiała). Ma być **poradnikiem dopasowanym do sytuacji**: po wpisaniu adresów użytkownik od razu dostaje ocenę sytuacji i konkretne rekomendacje, bez przeklikiwania.

## 2. Nowy przepływ ekranów

1. **Adresy** (jak teraz) + nowy przycisk **„Użyj mojej lokalizacji”** (GPS przeglądarki → najbliższy punkt adresowy z paczki).
2. **„Sprawdzam połączenie…”**: ekran z animacją ładowania. Aplikacja sprawdza sieć i API (zapytanie do `/api/live/wiatr` z limitem 4 s):
   - **Online:** „Jest połączenie”. Pobiera albo odświeża paczkę offline i zapisuje trasy na offline (punkt 5). Dane na żywo włączone.
   - **Offline:** „Brak sieci, działam na danych z paczki z HH:MM”. Bez paczki: jasny komunikat, co działa, a co nie.
   - Wynik widać potem stale w pasku (`Online` / `Offline · paczka z …`).
3. **Ekran główny:**
   - **Mapa pusta**: tylko lokalizacja użytkownika, **bez punktów**.
   - **Na górze kafelki jak w Google Maps** (przewijany rząd): Miejsca schronienia PSP · AED · SOR · Apteki · Przychodnie · Toalety · Metro. Kliknięcie włącza lub wyłącza warstwę. To **dodatkowa** funkcja, domyślnie wszystko wyłączone.
   - **Na dole lista „Twoja sytuacja”**: karty wskazówek dla wybranego miejsca (lokalizacja albo zapisany adres; przełącznik miejsca jak teraz w pasku).
4. **Kliknięcie karty** pokazuje na mapie to, czego dotyczy (okręgi syren, trasę do punktu), a pod spodem szczegóły i akcje.

## 3. Karty na ekranie startowym (w tej kolejności)

| # | Karta | Treść karty (przykład) | Po kliknięciu |
|---|---|---|---|
| 1 | **Syreny** | „Jesteś w zasięgu syreny (75 dB i więcej). Jeśli zabraknie prądu: 65–70 dB, możesz jej nie usłyszeć w mieszkaniu.” + 1–2 kroki (Alert RCB, sąsiad) | **okręgi 75/70/65 dB** 3–5 najbliższych syren, kolor wg typu (cyfrowa/analogowa), punkt użytkownika; tekst „mieścisz się w okręgu …” |
| 2 | **Najbliższe miejsce schronienia (PSP)** | „ul. Garwolińska 9, 80 m, ok. 2 min pieszo. Dostępność: na żądanie.” | **trasa piesza po chodnikach** + „Otwórz w aplikacji PSP”; lista 2 kolejnych |
| 3 | **Pomoc medyczna** | najbliższy AED, SOR, apteka, przychodnia (w tym prywatne, z OSM) z odległością | trasa do wybranego; godziny otwarcia, jeśli są |
| 4 | **Powietrze i wiatr** (online; offline: ostatni stan) | **rekomendacja**, nie dane, np. „Powietrze dobre, możesz wietrzyć.” albo „Wiatr niesie dym w Twoją stronę: zamknij okna, wyłącz wentylację.” | pomiar, stacja, godzina; przycisk „Widzę dym” |
| 5 | **Dotarcie do bliskich** | dla każdego zapisanego adresu: „Do mamy (Grochowska 200): pieszo ok. 95 min, rowerem ok. 30 min. Najbliższa stacja Veturilo z rowerami: 450 m.” Przy blackoucie: „tramwaje i metro stoją” | trasa piesza albo rowerowa po ulicach |

Każda karta ma poziom: `ok` (zielony), `uwaga` (pomarańczowy), `alarm` (czerwony), `brak` (szary: brak danych, ze źródłem). Zasady treści z SPEC §7 dalej obowiązują: „miejsca schronienia według PSP”, nigdy „schrony”; przy blackoucie zawsze „jeśli”.

### Rekomendacje powietrza i wiatru (O4), progi PM2.5 wg indeksu GIOŚ

| PM2.5 [µg/m³] | Poziom | Rekomendacja |
|---|---|---|
| ≤ 35 | ok | „Powietrze dobre. Możesz wietrzyć.” |
| 35–75 | uwaga | „Powietrze gorsze. Ogranicz wietrzenie i wysiłek na zewnątrz.” |
| > 75 | alarm | „Powietrze złe. Zamknij okna, wyłącz wentylację, na zewnątrz maska FFP2.” |

Gdy użytkownik zaznaczył dym i jest w stożku z wiatrem: poziom `alarm`, „Wiatr niesie dym w Twoją stronę (z …, X m/s). Zamknij okna, wyłącz wentylację. Jeśli musisz wyjść, idź w poprzek kierunku wiatru.” Zawsze dopisek: „To kierunek wiatru, nie model rozprzestrzeniania się dymu.”

## 4. Ukrywamy w tej wersji

- **Zakładka Dojazd** i **„co jeździ w okolicy”** (tramwaje i autobusy na żywo): poza interfejsem, kod zostaje w repo. Komunikacja wraca w dalszej iteracji.
- **Dolne menu modułów** (Syreny / Pomoc / Dojazd / Na żywo): zastępują je karty i kafelki.
- **Lista stacji Veturilo**: rower pojawia się tylko jako sugestia w karcie 5 (najbliższa stacja z rowerami i trasa do niej).
- Prywatne placówki z Google Maps: **nie** (licencja). Bierzemy je z OpenStreetMap.

## 5. Trasy po chodnikach

- **Online:** proxy `GET /api/live/trasa?od=lon,lat&do=lon,lat&profil=pieszo|rower` (pod `/api/live/`, bo tylko tam kierują Worker i `npm run dev`) → OSRM `routing.openstreetmap.de` (`routed-foot`, `routed-bike`; sprawdzone 19:00: 536 m, 7 min, 62 punkty linii). Odpowiedź w cache Workera (24 h) i w IndexedDB przeglądarki.
- **Zapis na offline:** przy pobraniu paczki aplikacja liczy i zapisuje trasy z każdego zapisanego adresu do: najbliższego miejsca schronienia PSP (3), AED, SOR, apteki, przychodni, a między adresami (pieszo i rowerem). Około 50 tras na użytkownika.
- **Offline bez zapisanej trasy** (np. z bieżącej lokalizacji): linia prosta + kierunek + odległość, opisana jako „w linii prostej”.
- Atrybucja: „Trasy: OSRM, © OpenStreetMap contributors”. Dodać do stopki.

## 6. Kontrakt (zmiana `src/contracts.ts`, robi O1 jako pierwszy krok)

```ts
export type RolaMiejsca = 'tutaj' | 'dom' | 'praca' | 'przedszkole' | 'bliska_osoba';
export type RodzajPunktu = 'schronienie_psp' | 'metro' | 'aed' | 'apteka' | 'sor' | 'toaleta' | 'przychodnia';

export type Profil = 'pieszo' | 'rower';
export type Trasa = {
  od: Wsp; do: Wsp; profil: Profil;
  dystansM: number; czasMin: number;
  linia: [number, number][];          // [lon, lat]
  zrodlo: 'osrm' | 'osrm-zapisana' | 'prosta';
};

export type Poziom = 'ok' | 'uwaga' | 'alarm' | 'brak';
export type Akcja =
  | { typ: 'trasa'; cel: Wsp; nazwa: string; profil?: Profil }
  | { typ: 'mapa'; pokaz: (map: import('maplibre-gl').Map) => () => void }
  | { typ: 'link'; url: string; etykieta: string };

export type Wskazowka = {
  id: string;            // np. 'syreny', 'schronienie', 'medyczna', 'powietrze', 'bliscy'
  kolejnosc: number;     // 10, 20, 30, 40, 50 (tabela w §3)
  tytul: string;
  poziom: Poziom;
  tekst: string;         // 1–2 zdania rekomendacji
  szczegoly?: string[];
  akcje: Akcja[];        // pierwsza akcja wykonuje się po kliknięciu karty
  zrodlo: string;
  stanNa?: string;
};
export type KontekstWskazowek = { miejsce: MiejsceUzytkownika; miejsca: MiejsceUzytkownika[]; online: boolean };

export type Kafelek = { id: RodzajPunktu; etykieta: string; kolor: string; dodajWarstwe: (map: import('maplibre-gl').Map) => () => void };

export type Modul = {
  id: 'syreny' | 'punkty' | 'transport' | 'live';
  nazwa: string;
  wskazowki?: (k: KontekstWskazowek) => Promise<Wskazowka[]>;
  kafelki?: Kafelek[];
  Panel?: (p: ModulProps) => import('react').ReactElement; // zostaje, nie jest pokazywany w menu
  dodajWarstwy?: (map: import('maplibre-gl').Map) => () => void;
};
```

Publiczne funkcje dla innych modułów:
- O1, `src/offline/trasy.ts`: `trasa(od: Wsp, do: Wsp, profil: Profil): Promise<Trasa>` (cache → online → prosta).
- O3, `src/modules/punkty`: `najblizsze(wsp, rodzaj, n)` jak teraz, z nowym rodzajem `przychodnia`.
- O4, `src/modules/live`: `najblizszaStacjaZRowerami(wsp): Promise<{ nazwa: string; wsp: Wsp; rowery: number; odlegloscM: number } | null>`.

## 7. Podział prac

### O1 (Wojciech, szkielet i integracja)
- **V1, 19:15–19:45, blokuje resztę:** kontrakt z §6 + atrapy `wskazowki()` w każdym module, żeby wszyscy mogli pracować równolegle. PR `[kontrakt]`.
- **V2:** przycisk „Użyj mojej lokalizacji” (geolokalizacja + najbliższy adres z paczki; parametr `?lokalizacja=lat,lon` na demo).
- **V3:** ekran „Sprawdzam połączenie…” (animacja, test sieci i API, automatyczne pobranie paczki online).
- **V4:** ekran główny: pusta mapa z lokalizacją, rząd kafelków (z `modul.kafelki`), lista kart (z `modul.wskazowki`, sortowana po `kolejnosc`), wykonanie akcji po kliknięciu (trasa na mapie, warstwa).
- **V5:** `trasa()` z cache i zapisem tras na offline przy pobraniu paczki; warstwa trasy na mapie; atrybucja OSRM.
- **V6:** usunięcie dolnego menu, Dojazdu i „co jeździ” z interfejsu; test ścieżki Kasi przepisany pod nowy przepływ.

### O2 (Oskar, syreny i dotarcie do bliskich)
- **S1, karta Syreny:** „w zasięgu / poza zasięgiem / przy blackoucie (jeśli…)”, poziom, 1–2 kroki; karta do wydruku jako akcja.
- **S2, okręgi syren:** pipeline eksportuje syreny (wsp., typ, moc) i promienie 75/70/65 dB z modelu `przyblizenie.py` do `public/pack/syreny/okregi.json`; akcja `mapa` rysuje okręgi 3–5 najbliższych syren.
- **S3, karta Dotarcie do bliskich:** dla każdego zapisanego adresu czas pieszo i rowerem po ulicach (`trasa()` O1), najbliższa stacja z rowerami (O4), dopisek o blackoucie. Autobusy nie (dalsza iteracja).

### O3 (punkty pomocy)
- **P1, przychodnie z OSM:** pipeline Overpass (`amenity=clinic|doctors|hospital`, `healthcare=*`, ok. 1044 obiekty w Warszawie, sprawdzone 19:05) → rodzaj `przychodnia` w `punkty.json`, nazwa, adres, godziny (`opening_hours`), źródło „© OpenStreetMap contributors (ODbL)”.
- **P2, karta Najbliższe miejsce schronienia:** 1 najbliższe + 2 kolejne, akcja trasa, „Otwórz w aplikacji PSP”.
- **P3, karta Pomoc medyczna:** najbliższy AED, SOR, apteka, przychodnia; akcja trasa do każdego.
- **P4, kafelki:** `kafelki` dla 7 rodzajów punktów (warstwa włączana pojedynczo, bez klastrów 1000 ikon naraz).

### O4 (Valueszyce, powietrze, proxy tras, pitch)
- **L1, proxy tras:** `server/live/trasa.ts` (OSRM pieszo/rower, walidacja współrzędnych w bbox Warszawy, cache 24 h, User-Agent z nazwą projektu) + rejestr; test.
- **L2, karta Powietrze i wiatr:** rekomendacje wg §3; offline ostatni stan z godziną.
- **L3:** `najblizszaStacjaZRowerami()` dla O2.
- **L4, pitch:** liczby syren z `pipeline/syreny/WYNIKI.md` zamiast 69,1% (prezentacja, `dane.js`, scenariusz, pytania, DOKUMENTACJA, HANDOFF); demo pod nowy przepływ: adres → „Sprawdzam połączenie” → karty → klik w miejsce schronienia → trasa → tryb offline.

## 8. Harmonogram

| Godzina | Stan |
|---|---|
| 19:45 | kontrakt V1 na `main`; każdy pracuje na swojej gałęzi od `main` |
| 21:00 | każda karta pokazuje prawdziwe dane (nawet bez wyglądu); proxy tras działa |
| 22:30 | ekran główny z kartami i kafelkami na `main`, test ścieżki Kasi zielony |
| 23:30 | próba pitchu na nowym przepływie |
| **24:00** | **funkcje zamrożone**; dalej poprawki, wygląd, dokumentacja (plan, sekcja F, bez zmian) |

## 9. Ryzyka

| Ryzyko | Plan B |
|---|---|
| OSRM (serwer publiczny) wolny albo niedostępny | cache Workera i trasy zapisane na offline; w razie awarii linia prosta z napisem „w linii prostej” |
| Overpass przeciążony (19:05 pierwsze zapytanie zwróciło błąd, drugie przeszło) | zapisać wynik raz do `dane/probki/` i budować paczkę z pliku |
| Geolokalizacja na laptopie na demo (wymaga zgody i sieci) | `?lokalizacja=lat,lon` i zapisane adresy |
| Za dużo naraz do 24:00 | kolejność ważności: karty 1–2 i trasa piesza → karta 3 → karta 4 → karta 5 → kafelki |
