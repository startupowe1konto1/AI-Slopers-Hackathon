# Specyfikacja: Warszawa w trybie kryzysowym

Stan na sobotę, 14:45. Wersja do budowy w 4 osoby, z subagentami Claude Code. Kontekst, dane i uzasadnienia są w [HANDOFF.md](../HANDOFF.md). Kolejność prac i zadania są w [PLAN.md](PLAN.md).

---

## 1. Cel i warunek sukcesu

Strona internetowa (PWA) dla mieszkańca Warszawy na czas ataku i blackoutu. Odpowiada na pytania Kasi (persona z handoffu, sekcja 3) i działa także bez sieci.

**Demo jest udane, gdy:**
1. Na jednym adresie widać, czy Kasia usłyszy syrenę normalnie i przy blackoucie, z krokami „co zrobić”.
2. Na mapie i w liście są najbliższe miejsca schronienia według PSP, wejścia do metra, AED, apteki, SOR i toalety, każde ze źródłem i datą.
3. Dla zapisanych adresów widać odległość i czas pieszo oraz autobusy z najbliższego przystanku.
4. Z siecią widać, co jeździ w okolicy, oraz wiatr. Bez sieci widać ostatni stan z godziną.
5. Po wyłączeniu Wi-Fi i odświeżeniu strona dalej działa (punkty 1–3 w całości, punkt 4 jako „stan na …”).

**Forma demo:** strona w przeglądarce na laptopie, w widoku telefonu. Nie budujemy i nie testujemy wersji na telefon.

**Dwa linki w prezentacji (pptx):**
- `https://<app>.pages.dev/`: pełna wersja.
- `https://<app>.pages.dev/?offline=1`: ta sama aplikacja z wymuszonym trybem offline (tylko paczka, „stan na …”).

## 2. Zakres

**Robimy (wszystko P0, w kolejności z PLAN.md):**

| Moduł | Funkcja |
|---|---|
| `syreny` | klasa słyszalności syreny pod adresem: normalnie i tylko syreny cyfrowe (blackout); kroki: Alert RCB, RSO, umowa z sąsiadem, karta do wydruku |
| `adresy` | wyszukiwanie adresu offline w 126 923 punktach adresowych (bez GPS) |
| `punkty` | 6 rodzajów punktów na mapie i lista „najbliższe”; przycisk „Otwórz w aplikacji PSP” (`gdziesieukryc.pl/?lat=…&lng=…`) |
| `transport` | wersja minimalna: dla każdej pary zapisanych adresów odległość, czas pieszo i rowerem oraz linie autobusowe z przystanku najbliższego startu, które zatrzymują się nie dalej niż 500 m od celu (bez przesiadek) |
| `live` | pozycje autobusów i tramwajów w okolicy, wiatr; w etapie dobudowy: strefa dymu, Veturilo, utrudnienia |
| `app` / `offline` | onboarding (do 4 adresów: dom, praca, przedszkole, bliska osoba), pobranie paczki, mapa offline, wskaźnik sieci, tryb `?offline=1` |

**Nie robimy (świadomie):** konta i logowanie, powiadomienia push, ogłaszanie alarmów, miejsca uderzeń na żywo, wyznaczanie tras z dowolnego miejsca offline, konsola dla miasta, aplikacja ze sklepu.

## 3. Stos

| Warstwa | Wybór |
|---|---|
| Frontend | Vite, React, TypeScript, `vite-plugin-pwa` (Workbox) |
| Mapa | MapLibre GL JS, `pmtiles`, `@protomaps/basemaps` (styl), fonty i ikony mapy lokalnie w `public/map/` |
| Przechowywanie | paczka danych: Cache Storage przez service worker; mapa: plik `warszawa.pmtiles` w OPFS, czytany przez `FileSource`; adresy użytkownika: IndexedDB (`idb-keyval`) |
| Najbliższe punkty | liczone w przeglądarce (`kdbush` + `geokdbush`) |
| Dane | Python, `uv`, skrypty w `pipeline/`, wynik w `public/pack/` |
| Proxy na żywo | czyste funkcje w `server/live/` (TypeScript), adapter Cloudflare Pages Functions w `functions/`, w `vite dev` middleware; klucz w zmiennej `WARSAW_API_TOKEN` |
| Testy | Vitest (logika i walidacja paczki), Playwright (ścieżka Kasi z trybem offline) |
| Hosting | Cloudflare Pages, podgląd dla każdego PR, wdrożenie z `main`. Vercel odpada: darmowy plan blokuje wdrożenia z commitów współpracowników |

Wszystkie zależności npm instaluje O1 w szkielecie. Nowa zależność wchodzi tylko PR-em „kontrakt”.

## 4. Architektura

```
pipeline/<moduł>/*.py  (laptop, uv)
   └─> public/pack/<moduł>/*.json + meta.json
          └─> pipeline/build_manifest.py ─> public/pack/manifest.json
public/map/warszawa.pmtiles (+ fonty, ikony)

Przeglądarka:
  service worker: precache aplikacji; /pack/** CacheFirst; /api/live/** NetworkFirst
  „Pobierz paczkę”: pobiera wszystkie pliki z manifestu + pmtiles do OPFS
  moduły czytają dane tylko przez funkcje z własnego modułu i typy z contracts.ts

functions/api/live/[nazwa].ts (Cloudflare) → server/live/*.ts ─> dane.um.warszawa.pl (POST, nagłówek Authorization), Veturilo GBFS
   cache odpowiedzi 15–30 s; klucz nigdy nie trafia do przeglądarki
```

**Tryb offline:** hook `useSiec()` zwraca `online: false`, gdy przeglądarka nie ma sieci albo adres zawiera `?offline=1`. Moduł `live` pokazuje wtedy ostatni zapisany `StanLive` z `stanNa`.

## 5. Kontrakty (`src/contracts.ts`)

Szkielet zawiera dokładnie ten plik. Zmiana tylko PR-em „kontrakt”, który przegląda O1.

```ts
export type Wsp = { lat: number; lon: number };

export type Adres = Wsp & {
  id: string;          // ID punktu adresowego z WFS
  ulica: string;       // „ul. Czwartaków”
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
  zrodlo: string;      // klucz w Manifest.zrodla
};

export type KlasaSyreny = '75+' | '70-75' | '65-70' | 'ponizej_65';
export type WynikSyreny = { adresId: string; normalnie: KlasaSyreny; blackout: KlasaSyreny };

export type TrasaMin = {
  z: RolaMiejsca; do: RolaMiejsca;
  dystansM: number; pieszoMin: number; rowerMin: number;
  autobusy: { przystanek: string; odlegloscM: number; linie: string[] }[];
};

export type StanLive<T> = { dane: T; stanNa: string; zrodlo: string; zCache: boolean };
export type Pojazd = Wsp & { linia: string; typ: 'autobus' | 'tramwaj'; czas: string };
export type Wiatr = Wsp & { stacja: string; kierunekDeg: number; predkoscMs: number; czas: string };

export type Zrodlo = { nazwa: string; licencja: string; url: string; pobrano: string };
export type Manifest = {
  wersja: string; zbudowano: string;
  pliki: { sciezka: string; bajty: number; modul: string }[];
  zrodla: Record<string, Zrodlo>;
};

// Rejestracja modułu w src/modules/index.ts
export type ModulProps = { miejsca: MiejsceUzytkownika[]; wybrane: Wsp | null; online: boolean };
export type Modul = {
  id: 'syreny' | 'punkty' | 'transport' | 'live';
  nazwa: string;
  Panel: (p: ModulProps) => import('react').ReactElement;
  dodajWarstwy?: (map: import('maplibre-gl').Map) => () => void; // zwraca sprzątanie
};
```

**Interfejsy między modułami** (publiczne funkcje, reszta jest wewnętrzna):
- `src/modules/adresy/index.ts`: `znajdzAdres(q: string, limit?: number): Promise<Adres[]>`. Używa go onboarding (O1). Do czasu scalenia działa wersja z 20 adresami testowymi.
- `src/modules/syreny/index.ts`: `wynikSyreny(adresId: string): Promise<WynikSyreny | null>`.
- `src/modules/punkty/index.ts`: `najblizsze(wsp: Wsp, rodzaj: RodzajPunktu, n: number): Promise<Punkt[]>`.
- `src/offline/siec.ts`: `useSiec(): { online: boolean; wymuszonyOffline: boolean }`.
- `src/app/miejsca.ts`: `useMiejsca(): { miejsca: MiejsceUzytkownika[]; gotowe: boolean }` (`gotowe` = odczytano IndexedDB).

Format plików w `public/pack/<moduł>/` ustala właściciel modułu. Każdy folder ma `meta.json`: `{ modul, rekordy, zrodla: Record<string, Zrodlo> }`.

## 6. Dane

| Moduł | Źródło | Stan |
|---|---|---|
| adresy | WFS `wfs:PUNKTY_ADRESOWE_WGS84` | pobrane: `dane/adresy/punkty_adresowe_wgs84.csv` (126 923) |
| syreny | SOIA `coverage_ranges` (65/70/75 dB, typ syreny) | w repo: `dane/soia-warszawa/` |
| punkty | PSP (CSV, 8006, poza gitem), WFS `wfs:METRO_WEJSCIA`, `wfs:APTEKI`, portal: `get_scb_lokalizacja_defibrylatorow` (710), `get_m_toalety` (695), SOR z dane.gov.pl (zbiór 1642) | PSP lokalnie; reszta do pobrania |
| transport | GTFS `mkuran.pl/gtfs/warsaw.zip` (autobusy, `route_type` 3) | do pobrania |
| live | portal: `get_ztm_lokalizacja_pojazdow` (`type` 1 i 2), `get_zom_pogoda`, `get_bopipk_monitoring_jakosci_powietrza`, `get_bin_utrudnienia_drogowe`; Veturilo `gbfs.nextbike.net/maps/gbfs/v2/nextbike_vw/gbfs.json` | API działa (sprawdzone 14:20) |
| mapa | `build.protomaps.com/20261017.pmtiles`, wycięty do bbox Warszawy, zoom do 13 (limit 25 MiB na plik w Cloudflare Pages) | do wycięcia |

**Zasady danych:**
- Aplikacja nigdy nie pyta WFS na żywo. Wszystkie warstwy WFS pobieramy raz do `dane/`.
- Surowy eksport PSP nie trafia do gita. Do repo trafia tylko przetworzony plik paczki.
- Każdy punkt ma źródło, a manifest ma datę pobrania.
- Pierwsze zapytanie do każdego źródła zapisuje próbkę do `dane/probki/`. Parser piszemy na podstawie próbki, nie z pamięci.
- Pliki dokumentacji API mają BOM. Czytamy je z kodowaniem `utf-8-sig`.

## 7. Zasady treści (bezpieczeństwo)

- Mówimy „miejsca schronienia według PSP”, nigdy „schrony”.
- Aplikacja nie ogłasza alarmów. Wynik syreny pokazuje kroki, które pomagają upewnić się, że alarm do kogoś dotrze.
- Wynik syreny zawsze ma dopisek: „model dźwięku na zewnątrz” i „przy blackoucie: jeśli syreny analogowe nie mają zasilania awaryjnego”.
- Nie pokazujemy miejsc uderzeń. Dym to kierunek wiatru i pomiar powietrza, a nie model skażenia.
- Atrybucje w stopce i w „O danych”: KG PSP SOIA 2026.05 (CC BY 4.0, pełne oznaczenie z `dane/soia-warszawa/README.md`), m.st. Warszawa (CC BY), OpenStreetMap i Protomaps (ODbL), PSP gdziesieukryc.pl (za zgodą).

## 8. Stany i błędy

Każdy panel obsługuje cztery stany, nigdy nie pokazuje pustego ekranu:

| Stan | Co widzi mieszkaniec |
|---|---|
| ładowanie | szkielet panelu |
| brak sieci | dane z paczki lub ostatni stan z „stan na HH:MM” |
| brak danych | „Brak danych dla tego miejsca” i źródło, które sprawdziliśmy |
| błąd źródła | „Źródło chwilowo niedostępne”, ostatni zapisany stan, jeśli jest |

Proxy rozróżnia timeout, błąd schematu oraz „zły klucz lub usługa niedostępna” (portal w obu przypadkach zwraca 500, a nie 401) i zapisuje rodzaj błędu w logu serwera bez klucza.

## 9. Praca zespołu i gałęzie

**Właściciele folderów** (subagent pisze tylko w folderach swojej osoby):

| Osoba | Foldery |
|---|---|
| O1 Szkielet i offline | `src/app/`, `src/map/`, `src/offline/`, `src/contracts.ts`, `src/modules/index.ts`, `public/map/`, `vite.config.ts`, `package.json`, `.github/`, `CLAUDE.md`, `tests/e2e/` |
| O2 Syreny, adresy, transport | `src/modules/{syreny,adresy,transport}/`, `pipeline/{syreny,adresy,transport}/`, `public/pack/{syreny,adresy,transport}/`, `pipeline/pyproject.toml` |
| O3 Punkty pomocy | `src/modules/punkty/`, `pipeline/punkty/`, `public/pack/punkty/` |
| O4 Na żywo i prezentacja | `src/modules/live/`, `server/`, `functions/`, `docs/pitch/`, `docs/DOKUMENTACJA.md`, prezentacja `.pptx` |

`pipeline/build_manifest.py` i `pipeline/validate.py` należą do O2. `docs/AI_USAGE.md` uzupełnia każdy.

**Gałęzie:**
- `main` jest zawsze do pokazania. Wdraża się automatycznie na Cloudflare Pages.
- Każdy pas to gałąź `<osoba>/<pas>-<temat>`, np. `o2/b-syreny-pipeline`, w osobnym `git worktree`.
- PR do `main`: rebase na aktualny `main`, zielone CI, sprawdzony podgląd Cloudflare, scalenie przez squash.
- PR „kontrakt” (zmiana pliku spoza własnych folderów) jest mały, osobny, oznaczony w tytule `[kontrakt]` i przeglądany przez O1.
- Pas C (dobudowa) scala do `main` dopiero, gdy pasy A i B tej osoby są na `main`.
- Integracja o każdej pełnej godzinie: każdy scala to, co ma zielone; integrator (subagent O1) uruchamia Playwright na `main` i zgłasza błędy na kanale zespołu.

**CI (GitHub Actions, każdy PR):** `npm ci`, `npm run typecheck`, `npm test`, `npm run build`, `uv run pipeline/validate.py`.

## 10. Testy

- **Vitest:** wyszukiwanie adresu (polskie znaki, „al.” i „ul.”, numer z literą), klasy syren dla 3 znanych adresów, najbliższe punkty (kolejność, odległość), parser odpowiedzi API dla każdego źródła na zapisanej próbce.
- **validate.py:** każdy plik z manifestu istnieje, ma rekordy i źródło; współrzędne mieszczą się w bbox Warszawy (20.85–21.28, 52.09–52.37).
- **Playwright (ścieżka Kasi):** onboarding 4 adresów → wynik syreny → najbliższe punkty → transport → warstwa live → przełączenie w offline (`context.setOffline(true)`) i odświeżenie → punkty 1–3 nadal działają, live pokazuje „stan na”.

## 11. Prezentacja i dokumentacja (do oddania)

- **Prezentacja `.pptx`**, 5 minut: Kijów → Kasia i jej trzy pytania → demo (najpierw live, potem wyłączenie Wi-Fi) → dowód z danych o syrenach → dane miasta i PSP → wdrożenie i następne kroki. Na slajdzie końcowym dwa linki (pełna wersja i `?offline=1`) oraz link do repo.
- **Zapasowe nagranie** demo (wideo) na wypadek braku sieci na sali.
- **`docs/DOKUMENTACJA.md`:** wykorzystane dane miejskie (lista zbiorów), założenia i ograniczenia (syreny, dym, PSP), frameworki i narzędzia, użycie AI (`docs/AI_USAGE.md`), atrybucje.
- **README** z linkami i instrukcją uruchomienia.

## 12. Ryzyka

| Ryzyko | Sygnał | Plan B |
|---|---|---|
| Mapa offline (`pmtiles` w OPFS) | spike nie działa do 16:30 | offline: prosty podkład z WFS (granice dzielnic, ulice) + punkty; mapa wektorowa tylko online |
| Plik `pmtiles` powyżej 25 MiB | błąd wdrożenia Cloudflare Pages | węższy bbox albo plik na Cloudflare R2 |
| WFS niestabilny | timeout | jedna kopia danych na starcie, aplikacja nie zależy od WFS |
| Konflikty `package.json` przy 10 strumieniach | czerwone CI po scaleniu | zależności tylko w szkielecie i PR „kontrakt” |
| API na żywo na sali | 500 lub brak sieci | cache proxy, „stan na …”, nagrane wideo |
| GTFS (źródło nieoficjalne) | brak pliku lub złe dane | najbliższy przystanek i jego linie z API portalu |
| Zmęczenie po północy | błędy na `main` | wszystkie funkcje gotowe o 24:00, potem tylko poprawki |
