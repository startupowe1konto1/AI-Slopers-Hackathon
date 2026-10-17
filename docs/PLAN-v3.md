# Plan v3: ekran „Twoja sytuacja”

> **Dla agentów:** zadania wykonujesz subagentami, jedno zadanie = jeden świeży subagent w osobnym worktree (sekcja „Praca z subagentami”). Zalecany skill: `superpowers:subagent-driven-development`. Kroki mają pola `- [ ]` do odhaczania. Źródła: [HANDOFF-v3.md](../HANDOFF-v3.md) (co i dlaczego), [SPEC.md](SPEC.md) (dane, zasady treści §7, stany §8), [PLAN.md](PLAN.md) (zasady pracy, harmonogram nocny, oddanie F).

**Cel:** po wpisaniu adresu albo użyciu lokalizacji użytkownik od razu widzi pustą mapę i listę 5 kart z rekomendacjami dla swojego miejsca (syreny, miejsce schronienia, pomoc medyczna, powietrze, dotarcie do bliskich); kliknięcie karty pokazuje na mapie okręgi syren albo trasę pieszą. Wszystko działa też bez sieci.

**Architektura:** każdy moduł dostaje w `Modul` funkcję `wskazowki(kontekst) → Wskazowka[]` i opcjonalnie `kafelki`. Aplikacja (O1) zbiera karty ze wszystkich modułów, sortuje po `kolejnosc`, a po kliknięciu wykonuje pierwszą akcję karty (trasa albo rysunek na mapie). Trasy liczy `trasa()` z `src/offline/trasy.ts`: zapis w IndexedDB → OSRM przez nasze proxy `/api/live/trasa` → linia prosta.

**Stos:** bez zmian (Vite, React, TS, MapLibre, idb-keyval, Vitest, Playwright, Python + uv). Bez nowych zależności npm i Pythona.

## Ograniczenia globalne (obowiązują w każdym zadaniu)

- Wszystko z sekcji „Ograniczenia globalne” w [PLAN.md](PLAN.md) i z [CLAUDE.md](../CLAUDE.md).
- Typy wspólne tylko z `src/contracts.ts`. Zmienia je wyłącznie zadanie V1.
- Teksty: „miejsca schronienia według PSP”, nigdy „schrony”. Przy blackoucie zawsze „jeśli”. Nie ogłaszamy alarmów. Przy wyniku syren dopisek o modelu na zewnątrz i o założeniu blackoutu.
- Każda karta ma poziom: `ok` (zielony), `uwaga` (pomarańczowy), `alarm` (czerwony), `brak` (szary: brak danych albo błąd, z nazwą źródła). Moduł nigdy nie zwraca pustej listy zamiast karty: przy błędzie zwraca kartę `brak` z tekstem, co nie działa.
- Atrapa karty z V1 ma tekst dokładnie `Karta w budowie.` Po nim test e2e rozpoznaje kartę jeszcze nie zrobioną.
- `data-testid` karty: `karta-<id>`, gdzie `id` to `syreny`, `schronienie`, `medyczna`, `powietrze`, `bliscy`.
- Współrzędne w paczce w bbox Warszawy: lon 20.85–21.28, lat 52.09–52.37.

## Co ten plan zmienia względem HANDOFF-v3

| Miejsce | HANDOFF-v3 | Plan | Dlaczego |
|---|---|---|---|
| §5 adres proxy tras | `GET /api/trasa` | `GET /api/live/trasa` | Worker i `npm run dev` obsługują tylko `/api/live/<nazwa>` (rejestr `server/live/index.ts`). Inny adres wymagałby zmian w Workerze i w `vite.config.ts`. |
| §6 `Akcja` | `trasa`, `mapa`, `link` | dochodzi `przycisk` (etykieta + funkcja) | Karta do wydruku (S1) i „Widzę dym” (L2) nie są ani trasą, ani rysunkiem, ani linkiem. |
| §6 `Modul.Panel` | opcjonalny | zostaje wymagany | Panele zostają w repo, a App przestaje je pokazywać w V4. Dzięki temu V1 nie rusza paneli modułów. |
| §4 transport | ukryty | moduł zostaje w rejestrze | Niesie kartę 5 „Dotarcie do bliskich” (S3). Znika tylko jego panel „Dojazd”. |
| §3 okręgi syren | z modelu `przyblizenie.py` | promienie z parametrów w `public/pack/syreny/meta.json` | Te same parametry (A, B, poprawka) już są w paczce, nie trzeba liczyć rastrów od nowa. Karta mówi, że okręgi to przybliżenie bez budynków. |
| §2 odświeżanie paczki | pobiera albo odświeża | pobiera, gdy jej nie ma | Service worker trzyma `/pack/` jako CacheFirst, więc odświeżenie wymaga zmiany cache. Znane ograniczenie, poza zakresem. |
| §5 zapis tras na offline | na ekranie „Sprawdzam połączenie” | w tle, po wejściu na ekran główny | Około 50 zapytań do OSRM trwa kilka sekund. Ekran startowy nie może tyle czekać. |

## Kolejność i zależności

```
V1 kontrakt + atrapy (O1, 19:15–19:45) ── blokuje wszystko poniżej
 │
 ├─ O1: V2 lokalizacja ─┐                        ┌─ V5 kroki 5–6 (zapis tras w tle) ─ V6 e2e
 │       V5 kroki 1–4 ──┴─ V3 połączenie ─ V4 ekran główny ─┤
 ├─ O2: S1 karta Syreny ∥ S2 pipeline okręgów ∥ S3 karta bliskich  →  S2 frontend okręgów
 ├─ O3: P1 przychodnie OSM ∥ P2 karta schronienia ∥ P4 kafelki  →  P3 karta medyczna
 └─ O4: L1 proxy tras ∥ L2 karta powietrza ∥ L3 stacja z rowerami ∥ L4 pitch
```

- `∥` = osobne subagenty równolegle, każdy we własnym worktree. Pliki się nie pokrywają albo pokrywają się jedną linią w `index.tsx` modułu (konflikt do rozwiązania przy rebase).
- Karty modułów działają bez ekranu głównego O1: testujesz je testami jednostkowymi. Na ekranie zobaczysz je po scaleniu V4.
- `trasa()` z V1 od razu zwraca linię prostą, a `najblizszaStacjaZRowerami()` z V1 zwraca `null`. O2 i O3 nie czekają więc na L1, V5 ani L3.

## Harmonogram (z HANDOFF-v3 §8)

| Godzina | Co ma być prawdą | Kto sprawdza |
|---|---|---|
| 19:45 | V1 na `main`; każdy startuje swoje subagenty od `main` | O1 |
| 21:00 | każda karta pokazuje prawdziwe dane (testy jednostkowe zielone, PR otwarte); L1 na `main` | wszyscy |
| 22:30 | V4 na `main`: ekran główny z kartami i kafelkami; `npm run test:e2e` zielony | O1 |
| 23:30 | próba pitchu na nowym przepływie (L4) | O4 |
| **24:00** | **funkcje zamrożone**; dalej poprawki, wygląd, dokumentacja (PLAN.md, harmonogram nocny i sekcja F bez zmian) | wszyscy |

Jeśli brakuje czasu, kolejność ważności: karty 1–2 i trasa piesza (S1, P2, V4, V5, L1) → karta 3 (P1, P3) → karta 4 (L2) → karta 5 (S3, L3) → kafelki (P4) → okręgi syren (S2).

## Mapa plików v3

```
src/contracts.ts                    O1  V1: Trasa, Wskazowka, Akcja, Kafelek, nowe pola Modul
src/offline/trasy.ts                O1  V1 linia prosta; V5 cache → /api/live/trasa → linia prosta, zapis na offline
src/offline/polaczenie.ts           O1  V3 sprawdzenie sieci i API, pobranie paczki
src/app/lokalizacja.ts              O1  V2 GPS albo ?lokalizacja=lat,lon → miejsce „Tutaj”
src/app/Polaczenie.tsx              O1  V3 ekran „Sprawdzam połączenie…”
src/app/wskazowki.ts                O1  V4 zbieranie kart z modułów
src/app/akcje.ts                    O1  V4 etykiety i wykonanie akcji, opis trasy
src/app/Karty.tsx, Kafelki.tsx      O1  V4 lista „Twoja sytuacja”, rząd kafelków
src/map/trasaNaMapie.ts             O1  V4 warstwa trasy
src/modules/adresy/                 O2  V2 (PR [kontrakt]): najblizszyAdres()
src/modules/syreny/wskazowki.ts     O2  S1 karta Syreny; S2 akcja okręgów
src/modules/syreny/druk.tsx         O2  S1 druk karty jako akcja
src/modules/syreny/okregi.ts        O2  S2 okręgi 75/70/65 dB na mapie
pipeline/syreny/okregi.py           O2  S2 → public/pack/syreny/okregi.json
src/modules/transport/wskazowki.ts  O2  S3 karta Dotarcie do bliskich
pipeline/punkty/{pobierz,zrodla,build}.py  O3  P1 przychodnie z OSM
src/modules/punkty/wskazowki.ts     O3  P2 karta schronienia (+ P3 podpina kartę medyczną)
src/modules/punkty/medyczna.ts      O3  P3 karta Pomoc medyczna
src/modules/punkty/kafelki.ts       O3  P4 7 kafelków; warstwy.ts: warstwa jednego rodzaju
server/live/trasa.ts                O4  L1 proxy OSRM
src/modules/live/wskazowki.ts       O4  L2 karta Powietrze i wiatr
src/modules/live/rowery.ts          O4  L3 najblizszaStacjaZRowerami()
docs/pitch/, docs/DOKUMENTACJA.md   O4  L4 liczby syren i demo nowego przepływu
tests/e2e/kasia.spec.ts             O1  V4 karty zamiast menu; V6 pełna ścieżka demo
```

## Praca z subagentami

Każda osoba prowadzi jedną sesję Claude Code („koordynator pasa”), która uruchamia subagenty i przegląda ich wynik. Jedno zadanie (albo część zadania oznaczona w kolejności wyżej) = jeden subagent = jeden worktree = jedna gałąź = jeden PR.

**1. Worktree dla zadania** (koordynator, przed uruchomieniem subagenta):

```bash
git fetch origin && git worktree add ../ws-s1 -b o2/s1-karta-syreny origin/main
```

Nazwy gałęzi: `o1/v1-kontrakt`, `o2/s1-karta-syreny`, `o3/p1-przychodnie`, `o4/l1-proxy-tras` itd. W nowym worktree raz: `npm ci` (i `uv sync --project pipeline`, jeśli zadanie ma pipeline).

**2. Polecenie dla subagenta** (narzędzie Agent, `subagent_type: general-purpose`; jeden komunikat może uruchomić kilka subagentów naraz, jeśli zadania są oznaczone `∥`):

```
Pracujesz w katalogu ../ws-<id> nad zadaniem <ID> z docs/PLAN-v3.md.
Przeczytaj: CLAUDE.md, HANDOFF-v3.md §3 i §6, w docs/PLAN-v3.md sekcje „Ograniczenia globalne”
i całe zadanie <ID> (z „Interfejsami”). Piszesz tylko w plikach z sekcji „Pliki” tego zadania.
TDD: najpierw test, uruchom (ma być czerwony z opisanego powodu), potem kod, test zielony.
Kod z planu jest punktem wyjścia: jeśli nie pasuje do repo, popraw go i napisz dlaczego.
Na końcu: npm run typecheck && npm test && npm run build
(zadania z pipeline także: uv run --project pipeline pytest pipeline/<moduł> && uv run --project pipeline python pipeline/validate.py).
Gdy „Gotowe, gdy” spełnione: commit, git fetch && git rebase origin/main, ponownie testy, push,
gh pr create --title "<ID>: <opis>" --body "<co zrobione, jak sprawdzone>".
Klucz API tylko w .env, nigdy w kodzie, logach i odpowiedzi.
Zwróć: link do PR, wynik testów (ostatnie linie), czego nie zrobiłeś i dlaczego.
```

**3. Przegląd** (koordynator, przed scaleniem): przeczytaj diff PR, sprawdź „Gotowe, gdy”, uruchom testy w worktree. Popraw sam albo odeślij subagentowi uwagi (SendMessage do tego samego agenta). Po scaleniu: `git worktree remove ../ws-<id>`.

**4. Czego subagent nie robi:** nie zmienia `src/contracts.ts` (tylko V1), nie edytuje `src/modules/index.ts`, nie dodaje zależności, nie scala PR do `main` (scala koordynator po przeglądzie, zielone CI).

**5. Integracja:** o pełnych godzinach O1 uruchamia `npm run test:e2e` na `main` i zgłasza błędy na kanale zespołu (jak w PLAN.md).

---

## Pas O1: kontrakt, lokalizacja, połączenie, ekran główny, trasy

### V1. Kontrakt v3 i atrapy kart (19:15–19:45, blokuje resztę)

**Pliki:**
- Modyfikuj: `src/contracts.ts`
- Utwórz: `src/offline/trasy.ts`, `src/offline/trasy.test.ts`
- Modyfikuj (tylko atrapy): `src/modules/syreny/index.tsx`, `src/modules/punkty/index.tsx`, `src/modules/live/index.tsx`, `src/modules/transport/index.tsx`

**Interfejsy:**
- Produkuje typy: `Profil`, `Trasa`, `Poziom`, `Akcja`, `Wskazowka`, `KontekstWskazowek`, `Kafelek`; `Modul.wskazowki?`, `Modul.kafelki?`; `RolaMiejsca` z `'tutaj'`; `RodzajPunktu` z `'przychodnia'`.
- Produkuje: `trasaProsta(od: Wsp, do_: Wsp, profil: Profil): Trasa` i `trasa(od: Wsp, do_: Wsp, profil: Profil): Promise<Trasa>` w `src/offline/trasy.ts` (V1: zawsze linia prosta; V5 dokłada OSRM i zapis).
- Produkuje (atrapa O4): `najblizszaStacjaZRowerami(wsp: Wsp): Promise<{ nazwa: string; wsp: Wsp; rowery: number; odlegloscM: number } | null>` eksportowane z `src/modules/live/index.tsx` (V1 zwraca `null`, L3 podmienia).

- [ ] **Krok 1: test** `src/offline/trasy.test.ts`

```ts
import { expect, it } from 'vitest';
import { trasa, trasaProsta } from './trasy';

const A = { lat: 52.23, lon: 21.0 };
const B = { lat: 52.239, lon: 21.0 }; // ok. 1001 m na północ

it('trasa prosta: odległość w linii prostej, czas z mnożnikiem 1,3 (pieszo 5 km/h, rowerem 15 km/h)', () => {
  const p = trasaProsta(A, B, 'pieszo');
  expect(p.dystansM).toBeGreaterThan(990);
  expect(p.dystansM).toBeLessThan(1010);
  expect(p.czasMin).toBe(16); // 1001 * 1,3 / 83 = 15,7
  expect(trasaProsta(A, B, 'rower').czasMin).toBe(5); // 1001 * 1,3 / 250 = 5,2
  expect(p.linia).toEqual([[21.0, 52.23], [21.0, 52.239]]);
  expect(p).toMatchObject({ od: A, do: B, profil: 'pieszo', zrodlo: 'prosta' });
});

it('trasa trwa co najmniej minutę', () => {
  expect(trasaProsta(A, A, 'pieszo').czasMin).toBe(1);
});

it('trasa() w V1 zwraca linię prostą', async () => {
  expect((await trasa(A, B, 'rower')).zrodlo).toBe('prosta');
});
```

- [ ] **Krok 2:** `npx vitest run src/offline/trasy.test.ts` → FAIL („Failed to resolve import ./trasy”).

- [ ] **Krok 3: kontrakt** w `src/contracts.ts`. Zamień `RolaMiejsca`, `RodzajPunktu` i `Modul`, dopisz nowe typy pod `TrasaMin`:

```ts
export type RolaMiejsca = 'tutaj' | 'dom' | 'praca' | 'przedszkole' | 'bliska_osoba';
```

```ts
export type RodzajPunktu = 'schronienie_psp' | 'metro' | 'aed' | 'apteka' | 'sor' | 'toaleta' | 'przychodnia';
```

```ts
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
```

```ts
export type Modul = {
  id: 'syreny' | 'punkty' | 'transport' | 'live';
  nazwa: string;
  Panel: (p: ModulProps) => ReactElement; // od V4 aplikacja go nie pokazuje; zostaje w repo
  dodajWarstwy?: (map: MapLibreMap) => () => void; // zwraca sprzątanie
  wskazowki?: (k: KontekstWskazowek) => Promise<Wskazowka[]>;
  kafelki?: Kafelek[];
};
```

- [ ] **Krok 4: `src/offline/trasy.ts`**

```ts
import { distance } from 'geokdbush';
import type { Profil, Trasa, Wsp } from '../contracts';

// Szacunek bez sieci: droga ok. 1,3 razy dłuższa niż linia prosta, pieszo 5 km/h, rowerem 15 km/h
// (te same założenia co src/modules/transport/trasy.ts).
const KRETOSC = 1.3;
const M_NA_MIN: Record<Profil, number> = { pieszo: 83, rower: 250 };

export function trasaProsta(od: Wsp, do_: Wsp, profil: Profil): Trasa {
  const dystansM = Math.round(distance(od.lon, od.lat, do_.lon, do_.lat) * 1000);
  return {
    od,
    do: do_,
    profil,
    dystansM,
    czasMin: Math.max(1, Math.round((dystansM * KRETOSC) / M_NA_MIN[profil])),
    linia: [
      [od.lon, od.lat],
      [do_.lon, do_.lat],
    ],
    zrodlo: 'prosta',
  };
}

// V1: zawsze linia prosta. V5: zapis w IndexedDB → /api/live/trasa → linia prosta.
export async function trasa(od: Wsp, do_: Wsp, profil: Profil): Promise<Trasa> {
  return trasaProsta(od, do_, profil);
}
```

- [ ] **Krok 5:** `npx vitest run src/offline/trasy.test.ts` → PASS.

- [ ] **Krok 6: atrapy kart.** W każdym `index.tsx` dopisz do obiektu `modul` (reszta pliku bez zmian). Tekst atrapy dokładnie `Karta w budowie.`

`src/modules/syreny/index.tsx`:
```ts
  // Atrapa z V1. Prawdziwa karta: S1.
  wskazowki: async () => [
    { id: 'syreny', kolejnosc: 10, tytul: 'Syreny', poziom: 'brak', tekst: 'Karta w budowie.', akcje: [], zrodlo: 'atrapa' },
  ],
```

`src/modules/punkty/index.tsx`:
```ts
  // Atrapy z V1. Prawdziwe karty: P2, P3; kafelki: P4.
  wskazowki: async () => [
    { id: 'schronienie', kolejnosc: 20, tytul: 'Najbliższe miejsce schronienia według PSP', poziom: 'brak', tekst: 'Karta w budowie.', akcje: [], zrodlo: 'atrapa' },
    { id: 'medyczna', kolejnosc: 30, tytul: 'Pomoc medyczna', poziom: 'brak', tekst: 'Karta w budowie.', akcje: [], zrodlo: 'atrapa' },
  ],
  kafelki: [],
```

`src/modules/live/index.tsx`:
```ts
import type { Modul, Wsp } from '../../contracts';
// …
// Atrapa z V1 dla O2 (S3). Prawdziwa funkcja: L3.
export const najblizszaStacjaZRowerami = async (_wsp: Wsp): Promise<{ nazwa: string; wsp: Wsp; rowery: number; odlegloscM: number } | null> => null;
// … w obiekcie modul:
  // Atrapa z V1. Prawdziwa karta: L2.
  wskazowki: async () => [
    { id: 'powietrze', kolejnosc: 40, tytul: 'Powietrze i wiatr', poziom: 'brak', tekst: 'Karta w budowie.', akcje: [], zrodlo: 'atrapa' },
  ],
```

`src/modules/transport/index.tsx`:
```ts
  // Atrapa z V1. Prawdziwa karta: S3. Moduł zostaje w rejestrze, bo niesie kartę 5.
  wskazowki: async () => [
    { id: 'bliscy', kolejnosc: 50, tytul: 'Dotarcie do bliskich', poziom: 'brak', tekst: 'Karta w budowie.', akcje: [], zrodlo: 'atrapa' },
  ],
```

- [ ] **Krok 7:** `npm run typecheck && npm test && npm run build` → zielone (nowe człony unii nie psują istniejących `switch`/`Record`: sprawdzone `grep`, żaden plik nie robi `Record<RolaMiejsca|RodzajPunktu, …>`).
- [ ] **Krok 8: PR** `[kontrakt] V1: karty, trasy, kafelki`. Po scaleniu napisz na kanale: „V1 na main, startujcie od origin/main”.

**Gotowe, gdy:** typy z HANDOFF-v3 §6 (z poprawkami z tabeli na początku planu) są w `src/contracts.ts`, każdy moduł zwraca atrapę swoich kart, `trasa()` zwraca linię prostą, CI zielone.

---

### V2. „Użyj mojej lokalizacji” (po V1)

Dwa PR-y: V2a w folderze O2 (mały `[kontrakt]`, O2 tylko akceptuje), V2b w folderach O1.

**Pliki:**
- V2a: modyfikuj `src/modules/adresy/szukaj.ts`, `src/modules/adresy/index.ts`; utwórz `src/modules/adresy/najblizszy.test.ts`
- V2b: utwórz `src/app/lokalizacja.ts`, `src/app/lokalizacja.test.ts`; modyfikuj `src/app/Onboarding.tsx`, `src/app/App.tsx`, `src/index.css`

**Interfejsy:**
- Produkuje (V2a): `najblizszyAdres(w: Wsp): Promise<Adres | null>` z `src/modules/adresy` (null = dalej niż 1 km od jakiegokolwiek adresu, czyli poza Warszawą).
- Produkuje (V2b): `miejsceTutaj(): Promise<MiejsceUzytkownika>` (rola `'tutaj'`, etykieta `'Tutaj'`), `zTutaj(miejsca, tutaj)`, parametr `?lokalizacja=lat,lon`.

- [ ] **Krok 1 (V2a): test** `src/modules/adresy/najblizszy.test.ts`

```ts
import { expect, it } from 'vitest';
import { najblizszyIndeks, type PaczkaAdresow } from './szukaj';

const p: PaczkaAdresow = {
  ulice: ['Grochowska'], dzielnice: ['Praga-Południe'], id: ['a', 'b'], u: [0, 0], nr: ['200', '10'], dz: [0, 0],
  lat: [52.2457, 52.25], lon: [21.0874, 21.06],
};

it('zwraca indeks najbliższego adresu', () => {
  expect(najblizszyIndeks(p, { lat: 52.2458, lon: 21.0875 })).toBe(0);
  expect(najblizszyIndeks(p, { lat: 52.2499, lon: 21.0601 })).toBe(1);
});

it('dalej niż 1 km od każdego adresu (poza Warszawą) zwraca -1', () => {
  expect(najblizszyIndeks(p, { lat: 52.4, lon: 21.0874 })).toBe(-1);
});
```

- [ ] **Krok 2:** FAIL („najblizszyIndeks is not a function”). **Krok 3:** w `szukaj.ts` zmień import na `import type { Adres, Wsp } from '../../contracts';` i dopisz:

```ts
// Najbliższy punkt adresowy w rzucie równoodległościowym (wystarcza w skali miasta) albo -1, gdy dalej niż maksM.
export function najblizszyIndeks(p: PaczkaAdresow, w: Wsp, maksM = 1000): number {
  const kx = Math.cos((w.lat * Math.PI) / 180);
  let naj = -1;
  let najD = Infinity;
  for (let i = 0; i < p.lat.length; i++) {
    const dx = (p.lon[i] - w.lon) * kx;
    const dy = p.lat[i] - w.lat;
    const d = dx * dx + dy * dy;
    if (d < najD) {
      najD = d;
      naj = i;
    }
  }
  return naj >= 0 && Math.sqrt(najD) * 111_195 <= maksM ? naj : -1;
}
```

W `index.ts` zmień import na `import type { Adres, Wsp } from '../../contracts';`, rozszerz import z `./szukaj` o `najblizszyIndeks` i dopisz:

```ts
// Adres najbliższy współrzędnym z GPS (karta „Tutaj”) albo null poza Warszawą.
export async function najblizszyAdres(w: Wsp): Promise<Adres | null> {
  const p = await wczytaj();
  const i = najblizszyIndeks(p, w);
  return i < 0 ? null : adres(p, i);
}
```

- [ ] **Krok 4:** PASS → PR `[kontrakt] V2a: najblizszyAdres w module adresy` (przegląda O2).

- [ ] **Krok 5 (V2b): test** `src/app/lokalizacja.test.ts`

```ts
import { expect, it } from 'vitest';
import type { MiejsceUzytkownika } from '../contracts';
import { lokalizacjaZAdresu, zTutaj } from './lokalizacja';

it('czyta ?lokalizacja=lat,lon (demo i testy)', () => {
  expect(lokalizacjaZAdresu('?lokalizacja=52.2297,21.0122')).toEqual({ lat: 52.2297, lon: 21.0122 });
  expect(lokalizacjaZAdresu('?lokalizacja=abc')).toBeNull();
  expect(lokalizacjaZAdresu('?offline=1')).toBeNull();
});

const adres = { id: '1', ulica: 'Grochowska', numer: '200', dzielnica: 'Praga-Południe', lat: 52.2457, lon: 21.0874 };

it('„Tutaj” trafia na początek listy i zastępuje poprzednią lokalizację', () => {
  const dom: MiejsceUzytkownika = { rola: 'dom', etykieta: 'Dom', adres };
  const stare: MiejsceUzytkownika = { rola: 'tutaj', etykieta: 'Tutaj', adres };
  const nowe: MiejsceUzytkownika = { ...stare, adres: { ...adres, id: '2' } };
  expect(zTutaj([dom, stare], nowe)).toEqual([nowe, dom]);
});
```

- [ ] **Krok 6:** FAIL → **Krok 7: `src/app/lokalizacja.ts`**

```ts
import type { MiejsceUzytkownika, Wsp } from '../contracts';
import { najblizszyAdres } from '../modules/adresy';

// ?lokalizacja=52.2297,21.0122 (lat,lon) zastępuje GPS na demo i w testach e2e.
export function lokalizacjaZAdresu(search: string): Wsp | null {
  const v = new URLSearchParams(search).get('lokalizacja')?.split(',').map(Number);
  return v && v.length === 2 && v.every(Number.isFinite) ? { lat: v[0], lon: v[1] } : null;
}

function gps(): Promise<Wsp> {
  return new Promise((ok, blad) => {
    if (!navigator.geolocation) return blad(new Error('Ta przeglądarka nie udostępnia lokalizacji. Wpisz adres.'));
    navigator.geolocation.getCurrentPosition(
      (p) => ok({ lat: p.coords.latitude, lon: p.coords.longitude }),
      (e) => blad(new Error(e.code === 1 ? 'Brak zgody na lokalizację. Wpisz adres.' : 'Nie udało się ustalić lokalizacji. Wpisz adres.')),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  });
}

// „Tutaj” = najbliższy punkt adresowy z paczki, więc syreny i punkty liczą się jak dla wpisanego adresu.
export async function miejsceTutaj(): Promise<MiejsceUzytkownika> {
  const wsp = lokalizacjaZAdresu(location.search) ?? (await gps());
  const adres = await najblizszyAdres(wsp);
  if (!adres) throw new Error('Jesteś poza Warszawą albo daleko od adresu z naszej paczki. Wpisz adres.');
  return { rola: 'tutaj', etykieta: 'Tutaj', adres };
}

export function zTutaj(miejsca: MiejsceUzytkownika[], tutaj: MiejsceUzytkownika): MiejsceUzytkownika[] {
  return [tutaj, ...miejsca.filter((m) => m.rola !== 'tutaj')];
}
```

- [ ] **Krok 8:** PASS. **Krok 9: `Onboarding.tsx`.** Importy: `import { miejsceTutaj, zTutaj } from './lokalizacja';`. W `Onboarding` dodaj stan i obsługę, a `zapisz` ma zachować wcześniejsze „Tutaj”:

```tsx
  const [lokalizacja, setLokalizacja] = useState<string | null>(null);

  const zapisz = async () => {
    const miejsca = ROLE.flatMap(({ rola, etykieta }) => {
      const adres = wybor[rola];
      return adres ? [{ rola, etykieta, adres }] : [];
    });
    const tutaj = poczatkowe.find((m) => m.rola === 'tutaj');
    await zapiszMiejsca(tutaj ? zTutaj(miejsca, tutaj) : miejsca);
    onGotowe();
  };

  const uzyjLokalizacji = async () => {
    setLokalizacja('Ustalam lokalizację…');
    try {
      const tutaj = await miejsceTutaj();
      const wpisane = ROLE.flatMap(({ rola, etykieta }) => (wybor[rola] ? [{ rola, etykieta, adres: wybor[rola]! }] : []));
      await zapiszMiejsca(zTutaj(wpisane, tutaj));
      onGotowe();
    } catch (e) {
      setLokalizacja(e instanceof Error ? e.message : 'Nie udało się ustalić lokalizacji. Wpisz adres.');
    }
  };
```

Nad polami adresów (pod akapitem „Adresy zostają tylko w tej przeglądarce…”):

```tsx
      <button className="przycisk" onClick={uzyjLokalizacji} disabled={lokalizacja === 'Ustalam lokalizację…'}>
        Użyj mojej lokalizacji
      </button>
      {lokalizacja && <p role="status" className="onboarding-lokalizacja">{lokalizacja}</p>}
      <p className="onboarding-albo">albo wpisz adresy</p>
```

- [ ] **Krok 10: przycisk „Tutaj” w pasku** (`App.tsx`). Importy: `zapiszMiejsca` z `./miejsca`, `miejsceTutaj, zTutaj` z `./lokalizacja`. Stan i funkcja przed `if (!gotowe)`:

```tsx
  const [bladLokalizacji, setBladLokalizacji] = useState<string | null>(null);
  const tutaj = async () => {
    try {
      await zapiszMiejsca(zTutaj(miejsca, await miejsceTutaj()));
      setRola('tutaj');
      setBladLokalizacji(null);
    } catch (e) {
      setBladLokalizacji(e instanceof Error ? e.message : 'Nie udało się ustalić lokalizacji.');
    }
  };
```

W `<header className="pasek">` przed przyciskiem „Adresy”; komunikat błędu na końcu paska:

```tsx
        <button className="pasek-przycisk" onClick={tutaj} aria-label="Użyj mojej lokalizacji">
          Tutaj
        </button>
        {/* … przycisk Adresy (zmień style={…} na className="pasek-przycisk") i status sieci … */}
        {bladLokalizacji && <p className="pasek-blad" role="alert">{bladLokalizacji}</p>}
```

`src/index.css`:

```css
.pasek { flex-wrap: wrap; }
.pasek-przycisk { font-size: 13px; padding: 6px 10px; min-height: 36px; border: 1px solid var(--linia); border-radius: 8px; background: #fff; }
.pasek-blad { flex-basis: 100%; margin: 0; font-size: 13px; color: var(--akcent); }
.onboarding-lokalizacja { font-size: 13px; margin: 8px 0 0 !important; }
.onboarding-albo { text-align: center; font-size: 13px; margin: 14px 0 10px !important; }
```

- [ ] **Krok 11: sprawdzenie ręczne** (`npm run dev`): `/?lokalizacja=52.2457,21.0874` → „Użyj mojej lokalizacji” → w pasku „Tutaj: Grochowska 200”. `/?lokalizacja=52.5,21.0` → komunikat „Jesteś poza Warszawą…”.
- [ ] **Krok 12: PR** `V2: użyj mojej lokalizacji` (po scaleniu V2a).

**Gotowe, gdy:** przycisk działa z GPS i z `?lokalizacja=`, „Tutaj” jest na liście miejsc w pasku, zapis adresów nie gubi „Tutaj”, poza Warszawą jest komunikat zamiast pustego ekranu.

---

### V3. Ekran „Sprawdzam połączenie…” (po V2)

**Pliki:**
- Utwórz: `src/offline/polaczenie.ts`, `src/offline/polaczenie.test.ts`, `src/app/Polaczenie.tsx`, `src/app/Polaczenie.test.tsx`
- Modyfikuj: `src/app/App.tsx`, `src/index.css`

**Interfejsy:**
- Produkuje: `sprawdzPolaczenie(f?: typeof fetch, limitMs?: number): Promise<{ siec: boolean; api: boolean }>`, `przygotuj(onPostep: (tekst: string) => void): Promise<Przygotowanie>`, `type Przygotowanie = { siec: boolean; api: boolean; paczka: { wersja: string; zbudowano: string } | null }`.
- Używa: `stanPaczki()`, `pobierzPaczke()` z `src/offline/paczka.ts`; `wymuszonyOffline()` z `src/offline/siec.ts`.

- [ ] **Krok 1: test** `src/offline/polaczenie.test.ts`

```ts
import { afterEach, expect, it, vi } from 'vitest';

vi.mock('./paczka', () => ({ stanPaczki: vi.fn(), pobierzPaczke: vi.fn() }));
import { pobierzPaczke, stanPaczki } from './paczka';
import { przygotuj, sprawdzPolaczenie } from './polaczenie';

const PACZKA = { wersja: 'x', zbudowano: '2026-10-17T18:00:00Z' };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  history.replaceState(null, '', '/');
});

it('200 z /api/live/wiatr: sieć i API działają', async () => {
  expect(await sprawdzPolaczenie(async () => Response.json([]))).toEqual({ siec: true, api: true });
});

it('502 z proxy: sieć jest, dane miasta nie', async () => {
  expect(await sprawdzPolaczenie(async () => Response.json({ blad: 'timeout' }, { status: 502 }))).toEqual({ siec: true, api: false });
});

it('błąd sieci albo limit czasu: offline', async () => {
  const f = async () => {
    throw new TypeError('fetch failed');
  };
  expect(await sprawdzPolaczenie(f)).toEqual({ siec: false, api: false });
});

it('?offline=1: nie pyta sieci', async () => {
  history.replaceState(null, '', '/?offline=1');
  const f = vi.fn();
  expect(await sprawdzPolaczenie(f)).toEqual({ siec: false, api: false });
  expect(f).not.toHaveBeenCalled();
});

it('online bez paczki: pobiera paczkę i opisuje postęp', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => Response.json([])));
  vi.mocked(stanPaczki).mockResolvedValueOnce(null).mockResolvedValueOnce(PACZKA);
  vi.mocked(pobierzPaczke).mockImplementation(async (f) => {
    f(1, 2);
    f(2, 2);
  });
  const postep = vi.fn();
  expect(await przygotuj(postep)).toEqual({ siec: true, api: true, paczka: PACZKA });
  expect(postep).toHaveBeenLastCalledWith('Jest połączenie. Pobieram paczkę offline: 2 z 2');
});

it('offline z paczką: nie pobiera', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => {
    throw new TypeError('fetch failed');
  }));
  vi.mocked(stanPaczki).mockResolvedValue(PACZKA);
  expect(await przygotuj(() => {})).toEqual({ siec: false, api: false, paczka: PACZKA });
  expect(pobierzPaczke).not.toHaveBeenCalled();
});

it('dwa wywołania naraz (StrictMode): jedno sprawdzenie i jedno pobranie', async () => {
  const f = vi.fn(async () => Response.json([]));
  vi.stubGlobal('fetch', f);
  vi.mocked(stanPaczki).mockResolvedValue(null);
  vi.mocked(pobierzPaczke).mockResolvedValue(undefined);
  await Promise.all([przygotuj(() => {}), przygotuj(() => {})]);
  expect(f).toHaveBeenCalledTimes(1);
  expect(pobierzPaczke).toHaveBeenCalledTimes(1);
});
```

- [ ] **Krok 2:** FAIL → **Krok 3: `src/offline/polaczenie.ts`**

```ts
import { pobierzPaczke, stanPaczki } from './paczka';
import { wymuszonyOffline } from './siec';

export type WynikPolaczenia = { siec: boolean; api: boolean };
export type Przygotowanie = WynikPolaczenia & { paczka: { wersja: string; zbudowano: string } | null };

// Sieć = nasz serwer odpowiedział czymkolwiek. API = /api/live/wiatr zwróciło dane (klucz i portal miasta działają).
export async function sprawdzPolaczenie(f: typeof fetch = fetch, limitMs = 4000): Promise<WynikPolaczenia> {
  if (wymuszonyOffline()) return { siec: false, api: false };
  try {
    const r = await f('/api/live/wiatr', { signal: AbortSignal.timeout(limitMs), cache: 'no-store' });
    return { siec: true, api: r.ok };
  } catch {
    return { siec: false, api: false };
  }
}

// Jedno przygotowanie naraz (StrictMode uruchamia efekt dwa razy); postęp trafia do ostatniego słuchacza.
let wTrakcie: Promise<Przygotowanie> | null = null;
let postep: (tekst: string) => void = () => {};

export function przygotuj(onPostep: (tekst: string) => void): Promise<Przygotowanie> {
  postep = onPostep;
  wTrakcie ??= (async () => {
    const w = await sprawdzPolaczenie();
    let paczka = await stanPaczki();
    if (w.siec && !paczka) {
      try {
        await pobierzPaczke((z, n) => postep(`Jest połączenie. Pobieram paczkę offline: ${z} z ${n}`));
        paczka = await stanPaczki();
      } catch {
        // bez paczki aplikacja działa online; spróbujemy przy następnym uruchomieniu
      }
    }
    return { ...w, paczka };
  })().finally(() => {
    wTrakcie = null;
  });
  return wTrakcie;
}
```

- [ ] **Krok 4:** PASS. **Krok 5: test opisu** `src/app/Polaczenie.test.tsx`

```tsx
import { expect, it } from 'vitest';
import { opisPrzygotowania } from './Polaczenie';

const paczka = { wersja: 'x', zbudowano: '2026-10-17T16:16:00Z' };

it('opisuje każdy wynik sprawdzenia', () => {
  expect(opisPrzygotowania({ siec: true, api: true, paczka })).toBe('Jest połączenie. Dane na żywo włączone.');
  expect(opisPrzygotowania({ siec: true, api: false, paczka })).toMatch(/dane miasta na żywo chwilowo nie odpowiadają/);
  expect(opisPrzygotowania({ siec: false, api: false, paczka })).toMatch(/^Brak sieci\. Działam na danych z paczki z 17\.10/);
  expect(opisPrzygotowania({ siec: false, api: false, paczka: null })).toMatch(/^Brak sieci i brak paczki offline/);
});
```

- [ ] **Krok 6:** FAIL → **Krok 7: `src/app/Polaczenie.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { przygotuj, type Przygotowanie } from '../offline/polaczenie';

const kiedy = (iso: string) =>
  new Date(iso).toLocaleString('pl-PL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Warsaw' });

export function opisPrzygotowania(p: Przygotowanie): string {
  if (p.siec) return p.api ? 'Jest połączenie. Dane na żywo włączone.' : 'Jest połączenie, ale dane miasta na żywo chwilowo nie odpowiadają.';
  return p.paczka
    ? `Brak sieci. Działam na danych z paczki z ${kiedy(p.paczka.zbudowano)}.`
    : 'Brak sieci i brak paczki offline. Mapa, syreny i punkty pomocy pojawią się po pierwszym połączeniu.';
}

export function Polaczenie({ onGotowe }: { onGotowe: (p: Przygotowanie) => void }) {
  const [tekst, setTekst] = useState('Sprawdzam połączenie…');
  const [wynik, setWynik] = useState<Przygotowanie | null>(null);

  useEffect(() => {
    let aktywne = true;
    let t: ReturnType<typeof setTimeout> | undefined;
    przygotuj((s) => aktywne && setTekst(s)).then((p) => {
      if (!aktywne) return;
      setWynik(p);
      setTekst(opisPrzygotowania(p));
      // Bez sieci i bez paczki czekamy na „Dalej”, żeby dało się przeczytać, co nie działa.
      if (p.siec || p.paczka) t = setTimeout(() => onGotowe(p), 800);
    });
    return () => {
      aktywne = false;
      clearTimeout(t);
    };
  }, [onGotowe]);

  return (
    <div className="polaczenie">
      {!wynik && <div className="polaczenie-kolko" aria-hidden="true" />}
      <p role="status" aria-live="polite">{tekst}</p>
      {wynik && !wynik.siec && !wynik.paczka && (
        <button className="przycisk" onClick={() => onGotowe(wynik)}>
          Dalej
        </button>
      )}
    </div>
  );
}
```

- [ ] **Krok 8: App.** Import `Polaczenie` i typ `Przygotowanie`. Przed `if (!gotowe)`:

```tsx
  const [przygotowanie, setPrzygotowanie] = useState<Przygotowanie | null>(null);
  const siec = useSiec(); // zamiast destrukturyzacji { online, wymuszonyOffline }
  // Sieć wróciła po starcie bez sieci: przechodzimy na online bez ponownego ekranu sprawdzania.
  useEffect(() => {
    if (siec.online) setPrzygotowanie((p) => (p && !p.siec ? { ...p, siec: true } : p));
  }, [siec.online]);
  const online = siec.online && przygotowanie?.siec !== false;
```

Efekt `stanPaczki()` ma zależeć od `[edycja, przygotowanie]` (po pobraniu paczki pasek pokazuje jej datę). Po bloku z `Onboarding`:

```tsx
  if (!przygotowanie) {
    return (
      <div className="aplikacja" style={{ display: 'block' }}>
        <Polaczenie onGotowe={setPrzygotowanie} />
      </div>
    );
  }
```

Status w pasku:

```tsx
          {online ? (przygotowanie.api ? 'Online' : 'Online · bez danych na żywo') : siec.wymuszonyOffline ? 'Offline (symulacja)' : 'Offline'}
          {!online && (paczka ? ` · paczka z ${paczka}` : ' · brak paczki')}
```

- [ ] **Krok 9: CSS** (`src/index.css`)

```css
.polaczenie { min-height: 70dvh; display: grid; place-content: center; justify-items: center; gap: 16px; padding: 24px; text-align: center; }
.polaczenie p { margin: 0; max-width: 32ch; }
.polaczenie-kolko { width: 40px; height: 40px; border-radius: 50%; border: 4px solid var(--linia); border-top-color: var(--akcent); animation: obrot 0.9s linear infinite; }
@keyframes obrot { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .polaczenie-kolko { animation: none; } }
```

- [ ] **Krok 10:** `npm run typecheck && npm test && npm run build`, potem `npm run test:e2e` (testy szkieletu muszą przejść: po zapisaniu adresów pojawia się ekran sprawdzania, po 0,8 s mapa).
- [ ] **Krok 11: PR** `V3: ekran Sprawdzam połączenie`.

**Gotowe, gdy:** po adresach widać ekran sprawdzania; online bez paczki pobiera ją z postępem; offline pokazuje datę paczki albo „brak paczki” z przyciskiem „Dalej”; pasek pokazuje `Online` / `Online · bez danych na żywo` / `Offline · paczka z …`.

---

### V4. Ekran główny: pusta mapa, kafelki, karty (po V3)

**Pliki:**
- Utwórz: `src/app/wskazowki.ts`, `src/app/wskazowki.test.tsx`, `src/app/akcje.ts`, `src/app/akcje.test.ts`, `src/app/Karty.tsx`, `src/app/Karty.test.tsx`, `src/app/Kafelki.tsx`, `src/map/trasaNaMapie.ts`, `src/map/trasaNaMapie.test.ts`
- Modyfikuj: `src/app/App.tsx`, `src/map/MapView.tsx`, `src/index.css`, `tests/e2e/kasia.spec.ts`

**Interfejsy:**
- Używa: `Modul.wskazowki`, `Modul.kafelki`, `Akcja`, `trasa()` z `src/offline/trasy.ts`.
- Produkuje: `useWskazowki(moduly, kontekst | null, proba): { karty: Wskazowka[]; ladowanie: number }`, `pokazTrase(map, t: Trasa): () => void`, `opisTrasy(t: Trasa): string`, `etykietaAkcji(a: Akcja): string`; w DOM: region „Twoja sytuacja”, karty `data-testid="karta-<id>"`, opis trasy w karcie jako `role="status"`, kafelki w `nav` „Warstwy na mapie”.

- [ ] **Krok 1: test zbierania kart** `src/app/wskazowki.test.tsx`

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { expect, it } from 'vitest';
import type { KontekstWskazowek, Modul, Wskazowka } from '../contracts';
import { useWskazowki } from './wskazowki';

const karta = (id: string, kolejnosc: number): Wskazowka => ({ id, kolejnosc, tytul: id, poziom: 'ok', tekst: id, akcje: [], zrodlo: 'test' });
const adres = { id: '1', ulica: 'Grochowska', numer: '200', dzielnica: 'Praga-Południe', lat: 52.2457, lon: 21.0874 };
const k: KontekstWskazowek = { miejsce: { rola: 'dom', etykieta: 'Dom', adres }, miejsca: [], online: true };
const Panel = () => <div />;

it('zbiera karty, sortuje po kolejności, błąd modułu zamienia na kartę „brak”', async () => {
  const moduly: Modul[] = [
    { id: 'live', nazwa: 'Na żywo', Panel, wskazowki: async () => [karta('powietrze', 40)] },
    { id: 'syreny', nazwa: 'Syreny', Panel, wskazowki: async () => [karta('syreny', 10)] },
    { id: 'punkty', nazwa: 'Pomoc', Panel, wskazowki: async () => Promise.reject(new Error('x')) },
    { id: 'transport', nazwa: 'Dojazd', Panel },
  ];
  const { result } = renderHook(() => useWskazowki(moduly, k, 0));
  expect(result.current.ladowanie).toBe(3);
  await waitFor(() => expect(result.current.ladowanie).toBe(0));
  expect(result.current.karty.map((w) => w.id)).toEqual(['syreny', 'powietrze', 'blad-punkty']);
  expect(result.current.karty[2]).toMatchObject({ poziom: 'brak', tytul: 'Pomoc' });
});

it('bez kontekstu nic nie ładuje', () => {
  const { result } = renderHook(() => useWskazowki([], null, 0));
  expect(result.current).toEqual({ karty: [], ladowanie: 0 });
});
```

- [ ] **Krok 2:** FAIL → **Krok 3: `src/app/wskazowki.ts`**

```ts
import { useEffect, useState } from 'react';
import type { KontekstWskazowek, Modul, Wskazowka } from '../contracts';

type StanModulu = 'ladowanie' | Wskazowka[];

// Moduł, który rzucił wyjątkiem, dostaje szarą kartę zamiast pustego miejsca (SPEC §8: błąd źródła).
function kartaBledu(m: Modul): Wskazowka {
  return {
    id: `blad-${m.id}`,
    kolejnosc: 900,
    tytul: m.nazwa,
    poziom: 'brak',
    tekst: 'Nie udało się przygotować tej wskazówki. Spróbuj ponownie za chwilę.',
    akcje: [],
    zrodlo: m.nazwa,
  };
}

// Karty pojawiają się, gdy moduł skończy; reszta pokazuje szkielet (ladowanie = liczba modułów w toku).
export function useWskazowki(moduly: Modul[], k: KontekstWskazowek | null, proba: number): { karty: Wskazowka[]; ladowanie: number } {
  const [stany, setStany] = useState<Record<string, StanModulu>>({});
  const klucz = k ? `${k.miejsce.rola}:${k.miejsce.adres.id}|${k.miejsca.map((m) => m.adres.id).join(',')}|${k.online}|${proba}` : '';

  useEffect(() => {
    if (!k) return setStany({});
    let aktywne = true;
    const zKartami = moduly.filter((m) => m.wskazowki);
    setStany(Object.fromEntries(zKartami.map((m) => [m.id, 'ladowanie' as const])));
    for (const m of zKartami) {
      m.wskazowki!(k).then(
        (w) => aktywne && setStany((s) => ({ ...s, [m.id]: w })),
        () => aktywne && setStany((s) => ({ ...s, [m.id]: [kartaBledu(m)] })),
      );
    }
    return () => {
      aktywne = false;
    };
    // klucz opisuje kontekst w całości
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduly, klucz]);

  const wartosci = Object.values(stany);
  return {
    karty: wartosci.flatMap((s) => (s === 'ladowanie' ? [] : s)).sort((a, b) => a.kolejnosc - b.kolejnosc),
    ladowanie: wartosci.filter((s) => s === 'ladowanie').length,
  };
}
```

- [ ] **Krok 4:** PASS. **Krok 5: test warstwy trasy** `src/map/trasaNaMapie.test.ts`

```ts
import { expect, it, vi } from 'vitest';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Trasa } from '../contracts';
import { pokazTrase } from './trasaNaMapie';

function atrapa() {
  const warstwy = new Map<string, { paint: Record<string, unknown> }>();
  const zrodla = new Set<string>();
  const map = {
    addSource: (id: string) => void zrodla.add(id),
    addLayer: (l: { id: string; paint: Record<string, unknown> }) => void warstwy.set(l.id, l),
    getLayer: (id: string) => warstwy.get(id),
    getSource: (id: string) => (zrodla.has(id) ? {} : undefined),
    removeLayer: (id: string) => void warstwy.delete(id),
    removeSource: (id: string) => void zrodla.delete(id),
    fitBounds: vi.fn(),
  };
  return { map: map as unknown as MapLibreMap, warstwy, zrodla, fitBounds: map.fitBounds };
}

const t: Trasa = {
  od: { lat: 52.23, lon: 21.0 }, do: { lat: 52.24, lon: 21.02 }, profil: 'pieszo', dystansM: 1800, czasMin: 22,
  linia: [[21.0, 52.23], [21.01, 52.235], [21.02, 52.24]], zrodlo: 'osrm',
};

it('rysuje linię, pokazuje całą trasę i sprząta po sobie', () => {
  const a = atrapa();
  const sprzatnij = pokazTrase(a.map, t);
  expect(a.warstwy.size).toBe(1);
  expect(a.fitBounds).toHaveBeenCalledWith([[21.0, 52.23], [21.02, 52.24]], { padding: 60, maxZoom: 17 });
  sprzatnij();
  expect(a.warstwy.size).toBe(0);
  expect(a.zrodla.size).toBe(0);
});

it('linia prosta (bez sieci) jest przerywana', () => {
  const a = atrapa();
  pokazTrase(a.map, { ...t, zrodlo: 'prosta' });
  expect([...a.warstwy.values()][0].paint['line-dasharray']).toEqual([1.5, 1.5]);
});
```

- [ ] **Krok 6:** FAIL → **Krok 7: `src/map/trasaNaMapie.ts`** (bez importów wartości z `maplibre-gl`, żeby testy w jsdom nie ładowały biblioteki)

```ts
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Trasa } from '../contracts';

let licznik = 0;

// Każde wywołanie ma własne id, więc spóźnione sprzątanie starej trasy nie usuwa nowej.
export function pokazTrase(map: MapLibreMap, t: Trasa): () => void {
  const id = `trasa-${++licznik}`;
  map.addSource(id, { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: t.linia } } });
  map.addLayer({
    id,
    type: 'line',
    source: id,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#1d4ed8', 'line-width': 5, 'line-opacity': 0.85, ...(t.zrodlo === 'prosta' ? { 'line-dasharray': [1.5, 1.5] } : {}) },
  });
  const lon = t.linia.map((p) => p[0]);
  const lat = t.linia.map((p) => p[1]);
  map.fitBounds([[Math.min(...lon), Math.min(...lat)], [Math.max(...lon), Math.max(...lat)]], { padding: 60, maxZoom: 17 });
  return () => {
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(id)) map.removeSource(id);
  };
}
```

- [ ] **Krok 8:** PASS. **Krok 9: test akcji** `src/app/akcje.test.ts`

```ts
import { expect, it } from 'vitest';
import type { Trasa } from '../contracts';
import { etykietaAkcji, opisTrasy } from './akcje';

const t: Trasa = { od: { lat: 52.23, lon: 21 }, do: { lat: 52.24, lon: 21 }, profil: 'pieszo', dystansM: 536, czasMin: 7, linia: [], zrodlo: 'osrm' };

it('opis trasy po ulicach, z zapisu i w linii prostej', () => {
  expect(opisTrasy(t)).toBe('540 m po ulicach, pieszo ok. 7 min.');
  expect(opisTrasy({ ...t, zrodlo: 'osrm-zapisana', profil: 'rower', dystansM: 7240, czasMin: 30 })).toBe('7,2 km po ulicach, rowerem ok. 30 min (trasa zapisana w telefonie).');
  expect(opisTrasy({ ...t, zrodlo: 'prosta' })).toBe('540 m w linii prostej, pieszo ok. 7 min. Bez sieci nie mamy trasy po ulicach.');
});

it('etykiety przycisków akcji', () => {
  expect(etykietaAkcji({ typ: 'trasa', cel: t.do, nazwa: 'ul. Garwolińska 9' })).toBe('Trasa pieszo: ul. Garwolińska 9');
  expect(etykietaAkcji({ typ: 'trasa', cel: t.do, nazwa: 'Dom', profil: 'rower' })).toBe('Trasa rowerem: Dom');
  expect(etykietaAkcji({ typ: 'mapa', pokaz: () => () => {} })).toBe('Pokaż na mapie');
  expect(etykietaAkcji({ typ: 'przycisk', etykieta: 'Widzę dym', wykonaj: () => {} })).toBe('Widzę dym');
});
```

- [ ] **Krok 10:** FAIL → **Krok 11: `src/app/akcje.ts`**

```ts
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Akcja, Trasa, Wsp } from '../contracts';
import { pokazTrase } from '../map/trasaNaMapie';
import { trasa } from '../offline/trasy';

const odleglosc = (m: number) => (m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`);

export function etykietaAkcji(a: Akcja): string {
  switch (a.typ) {
    case 'trasa':
      return `${a.profil === 'rower' ? 'Trasa rowerem' : 'Trasa pieszo'}: ${a.nazwa}`;
    case 'mapa':
      return 'Pokaż na mapie';
    case 'link':
    case 'przycisk':
      return a.etykieta;
  }
}

export function opisTrasy(t: Trasa): string {
  const jak = t.profil === 'rower' ? 'rowerem' : 'pieszo';
  if (t.zrodlo === 'prosta') return `${odleglosc(t.dystansM)} w linii prostej, ${jak} ok. ${t.czasMin} min. Bez sieci nie mamy trasy po ulicach.`;
  return `${odleglosc(t.dystansM)} po ulicach, ${jak} ok. ${t.czasMin} min${t.zrodlo === 'osrm-zapisana' ? ' (trasa zapisana w telefonie)' : ''}.`;
}

// Akcje rysujące na mapie: zwraca sprzątanie i (dla trasy) opis do pokazania pod kartą.
export async function wykonajNaMapie(a: Akcja, mapa: MapLibreMap, od: Wsp): Promise<{ sprzatanie: () => void; opis?: string }> {
  if (a.typ === 'mapa') return { sprzatanie: a.pokaz(mapa) };
  if (a.typ === 'trasa') {
    const t = await trasa(od, a.cel, a.profil ?? 'pieszo');
    return { sprzatanie: pokazTrase(mapa, t), opis: opisTrasy(t) };
  }
  return { sprzatanie: () => {} };
}
```

- [ ] **Krok 12:** PASS. **Krok 13: test kart** `src/app/Karty.test.tsx`

```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Wskazowka } from '../contracts';
import { Karty } from './Karty';

it('klik w kartę wykonuje pierwszą akcję mapową, drugi klik sprząta; szkielet dla modułów w toku', async () => {
  const sprzatanie = vi.fn();
  const pokaz = vi.fn((_m: MapLibreMap) => sprzatanie);
  const mapa = {} as MapLibreMap;
  const w: Wskazowka = { id: 'syreny', kolejnosc: 10, tytul: 'Syreny', poziom: 'ok', tekst: 'Jesteś w zasięgu syreny.', akcje: [{ typ: 'mapa', pokaz }], zrodlo: 'SOIA' };
  render(<Karty karty={[w]} ladowanie={1} mapa={mapa} od={{ lat: 52.23, lon: 21 }} onOdswiez={() => {}} />);
  expect(screen.getByLabelText('Ładowanie wskazówki')).toBeTruthy();
  const przycisk = screen.getByRole('button', { name: /Syreny/ });
  fireEvent.click(przycisk);
  await waitFor(() => expect(pokaz).toHaveBeenCalledWith(mapa));
  expect(screen.getByText('Źródło: SOIA')).toBeTruthy();
  fireEvent.click(przycisk);
  expect(sprzatanie).toHaveBeenCalled();
});

it('akcja „przycisk” wykonuje się i odświeża karty', async () => {
  const wykonaj = vi.fn();
  const onOdswiez = vi.fn();
  const w: Wskazowka = { id: 'powietrze', kolejnosc: 40, tytul: 'Powietrze i wiatr', poziom: 'ok', tekst: 'Możesz wietrzyć.', akcje: [{ typ: 'przycisk', etykieta: 'Widzę dym', wykonaj }], zrodlo: 'x' };
  render(<Karty karty={[w]} ladowanie={0} mapa={null} od={{ lat: 52.23, lon: 21 }} onOdswiez={onOdswiez} />);
  fireEvent.click(screen.getByRole('button', { name: /Powietrze/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Widzę dym' }));
  await waitFor(() => expect(onOdswiez).toHaveBeenCalled());
  expect(wykonaj).toHaveBeenCalled();
});
```

- [ ] **Krok 14:** FAIL → **Krok 15: `src/app/Karty.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Akcja, Poziom, Wskazowka, Wsp } from '../contracts';
import { etykietaAkcji, wykonajNaMapie } from './akcje';

const POZIOM: Record<Poziom, string> = { ok: 'W porządku', uwaga: 'Uwaga', alarm: 'Ważne', brak: 'Brak danych' };

type Props = { karty: Wskazowka[]; ladowanie: number; mapa: MapLibreMap | null; od: Wsp; onOdswiez: () => void };

export function Karty({ karty, ladowanie, mapa, od, onOdswiez }: Props) {
  const [otwarta, setOtwarta] = useState<string | null>(null);
  const [opis, setOpis] = useState<string | null>(null);
  const sprzatanie = useRef<() => void>(() => {});
  const nr = useRef(0); // ostatnie kliknięcie wygrywa, spóźniona trasa się nie rysuje

  const wyczysc = () => {
    nr.current++;
    sprzatanie.current();
    sprzatanie.current = () => {};
    setOpis(null);
  };
  useEffect(() => () => sprzatanie.current(), []);
  // Inne miejsce: zamykamy kartę i czyścimy mapę.
  useEffect(() => {
    wyczysc();
    setOtwarta(null);
  }, [od.lat, od.lon]);

  const uruchom = async (a: Akcja) => {
    if (a.typ === 'przycisk') {
      await a.wykonaj();
      onOdswiez();
      return;
    }
    if (a.typ === 'link' || !mapa) return;
    wyczysc();
    const moje = nr.current;
    const w = await wykonajNaMapie(a, mapa, od);
    if (moje !== nr.current) return w.sprzatanie();
    sprzatanie.current = w.sprzatanie;
    setOpis(w.opis ?? null);
  };

  const kliknij = (w: Wskazowka) => {
    wyczysc();
    if (otwarta === w.id) return setOtwarta(null);
    setOtwarta(w.id);
    const pierwsza = w.akcje[0];
    if (pierwsza?.typ === 'trasa' || pierwsza?.typ === 'mapa') void uruchom(pierwsza);
  };

  return (
    <section className="karty" aria-label="Twoja sytuacja">
      <h2>Twoja sytuacja</h2>
      <ul>
        {karty.map((w) => (
          <li key={w.id} className={`karta karta-${w.poziom}`} data-testid={`karta-${w.id}`}>
            <button className="karta-glowna" aria-expanded={otwarta === w.id} onClick={() => kliknij(w)}>
              <span className="karta-tytul">{w.tytul}</span>
              <span className="karta-poziom">{POZIOM[w.poziom]}</span>
              <span className="karta-tekst">{w.tekst}</span>
            </button>
            {otwarta === w.id && (
              <div className="karta-szczegoly">
                {opis && <p role="status">{opis}</p>}
                {w.szczegoly && (
                  <ul>
                    {w.szczegoly.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                )}
                {w.akcje.length > 0 && (
                  <div className="karta-akcje">
                    {w.akcje.map((a, i) =>
                      a.typ === 'link' ? (
                        <a key={i} className="przycisk drugi" href={a.url} target="_blank" rel="noreferrer">
                          {a.etykieta}
                        </a>
                      ) : (
                        <button key={i} className="przycisk drugi" onClick={() => void uruchom(a)}>
                          {etykietaAkcji(a)}
                        </button>
                      ),
                    )}
                  </div>
                )}
                <p className="karta-zrodlo">
                  Źródło: {w.zrodlo}
                  {w.stanNa && `, stan na ${w.stanNa}`}
                </p>
              </div>
            )}
          </li>
        ))}
        {Array.from({ length: ladowanie }, (_, i) => (
          <li key={`ladowanie-${i}`} className="karta karta-szkielet" aria-busy="true" aria-label="Ładowanie wskazówki" />
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Krok 16:** PASS. **Krok 17: `src/app/Kafelki.tsx`** (logika to włącz/wyłącz; sprawdzenie w e2e z V6 i ręcznie)

```tsx
import { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Kafelek } from '../contracts';

// Rząd przycisków nad mapą jak w Google Maps. Domyślnie wszystko wyłączone: mapa pusta.
export function Kafelki({ kafelki, mapa }: { kafelki: Kafelek[]; mapa: MapLibreMap | null }) {
  const [wlaczone, setWlaczone] = useState<ReadonlySet<string>>(new Set());
  const sprzatanie = useRef(new Map<string, () => void>());

  useEffect(
    () => () => {
      sprzatanie.current.forEach((f) => f());
      sprzatanie.current.clear();
      setWlaczone(new Set());
    },
    [mapa],
  );

  if (!kafelki.length) return null;

  const przelacz = (k: Kafelek) => {
    if (!mapa) return;
    const nowe = new Set(wlaczone);
    const s = sprzatanie.current.get(k.id);
    if (s) {
      s();
      sprzatanie.current.delete(k.id);
      nowe.delete(k.id);
    } else {
      sprzatanie.current.set(k.id, k.dodajWarstwe(mapa));
      nowe.add(k.id);
    }
    setWlaczone(nowe);
  };

  return (
    <nav className="kafelki" aria-label="Warstwy na mapie">
      {kafelki.map((k) => (
        <button key={k.id} aria-pressed={wlaczone.has(k.id)} disabled={!mapa} onClick={() => przelacz(k)}>
          <span className="kropka" style={{ background: k.kolor }} aria-hidden="true" />
          {k.etykieta}
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Krok 18: `MapView.tsx`.** Dodaj prop `onMapa?: (m: MapLibreMap | null) => void` (sygnatura: `{ centrum, moduly, onMapa }: { centrum: Wsp | null; moduly: Modul[]; onMapa?: … }`). W `m.on('load', …)` po pętli warstw: `onMapa?.(m);`. W sprzątaniu efektu przed `mapa.current?.remove()`: `onMapa?.(null);`. Kontrolkę przybliżania przenieś na dół (kafelki zajmują górę): `m.addControl(new NavigationControl({ showCompass: false }), 'bottom-right');`.

- [ ] **Krok 19: `App.tsx` po V4** (cały plik; zawiera zmiany z V2 i V3):

```tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { KontekstWskazowek, RolaMiejsca } from '../contracts';
import { moduly } from '../modules';
import { useSiec } from '../offline/siec';
import { stanPaczki } from '../offline/paczka';
import type { Przygotowanie } from '../offline/polaczenie';
import { MapView } from '../map/MapView';
import { useMiejsca, zapiszMiejsca } from './miejsca';
import { miejsceTutaj, zTutaj } from './lokalizacja';
import { Onboarding } from './Onboarding';
import { Polaczenie } from './Polaczenie';
import { Kafelki } from './Kafelki';
import { Karty } from './Karty';
import { useWskazowki } from './wskazowki';
import { Stopka } from './Stopka';

const KAFELKI = moduly.flatMap((m) => m.kafelki ?? []);

export default function App() {
  const { miejsca, gotowe } = useMiejsca();
  const siec = useSiec();
  const [edycja, setEdycja] = useState(false);
  const [rola, setRola] = useState<RolaMiejsca>('dom');
  const [paczka, setPaczka] = useState<string | null>(null);
  const [przygotowanie, setPrzygotowanie] = useState<Przygotowanie | null>(null);
  const [mapa, setMapa] = useState<MapLibreMap | null>(null);
  const [proba, setProba] = useState(0);
  const [bladLokalizacji, setBladLokalizacji] = useState<string | null>(null);

  useEffect(() => {
    stanPaczki().then((s) =>
      setPaczka(s ? new Date(s.zbudowano).toLocaleString('pl-PL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }) : null),
    );
  }, [edycja, przygotowanie]);

  useEffect(() => {
    if (miejsca.length && !miejsca.some((m) => m.rola === rola)) setRola(miejsca[0].rola);
  }, [miejsca, rola]);

  // Sieć wróciła po starcie bez sieci: przechodzimy na online bez ponownego ekranu sprawdzania.
  useEffect(() => {
    if (siec.online) setPrzygotowanie((p) => (p && !p.siec ? { ...p, siec: true } : p));
  }, [siec.online]);

  const online = siec.online && przygotowanie?.siec !== false;
  const miejsce = miejsca.find((m) => m.rola === rola) ?? miejsca[0] ?? null;
  const kontekst = useMemo<KontekstWskazowek | null>(() => (miejsce ? { miejsce, miejsca, online } : null), [miejsce, miejsca, online]);
  const { karty, ladowanie } = useWskazowki(moduly, przygotowanie ? kontekst : null, proba);
  const odswiez = useCallback(() => setProba((p) => p + 1), []);

  if (!gotowe) return null;
  if (!miejsca.length || edycja) {
    return (
      <div className="aplikacja" style={{ display: 'block' }}>
        <Onboarding poczatkowe={miejsca} onGotowe={() => setEdycja(false)} />
      </div>
    );
  }
  if (!przygotowanie || !miejsce) {
    return (
      <div className="aplikacja" style={{ display: 'block' }}>
        <Polaczenie onGotowe={setPrzygotowanie} />
      </div>
    );
  }

  const tutaj = async () => {
    try {
      await zapiszMiejsca(zTutaj(miejsca, await miejsceTutaj()));
      setRola('tutaj');
      setBladLokalizacji(null);
    } catch (e) {
      setBladLokalizacji(e instanceof Error ? e.message : 'Nie udało się ustalić lokalizacji.');
    }
  };

  return (
    <div className="aplikacja">
      <header className="pasek">
        <select aria-label="Wybrane miejsce" value={miejsce.rola} onChange={(e) => setRola(e.target.value as RolaMiejsca)}>
          {miejsca.map((m) => (
            <option key={m.rola} value={m.rola}>
              {m.etykieta}: {m.adres.ulica} {m.adres.numer}
            </option>
          ))}
        </select>
        <button className="pasek-przycisk" onClick={tutaj} aria-label="Użyj mojej lokalizacji">
          Tutaj
        </button>
        <button className="pasek-przycisk" onClick={() => setEdycja(true)} aria-label="Edytuj adresy">
          Adresy
        </button>
        <span className={`siec ${online ? 'online' : 'offline'}`} role="status">
          {online ? (przygotowanie.api ? 'Online' : 'Online · bez danych na żywo') : siec.wymuszonyOffline ? 'Offline (symulacja)' : 'Offline'}
          {!online && (paczka ? ` · paczka z ${paczka}` : ' · brak paczki')}
        </span>
        {bladLokalizacji && (
          <p className="pasek-blad" role="alert">
            {bladLokalizacji}
          </p>
        )}
      </header>
      <main className="mapa">
        <MapView centrum={miejsce.adres} moduly={moduly} onMapa={setMapa} />
        <Kafelki kafelki={KAFELKI} mapa={mapa} />
      </main>
      <Karty karty={karty} ladowanie={ladowanie} mapa={mapa} od={miejsce.adres} onOdswiez={odswiez} />
      <Stopka />
    </div>
  );
}
```

- [ ] **Krok 20: CSS** (`src/index.css`). W `.aplikacja` zmień `grid-template-rows` na `auto minmax(200px, 1fr) auto auto` (pasek, mapa, karty, stopka). Usuń reguły `.panel`, `.menu`, `.menu button`, `.menu button[aria-pressed='true']`. Dopisz:

```css
.karty { max-height: 48dvh; overflow: auto; padding: 10px 14px; border-top: 1px solid var(--linia); }
.karty h2 { font-size: 16px; margin: 0 0 8px; }
.karty > ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.karta { border: 1px solid var(--linia); border-left: 5px solid #9ca3af; border-radius: 8px; background: #fff; }
.karta-ok { border-left-color: var(--ok); }
.karta-uwaga { border-left-color: var(--uwaga); }
.karta-alarm { border-left-color: var(--akcent); }
.karta-glowna { display: grid; gap: 2px; width: 100%; min-height: 48px; padding: 10px 12px; border: 0; background: none; text-align: left; color: inherit; }
.karta-tytul { font-weight: 600; }
.karta-poziom { font-size: 12px; color: var(--przygaszony); }
.karta-szczegoly { padding: 0 12px 12px; font-size: 14px; }
.karta-szczegoly p { margin: 0 0 8px; }
.karta-szczegoly ul { margin: 0 0 8px; padding-left: 18px; }
.karta-akcje { display: flex; flex-wrap: wrap; gap: 6px; }
.karta-akcje .przycisk { width: auto; margin: 0; padding: 8px 12px; text-decoration: none; font-size: 14px; }
.karta-zrodlo { font-size: 12px; color: var(--przygaszony); margin: 8px 0 0 !important; }
.karta-szkielet { height: 64px; border: 0; background: var(--linia); animation: puls 1.2s ease-in-out infinite; }
@keyframes puls { 50% { opacity: 0.5; } }
@media (prefers-reduced-motion: reduce) { .karta-szkielet { animation: none; } }
.kafelki { position: absolute; top: 8px; left: 0; right: 0; z-index: 2; display: flex; gap: 6px; overflow-x: auto; padding: 0 10px 4px; scrollbar-width: none; }
.kafelki button { flex: none; display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 6px 12px; border: 1px solid var(--linia); border-radius: 999px; background: #fff; box-shadow: 0 1px 4px rgb(0 0 0 / 0.12); font-size: 13px; color: var(--tekst); }
.kafelki button[aria-pressed='true'] { background: var(--tekst); color: #fff; }
.kafelki .kropka { width: 10px; height: 10px; border-radius: 50%; }
```

(`.kafelki` to `<nav>`, więc reguła `.mapa > div { position: absolute; inset: 0 }` go nie dotyczy.)

- [ ] **Krok 21: e2e** (`tests/e2e/kasia.spec.ts`). Usuń funkcję `otworzModul` i 4 testy modułów („Syreny…”, „Pomoc…”, „Dojazd…”, „Na żywo…”). Dopisz:

```ts
test('Twoja sytuacja: 5 kart w kolejności, bez menu modułów', async ({ page }) => {
  await onboarding(page);
  const karty = page.getByRole('region', { name: 'Twoja sytuacja' }).locator('[data-testid^="karta-"]');
  await expect(karty).toHaveCount(5, { timeout: 30_000 });
  await expect(karty.first()).toHaveAttribute('data-testid', 'karta-syreny');
  await expect(page.getByRole('navigation', { name: 'Moduły' })).toHaveCount(0);
});
```

- [ ] **Krok 22:** `npm run typecheck && npm test && npm run build && npm run test:e2e` → zielone. Zrzut ekranu ekranu głównego do `docs/pitch/zrzuty/` + jedno zdanie w `docs/pitch/zrzuty.md`.
- [ ] **Krok 23: PR** `V4: ekran główny z kartami i kafelkami`.

**Gotowe, gdy:** po starcie widać pustą mapę z punktem miejsca, rząd kafelków (gdy O3 doda kafelki) i 5 kart (atrapy albo prawdziwe) posortowanych 10–50; klik w kartę z trasą rysuje trasę i pokazuje opis; drugi klik czyści mapę; dolnego menu i panelu modułu nie ma.

---

### V5. Trasy: OSRM, zapis w telefonie, zapis na offline (kroki 1–4 równolegle z V2; kroki 5–6 po V4)

**Pliki:**
- Modyfikuj: `src/offline/trasy.ts`, `src/offline/trasy.test.ts`, `src/app/zrodla.ts`, `src/app/zrodla.test.ts`
- Utwórz: `src/offline/zapisTras.ts`, `src/offline/zapisTras.test.ts`
- Modyfikuj (krok 6): `src/app/App.tsx`, `src/app/Polaczenie.tsx`

**Interfejsy:**
- Używa: `GET /api/live/trasa?od=lon,lat&do=lon,lat&profil=pieszo|rower` z L1 → `200 { dystansM: number; czasMin: number; linia: [number, number][] }`, `400 { blad: 'parametry' }`, `502 { blad: … }`. Do czasu scalenia L1 serwer zwraca 404 i `trasa()` daje linię prostą.
- Używa: `najblizsze(w, rodzaj, n)` z `src/modules/punkty`.
- Produkuje: `trasa()` z tą samą sygnaturą co w V1, `kluczTrasy(od, do_, profil): string`, `celeTras(miejsca, szukaj?)`, `zapiszTrasyOffline(miejsca, onPostep?): Promise<number>`.

- [ ] **Krok 1: testy** — dopisz do `src/offline/trasy.test.ts` (na górze pliku `import 'fake-indexeddb/auto';`, rozszerz importy):

```ts
import 'fake-indexeddb/auto';
import { clear } from 'idb-keyval';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { kluczTrasy, trasa, trasaProsta } from './trasy';

const OSRM = { dystansM: 536, czasMin: 7, linia: [[21.0, 52.23], [21.001, 52.235], [21.0, 52.239]] };

function ustawSiec(online: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online);
}

beforeEach(() => clear());
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('online: pyta /api/live/trasa, zapisuje, a za drugim razem bierze z zapisu', async () => {
  ustawSiec(true);
  const f = vi.fn(async (_url: string) => Response.json(OSRM));
  vi.stubGlobal('fetch', f);
  const t = await trasa(A, B, 'pieszo');
  expect(t).toMatchObject({ dystansM: 536, czasMin: 7, zrodlo: 'osrm', profil: 'pieszo' });
  expect(String(f.mock.calls[0][0])).toBe('/api/live/trasa?od=21.00000%2C52.23000&do=21.00000%2C52.23900&profil=pieszo');
  expect((await trasa(A, B, 'pieszo')).zrodlo).toBe('osrm-zapisana');
  expect(f).toHaveBeenCalledTimes(1);
});

it('offline bez zapisu: linia prosta, bez zapytania', async () => {
  ustawSiec(false);
  const f = vi.fn();
  vi.stubGlobal('fetch', f);
  expect((await trasa(A, B, 'rower')).zrodlo).toBe('prosta');
  expect(f).not.toHaveBeenCalled();
});

it('błąd proxy (502): linia prosta, nic nie zapisuje', async () => {
  ustawSiec(true);
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ blad: 'timeout' }, { status: 502 })));
  expect((await trasa(A, B, 'pieszo')).zrodlo).toBe('prosta');
  vi.stubGlobal('fetch', vi.fn(async () => Response.json(OSRM)));
  expect((await trasa(A, B, 'pieszo')).zrodlo).toBe('osrm');
});

it('klucz zapisu: profil i współrzędne z dokładnością 5 miejsc', () => {
  expect(kluczTrasy(A, { lat: 52.2390001, lon: 21.0 }, 'rower')).toBe('trasa:rower:21.00000,52.23000;21.00000,52.23900');
});
```

Usuń z pliku test „trasa() w V1 zwraca linię prostą”.

- [ ] **Krok 2:** FAIL → **Krok 3: `src/offline/trasy.ts`** — zostaw `trasaProsta`, zamień resztę:

```ts
import { get, set } from 'idb-keyval';
import { wymuszonyOffline } from './siec';
// … (import distance, typy, KRETOSC, M_NA_MIN, trasaProsta bez zmian)

const r5 = (x: number) => x.toFixed(5);
const punkt = (w: Wsp) => `${r5(w.lon)},${r5(w.lat)}`;
export const kluczTrasy = (od: Wsp, do_: Wsp, profil: Profil) => `trasa:${profil}:${punkt(od)};${punkt(do_)}`;

type OdpowiedzTrasy = Pick<Trasa, 'dystansM' | 'czasMin' | 'linia'>;

// Kolejność: zapis w telefonie → OSRM przez /api/live/trasa (gdy jest sieć) → linia prosta.
export async function trasa(od: Wsp, do_: Wsp, profil: Profil): Promise<Trasa> {
  const klucz = kluczTrasy(od, do_, profil);
  const zapis = await get<Trasa>(klucz).catch(() => undefined);
  if (zapis) return { ...zapis, zrodlo: 'osrm-zapisana' };
  if (navigator.onLine && !wymuszonyOffline()) {
    try {
      const q = new URLSearchParams({ od: punkt(od), do: punkt(do_), profil });
      const r = await fetch(`/api/live/trasa?${q}`, { signal: AbortSignal.timeout(8000) });
      if (r.ok) {
        const o = (await r.json()) as OdpowiedzTrasy;
        const t: Trasa = { od, do: do_, profil, dystansM: o.dystansM, czasMin: o.czasMin, linia: o.linia, zrodlo: 'osrm' };
        await set(klucz, t).catch(() => {});
        return t;
      }
    } catch {
      // brak sieci albo OSRM nie odpowiada: linia prosta
    }
  }
  return trasaProsta(od, do_, profil);
}
```

- [ ] **Krok 4:** PASS. **Atrybucja:** w `src/app/zrodla.ts` dopisz do `STALE_ZRODLA`:

```ts
  {
    nazwa: 'Trasy: OSRM (routing.openstreetmap.de, FOSSGIS), © OpenStreetMap contributors',
    licencja: 'ODbL',
    url: 'https://routing.openstreetmap.de',
    pobrano: '2026-10-17',
  },
```

W `src/app/zrodla.test.ts` w pierwszym teście dopisz: `expect(z.some((x) => x.nazwa.startsWith('Trasy: OSRM'))).toBe(true);`. PR `V5a: trasy z OSRM i zapis w telefonie` (może wejść przed V4).

- [ ] **Krok 5: test zapisu na offline** `src/offline/zapisTras.test.ts`

```ts
import { expect, it, vi } from 'vitest';
import type { MiejsceUzytkownika, Punkt, RodzajPunktu, Wsp } from '../contracts';

vi.mock('./trasy', () => ({
  trasa: vi.fn(async (od: Wsp, d: Wsp, profil: string) => ({ od, do: d, profil, dystansM: 1, czasMin: 1, linia: [], zrodlo: 'osrm' })),
}));
import { trasa } from './trasy';
import { celeTras, zapiszTrasyOffline } from './zapisTras';

const adres = (id: string, lat: number) => ({ id, ulica: 'X', numer: id, dzielnica: 'Wola', lat, lon: 21.0 });
const miejsca: MiejsceUzytkownika[] = [
  { rola: 'dom', etykieta: 'Dom', adres: adres('1', 52.23) },
  { rola: 'praca', etykieta: 'Praca', adres: adres('2', 52.24) },
];
const szukaj = async (w: Wsp, rodzaj: RodzajPunktu, n: number): Promise<Punkt[]> =>
  Array.from({ length: n }, (_, i) => ({ id: `${rodzaj}-${i}`, rodzaj, nazwa: rodzaj, lat: w.lat + 0.001 * (i + 1), lon: w.lon, zrodlo: 'x' }));

it('cele: 3 PSP + AED + SOR + apteka + przychodnia pieszo z każdego miejsca, między miejscami pieszo i rowerem', async () => {
  const c = await celeTras(miejsca, szukaj);
  // na miejsce: 7 punktów + 1 inne miejsce × 2 profile = 9; dwa miejsca = 18
  expect(c).toHaveLength(18);
  expect(c.filter((x) => x.profil === 'rower')).toHaveLength(2);
  expect(c[0]).toEqual({ od: miejsca[0].adres, do: { lat: 52.231, lon: 21.0 }, profil: 'pieszo' });
});

it('zapisuje każdą trasę i raportuje postęp', async () => {
  const postep = vi.fn();
  expect(await zapiszTrasyOffline(miejsca, postep, szukaj)).toBe(18);
  expect(trasa).toHaveBeenCalledTimes(18);
  expect(postep).toHaveBeenLastCalledWith(18, 18);
});
```

- [ ] **Krok 6:** FAIL → **Krok 7: `src/offline/zapisTras.ts`**

```ts
import type { MiejsceUzytkownika, Profil, Punkt, RodzajPunktu, Wsp } from '../contracts';
// Bezpośrednio z najblizsze.ts, nie z index.tsx modułu: bez panelu i warstw MapLibre (lżej, także w testach).
import { najblizsze } from '../modules/punkty/najblizsze';
import { trasa } from './trasy';

type Szukaj = (w: Wsp, rodzaj: RodzajPunktu, n: number) => Promise<Punkt[]>;
type Cel = { od: Wsp; do: Wsp; profil: Profil };

// HANDOFF-v3 §5: z każdego miejsca do 3 miejsc schronienia PSP, AED, SOR, apteki, przychodni; między miejscami pieszo i rowerem.
const PUNKTY: [RodzajPunktu, number][] = [['schronienie_psp', 3], ['aed', 1], ['sor', 1], ['apteka', 1], ['przychodnia', 1]];

export async function celeTras(miejsca: MiejsceUzytkownika[], szukaj: Szukaj = najblizsze): Promise<Cel[]> {
  const cele: Cel[] = [];
  for (const m of miejsca) {
    for (const [rodzaj, n] of PUNKTY) {
      for (const p of await szukaj(m.adres, rodzaj, n).catch(() => [])) cele.push({ od: m.adres, do: { lat: p.lat, lon: p.lon }, profil: 'pieszo' });
    }
    for (const inne of miejsca) {
      if (inne !== m) for (const profil of ['pieszo', 'rower'] as const) cele.push({ od: m.adres, do: inne.adres, profil });
    }
  }
  return cele;
}

// Po 2 zapytania naraz, żeby nie obciążać publicznego serwera OSRM. Zwraca liczbę tras po ulicach (nie w linii prostej).
export async function zapiszTrasyOffline(
  miejsca: MiejsceUzytkownika[],
  onPostep: (zrobione: number, wszystkie: number) => void = () => {},
  szukaj: Szukaj = najblizsze,
): Promise<number> {
  const cele = await celeTras(miejsca, szukaj);
  let zrobione = 0;
  let poUlicach = 0;
  for (let i = 0; i < cele.length; i += 2) {
    const wyniki = await Promise.all(cele.slice(i, i + 2).map((c) => trasa(c.od, c.do, c.profil)));
    poUlicach += wyniki.filter((t) => t.zrodlo !== 'prosta').length;
    zrobione += wyniki.length;
    onPostep(zrobione, cele.length);
  }
  return poUlicach;
}
```

- [ ] **Krok 8:** PASS. **Krok 9: zapis w tle** (`App.tsx`, po efekcie `siec.online`; import `zapiszTrasyOffline` z `../offline/zapisTras`):

```tsx
  // Trasy na offline zapisujemy w tle, gdy jest sieć (HANDOFF-v3 §5). Zapisane trasy nie idą drugi raz do OSRM.
  useEffect(() => {
    if (przygotowanie?.siec && miejsca.length) void zapiszTrasyOffline(miejsca).catch(() => {});
  }, [przygotowanie?.siec, miejsca]);
```

W `opisPrzygotowania` (Polaczenie.tsx) zmień tekst online z API na: `'Jest połączenie. Dane na żywo włączone. Trasy na offline zapisuję w tle.'` i popraw oczekiwanie w `Polaczenie.test.tsx`.

- [ ] **Krok 10:** `npm run typecheck && npm test && npm run build`; ręcznie w `npm run dev` (z L1 na `main`): klik w kartę schronienia → niebieska ciągła trasa, opis „… po ulicach, pieszo ok. N min.”; DevTools → Application → IndexedDB → klucze `trasa:pieszo:…` (ok. 9 na miejsce); `?offline=1` → ta sama trasa z dopiskiem „(trasa zapisana w telefonie)”.
- [ ] **Krok 11: PR** `V5b: zapis tras na offline`.

**Gotowe, gdy:** online trasa idzie po chodnikach (OSRM), drugi raz i offline jest z zapisu, bez zapisu offline jest linia prosta z napisem „w linii prostej”; w stopce jest atrybucja OSRM.

---

### V6. Ścieżka Kasi pod nowy przepływ, sprzątanie (po V4, V5 i kartach O2–O4 na `main`)

**Pliki:** `tests/e2e/kasia.spec.ts`, `CLAUDE.md`.

- [ ] **Krok 1: e2e** — dopisz pomocnika i testy kart (pomijają się, póki karta jest atrapą):

```ts
async function karta(page: Page, id: string) {
  const k = page.getByTestId(`karta-${id}`);
  await expect(k).toBeVisible({ timeout: 30_000 });
  test.skip(await k.getByText('Karta w budowie.').isVisible(), `karta „${id}” jest jeszcze atrapą`);
  return k;
}

test('Syreny: karta z wynikiem w dB, także offline', async ({ page, context }) => {
  await onboarding(page);
  await expect(await karta(page, 'syreny')).toContainText('dB');
  await context.setOffline(true);
  await page.reload();
  await expect(await karta(page, 'syreny')).toContainText('dB');
});

test('Miejsce schronienia: klik pokazuje trasę, także offline', async ({ page, context }) => {
  await onboarding(page);
  let k = await karta(page, 'schronienie');
  await k.getByRole('button').first().click();
  await expect(k.getByRole('status')).toContainText(/pieszo ok\. \d+ min/);
  await context.setOffline(true);
  await page.reload();
  k = await karta(page, 'schronienie');
  await k.getByRole('button').first().click();
  await expect(k.getByRole('status')).toContainText(/pieszo ok\. \d+ min/);
});

test('Pomoc medyczna, powietrze, bliscy: karta zawsze ma treść (także bez sieci)', async ({ page, context }) => {
  await onboarding(page);
  await context.setOffline(true);
  await page.reload();
  for (const id of ['medyczna', 'powietrze', 'bliscy']) {
    await expect(page.getByTestId(`karta-${id}`).locator('.karta-tekst')).not.toBeEmpty({ timeout: 30_000 });
  }
});

test('kafelek włącza i wyłącza warstwę', async ({ page }) => {
  await onboarding(page);
  const kafelek = page.getByRole('navigation', { name: 'Warstwy na mapie' }).getByRole('button', { name: 'AED' });
  test.skip(!(await kafelek.isVisible().catch(() => false)), 'kafelki O3 (P4) jeszcze nie na main');
  await kafelek.click();
  await expect(kafelek).toHaveAttribute('aria-pressed', 'true');
  await kafelek.click();
  await expect(kafelek).toHaveAttribute('aria-pressed', 'false');
});

test('demo: lokalizacja z parametru → sprawdzanie połączenia → karty dla „Tutaj”', async ({ page }) => {
  await page.goto('/?lokalizacja=52.2457,21.0874');
  await page.getByRole('button', { name: 'Użyj mojej lokalizacji' }).click();
  await mapaGotowa(page);
  await expect(page.getByRole('combobox', { name: 'Wybrane miejsce' })).toContainText('Tutaj');
  await expect(page.getByTestId('karta-syreny')).toBeVisible({ timeout: 30_000 });
});
```

Uwaga: `vite preview` nie obsługuje `/api/live/*`, więc w e2e trasa jest „w linii prostej” — wyrażenie `pieszo ok. N min` pasuje do obu wariantów.

- [ ] **Krok 2:** `npm run test:e2e` → zielone albo pominięte z adnotacją „jest jeszcze atrapą”. Pominięcie po 22:30 = zgłoszenie do właściciela karty.
- [ ] **Krok 3: `CLAUDE.md`** — zamień zdanie o `data-testid` na: „Umówione `data-testid`: `karta-<id>` (`syreny`, `schronienie`, `medyczna`, `powietrze`, `bliscy`); atrapa karty ma tekst `Karta w budowie.`”.
- [ ] **Krok 4: PR** `V6: ścieżka Kasi na nowym przepływie`.

**Gotowe, gdy:** e2e przechodzi pełną ścieżkę demo (lokalizacja → sprawdzanie → karty → trasa → offline), bez menu modułów; `CLAUDE.md` opisuje nowe `data-testid`.

---

## Pas O2: syreny i dotarcie do bliskich

Równolegle od razu po V1: **S1 ∥ S2 (kroki 1–5, pipeline) ∥ S3**. Potem **S2 kroki 6–10** (frontend okręgów, dotyka pliku z S1).

### S1. Karta Syreny

**Pliki:**
- Utwórz: `src/modules/syreny/wskazowki.ts`, `src/modules/syreny/wskazowki.test.ts`, `src/modules/syreny/druk.tsx`
- Modyfikuj: `src/modules/syreny/Karta.tsx` (tylko `export` przy `Tresc` i `wczytaj`), `src/modules/syreny/index.tsx`

**Interfejsy:**
- Używa: `wynikSyreny(adresId)`, `ocena(w)` z `./wynik`; `KLASA`, `DOPISEK` z `./teksty`; `Tresc`, `wczytaj` z `./Karta`.
- Produkuje: `wskazowkiSyren(k: KontekstWskazowek): Promise<Wskazowka[]>` (jedna karta `id: 'syreny'`, `kolejnosc: 10`), `tekstSyren(w)`, `drukujKarte(miejsca): Promise<void>`.

- [ ] **Krok 1: test** `src/modules/syreny/wskazowki.test.ts`

```ts
import { afterEach, expect, it, vi } from 'vitest';
import type { KontekstWskazowek } from '../../contracts';

vi.mock('./wynik', async (oryginal) => ({ ...(await oryginal<typeof import('./wynik')>()), wynikSyreny: vi.fn() }));
vi.mock('./druk', () => ({ drukujKarte: vi.fn() }));
import { wynikSyreny } from './wynik';
import { DOPISEK } from './teksty';
import { tekstSyren, wskazowkiSyren } from './wskazowki';

const adres = { id: '1', ulica: 'Grochowska', numer: '200', dzielnica: 'Praga-Południe', lat: 52.2457, lon: 21.0874 };
const k = (online = true): KontekstWskazowek => ({ miejsce: { rola: 'dom', etykieta: 'Dom', adres }, miejsca: [], online });
const w = (normalnie: string, blackout: string, blackoutSzacunek = false) =>
  ({ adresId: '1', normalnie, blackout, blackoutSzacunek }) as Parameters<typeof tekstSyren>[0];

afterEach(() => vi.clearAllMocks());

it('tekst: najpierw zasięg normalnie, potem „jeśli zabraknie prądu”', () => {
  expect(tekstSyren(w('75+', '65-70'))).toBe('Jesteś w zasięgu syreny (75 dB i więcej). Jeśli zabraknie prądu (65–70 dB), możesz jej nie usłyszeć w mieszkaniu.');
  expect(tekstSyren(w('75+', 'ponizej_65', true))).toBe('Jesteś w zasięgu syreny (75 dB i więcej). Jeśli zabraknie prądu (poniżej 65 dB, szacunek), możesz jej nie usłyszeć.');
  expect(tekstSyren(w('75+', '70-75'))).toBe('Jesteś w zasięgu syreny (75 dB i więcej). Jeśli zabraknie prądu (70–75 dB), nadal powinna być słyszalna na zewnątrz.');
  expect(tekstSyren(w('70-75', '70-75'))).toBe('Jesteś w zasięgu syreny (70–75 dB). Jeśli zabraknie prądu, poziom się nie zmienia.');
  expect(tekstSyren(w('65-70', '65-70'))).toBe('Syrena może być tu słabo słyszalna (65–70 dB), zwłaszcza w mieszkaniu.');
  expect(tekstSyren(w('ponizej_65', 'ponizej_65'))).toBe('Syrena prawdopodobnie nie jest tu słyszalna (poniżej 65 dB). Włącz Alert RCB, żeby alarm do Ciebie dotarł.');
});

it('karta: poziom z oceny, kroki i dopisek o modelu w szczegółach, druk jako akcja', async () => {
  vi.mocked(wynikSyreny).mockResolvedValue(w('75+', 'ponizej_65'));
  const [karta] = await wskazowkiSyren(k());
  expect(karta).toMatchObject({ id: 'syreny', kolejnosc: 10, tytul: 'Syreny', poziom: 'uwaga' });
  expect(karta.szczegoly).toContain('Włącz Alert RCB w telefonie.');
  expect(karta.szczegoly).toContain(DOPISEK);
  expect(karta.akcje).toEqual([expect.objectContaining({ typ: 'przycisk', etykieta: 'Drukuj kartę z adresami' })]);
});

it('poziomy: słychać = ok, nie słychać = alarm', async () => {
  vi.mocked(wynikSyreny).mockResolvedValue(w('70-75', '70-75'));
  expect((await wskazowkiSyren(k()))[0].poziom).toBe('ok');
  vi.mocked(wynikSyreny).mockResolvedValue(w('ponizej_65', 'ponizej_65'));
  expect((await wskazowkiSyren(k()))[0].poziom).toBe('alarm');
});

it('brak danych dla adresu i brak paczki bez sieci: karta „brak” z wyjaśnieniem', async () => {
  vi.mocked(wynikSyreny).mockResolvedValue(null);
  expect((await wskazowkiSyren(k()))[0]).toMatchObject({ poziom: 'brak', tekst: 'Brak danych o syrenach dla tego miejsca.' });
  vi.mocked(wynikSyreny).mockRejectedValue(new Error('Nie pobrano'));
  expect((await wskazowkiSyren(k(false)))[0].tekst).toMatch(/^Brak sieci/);
  expect((await wskazowkiSyren(k(true)))[0].tekst).toMatch(/^Źródło chwilowo niedostępne/);
});
```

- [ ] **Krok 2:** `npx vitest run src/modules/syreny/wskazowki.test.ts` → FAIL („Failed to resolve import ./wskazowki”).
- [ ] **Krok 3: `src/modules/syreny/druk.tsx`** (w `Karta.tsx` dopisz `export` przed `async function wczytaj` i `function Tresc`)

```tsx
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import type { MiejsceUzytkownika } from '../../contracts';
import { Tresc, wczytaj } from './Karta';

// Karta do wydruku jako akcja karty Syreny: render do <body>, druk, sprzątanie (style w syreny.css).
export async function drukujKarte(miejsca: MiejsceUzytkownika[]): Promise<void> {
  const dane = await Promise.all(miejsca.map(wczytaj));
  const el = document.createElement('div');
  el.className = 'karta-druk-portal';
  document.body.append(el);
  const root = createRoot(el);
  flushSync(() => root.render(<Tresc dane={dane} data={new Date().toLocaleDateString('pl-PL')} />));
  document.body.classList.add('druk-karty');
  window.addEventListener(
    'afterprint',
    () => {
      document.body.classList.remove('druk-karty');
      root.unmount();
      el.remove();
    },
    { once: true },
  );
  window.print();
}
```

- [ ] **Krok 4: `src/modules/syreny/wskazowki.ts`**

```ts
import type { KontekstWskazowek, Poziom, Wskazowka } from '../../contracts';
import { drukujKarte } from './druk';
import { DOPISEK, KLASA } from './teksty';
import { ocena, wynikSyreny, type Poziom as Ocena, type WynikSyrenyZSzacunkiem } from './wynik';

const POZIOM: Record<Ocena, Poziom> = { slychac: 'ok', slabo: 'uwaga', ryzyko_blackout: 'uwaga', nie_slychac: 'alarm' };
const KROKI = ['Włącz Alert RCB w telefonie.', 'Umów się z sąsiadem, kto kogo budzi.'];
const ZRODLO = 'Model zasięgu syren KG PSP, SOIA 2026.05';

function poBlackoucie(w: WynikSyrenyZSzacunkiem): string {
  if (w.blackout === w.normalnie) return 'Jeśli zabraknie prądu, poziom się nie zmienia.';
  const b = `${KLASA[w.blackout].tekst}${w.blackoutSzacunek ? ', szacunek' : ''}`;
  if (w.blackout === 'ponizej_65') return `Jeśli zabraknie prądu (${b}), możesz jej nie usłyszeć.`;
  if (w.blackout === '65-70') return `Jeśli zabraknie prądu (${b}), możesz jej nie usłyszeć w mieszkaniu.`;
  return `Jeśli zabraknie prądu (${b}), nadal powinna być słyszalna na zewnątrz.`;
}

export function tekstSyren(w: WynikSyrenyZSzacunkiem): string {
  const n = KLASA[w.normalnie].tekst;
  switch (ocena(w).poziom) {
    case 'nie_slychac':
      return `Syrena prawdopodobnie nie jest tu słyszalna (${n}). Włącz Alert RCB, żeby alarm do Ciebie dotarł.`;
    case 'slabo':
      return `Syrena może być tu słabo słyszalna (${n}), zwłaszcza w mieszkaniu.`;
    default:
      return `Jesteś w zasięgu syreny (${n}). ${poBlackoucie(w)}`;
  }
}

export async function wskazowkiSyren(k: KontekstWskazowek): Promise<Wskazowka[]> {
  const baza = { id: 'syreny', kolejnosc: 10, tytul: 'Syreny', zrodlo: ZRODLO };
  const druk = { typ: 'przycisk' as const, etykieta: 'Drukuj kartę z adresami', wykonaj: () => drukujKarte(k.miejsca) };
  let w: WynikSyrenyZSzacunkiem | null;
  try {
    w = await wynikSyreny(k.miejsce.adres.id);
  } catch {
    const tekst = k.online
      ? 'Źródło chwilowo niedostępne: nie udało się wczytać danych o syrenach. Spróbuj za chwilę.'
      : 'Brak sieci, a dane o syrenach nie są zapisane w telefonie. Pobierz paczkę, gdy wróci sieć.';
    return [{ ...baza, poziom: 'brak', tekst, akcje: [] }];
  }
  if (!w) return [{ ...baza, poziom: 'brak', tekst: 'Brak danych o syrenach dla tego miejsca.', akcje: [] }];
  return [
    {
      ...baza,
      poziom: POZIOM[ocena(w).poziom],
      tekst: tekstSyren(w),
      szczegoly: [
        `Normalnie: ${KLASA[w.normalnie].tekst}. Jeśli zabraknie prądu: ${KLASA[w.blackout].tekst}${w.blackoutSzacunek ? ' (szacunek)' : ''}.`,
        ...KROKI,
        DOPISEK,
      ],
      akcje: [druk],
    },
  ];
}
```

- [ ] **Krok 5:** PASS. **Krok 6:** w `src/modules/syreny/index.tsx` zamień atrapę na `wskazowki: wskazowkiSyren,` (import z `./wskazowki`).
- [ ] **Krok 7:** `npm run typecheck && npm test && npm run build`. **Krok 8: PR** `S1: karta Syreny`.

**Gotowe, gdy:** karta ma poziom i tekst dla każdej z 4 ocen, w szczegółach są kroki i dopisek o modelu i blackoucie, „Drukuj kartę z adresami” drukuje kartę, a przy braku danych albo sieci karta jest szara z wyjaśnieniem.

---

### S2. Okręgi 75/70/65 dB wokół najbliższych syren

**Pliki:**
- Kroki 1–5 (pipeline): utwórz `pipeline/syreny/okregi.py`, `pipeline/syreny/test_okregi.py`, `public/pack/syreny/okregi.json`; odśwież `public/pack/manifest.json`
- Kroki 6–10 (frontend, po scaleniu S1): utwórz `src/modules/syreny/okregi.ts`, `src/modules/syreny/okregi.test.ts`; modyfikuj `src/modules/syreny/wskazowki.ts`, `src/modules/syreny/wskazowki.test.ts`

**Interfejsy:**
- Używa: `dane/soia-warszawa/coverage_ranges.geojson` (pola `nr_ref`, `typ`, `spl30`), `dane/soia-warszawa/tabele/syreny_inwentaryzacja_warszawa.csv` (`nr_ref`, `lat`, `lon`), `public/pack/syreny/meta.json` → `przyblizenie` (`poziom_A_wg_spl30`, `spadek_db_na_dekade_odleglosci`, `poprawka_db`).
- Produkuje: `public/pack/syreny/okregi.json` = `[{ "nr": "SOiA-…", "typ": "cyfrowa"|"analogowa", "lat": 52.2, "lon": 21.0, "r75": 345, "r70": 641, "r65": 1191 }]` (425 syren, wszystkie w bbox, sprawdzone 17.10); `najblizszeOkregi()`, `pokazOkregi()`, `opisOkregow()`, `DOPISEK_OKREGOW`.

- [ ] **Krok 1: test** `pipeline/syreny/test_okregi.py`

```python
import json
from pathlib import Path

from syreny.okregi import okregi, promien

ROOT = Path(__file__).resolve().parents[2]
PRZ = {"poziom_A_wg_spl30": {"112": 126.0}, "spadek_db_na_dekade_odleglosci": -18.58, "poprawka_db": 3.85}


def test_promien_z_modelu_przyblizenia():
    # 126 - 3,85 - 65 = 57,15 dB zapasu; 10 ** (57,15 / 18,58) ≈ 1191 m
    assert round(promien(126.0, -18.58, 3.85, 65)) == 1191
    assert promien(126.0, -18.58, 3.85, 75) < promien(126.0, -18.58, 3.85, 70) < promien(126.0, -18.58, 3.85, 65)
    assert promien(100.0, -18.58, 3.85, 75) == 30.0  # nie mniej niż 30 m (spl30 mierzone 30 m od syreny)


def test_okregi_lacza_zasiegi_z_inwentaryzacja():
    zasiegi = [
        {"nr_ref": "A", "typ": "cyfrowa", "spl30": 112.0},
        {"nr_ref": "A", "typ": "cyfrowa", "spl30": 112.0},  # ta sama syrena, inny próg dB
        {"nr_ref": "B", "typ": "analogowa", "spl30": 112.0},
        {"nr_ref": "Z", "typ": "analogowa", "spl30": 112.0},  # poza Warszawą
        {"nr_ref": "X", "typ": "analogowa", "spl30": 112.0},  # brak w inwentaryzacji
    ]
    inw = [{"nr_ref": "A", "lat": "52.23", "lon": "21.01"}, {"nr_ref": "B", "lat": "52.25", "lon": "21.05"}, {"nr_ref": "Z", "lat": "52.40", "lon": "21.0"}]
    o = okregi(zasiegi, inw, PRZ)
    assert [x["nr"] for x in o] == ["A", "B"]
    assert o[0] == {"nr": "A", "typ": "cyfrowa", "lat": 52.23, "lon": 21.01, "r75": 345, "r70": 641, "r65": 1191}


def test_okregi_w_paczce():
    o = json.loads((ROOT / "public/pack/syreny/okregi.json").read_text(encoding="utf-8"))
    assert len(o) > 400
    assert {x["typ"] for x in o} == {"cyfrowa", "analogowa"}
    assert all(30 <= x["r75"] <= x["r70"] <= x["r65"] for x in o)
```

- [ ] **Krok 2:** `uv run --project pipeline pytest pipeline/syreny/test_okregi.py` → FAIL („No module named syreny.okregi”).
- [ ] **Krok 3: `pipeline/syreny/okregi.py`**

```python
"""Okręgi 75/70/65 dB wokół syren m.st. Warszawy (karta Syreny: „pokaż na mapie”).

Promień z modelu przybliżenia (przyblizenie.py; parametry zapisane przez build.py w public/pack/syreny/meta.json):
L(d) = A[spl30] + B * log10(d) - poprawka, więc d(X) = 10 ** ((A[spl30] - poprawka - X) / -B).
Okrąg nie widzi budynków. Wynik dla adresu (syreny.json) pochodzi z SOIA.
Uruchom po build.py: uv run --project pipeline python pipeline/syreny/okregi.py
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOIA = ROOT / "dane/soia-warszawa"
PACZKA = ROOT / "public/pack/syreny"
PROGI = (75, 70, 65)
MIN_M = 30.0
LON, LAT = (20.85, 21.28), (52.09, 52.37)  # bbox Warszawy (validate.py)


def promien(A: float, B: float, poprawka: float, prog: int) -> float:
    return max(MIN_M, 10 ** ((A - poprawka - prog) / -B))


def okregi(zasiegi: list[dict], inwentaryzacja: list[dict], przyblizenie: dict) -> list[dict]:
    A = {float(k): v for k, v in przyblizenie["poziom_A_wg_spl30"].items()}
    B, p = przyblizenie["spadek_db_na_dekade_odleglosci"], przyblizenie["poprawka_db"]
    wsp = {r["nr_ref"]: (float(r["lat"]), float(r["lon"])) for r in inwentaryzacja if r["lat"] and r["lon"]}
    wynik, byly = [], set()
    for z in zasiegi:
        nr = z["nr_ref"]
        if nr in byly or nr not in wsp or float(z["spl30"]) not in A:
            continue
        byly.add(nr)
        lat, lon = wsp[nr]
        if not (LON[0] <= lon <= LON[1] and LAT[0] <= lat <= LAT[1]):
            continue
        a = A[float(z["spl30"])]
        wynik.append({"nr": nr, "typ": z["typ"], "lat": round(lat, 6), "lon": round(lon, 6),
                      **{f"r{x}": round(promien(a, B, p, x)) for x in PROGI}})
    return wynik


if __name__ == "__main__":
    zasiegi = [f["properties"] for f in json.loads((SOIA / "coverage_ranges.geojson").read_text(encoding="utf-8"))["features"]]
    with open(SOIA / "tabele/syreny_inwentaryzacja_warszawa.csv", encoding="utf-8-sig") as f:
        inw = list(csv.DictReader(f))
    meta = json.loads((PACZKA / "meta.json").read_text(encoding="utf-8"))
    o = okregi(zasiegi, inw, meta["przyblizenie"])
    (PACZKA / "okregi.json").write_text(json.dumps(o, ensure_ascii=False, separators=(",", ":")), encoding="utf-8", newline="\n")
    print("okręgi syren:", len(o))
```

- [ ] **Krok 4:** wygeneruj paczkę i manifest:

```bash
uv run --project pipeline python pipeline/syreny/okregi.py
uv run --project pipeline python pipeline/build_manifest.py
uv run --project pipeline pytest pipeline/syreny && uv run --project pipeline python pipeline/validate.py
```

Oczekiwane: `okręgi syren: 425`, testy PASS, `paczka OK`.
- [ ] **Krok 5: PR** `S2a: okręgi syren w paczce` (pliki pipeline + `okregi.json` + `manifest.json`).

- [ ] **Krok 6: test frontendu** `src/modules/syreny/okregi.test.ts`

```ts
import { expect, it } from 'vitest';
import { distance } from 'geokdbush';
import { kolekcjaOkregow, kolo, najblizszeOkregi, opisOkregow, wOkregu, type Okrag } from './okregi';

const S: Okrag[] = [
  { nr: 'a', typ: 'cyfrowa', lat: 52.23, lon: 21.0, r75: 345, r70: 641, r65: 1191 },
  { nr: 'b', typ: 'analogowa', lat: 52.24, lon: 21.0, r75: 300, r70: 560, r65: 1000 },
];
const W = { lat: 52.233, lon: 21.0 }; // 334 m od a, 778 m od b

it('najbliższe syreny po odległości', () => {
  expect(najblizszeOkregi(S, W, 5).map((o) => o.nr)).toEqual(['a', 'b']);
  expect(najblizszeOkregi(S, W, 1)).toHaveLength(1);
});

it('najmocniejszy okrąg, w którym mieści się punkt', () => {
  const [a, b] = najblizszeOkregi(S, W);
  expect(wOkregu(a)).toBe(75);
  expect(wOkregu(b)).toBe(65);
  expect(wOkregu({ ...b, odlegloscM: 1200 })).toBeNull();
});

it('opis do szczegółów karty', () => {
  expect(opisOkregow(najblizszeOkregi(S, W))).toEqual([
    'Syrena cyfrowa, 330 m od Ciebie: mieścisz się w okręgu 75 dB.',
    'Syrena analogowa, 780 m od Ciebie: mieścisz się w okręgu 65 dB.',
  ]);
});

it('koło ma zadany promień, a każda syrena 3 okręgi', () => {
  const [lon, lat] = kolo(S[0], 1000).coordinates[0][16]; // punkt na północy
  const m = distance(21.0, 52.23, lon, lat) * 1000;
  expect(m).toBeGreaterThan(990);
  expect(m).toBeLessThan(1010);
  expect(kolekcjaOkregow(S).features).toHaveLength(6);
});
```

- [ ] **Krok 7:** FAIL → **Krok 8: `src/modules/syreny/okregi.ts`**

```ts
import type { ExpressionSpecification, Map as MapLibreMap } from 'maplibre-gl';
import type { FeatureCollection, Polygon } from 'geojson';
import { distance } from 'geokdbush';
import type { Wsp } from '../../contracts';

// public/pack/syreny/okregi.json (pipeline/syreny/okregi.py); promienie w metrach.
export type Okrag = Wsp & { nr: string; typ: 'cyfrowa' | 'analogowa'; r75: number; r70: number; r65: number };
export type OkragBlisko = Okrag & { odlegloscM: number };
type Prog = 75 | 70 | 65;
const PROGI: Prog[] = [65, 70, 75];

export const DOPISEK_OKREGOW =
  'Okręgi to przybliżenie z odległości i mocy syreny, bez budynków. Wynik dla adresu wyżej pochodzi z modelu SOIA, który uwzględnia zabudowę.';

export function najblizszeOkregi(okregi: Okrag[], w: Wsp, n = 5): OkragBlisko[] {
  return okregi
    .map((o) => ({ ...o, odlegloscM: distance(w.lon, w.lat, o.lon, o.lat) * 1000 }))
    .sort((a, b) => a.odlegloscM - b.odlegloscM)
    .slice(0, n);
}

export function wOkregu(o: OkragBlisko): Prog | null {
  if (o.odlegloscM <= o.r75) return 75;
  if (o.odlegloscM <= o.r70) return 70;
  if (o.odlegloscM <= o.r65) return 65;
  return null;
}

const metry = (m: number) => (m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`);

export function opisOkregow(bliskie: OkragBlisko[]): string[] {
  return bliskie.map((o) => {
    const p = wOkregu(o);
    return `Syrena ${o.typ}, ${metry(o.odlegloscM)} od Ciebie: ${p ? `mieścisz się w okręgu ${p} dB` : 'jesteś poza jej okręgiem 65 dB'}.`;
  });
}

// Koło o promieniu r metrów w rzucie lokalnym (wystarcza do kilku km).
export function kolo(c: Wsp, r: number, kroki = 64): Polygon {
  const kx = 111_320 * Math.cos((c.lat * Math.PI) / 180);
  const ky = 110_574;
  const pierscien = Array.from({ length: kroki + 1 }, (_, i) => {
    const t = (2 * Math.PI * i) / kroki;
    return [c.lon + (r * Math.cos(t)) / kx, c.lat + (r * Math.sin(t)) / ky];
  });
  return { type: 'Polygon', coordinates: [pierscien] };
}

export function kolekcjaOkregow(okregi: Okrag[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: okregi.flatMap((o) =>
      PROGI.map((p) => ({ type: 'Feature' as const, geometry: kolo(o, o[`r${p}`]), properties: { typ: o.typ, prog: p } })),
    ),
  };
}

let dane: Promise<Okrag[]> | null = null;
export function wczytajOkregi(): Promise<Okrag[]> {
  dane ??= fetch('/pack/syreny/okregi.json')
    .then((r) => {
      if (!r.ok) throw new Error('Nie pobrano okregi.json');
      return r.json() as Promise<Okrag[]>;
    })
    .catch((e: unknown) => {
      dane = null;
      throw e;
    });
  return dane;
}

const kolorTypu = ['match', ['get', 'typ'], 'cyfrowa', '#1d4ed8', '#b45309'] as unknown as ExpressionSpecification;
const przezroczystosc = ['match', ['get', 'prog'], 75, 0.16, 70, 0.1, 0.05] as unknown as ExpressionSpecification;
let licznik = 0;

// Akcja „mapa” karty Syreny: okręgi najbliższych syren (cyfrowe niebieskie, analogowe pomarańczowe) i widok na nie.
export function pokazOkregi(bliskie: Okrag[], w: Wsp): (map: MapLibreMap) => () => void {
  return (map) => {
    const id = `syreny-okregi-${++licznik}`;
    map.addSource(id, { type: 'geojson', data: kolekcjaOkregow(bliskie) });
    map.addLayer({ id: `${id}-wypelnienie`, type: 'fill', source: id, paint: { 'fill-color': kolorTypu, 'fill-opacity': przezroczystosc } });
    map.addLayer({ id: `${id}-kontur`, type: 'line', source: id, paint: { 'line-color': kolorTypu, 'line-width': 1.5 } });
    const pkt = bliskie.flatMap((o) => kolo(o, o.r65, 8).coordinates[0]).concat([[w.lon, w.lat]]);
    const lon = pkt.map((p) => p[0]);
    const lat = pkt.map((p) => p[1]);
    map.fitBounds([[Math.min(...lon), Math.min(...lat)], [Math.max(...lon), Math.max(...lat)]], { padding: 40, maxZoom: 16 });
    return () => {
      for (const l of [`${id}-kontur`, `${id}-wypelnienie`]) if (map.getLayer(l)) map.removeLayer(l);
      if (map.getSource(id)) map.removeSource(id);
    };
  };
}
```

- [ ] **Krok 9: okręgi w karcie.** Test — dopisz do `wskazowki.test.ts` (na górze: `vi.mock('./okregi', async (o) => ({ ...(await o<typeof import('./okregi')>()), wczytajOkregi: vi.fn(async () => []) }));` i `import { wczytajOkregi } from './okregi';`; domyślnie brak okręgów, więc testy z S1 przechodzą bez zmian):

```ts
it('akcja „mapa” z okręgami najbliższych syren i opis okręgów w szczegółach', async () => {
  vi.mocked(wynikSyreny).mockResolvedValue(w('75+', '75+'));
  vi.mocked(wczytajOkregi).mockResolvedValue([{ nr: 'a', typ: 'cyfrowa', lat: 52.2459, lon: 21.0874, r75: 345, r70: 641, r65: 1191 }]);
  const [karta] = await wskazowkiSyren(k());
  expect(karta.akcje.map((a) => a.typ)).toEqual(['mapa', 'przycisk']);
  expect(karta.szczegoly).toContain('Syrena cyfrowa, 20 m od Ciebie: mieścisz się w okręgu 75 dB.');
});

it('bez pliku okręgów karta działa dalej, bez akcji mapy', async () => {
  vi.mocked(wynikSyreny).mockResolvedValue(w('75+', '75+'));
  vi.mocked(wczytajOkregi).mockRejectedValue(new Error('brak'));
  expect((await wskazowkiSyren(k()))[0].akcje.map((a) => a.typ)).toEqual(['przycisk']);
});
```

W `wskazowki.ts` import `{ DOPISEK_OKREGOW, najblizszeOkregi, opisOkregow, pokazOkregi, wczytajOkregi } from './okregi'`, a w gałęzi z wynikiem:

```ts
  const bliskie = await wczytajOkregi()
    .then((o) => najblizszeOkregi(o, k.miejsce.adres, 5))
    .catch(() => []);
  const okregi = bliskie.length ? [{ typ: 'mapa' as const, pokaz: pokazOkregi(bliskie, k.miejsce.adres) }] : [];
  // … w zwracanej karcie:
      szczegoly: [/* linia „Normalnie…”, */ ...KROKI, ...opisOkregow(bliskie), ...(bliskie.length ? [DOPISEK_OKREGOW] : []), DOPISEK],
      akcje: [...okregi, druk],
```

- [ ] **Krok 10:** PASS → `npm run typecheck && npm test && npm run build`; ręcznie po V4: klik w kartę Syreny rysuje okręgi wokół 5 syren i przybliża mapę. **PR** `S2b: okręgi syren na mapie`.

**Gotowe, gdy:** `okregi.json` w paczce (425 syren, `validate.py` OK); klik w kartę Syreny pokazuje okręgi 75/70/65 dB 5 najbliższych syren w kolorze typu; w szczegółach „mieścisz się w okręgu … dB” i dopisek, że okręgi to przybliżenie bez budynków.

---

### S3. Karta Dotarcie do bliskich

**Pliki:**
- Utwórz: `src/modules/transport/wskazowki.ts`, `src/modules/transport/wskazowki.test.ts`
- Modyfikuj: `src/modules/transport/index.tsx`

**Interfejsy:**
- Używa: `trasa(od, do_, profil)` z `src/offline/trasy.ts` (V1: linia prosta, po V5: OSRM); `najblizszaStacjaZRowerami(wsp)` z `src/modules/live` (V1: `null`, po L3: prawdziwa).
- Produkuje: `wskazowkiBliskich(k): Promise<Wskazowka[]>` (karta `id: 'bliscy'`, `kolejnosc: 50`).

- [ ] **Krok 1: test** `src/modules/transport/wskazowki.test.ts`

```ts
import { afterEach, expect, it, vi } from 'vitest';
import type { KontekstWskazowek, MiejsceUzytkownika, Profil, Wsp } from '../../contracts';

vi.mock('../../offline/trasy', () => ({
  trasa: vi.fn(async (od: Wsp, d: Wsp, profil: Profil) => ({ od, do: d, profil, dystansM: 7240, czasMin: profil === 'pieszo' ? 95 : 30, linia: [], zrodlo: 'osrm' })),
}));
vi.mock('../live', () => ({
  najblizszaStacjaZRowerami: vi.fn(async () => ({ nazwa: 'Koneser', wsp: { lat: 52.256, lon: 21.046 }, rowery: 20, odlegloscM: 450 })),
}));
import { najblizszaStacjaZRowerami } from '../live';
import { wskazowkiBliskich } from './wskazowki';

const adres = (id: string, ulica: string, numer: string, lat: number) => ({ id, ulica, numer, dzielnica: 'Praga-Południe', lat, lon: 21.08 });
const dom: MiejsceUzytkownika = { rola: 'dom', etykieta: 'Dom', adres: adres('1', 'Grochowska', '200', 52.245) };
const bliska: MiejsceUzytkownika = { rola: 'bliska_osoba', etykieta: 'Bliska osoba', adres: adres('2', 'Kondratowicza', '8', 52.29) };
const tutaj: MiejsceUzytkownika = { rola: 'tutaj', etykieta: 'Tutaj', adres: adres('3', 'Wiatraczna', '1', 52.24) };
const k = (miejsca: MiejsceUzytkownika[], online = true): KontekstWskazowek => ({ miejsce: dom, miejsca, online });

afterEach(() => vi.clearAllMocks());

it('czas pieszo i rowerem do innych miejsc, stacja Veturilo, dopisek o blackoucie', async () => {
  const [w] = await wskazowkiBliskich(k([dom, bliska]));
  expect(w).toMatchObject({ id: 'bliscy', kolejnosc: 50, tytul: 'Dotarcie do bliskich', poziom: 'ok' });
  expect(w.tekst).toBe('Bliska osoba (Kondratowicza 8): pieszo ok. 95 min, rowerem ok. 30 min. Jeśli zabraknie prądu, tramwaje i metro stoją.');
  expect(w.szczegoly).toContain('Najbliższa stacja Veturilo z rowerami: Koneser, 450 m (wolne rowery: 20).');
  expect(w.akcje.map((a) => a.typ === 'trasa' && `${a.nazwa}/${a.profil}`)).toEqual([
    'Bliska osoba/pieszo',
    'Bliska osoba/rower',
    'Stacja Veturilo Koneser/pieszo',
  ]);
});

it('„Tutaj” nie jest celem; bez innych miejsc karta prosi o dodanie adresu', async () => {
  const [w] = await wskazowkiBliskich(k([tutaj, dom]));
  expect(w.poziom).toBe('brak');
  expect(w.tekst).toMatch(/^Dodaj adres/);
});

it('bez sieci nie pyta o rowery (zapisany stan rowerów jest nieaktualny)', async () => {
  const [w] = await wskazowkiBliskich(k([dom, bliska], false));
  expect(najblizszaStacjaZRowerami).not.toHaveBeenCalled();
  expect(w.szczegoly?.some((s) => s.includes('Veturilo'))).toBe(false);
});
```

- [ ] **Krok 2:** FAIL → **Krok 3: `src/modules/transport/wskazowki.ts`**

```ts
import type { Akcja, KontekstWskazowek, Trasa, Wskazowka } from '../../contracts';
import { trasa } from '../../offline/trasy';
import { najblizszaStacjaZRowerami } from '../live';

const metry = (m: number) => (m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`);
const czas = (t: Trasa) => `ok. ${t.czasMin} min${t.zrodlo === 'prosta' ? ' (w linii prostej)' : ''}`;
const BLACKOUT = 'Jeśli zabraknie prądu, tramwaje i metro stoją.';

export async function wskazowkiBliskich(k: KontekstWskazowek): Promise<Wskazowka[]> {
  const baza = { id: 'bliscy', kolejnosc: 50, tytul: 'Dotarcie do bliskich' };
  const od = k.miejsce.adres;
  const cele = k.miejsca.filter((m) => m.rola !== 'tutaj' && m.adres.id !== od.id);
  if (!cele.length) {
    const tekst = 'Dodaj adres pracy, przedszkola albo bliskiej osoby (przycisk „Adresy”), żeby zobaczyć, jak do nich dotrzeć.';
    return [{ ...baza, poziom: 'brak', tekst, akcje: [], zrodlo: 'Twoje adresy' }];
  }
  const trasy = await Promise.all(
    cele.map(async (m) => ({ m, pieszo: await trasa(od, m.adres, 'pieszo'), rower: await trasa(od, m.adres, 'rower') })),
  );
  // Stan rowerów zmienia się co minutę: bez sieci nie pokazujemy zapisanego.
  const stacja = k.online ? await najblizszaStacjaZRowerami(od).catch(() => null) : null;
  const wiersze = trasy.map(({ m, pieszo, rower }) => `${m.etykieta} (${m.adres.ulica} ${m.adres.numer}): pieszo ${czas(pieszo)}, rowerem ${czas(rower)}.`);
  const akcje: Akcja[] = trasy.flatMap(({ m }) => [
    { typ: 'trasa' as const, cel: m.adres, nazwa: m.etykieta, profil: 'pieszo' as const },
    { typ: 'trasa' as const, cel: m.adres, nazwa: m.etykieta, profil: 'rower' as const },
  ]);
  if (stacja) akcje.push({ typ: 'trasa', cel: stacja.wsp, nazwa: `Stacja Veturilo ${stacja.nazwa}`, profil: 'pieszo' });
  const poUlicach = trasy.some((t) => t.pieszo.zrodlo !== 'prosta');
  return [
    {
      ...baza,
      poziom: 'ok',
      tekst: `${wiersze[0]} ${BLACKOUT}`,
      szczegoly: [...wiersze, ...(stacja ? [`Najbliższa stacja Veturilo z rowerami: ${stacja.nazwa}, ${metry(stacja.odlegloscM)} (wolne rowery: ${stacja.rowery}).`] : [])],
      akcje,
      zrodlo: [poUlicach ? 'Trasy: OSRM, © OpenStreetMap contributors' : 'Szacunek z odległości w linii prostej', stacja && 'Veturilo (GBFS nextbike)']
        .filter(Boolean)
        .join('; '),
    },
  ];
}
```

- [ ] **Krok 4:** PASS. **Krok 5:** w `src/modules/transport/index.tsx` zamień atrapę na `wskazowki: wskazowkiBliskich,`.
- [ ] **Krok 6:** `npm run typecheck && npm test && npm run build`. **PR** `S3: karta Dotarcie do bliskich`.

**Gotowe, gdy:** dla każdego zapisanego miejsca (poza „Tutaj” i bieżącym) karta podaje czas pieszo i rowerem po ulicach (albo „w linii prostej” bez sieci), przy sieci najbliższą stację Veturilo z rowerami, zawsze dopisek o blackoucie; bez innych miejsc prosi o dodanie adresu.

---

## Pas O3: punkty pomocy

Równolegle od razu po V1: **P1 ∥ P2 ∥ P4** (P2 i P4 zmieniają po jednej linii w `src/modules/punkty/index.tsx`, konflikt przy rebase rozwiązuje drugi scalany). Potem **P3** (potrzebuje `wskazowki.ts` z P2; przychodnie z P1 dadzą dane, ale kod działa i bez nich).

### P1. Przychodnie z OpenStreetMap

**Pliki:**
- Modyfikuj: `pipeline/punkty/pobierz.py`, `pipeline/punkty/zrodla.py`, `pipeline/punkty/build.py`, `pipeline/punkty/test_build.py`, `src/modules/punkty/rodzaje.ts`
- Utwórz (wynik): `dane/probki/osm-przychodnie.json`; odśwież `dane/probki/punkty_pobrano.json`, `public/pack/punkty/punkty.json`, `public/pack/punkty/meta.json`, `public/pack/manifest.json`

**Interfejsy:**
- Produkuje: punkty `rodzaj: 'przychodnia'`, `zrodlo: 'osm-przychodnie'`, `id: 'osm-<node|way|relation>-<id>'`, `nazwa` (z `name`, inaczej „Szpital” albo „Przychodnia”), `adres` (`addr:street` + `addr:housenumber`), `dostepnosc` (`opening_hours`, `24/7` → „Całodobowa”). Klucz źródła `osm-przychodnie` w `Manifest.zrodla`.
- Zapytanie Overpass (sprawdzone 17.10 19:30, `out count` = 1044 obiekty):

```
[out:json][timeout:120];
(
  nwr["amenity"~"^(clinic|doctors|hospital)$"](52.09,20.85,52.37,21.28);
  nwr["healthcare"~"^(clinic|doctor|hospital|centre)$"](52.09,20.85,52.37,21.28);
);
out center tags;
```

- [ ] **Krok 1: test parsera** — dopisz do `pipeline/punkty/test_build.py`:

```python
def test_przychodnie_z_osm(tmp_path):
    plik = tmp_path / "osm.json"
    plik.write_text(json.dumps({"elements": [
        {"type": "node", "id": 1, "lat": 52.23, "lon": 21.01, "tags": {
            "amenity": "doctors", "name": "Przychodnia Lekarzy Rodzinnych", "addr:street": "Grochowska",
            "addr:housenumber": "200", "opening_hours": "Mo-Fr 08:00-18:00"}},
        {"type": "way", "id": 2, "center": {"lat": 52.25, "lon": 21.05}, "tags": {"amenity": "hospital", "opening_hours": "24/7"}},
        {"type": "node", "id": 3, "lat": 52.24, "lon": 21.02, "tags": {"healthcare": "pharmacy", "name": "Apteka"}},
        {"type": "relation", "id": 4, "tags": {"amenity": "clinic"}},  # bez współrzędnych
    ]}), encoding="utf-8")
    p = zrodla.przychodnie(plik)
    assert [x["id"] for x in p] == ["osm-node-1", "osm-way-2"]
    assert p[0] == {"id": "osm-node-1", "rodzaj": "przychodnia", "nazwa": "Przychodnia Lekarzy Rodzinnych", "adres": "Grochowska 200",
                    "dostepnosc": "Mo-Fr 08:00-18:00", "lat": 52.23, "lon": 21.01, "zrodlo": "osm-przychodnie"}
    assert (p[1]["nazwa"], p[1]["dostepnosc"], p[1]["lat"], "adres" in p[1]) == ("Szpital", "Całodobowa", 52.25, False)
```

W `test_punkty` dopisz: `assert c["przychodnia"] > 900`.

- [ ] **Krok 2:** `uv run --project pipeline pytest pipeline/punkty` → FAIL („module 'punkty.zrodla' has no attribute 'przychodnie'”).
- [ ] **Krok 3: parser** — dopisz na końcu `pipeline/punkty/zrodla.py`:

```python
def przychodnie(plik: Path = PROBKI / "osm-przychodnie.json") -> list[dict]:
    """OpenStreetMap (Overpass): przychodnie, gabinety lekarskie, szpitale, także prywatne (tych nie ma w danych miasta)."""
    wynik = []
    for e in json.loads(plik.read_text(encoding="utf-8"))["elements"]:
        t = e.get("tags", {})
        if t.get("healthcare") == "pharmacy" or t.get("amenity") == "pharmacy":
            continue  # apteki są z WFS miasta
        srodek = e if "lat" in e else e.get("center")
        if not srodek:
            continue
        nazwa = _tekst(t.get("name")) or ("Szpital" if t.get("amenity") == "hospital" else "Przychodnia")
        godziny = _tekst(t.get("opening_hours"))
        wynik.append(_punkt(
            id=f"osm-{e['type']}-{e['id']}", rodzaj="przychodnia", nazwa=nazwa,
            adres=_tekst(f"{t.get('addr:street', '')} {t.get('addr:housenumber', '')}"),
            dostepnosc="Całodobowa" if godziny == "24/7" else godziny,
            lat=srodek["lat"], lon=srodek["lon"], zrodlo="osm-przychodnie",
        ))
    return wynik
```

- [ ] **Krok 4:** PASS (poza `test_punkty`, który czeka na paczkę). **Krok 5: pobieranie** — w `pipeline/punkty/pobierz.py` dopisz pod `RPRM`:

```python
OVERPASS = "https://overpass-api.de/api/interpreter"
# Przychodnie, gabinety i szpitale w bbox Warszawy (sprawdzone 17.10: 1044 obiekty).
ZAPYTANIE_OSM = """[out:json][timeout:120];
(
  nwr["amenity"~"^(clinic|doctors|hospital)$"](52.09,20.85,52.37,21.28);
  nwr["healthcare"~"^(clinic|doctor|hospital|centre)$"](52.09,20.85,52.37,21.28);
);
out center tags;"""


def _overpass() -> urllib.request.Request:
    return urllib.request.Request(OVERPASS, data=urllib.parse.urlencode({"data": ZAPYTANIE_OSM}).encode(), method="POST")
```

i w słowniku `ZRODLA`: `"osm-przychodnie": ("osm-przychodnie.json", _overpass, None),`. Uruchom (Overpass bywa przeciążony: `_pobierz` ponawia 3 razy; jeśli dalej błąd, odczekaj minutę):

```bash
uv run --project pipeline python pipeline/punkty/pobierz.py osm-przychodnie
```

Oczekiwane: `osm-przychodnie: … B → dane/probki/osm-przychodnie.json`.

- [ ] **Krok 6: paczka** — w `pipeline/punkty/build.py` dopisz do `ZRODLA`:

```python
    "osm-przychodnie": (
        zrodla.przychodnie,
        "OpenStreetMap: przychodnie, gabinety i szpitale (Overpass API)",
        "ODbL",
        "https://www.openstreetmap.org/copyright",
    ),
```

W `src/modules/punkty/rodzaje.ts` dopisz na końcu `RODZAJE`: `{ rodzaj: 'przychodnia', etykieta: 'Przychodnia', zrodlo: 'osm-przychodnie', kolor: '#be185d' },`.

```bash
uv run --project pipeline python pipeline/punkty/build.py
uv run --project pipeline python pipeline/build_manifest.py
uv run --project pipeline pytest pipeline/punkty && uv run --project pipeline python pipeline/validate.py
npm run typecheck && npm test && npm run build
```

Oczekiwane: `osm-przychodnie: 10xx`, testy PASS, `paczka OK`.
- [ ] **Krok 7: PR** `P1: przychodnie z OpenStreetMap`.

**Gotowe, gdy:** w `punkty.json` jest ponad 900 punktów `przychodnia` z nazwą, adresem (jeśli jest w OSM) i godzinami; w stopce źródło „OpenStreetMap … (ODbL)”; `validate.py` OK.

---

### P2. Karta Najbliższe miejsce schronienia według PSP

**Pliki:**
- Utwórz: `src/modules/punkty/wskazowki.ts`, `src/modules/punkty/wskazowki.test.ts`
- Modyfikuj: `src/modules/punkty/index.tsx` (tylko pole `wskazowki`)

**Interfejsy:**
- Używa: `najblizsze`, `odlegloscM`, `formatujOdleglosc`, `linkPSP`, `zrodlaPaczki` z `./najblizsze`; `trasa()` z `src/offline/trasy.ts`.
- Produkuje: `kartaSchronienia(k): Promise<Wskazowka>` (`id: 'schronienie'`, `kolejnosc: 20`), `wskazowkiPunktow(k): Promise<Wskazowka[]>` (schronienie + medyczna; medyczna to atrapa do P3).

- [ ] **Krok 1: test** `src/modules/punkty/wskazowki.test.ts`

```ts
import { afterEach, expect, it, vi } from 'vitest';
import type { KontekstWskazowek, Punkt, Wsp } from '../../contracts';

vi.mock('./najblizsze', async (o) => ({ ...(await o<typeof import('./najblizsze')>()), najblizsze: vi.fn(), zrodlaPaczki: vi.fn() }));
vi.mock('../../offline/trasy', () => ({
  trasa: vi.fn(async (od: Wsp, d: Wsp) => ({ od, do: d, profil: 'pieszo', dystansM: 120, czasMin: 2, linia: [], zrodlo: 'osrm' })),
}));
import { najblizsze, zrodlaPaczki } from './najblizsze';
import { kartaSchronienia } from './wskazowki';

const adres = { id: '1', ulica: 'Grochowska', numer: '200', dzielnica: 'Praga-Południe', lat: 52.2457, lon: 21.0874 };
const k = (online = true): KontekstWskazowek => ({ miejsce: { rola: 'dom', etykieta: 'Dom', adres }, miejsca: [], online });
const psp = (id: string, dLat: number, dostepnosc: string): Punkt => ({ id, rodzaj: 'schronienie_psp', nazwa: `ul. Garwolińska ${id}`, dostepnosc, lat: adres.lat + dLat, lon: adres.lon, zrodlo: 'psp' });

afterEach(() => vi.clearAllMocks());

it('najbliższe miejsce z trasą pieszą, dwa kolejne w szczegółach, link do aplikacji PSP', async () => {
  vi.mocked(zrodlaPaczki).mockResolvedValue({ psp: { nazwa: 'Miejsca schronienia według PSP (gdziesieukryc.pl)', licencja: 'za zgodą PSP', url: 'https://gdziesieukryc.pl', pobrano: '2026-10-17' } });
  vi.mocked(najblizsze).mockResolvedValue([psp('9', 0.001, 'Na żądanie'), psp('11', 0.003, 'Całodobowa'), psp('13', 0.005, 'Określone godziny')]);
  const w = await kartaSchronienia(k());
  expect(w).toMatchObject({ id: 'schronienie', kolejnosc: 20, tytul: 'Najbliższe miejsce schronienia według PSP', poziom: 'ok' });
  expect(w.tekst).toBe('ul. Garwolińska 9, 120 m, ok. 2 min pieszo. Dostępność: na żądanie.');
  expect(w.szczegoly).toEqual(['2. ul. Garwolińska 11, 330 m, całodobowa', '3. ul. Garwolińska 13, 560 m, określone godziny']);
  expect(w.akcje[0]).toMatchObject({ typ: 'trasa', nazwa: 'ul. Garwolińska 9', profil: 'pieszo' });
  expect(w.akcje[1]).toMatchObject({ typ: 'link', etykieta: 'Otwórz w aplikacji PSP' });
  expect(w.akcje).toHaveLength(4);
  expect(w.zrodlo).toBe('Miejsca schronienia według PSP (gdziesieukryc.pl)');
});

it('dalej niż 1 km: poziom „uwaga”; bez paczki offline: karta „brak”', async () => {
  vi.mocked(zrodlaPaczki).mockRejectedValue(new Error('brak'));
  vi.mocked(najblizsze).mockResolvedValue([psp('9', 0.02, 'Na żądanie')]);
  expect((await kartaSchronienia(k())).poziom).toBe('uwaga');
  vi.mocked(najblizsze).mockRejectedValue(new Error('brak paczki'));
  const w = await kartaSchronienia(k(false));
  expect(w).toMatchObject({ poziom: 'brak', akcje: [] });
  expect(w.tekst).toMatch(/^Brak sieci/);
});
```

- [ ] **Krok 2:** FAIL → **Krok 3: `src/modules/punkty/wskazowki.ts`**

```ts
import type { KontekstWskazowek, Punkt, Wskazowka } from '../../contracts';
import { trasa } from '../../offline/trasy';
import { formatujOdleglosc, linkPSP, najblizsze, odlegloscM, zrodlaPaczki } from './najblizsze';

const malaLitera = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const ZRODLO_PSP = 'Miejsca schronienia według PSP (gdziesieukryc.pl)';

export async function kartaSchronienia(k: KontekstWskazowek): Promise<Wskazowka> {
  const baza = { id: 'schronienie', kolejnosc: 20, tytul: 'Najbliższe miejsce schronienia według PSP' };
  const zrodlo = (await zrodlaPaczki().catch(() => null))?.psp?.nazwa ?? ZRODLO_PSP;
  const od = k.miejsce.adres;
  let punkty: Punkt[];
  try {
    punkty = await najblizsze(od, 'schronienie_psp', 3);
  } catch {
    const tekst = k.online
      ? 'Źródło chwilowo niedostępne: nie udało się wczytać miejsc schronienia według PSP.'
      : 'Brak sieci i brak pobranej paczki z miejscami schronienia według PSP.';
    return { ...baza, poziom: 'brak', tekst, akcje: [], zrodlo };
  }
  if (!punkty.length) return { ...baza, poziom: 'brak', tekst: 'Brak miejsc schronienia według PSP w promieniu 20 km.', akcje: [], zrodlo };
  const [p, ...kolejne] = punkty;
  const t = await trasa(od, p, 'pieszo');
  const d = odlegloscM(od, p);
  const ile = t.zrodlo === 'prosta' ? `${formatujOdleglosc(d)} w linii prostej` : formatujOdleglosc(t.dystansM);
  return {
    ...baza,
    poziom: d <= 1000 ? 'ok' : 'uwaga',
    tekst: `${p.nazwa}, ${ile}, ok. ${t.czasMin} min pieszo.${p.dostepnosc ? ` Dostępność: ${malaLitera(p.dostepnosc)}.` : ''}`,
    szczegoly: kolejne.map((q, i) => `${i + 2}. ${q.nazwa}, ${formatujOdleglosc(odlegloscM(od, q))}${q.dostepnosc ? `, ${malaLitera(q.dostepnosc)}` : ''}`),
    akcje: [
      { typ: 'trasa', cel: { lat: p.lat, lon: p.lon }, nazwa: p.nazwa, profil: 'pieszo' },
      { typ: 'link', url: linkPSP(p), etykieta: 'Otwórz w aplikacji PSP' },
      ...kolejne.map((q) => ({ typ: 'trasa' as const, cel: { lat: q.lat, lon: q.lon }, nazwa: q.nazwa, profil: 'pieszo' as const })),
    ],
    zrodlo,
  };
}

// Atrapa do P3 (karta Pomoc medyczna).
async function kartaMedyczna(): Promise<Wskazowka> {
  return { id: 'medyczna', kolejnosc: 30, tytul: 'Pomoc medyczna', poziom: 'brak', tekst: 'Karta w budowie.', akcje: [], zrodlo: 'atrapa' };
}

export async function wskazowkiPunktow(k: KontekstWskazowek): Promise<Wskazowka[]> {
  return Promise.all([kartaSchronienia(k), kartaMedyczna()]);
}
```

- [ ] **Krok 4:** PASS. **Krok 5:** w `index.tsx` zamień atrapę `wskazowki` na `wskazowki: wskazowkiPunktow,` (import z `./wskazowki`).
- [ ] **Krok 6:** `npm run typecheck && npm test && npm run build`. **PR** `P2: karta Najbliższe miejsce schronienia`.

**Gotowe, gdy:** karta podaje najbliższe miejsce schronienia według PSP z odległością, czasem pieszo i dostępnością, 2 kolejne w szczegółach, trasę po kliknięciu i link do aplikacji PSP; bez paczki szara karta z wyjaśnieniem.

---

### P3. Karta Pomoc medyczna (po P2)

**Pliki:**
- Utwórz: `src/modules/punkty/medyczna.ts`, `src/modules/punkty/medyczna.test.ts`
- Modyfikuj: `src/modules/punkty/wskazowki.ts` (atrapa `kartaMedyczna` → import z `./medyczna`)

**Interfejsy:**
- Używa: `najblizsze`, `odlegloscM`, `formatujOdleglosc` z `./najblizsze`; rodzaj `przychodnia` z P1 (bez P1 po prostu go nie ma w karcie).
- Produkuje: `kartaMedyczna(k): Promise<Wskazowka>` (`id: 'medyczna'`, `kolejnosc: 30`).

- [ ] **Krok 1: test** `src/modules/punkty/medyczna.test.ts`

```ts
import { afterEach, expect, it, vi } from 'vitest';
import type { KontekstWskazowek, Punkt, RodzajPunktu, Wsp } from '../../contracts';

vi.mock('./najblizsze', async (o) => ({ ...(await o<typeof import('./najblizsze')>()), najblizsze: vi.fn() }));
import { najblizsze } from './najblizsze';
import { kartaMedyczna } from './medyczna';

const adres = { id: '1', ulica: 'Grochowska', numer: '200', dzielnica: 'Praga-Południe', lat: 52.2457, lon: 21.0874 };
const k = (online = true): KontekstWskazowek => ({ miejsce: { rola: 'dom', etykieta: 'Dom', adres }, miejsca: [], online });
const DLAT: Partial<Record<RodzajPunktu, number>> = { aed: 0.001, sor: 0.02, apteka: 0.003, przychodnia: 0.004 };
const punkt = (rodzaj: RodzajPunktu): Punkt => ({ id: rodzaj, rodzaj, nazwa: `Nazwa ${rodzaj}`, adres: 'Grochowska 1', dostepnosc: 'Całodobowa', lat: adres.lat + DLAT[rodzaj]!, lon: adres.lon, zrodlo: 'x' });

afterEach(() => vi.clearAllMocks());

it('najbliższy AED, SOR, apteka i przychodnia z odległością i trasą do każdego', async () => {
  vi.mocked(najblizsze).mockImplementation(async (_w: Wsp, r: RodzajPunktu) => [punkt(r)]);
  const w = await kartaMedyczna(k());
  expect(w).toMatchObject({ id: 'medyczna', kolejnosc: 30, tytul: 'Pomoc medyczna', poziom: 'ok' });
  expect(w.tekst).toBe('AED 110 m · SOR 2,2 km · apteka 330 m · przychodnia 440 m.');
  expect(w.szczegoly?.[0]).toBe('W nagłym wypadku dzwoń 112.');
  expect(w.szczegoly).toContain('AED: Nazwa aed, Grochowska 1, 110 m. Całodobowa');
  expect(w.akcje.map((a) => a.typ === 'trasa' && a.nazwa)).toEqual(['AED: Nazwa aed', 'SOR: Nazwa sor', 'Apteka: Nazwa apteka', 'Przychodnia: Nazwa przychodnia']);
});

it('AED dalej niż 1 km albo brak AED: „uwaga”; brak wszystkiego bez sieci: „brak”', async () => {
  vi.mocked(najblizsze).mockImplementation(async (_w: Wsp, r: RodzajPunktu) => (r === 'aed' ? [] : [punkt(r)]));
  expect((await kartaMedyczna(k())).poziom).toBe('uwaga');
  vi.mocked(najblizsze).mockRejectedValue(new Error('brak paczki'));
  const w = await kartaMedyczna(k(false));
  expect(w).toMatchObject({ poziom: 'brak', akcje: [] });
  expect(w.tekst).toMatch(/^Brak sieci/);
});
```

- [ ] **Krok 2:** FAIL → **Krok 3: `src/modules/punkty/medyczna.ts`**

```ts
import type { KontekstWskazowek, Punkt, RodzajPunktu, Wskazowka } from '../../contracts';
import { formatujOdleglosc, najblizsze, odlegloscM } from './najblizsze';

const RODZAJE: { rodzaj: RodzajPunktu; nazwa: string }[] = [
  { rodzaj: 'aed', nazwa: 'AED' },
  { rodzaj: 'sor', nazwa: 'SOR' },
  { rodzaj: 'apteka', nazwa: 'Apteka' },
  { rodzaj: 'przychodnia', nazwa: 'Przychodnia' },
];
const ZRODLO = 'AED i apteki: m.st. Warszawa; SOR: rprm.ezdrowie.gov.pl; przychodnie: © OpenStreetMap contributors (ODbL)';
const krotko = (n: string) => (n === n.toUpperCase() ? n : n.toLowerCase()); // „AED”, „SOR”, „apteka”

export async function kartaMedyczna(k: KontekstWskazowek): Promise<Wskazowka> {
  const baza = { id: 'medyczna', kolejnosc: 30, tytul: 'Pomoc medyczna' };
  const od = k.miejsce.adres;
  const wyniki = await Promise.all(
    RODZAJE.map(async (r) => ({ ...r, p: ((await najblizsze(od, r.rodzaj, 1).catch(() => [])) as Punkt[])[0] })),
  );
  const z = wyniki.filter((w): w is typeof w & { p: Punkt } => Boolean(w.p));
  if (!z.length) {
    const tekst = k.online ? 'Źródło chwilowo niedostępne: nie udało się wczytać punktów pomocy.' : 'Brak sieci i brak pobranej paczki z punktami pomocy.';
    return { ...baza, poziom: 'brak', tekst, akcje: [], zrodlo: ZRODLO };
  }
  const m = (p: Punkt) => formatujOdleglosc(odlegloscM(od, p));
  const aed = z.find((w) => w.rodzaj === 'aed');
  return {
    ...baza,
    poziom: aed && odlegloscM(od, aed.p) <= 1000 ? 'ok' : 'uwaga',
    tekst: `${z.map((w) => `${krotko(w.nazwa)} ${m(w.p)}`).join(' · ')}.`,
    szczegoly: [
      'W nagłym wypadku dzwoń 112.',
      ...z.map((w) => `${w.nazwa}: ${w.p.nazwa}${w.p.adres ? `, ${w.p.adres}` : ''}, ${m(w.p)}.${w.p.dostepnosc ? ` ${w.p.dostepnosc}` : ''}`),
    ],
    akcje: z.map((w) => ({ typ: 'trasa' as const, cel: { lat: w.p.lat, lon: w.p.lon }, nazwa: `${w.nazwa}: ${w.p.nazwa}`, profil: 'pieszo' as const })),
    zrodlo: ZRODLO,
  };
}
```

- [ ] **Krok 4:** PASS. **Krok 5:** w `wskazowki.ts` usuń atrapę `kartaMedyczna` i dodaj `import { kartaMedyczna } from './medyczna';`, a w `wskazowkiPunktow` wywołaj `kartaMedyczna(k)`.
- [ ] **Krok 6:** `npm run typecheck && npm test && npm run build`. **PR** `P3: karta Pomoc medyczna`.

**Gotowe, gdy:** karta podaje najbliższy AED, SOR, aptekę i przychodnię z odległością, w szczegółach adres i dostępność oraz „W nagłym wypadku dzwoń 112.”, trasę do każdego; bez paczki szara karta.

---

### P4. Kafelki: 7 warstw włączanych pojedynczo, pusta mapa na starcie

**Pliki:**
- Utwórz: `src/modules/punkty/kafelki.ts`, `src/modules/punkty/kafelki.test.ts`
- Modyfikuj: `src/modules/punkty/warstwy.ts` (nowa funkcja `dodajWarstweRodzaju`, stara `dodajWarstwy` zostaje dla panelu), `src/modules/punkty/warstwy.test.ts`, `src/modules/punkty/index.tsx` (pole `kafelki`, usunięte pole `dodajWarstwy`)

**Interfejsy:**
- Używa: `Kafelek` z kontraktu; `wczytajPunkty`, `zrodlaPaczki` z `./najblizsze`; `RODZAJE` z `./rodzaje` (kolory).
- Produkuje: `kafelki: Kafelek[]` w kolejności: Miejsca schronienia PSP, AED, SOR, Apteki, Przychodnie, Toalety, Metro; `dodajWarstweRodzaju(map, rodzaj): () => void`.

- [ ] **Krok 1: test** — dopisz do `src/modules/punkty/warstwy.test.ts` (używa istniejących `atrapa()`, `P`, `poczekaj`):

```ts
import { dodajWarstweRodzaju } from './warstwy';

it('warstwa jednego rodzaju: tylko jego punkty; PSP w klastrach; sprzątanie usuwa wszystko', async () => {
  vi.mocked(wczytajPunkty).mockResolvedValue(P);
  vi.mocked(zrodlaPaczki).mockResolvedValue({});
  const a = atrapa();
  const sprzatnijAed = dodajWarstweRodzaju(a.map, 'aed');
  const sprzatnijPsp = dodajWarstweRodzaju(a.map, 'schronienie_psp');
  await poczekaj();
  expect(a.zrodla.get('punkty-aed')!.data.features.map((f) => f.properties?.nazwa)).toEqual(['B']);
  expect(a.zrodla.get('punkty-aed')!.cluster).toBeUndefined();
  expect(a.zrodla.get('punkty-schronienie_psp')!.cluster).toBe(true);
  sprzatnijAed();
  sprzatnijPsp();
  expect(a.zrodla.size).toBe(0);
  expect(a.warstwy.size).toBe(0);
  expect(a.subskrypcje.every((s) => s.unsubscribe.mock.calls.length === 1)).toBe(true);
});

it('wyłączenie kafelka przed wczytaniem danych nie dodaje warstwy', async () => {
  vi.mocked(wczytajPunkty).mockResolvedValue(P);
  vi.mocked(zrodlaPaczki).mockResolvedValue({});
  const a = atrapa();
  dodajWarstweRodzaju(a.map, 'aed')();
  await poczekaj();
  expect(a.zrodla.size).toBe(0);
});
```

Test kafelków `src/modules/punkty/kafelki.test.ts`:

```ts
import { expect, it, vi } from 'vitest';

vi.mock('./warstwy', () => ({ dodajWarstweRodzaju: vi.fn(() => () => {}) }));
import { dodajWarstweRodzaju } from './warstwy';
import { kafelki } from './kafelki';

it('7 kafelków w kolejności z HANDOFF-v3 i każdy włącza warstwę swojego rodzaju', () => {
  expect(kafelki.map((k) => k.etykieta)).toEqual(['Miejsca schronienia PSP', 'AED', 'SOR', 'Apteki', 'Przychodnie', 'Toalety', 'Metro']);
  const mapa = {} as Parameters<(typeof kafelki)[number]['dodajWarstwe']>[0];
  kafelki[1].dodajWarstwe(mapa);
  expect(dodajWarstweRodzaju).toHaveBeenCalledWith(mapa, 'aed');
});
```

- [ ] **Krok 2:** FAIL → **Krok 3: `dodajWarstweRodzaju`** — dopisz do `src/modules/punkty/warstwy.ts` (import `RodzajPunktu` z kontraktu):

```ts
// Kafelek (P4): warstwa jednego rodzaju punktów. PSP (ok. 8 tys.) w klastrach, reszta pojedynczo.
export function dodajWarstweRodzaju(map: MapLibreMap, rodzaj: RodzajPunktu): () => void {
  let aktywne = true;
  const id = `punkty-${rodzaj}`;
  const klastry = rodzaj === 'schronienie_psp';
  const warstwy = klastry ? [`${id}-klastry`, `${id}-liczba`, `${id}-punkty`] : [`${id}-punkty`];
  const subskrypcje: Subscription[] = [];

  Promise.all([wczytajPunkty(), zrodlaPaczki().catch(() => ({}))])
    .then(([punkty, zrodla]) => {
      if (!aktywne) return;
      map.addSource(id, { type: 'geojson', data: kolekcja(punkty.filter((p) => p.rodzaj === rodzaj)), ...(klastry ? { cluster: true, clusterRadius: 40 } : {}) });
      if (klastry) {
        map.addLayer({
          id: warstwy[0],
          type: 'circle',
          source: id,
          filter: ['has', 'point_count'],
          paint: { 'circle-color': '#b91c1c', 'circle-opacity': 0.85, 'circle-radius': ['step', ['get', 'point_count'], 14, 50, 18, 500, 24] },
        });
        map.addLayer({
          id: warstwy[1],
          type: 'symbol',
          source: id,
          filter: ['has', 'point_count'],
          layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Medium'], 'text-size': 12 },
          paint: { 'text-color': '#ffffff' },
        });
      }
      map.addLayer({
        id: `${id}-punkty`,
        type: 'circle',
        source: id,
        ...(klastry ? { filter: ['!', ['has', 'point_count']] as ExpressionSpecification } : {}),
        paint: { 'circle-color': kolor, 'circle-radius': 6, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 1.5 },
      });
      subskrypcje.push(map.on('click', `${id}-punkty`, (e) => popup(map, e, zrodla)));
      if (klastry) {
        subskrypcje.push(
          map.on('click', warstwy[0], async (e) => {
            const f = e.features?.[0];
            if (!f || f.geometry.type !== 'Point') return;
            const zoom = await map.getSource<GeoJSONSource>(id)?.getClusterExpansionZoom(f.properties.cluster_id);
            map.easeTo({ center: f.geometry.coordinates as [number, number], zoom });
          }),
        );
      }
    })
    // bez paczki kafelek nic nie rysuje; karty pokazują błąd źródła
    .catch(() => {});

  return () => {
    aktywne = false;
    subskrypcje.forEach((s) => s.unsubscribe());
    warstwy.forEach((l) => map.getLayer(l) && map.removeLayer(l));
    if (map.getSource(id)) map.removeSource(id);
  };
}
```

`src/modules/punkty/kafelki.ts`:

```ts
import type { Kafelek, RodzajPunktu } from '../../contracts';
import { RODZAJE } from './rodzaje';
import { dodajWarstweRodzaju } from './warstwy';

// Kolejność i krótkie etykiety z HANDOFF-v3 §2.
const KAFELKI: [RodzajPunktu, string][] = [
  ['schronienie_psp', 'Miejsca schronienia PSP'],
  ['aed', 'AED'],
  ['sor', 'SOR'],
  ['apteka', 'Apteki'],
  ['przychodnia', 'Przychodnie'],
  ['toaleta', 'Toalety'],
  ['metro', 'Metro'],
];

export const kafelki: Kafelek[] = KAFELKI.map(([id, etykieta]) => ({
  id,
  etykieta,
  kolor: RODZAJE.find((r) => r.rodzaj === id)?.kolor ?? '#be185d',
  dodajWarstwe: (map) => dodajWarstweRodzaju(map, id),
}));
```

- [ ] **Krok 4:** PASS. **Krok 5: `index.tsx`** — usuń `dodajWarstwy` z obiektu `modul` (mapa ma być pusta na starcie), zamień `kafelki: []` na `kafelki,` (import z `./kafelki`). Import `dodajWarstwy` usuń, jeśli nie jest już używany.
- [ ] **Krok 6:** `npm run typecheck && npm test && npm run build`; ręcznie po V4: na starcie brak punktów na mapie; „AED” włącza zielone punkty, drugi klik je usuwa; „Miejsca schronienia PSP” pokazuje klastry. **PR** `P4: kafelki warstw punktów`.

**Gotowe, gdy:** na starcie mapa nie ma punktów; każdy z 7 kafelków włącza i wyłącza tylko swoją warstwę; popup punktu ze źródłem działa jak wcześniej.

---

## Pas O4: proxy tras, powietrze, rowery, pitch

Równolegle od razu po V1: **L1 ∥ L2 ∥ L3 ∥ L4** (L2 i L3 zmieniają po jednej linii w `src/modules/live/index.tsx`).

### L1. Proxy tras OSRM `/api/live/trasa`

**Pliki:**
- Utwórz: `server/live/trasa.ts`, `server/live/trasa.test.ts`, `dane/probki/osrm-pieszo.json`
- Modyfikuj: `server/live/index.ts`

**Interfejsy:**
- Produkuje: `GET /api/live/trasa?od=<lon>,<lat>&do=<lon>,<lat>&profil=pieszo|rower` →
  - `200 { dystansM: number; czasMin: number; linia: [number, number][] }` (`Pick<Trasa, 'dystansM' | 'czasMin' | 'linia'>`), nagłówek `Cache-Control: public, s-maxage=86400`;
  - `400 { blad: 'parametry' }` dla złych współrzędnych, punktu poza bbox Warszawy albo innego profilu;
  - `502 { blad: 'timeout' | 'klucz_lub_usluga' | 'schemat' }` przez istniejące `blad()` z `server/portal.ts`.
- Konsument: `trasa()` w `src/offline/trasy.ts` (V5). Worker (`/^\/api\/live\/([a-z]+)$/`) i `npm run dev` obsłużą nowy handler bez zmian.
- OSRM (sprawdzone 17.10): `https://routing.openstreetmap.de/routed-foot/route/v1/driving/<lon,lat;lon,lat>?overview=full&geometries=geojson` i `…/routed-bike/…`; odpowiedź `{ code: 'Ok', routes: [{ distance, duration, geometry: { coordinates } }] }`.

- [ ] **Krok 1: próbka** (CLAUDE.md: parser na podstawie zapisanej próbki):

```bash
curl -s -A "warszawa-kryzys (hackathon)" "https://routing.openstreetmap.de/routed-foot/route/v1/driving/21.0122,52.2297;21.0180,52.2310?overview=full&geometries=geojson" -o dane/probki/osrm-pieszo.json
python3 -c "import json;r=json.load(open('dane/probki/osrm-pieszo.json'))['routes'][0];print(round(r['distance']),round(r['duration']/60),len(r['geometry']['coordinates']))"
```

17.10 o 19:20 wyszło `444 6 33`. Jeśli wyjdzie inaczej (zmiany w OSM), wpisz w teście swoje liczby.

- [ ] **Krok 2: test** `server/live/trasa.test.ts`

```ts
// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { handler, mapujTrase, punkt } from './trasa';

const probka = JSON.parse(readFileSync('dane/probki/osrm-pieszo.json', 'utf-8'));
const zapytanie = (q: string) => new Request(`http://x/api/live/trasa?${q}`);

describe('punkt', () => {
  it('„lon,lat” w Warszawie, zaokrąglone do 5 miejsc', () => {
    expect(punkt('21.0122,52.2297')).toBe('21.01220,52.22970');
    expect(punkt('19.94,50.06')).toBeNull(); // Kraków
    expect(punkt('abc')).toBeNull();
    expect(punkt(null)).toBeNull();
  });
});

describe('mapujTrase', () => {
  it('dystans w metrach, czas w minutach, linia [lon, lat] z próbki', () => {
    const t = mapujTrase(probka);
    expect(t.dystansM).toBe(444);
    expect(t.czasMin).toBe(6);
    expect(t.linia).toHaveLength(33);
    expect(t.linia[0][0]).toBeCloseTo(21.0122, 3);
  });
  it('brak trasy to błąd schematu', () => {
    expect(() => mapujTrase({ code: 'NoRoute', routes: [] })).toThrow('osrm: NoRoute');
  });
});

describe('handler', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('złe parametry: 400 bez pytania OSRM', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    for (const q of ['od=21.0122,52.2297&profil=pieszo', 'od=19.9,50.06&do=21.018,52.231&profil=pieszo', 'od=21.0122,52.2297&do=21.018,52.231&profil=auto']) {
      const r = await handler(zapytanie(q), {});
      expect(r.status).toBe(400);
      expect(await r.json()).toEqual({ blad: 'parametry' });
    }
    expect(f).not.toHaveBeenCalled();
  });

  it('pieszo: pyta routed-foot z User-Agent projektu i zwraca trasę z cache na dobę', async () => {
    const f = vi.fn(async (_url: string, _init?: RequestInit) => Response.json(probka));
    vi.stubGlobal('fetch', f);
    const r = await handler(zapytanie('od=21.0122,52.2297&do=21.018,52.231&profil=pieszo'), {});
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({ dystansM: 444, czasMin: 6 });
    expect(r.headers.get('Cache-Control')).toBe('public, s-maxage=86400');
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('https://routing.openstreetmap.de/routed-foot/route/v1/driving/21.01220,52.22970;21.01800,52.23100?overview=full&geometries=geojson');
    expect(new Headers(init?.headers).get('User-Agent')).toMatch(/^warszawa-kryzys/);
  });

  it('rower: pyta routed-bike', async () => {
    const f = vi.fn(async (_url: string) => Response.json(probka));
    vi.stubGlobal('fetch', f);
    await handler(zapytanie('od=21.0122,52.2297&do=21.018,52.231&profil=rower'), {});
    expect(f.mock.calls[0][0]).toContain('/routed-bike/');
  });

  it('OSRM nie odpowiada: 502 timeout', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('fetch failed');
    });
    const r = await handler(zapytanie('od=21.0122,52.2297&do=21.018,52.231&profil=pieszo'), {});
    expect(r.status).toBe(502);
    expect(await r.json()).toEqual({ blad: 'timeout' });
  });
});
```

- [ ] **Krok 3:** `npx vitest run server/live/trasa.test.ts` → FAIL („Failed to resolve import ./trasa”).
- [ ] **Krok 4: `server/live/trasa.ts`**

```ts
import type { Trasa } from '../../src/contracts';
import { BladPortalu, blad } from '../portal';

// Publiczne serwery OSRM FOSSGIS (routing.openstreetmap.de); jeden profil na serwer, „driving” w ścieżce to stała nazwa.
const OSRM = {
  pieszo: 'https://routing.openstreetmap.de/routed-foot/route/v1/driving',
  rower: 'https://routing.openstreetmap.de/routed-bike/route/v1/driving',
} as const;
// Zasady serwera wymagają identyfikacji aplikacji.
const UA = 'warszawa-kryzys (hackathon; https://github.com/startupowe1konto1/AI-Slopers-Hackathon)';
const LON = [20.85, 21.28];
const LAT = [52.09, 52.37];
const DOBA_S = 86_400;

export type OdpowiedzTrasy = Pick<Trasa, 'dystansM' | 'czasMin' | 'linia'>;
type Osrm = { code: string; routes?: { distance: number; duration: number; geometry: { coordinates: [number, number][] } }[] };

// „lon,lat” w bbox Warszawy → „lon,lat” z 5 miejscami (ok. 1 m; te same trasy trafiają w cache) albo null.
export function punkt(v: string | null): string | null {
  const [lon, lat] = (v ?? '').split(',').map(Number);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  if (lon < LON[0] || lon > LON[1] || lat < LAT[0] || lat > LAT[1]) return null;
  return `${lon.toFixed(5)},${lat.toFixed(5)}`;
}

export function mapujTrase(d: Osrm): OdpowiedzTrasy {
  const r = d.routes?.[0];
  if (d.code !== 'Ok' || !r) throw new BladPortalu('schemat', `osrm: ${d.code}`);
  return { dystansM: Math.round(r.distance), czasMin: Math.max(1, Math.round(r.duration / 60)), linia: r.geometry.coordinates };
}

// Cache Workera (Cloudflare). W `npm run dev` i w testach go nie ma.
const cacheWorkera = (): Cache | undefined => (globalThis as { caches?: { default?: Cache } }).caches?.default;

export async function handler(req: Request, _env: { WARSAW_API_TOKEN?: string }): Promise<Response> {
  const q = new URL(req.url).searchParams;
  const od = punkt(q.get('od'));
  const do_ = punkt(q.get('do'));
  const profil = q.get('profil');
  if (!od || !do_ || (profil !== 'pieszo' && profil !== 'rower')) return Response.json({ blad: 'parametry' }, { status: 400 });

  const klucz = new Request(`https://trasa.cache/${profil}/${od};${do_}`);
  const cache = cacheWorkera();
  const zapisana = await cache?.match(klucz);
  if (zapisana) return zapisana;

  try {
    let r: Response;
    try {
      r = await fetch(`${OSRM[profil]}/${od};${do_}?overview=full&geometries=geojson`, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      throw new BladPortalu('timeout', 'osrm');
    }
    if (!r.ok) throw new BladPortalu('klucz_lub_usluga', `osrm: HTTP ${r.status}`);
    const odp = Response.json(mapujTrase((await r.json()) as Osrm), { headers: { 'Cache-Control': `public, s-maxage=${DOBA_S}` } });
    await cache?.put(klucz, odp.clone());
    return odp;
  } catch (e) {
    return blad(e);
  }
}
```

- [ ] **Krok 5:** PASS. **Krok 6: rejestr** `server/live/index.ts`: `import { handler as trasa } from './trasa';` i `trasa` w obiekcie `handlery`.
- [ ] **Krok 7:** `npm run typecheck && npm test && npm run build`; `npm run dev` i:

```bash
curl -s "http://localhost:5173/api/live/trasa?od=21.0122,52.2297&do=21.018,52.231&profil=pieszo" | head -c 120
```

Oczekiwane: `{"dystansM":444,"czasMin":6,"linia":[[21.01…`. Po wdrożeniu to samo na `https://warszawa-kryzys.startupaplikujmy.workers.dev/api/live/trasa?…`.
- [ ] **Krok 8: PR** `L1: proxy tras OSRM`.

**Gotowe, gdy:** endpoint działa lokalnie i na Cloudflare, waliduje wejście (400), cache'uje trasę na dobę w Workerze, błędy OSRM dają 502 z rodzajem błędu.

---

### L2. Karta Powietrze i wiatr

**Pliki:**
- Utwórz: `src/modules/live/wskazowki.ts`, `src/modules/live/wskazowki.test.ts`
- Modyfikuj: `src/modules/live/dym.ts` (+ `wczytajDym`, `zapiszDym`, `wStozku`), `src/modules/live/dym.test.ts`, `src/modules/live/okolica.ts` (+ `zKierunku`), `src/modules/live/Panel.tsx` (importuje przeniesione funkcje zamiast lokalnych), `src/modules/live/index.tsx` (pole `wskazowki`)

**Interfejsy:**
- Używa: `fetchLive<T>(nazwa)` (zapis i odczyt bez sieci, `zCache`); `ustawDym`, `wybierzNaMapie` z `./warstwy` (warstwy modułu `live` zostają zarejestrowane przez `dodajWarstwy`); `stozekDymu` z `./dym`.
- Produkuje: `kartaPowietrza(k): Promise<Wskazowka>` (`id: 'powietrze'`, `kolejnosc: 40`), `ocenaPM25(pm25)`, `wStozku(p, dym, kierunekZDeg)`, `zKierunku(deg)`.

- [ ] **Krok 1: test stożka** — dopisz do `src/modules/live/dym.test.ts` (import `wStozku`):

```ts
it('wStozku: punkt z wiatrem od dymu do 3 km i ±15°', () => {
  const dym = { lat: 52.23, lon: 21.0 };
  expect(wStozku({ lat: 52.23, lon: 21.02 }, dym, 270)).toBe(true); // 1,4 km na wschód, wiatr z zachodu
  expect(wStozku({ lat: 52.25, lon: 21.02 }, dym, 270)).toBe(false); // ok. 32° od osi
  expect(wStozku({ lat: 52.23, lon: 21.06 }, dym, 270)).toBe(false); // 4 km
  expect(wStozku({ lat: 52.23, lon: 21.02 }, dym, 90)).toBe(false); // wiatr ze wschodu: dym idzie na zachód
});
```

- [ ] **Krok 2: test karty** `src/modules/live/wskazowki.test.ts`

```ts
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { KontekstWskazowek, StanLive, Wiatr } from '../../contracts';
import type { Powietrze } from '../../../server/live/typy';

vi.mock('../../offline/live-cache', () => ({ fetchLive: vi.fn() }));
vi.mock('./warstwy', () => ({ ustawDym: vi.fn(), wybierzNaMapie: vi.fn() }));
import { fetchLive } from '../../offline/live-cache';
import { wybierzNaMapie } from './warstwy';
import { wczytajDym, zapiszDym } from './dym';
import { kartaPowietrza, ocenaPM25 } from './wskazowki';

const adres = { id: '1', ulica: 'Grochowska', numer: '200', dzielnica: 'Praga-Południe', lat: 52.23, lon: 21.02 };
const k = (online = true): KontekstWskazowek => ({ miejsce: { rola: 'dom', etykieta: 'Dom', adres }, miejsca: [], online });
const stan = <T,>(dane: T, zCache: boolean): StanLive<T> => ({ dane, stanNa: '2026-10-17T16:40:00Z', zrodlo: 'test', zCache });
const pow = (pm25: number): Powietrze[] => [{ stacja: 'Grochów', lat: 52.235, lon: 21.02, pm10: 30, pm25, czas: '2026-10-17 18:00:00' }];
const wiatr = (kierunekDeg: number): Wiatr[] => [{ stacja: 'Praga', lat: 52.23, lon: 21.0, kierunekDeg, predkoscMs: 3.2, czas: '2026-10-17 18:30:00' }];

function dane(p: Powietrze[] | null, w: Wiatr[] | null, zCache = false) {
  vi.mocked(fetchLive).mockImplementation((async (nazwa: string) =>
    nazwa === 'powietrze' ? p && stan(p, zCache) : w && stan(w, zCache)) as typeof fetchLive);
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.clearAllMocks());

it('progi PM2,5 wg indeksu GIOŚ (HANDOFF-v3 §3)', () => {
  expect(ocenaPM25(35)).toEqual({ poziom: 'ok', tekst: 'Powietrze dobre. Możesz wietrzyć.' });
  expect(ocenaPM25(35.1)).toEqual({ poziom: 'uwaga', tekst: 'Powietrze gorsze. Ogranicz wietrzenie i wysiłek na zewnątrz.' });
  expect(ocenaPM25(75).poziom).toBe('uwaga');
  expect(ocenaPM25(75.1)).toEqual({ poziom: 'alarm', tekst: 'Powietrze złe. Zamknij okna, wyłącz wentylację, na zewnątrz maska FFP2.' });
});

it('rekomendacja z najbliższej stacji; pomiar i wiatr w szczegółach; „Widzę dym” jako akcja', async () => {
  dane(pow(12), wiatr(270));
  const w = await kartaPowietrza(k());
  expect(w).toMatchObject({ id: 'powietrze', kolejnosc: 40, tytul: 'Powietrze i wiatr', poziom: 'ok', tekst: 'Powietrze dobre. Możesz wietrzyć.', stanNa: '18:40' });
  expect(w.szczegoly).toEqual(['PM2,5: 12,0 µg/m³, PM10: 30,0 µg/m³. Grochów, 560 m, pomiar z 18:00.', 'Wiatr z zachodu, 3,2 m/s (Praga).']);
  expect(w.akcje).toEqual([expect.objectContaining({ typ: 'przycisk', etykieta: 'Widzę dym (potem kliknij na mapie)' })]);
});

it('dym w stożku wiatru: „alarm”, instrukcja, dopisek i stożek na mapie', async () => {
  zapiszDym({ lat: 52.23, lon: 21.0 }); // 1,4 km na zachód od adresu, wiatr z zachodu
  dane(pow(12), wiatr(270));
  const w = await kartaPowietrza(k());
  expect(w.poziom).toBe('alarm');
  expect(w.tekst).toBe('Wiatr niesie dym w Twoją stronę (z zachodu, 3,2 m/s). Zamknij okna, wyłącz wentylację. Jeśli musisz wyjść, idź w poprzek kierunku wiatru.');
  expect(w.szczegoly).toContain('To kierunek wiatru, nie model rozprzestrzeniania się dymu.');
  expect(w.akcje.map((a) => a.typ)).toEqual(['mapa', 'przycisk']);
});

it('dym, ale wiatr niesie go gdzie indziej: rekomendacja z pomiaru i dopisek', async () => {
  zapiszDym({ lat: 52.23, lon: 21.0 });
  dane(pow(50), wiatr(90));
  const w = await kartaPowietrza(k());
  expect(w.poziom).toBe('uwaga');
  expect(w.szczegoly).toContain('To kierunek wiatru, nie model rozprzestrzeniania się dymu.');
});

it('„Widzę dym” zapisuje punkt kliknięty na mapie', async () => {
  dane(pow(12), wiatr(270));
  vi.mocked(wybierzNaMapie).mockResolvedValue({ lat: 52.24, lon: 21.0 });
  const a = (await kartaPowietrza(k())).akcje[0];
  if (a.typ !== 'przycisk') throw new Error('oczekiwano przycisku');
  await a.wykonaj();
  expect(wczytajDym()).toEqual({ lat: 52.24, lon: 21.0 });
});

it('bez sieci i bez zapisu: „brak”; z zapisem: ostatni stan z godziną', async () => {
  dane(null, null);
  expect(await kartaPowietrza(k(false))).toMatchObject({ poziom: 'brak', tekst: 'Brak sieci i brak zapisanego pomiaru powietrza.' });
  dane(pow(12), wiatr(270), true);
  expect((await kartaPowietrza(k(false))).szczegoly).toContain('Brak sieci: ostatni zapisany stan z 18:40.');
});
```

- [ ] **Krok 3:** FAIL → **Krok 4: przeniesienia.** Do `src/modules/live/okolica.ts` przenieś z `Panel.tsx` mapę `Z_KIERUNKU` i dopisz `export const zKierunku = (deg: number): string => Z_KIERUNKU[kierunekNazwa(deg)];` (w `Panel.tsx` zamień `Z_KIERUNKU[kierunekNazwa(x)]` na `zKierunku(x)`). Do `src/modules/live/dym.ts` przenieś z `Panel.tsx` `KLUCZ_DYMU`, `wczytajDym`, `zapiszDym` (dodaj `export`; w `Panel.tsx` importuj je z `./dym`) i dopisz:

```ts
import { R, odlegloscM, rad } from './okolica';

function azymut(a: Wsp, b: Wsp): number {
  const dl = rad(b.lon - a.lon);
  const y = Math.sin(dl) * Math.cos(rad(b.lat));
  const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(dl);
  return (stopnie(Math.atan2(y, x)) + 360) % 360;
}

// Czy punkt p leży w stożku dymu (ten sam kształt co stozekDymu: 3 km, 30°). kierunekZDeg = skąd wieje.
export function wStozku(p: Wsp, dym: Wsp, kierunekZDeg: number, dlugoscM = 3000, katDeg = 30): boolean {
  const d = odlegloscM(dym, p);
  if (d > dlugoscM) return false;
  if (d < 1) return true;
  const os = (kierunekZDeg + 180) % 360;
  const roznica = Math.abs(((((azymut(dym, p) - os) % 360) + 540) % 360) - 180);
  return roznica <= katDeg / 2;
}
```

- [ ] **Krok 5: `src/modules/live/wskazowki.ts`**

```ts
import type { Akcja, KontekstWskazowek, Poziom, Wiatr, Wskazowka } from '../../contracts';
import type { Powietrze } from '../../../server/live/typy';
import { fetchLive } from '../../offline/live-cache';
import { stozekDymu, wczytajDym, wStozku, zapiszDym } from './dym';
import { godzina, liczba, najblizszaStacja, odleglosc, odlegloscM, zKierunku } from './okolica';
import { ustawDym, wybierzNaMapie } from './warstwy';

// Progi PM2,5 wg indeksu jakości powietrza GIOŚ (HANDOFF-v3 §3).
export function ocenaPM25(pm25: number): { poziom: Poziom; tekst: string } {
  if (pm25 <= 35) return { poziom: 'ok', tekst: 'Powietrze dobre. Możesz wietrzyć.' };
  if (pm25 <= 75) return { poziom: 'uwaga', tekst: 'Powietrze gorsze. Ogranicz wietrzenie i wysiłek na zewnątrz.' };
  return { poziom: 'alarm', tekst: 'Powietrze złe. Zamknij okna, wyłącz wentylację, na zewnątrz maska FFP2.' };
}

const DOPISEK_DYMU = 'To kierunek wiatru, nie model rozprzestrzeniania się dymu.';

export async function kartaPowietrza(k: KontekstWskazowek): Promise<Wskazowka> {
  const baza = { id: 'powietrze', kolejnosc: 40, tytul: 'Powietrze i wiatr' };
  const tu = k.miejsce.adres;
  const [pow, wiatr] = await Promise.all([
    fetchLive<Powietrze[]>('powietrze').catch(() => null),
    fetchLive<Wiatr[]>('wiatr').catch(() => null),
  ]);
  const dym = wczytajDym();
  const przyciskDymu: Akcja = dym
    ? { typ: 'przycisk', etykieta: 'Usuń zaznaczenie dymu', wykonaj: () => zapiszDym(null) }
    : {
        typ: 'przycisk',
        etykieta: 'Widzę dym (potem kliknij na mapie)',
        wykonaj: async () => {
          const p = await wybierzNaMapie();
          if (p) zapiszDym(p);
        },
      };

  const stacjaPM = pow ? najblizszaStacja(pow.dane.filter((s) => s.pm25 != null), tu) : null;
  const stacjaWiatru = wiatr ? najblizszaStacja(wiatr.dane, dym ?? tu) : null;
  if (!stacjaPM && !stacjaWiatru) {
    const tekst = k.online ? 'Źródła danych o powietrzu i wietrze chwilowo nie odpowiadają.' : 'Brak sieci i brak zapisanego pomiaru powietrza.';
    return { ...baza, poziom: 'brak', tekst, akcje: [przyciskDymu], zrodlo: 'dane.um.warszawa.pl' };
  }

  const kier = stacjaWiatru && stacjaWiatru.predkoscMs > 0 ? stacjaWiatru.kierunekDeg : null;
  const dymNaCiebie = dym != null && kier != null && wStozku(tu, dym, kier);
  const ocena = stacjaPM ? ocenaPM25(stacjaPM.pm25!) : { poziom: 'brak' as const, tekst: 'Brak pomiaru pyłu PM2,5 w pobliżu.' };
  const stan = (pow ?? wiatr)!;
  const pokazDym = () => {
    ustawDym(dym, dym && kier != null ? stozekDymu(dym, kier) : null);
    return () => ustawDym(null, null);
  };
  const mapaDymu: Akcja[] = dym ? [{ typ: 'mapa', pokaz: pokazDym }] : [];
  const ostatni = pow?.zCache || wiatr?.zCache ? `${k.online ? 'Źródło nie odpowiada' : 'Brak sieci'}: ostatni zapisany stan z ${godzina(stan.stanNa)}.` : null;

  return {
    ...baza,
    poziom: dymNaCiebie ? 'alarm' : ocena.poziom,
    tekst: dymNaCiebie
      ? `Wiatr niesie dym w Twoją stronę (${zKierunku(kier!)}, ${liczba(stacjaWiatru!.predkoscMs)} m/s). Zamknij okna, wyłącz wentylację. Jeśli musisz wyjść, idź w poprzek kierunku wiatru.`
      : ocena.tekst,
    szczegoly: [
      stacjaPM &&
        `PM2,5: ${liczba(stacjaPM.pm25!)} µg/m³${stacjaPM.pm10 != null ? `, PM10: ${liczba(stacjaPM.pm10)} µg/m³` : ''}. ${stacjaPM.stacja}, ${odleglosc(odlegloscM(tu, stacjaPM))}, pomiar z ${stacjaPM.czas.slice(11, 16)}.`,
      stacjaWiatru &&
        (stacjaWiatru.predkoscMs > 0
          ? `Wiatr ${zKierunku(stacjaWiatru.kierunekDeg)}, ${liczba(stacjaWiatru.predkoscMs)} m/s (${stacjaWiatru.stacja}).`
          : `Bezwietrznie (${stacjaWiatru.stacja}).`),
      dym && DOPISEK_DYMU,
      ostatni,
    ].filter((x): x is string => typeof x === 'string'),
    akcje: [...mapaDymu, przyciskDymu],
    zrodlo: [pow?.zrodlo, wiatr?.zrodlo].filter(Boolean).join('; '),
    stanNa: godzina(stan.stanNa),
  };
}
```

- [ ] **Krok 6:** PASS (także stare testy `Panel.test.tsx` i `dym.test.ts`). **Krok 7:** w `index.tsx` zamień atrapę na `wskazowki: async (k) => [await kartaPowietrza(k)],`.
- [ ] **Krok 8:** `npm run typecheck && npm test && npm run build`. **PR** `L2: karta Powietrze i wiatr`.

**Gotowe, gdy:** karta daje rekomendację (nie same liczby) wg progów PM2,5; przy dymie w stożku wiatru poziom `alarm` z instrukcją i dopiskiem; „Widzę dym” działa z mapy; offline pokazuje ostatni stan z godziną albo szarą kartę.

---

### L3. `najblizszaStacjaZRowerami()` dla karty bliskich

**Pliki:**
- Utwórz: `src/modules/live/rowery.ts`, `src/modules/live/rowery.test.ts`
- Modyfikuj: `src/modules/live/index.tsx` (atrapa z V1 → `export { najblizszaStacjaZRowerami } from './rowery';`)

**Interfejsy:**
- Używa: `fetchLive<StacjaRowerowa[]>('rowery')`, `rowerowe(lista, wsp, promienM, n)` z `./okolica`.
- Produkuje (sygnatura z V1, bez zmian): `najblizszaStacjaZRowerami(wsp: Wsp): Promise<{ nazwa: string; wsp: Wsp; rowery: number; odlegloscM: number } | null>`. `null`, gdy brak świeżych danych (zapis bez sieci też = `null`) albo brak stacji z rowerami w 3 km.

- [ ] **Krok 1: test** `src/modules/live/rowery.test.ts`

```ts
import { afterEach, expect, it, vi } from 'vitest';
import type { StacjaRowerowa } from '../../../server/live/typy';

vi.mock('../../offline/live-cache', () => ({ fetchLive: vi.fn() }));
import { fetchLive } from '../../offline/live-cache';
import { najblizszaStacjaZRowerami } from './rowery';

const st = (nazwa: string, lat: number, rowery: number): StacjaRowerowa => ({ nazwa, lat, lon: 21.0, rowery, wypozycza: true });
const stan = (dane: StacjaRowerowa[], zCache = false) => ({ dane, stanNa: '2026-10-17T16:40:00Z', zrodlo: 'Veturilo', zCache });
const W = { lat: 52.23, lon: 21.0 };

afterEach(() => vi.clearAllMocks());

it('najbliższa stacja z wolnymi rowerami w 3 km', async () => {
  vi.mocked(fetchLive).mockResolvedValue(stan([st('Pusta', 52.2301, 0), st('Daleka', 52.26, 5), st('Bliska', 52.232, 3)]));
  expect(await najblizszaStacjaZRowerami(W)).toEqual({ nazwa: 'Bliska', wsp: { lat: 52.232, lon: 21.0 }, rowery: 3, odlegloscM: 222 });
});

it('zapisany stan (bez sieci), brak danych albo brak stacji w 3 km: null', async () => {
  vi.mocked(fetchLive).mockResolvedValue(stan([st('Bliska', 52.232, 3)], true));
  expect(await najblizszaStacjaZRowerami(W)).toBeNull();
  vi.mocked(fetchLive).mockResolvedValue(null);
  expect(await najblizszaStacjaZRowerami(W)).toBeNull();
  vi.mocked(fetchLive).mockResolvedValue(stan([st('Daleko', 52.3, 9)]));
  expect(await najblizszaStacjaZRowerami(W)).toBeNull();
});
```

- [ ] **Krok 2:** FAIL → **Krok 3: `src/modules/live/rowery.ts`**

```ts
import type { Wsp } from '../../contracts';
import type { StacjaRowerowa } from '../../../server/live/typy';
import { fetchLive } from '../../offline/live-cache';
import { rowerowe } from './okolica';

export type StacjaZRowerami = { nazwa: string; wsp: Wsp; rowery: number; odlegloscM: number };

// Tylko świeże dane: liczba rowerów zmienia się co minutę, więc stan zapisany bez sieci nie wystarcza.
export async function najblizszaStacjaZRowerami(wsp: Wsp, promienM = 3000): Promise<StacjaZRowerami | null> {
  const s = await fetchLive<StacjaRowerowa[]>('rowery').catch(() => null);
  if (!s || s.zCache) return null;
  const [st] = rowerowe(s.dane, wsp, promienM, 1);
  return st ? { nazwa: st.nazwa, wsp: { lat: st.lat, lon: st.lon }, rowery: st.rowery, odlegloscM: Math.round(st.odlegloscM) } : null;
}
```

- [ ] **Krok 4:** PASS. **Krok 5:** w `index.tsx` usuń atrapę i dopisz `export { najblizszaStacjaZRowerami } from './rowery';` (usuń też zbędny import `Wsp`).
- [ ] **Krok 6:** `npm run typecheck && npm test && npm run build`. **PR** `L3: najbliższa stacja z rowerami`.

**Gotowe, gdy:** funkcja zwraca najbliższą stację Veturilo z wolnymi rowerami (do 3 km) przy świeżych danych, inaczej `null`; sygnatura taka jak w V1.

---

### L4. Pitch: liczby syren z WYNIKI.md i demo nowego przepływu

**Pliki:** `docs/pitch/scenariusz.md`, `docs/pitch/pytania.md`, `docs/pitch/prezentacja/index.html`, `docs/pitch/prezentacja/build_dane.py` (+ wygenerowany `dane.js`), `docs/DOKUMENTACJA.md`, `HANDOFF.md` (za zgodą O1: zmiana tylko liczb w §-ach z 69,1%).

**Interfejsy:** liczby wyłącznie z `pipeline/syreny/WYNIKI.md` (wygenerowane z paczki). Nie liczymy nic ręcznie.

- [ ] **Krok 1: gdzie jest stara liczba**

```bash
grep -rn "69,1\|69\.1\|29 676\|29676" docs HANDOFF.md README.md
```

17.10 trafienia: `HANDOFF.md:105,202`, `docs/pitch/pytania.md:40`, `docs/pitch/scenariusz.md:77,83,229`, `docs/pitch/prezentacja/index.html:293`, `docs/pitch/prezentacja/dane.js` (z `build_dane.py`, `podsum['adresy_zasieg_tylko_cyfrowe_pct']`), `docs/DOKUMENTACJA.md:72`. `docs/PRZEGLAD.md` i `docs/PLAN.md` zostają (zapis historii).

- [ ] **Krok 2: liczby do użycia** (z `WYNIKI.md`):

| Co | Wartość | Jak mówić |
|---|---|---|
| Adresy ≥ 65 dB, wszystkie syreny (SOIA) | 92,5% | „dziś syrenę słychać przy 92,5% adresów” |
| Adresy ≥ 75 dB normalnie → jeśli zabraknie prądu (przybliżenie) | 48,3% → 36,6% | główna liczba: „głośnej syreny (75 dB i więcej) ubywa z 48,3% do 36,6% adresów” |
| Adresy ≥ 65 dB jeśli zabraknie prądu (przybliżenie) | 91,5%, zasięg traci 1 230 adresów (wrażliwość ±1 dB: 697–1 928) | „rząd wielkości: ok. tysiąca adresów traci zasięg” |
| Dolne oszacowanie (tylko strefy syren cyfrowych w SOIA) | 69,1%, 29 676 adresów | tylko jako wariant skrajny, z nazwą „najgorszy wariant” |
| Dzielnice z największym spadkiem ≥ 75 dB | Praga-Południe 81,7% → 45,2%, Mokotów 72,6% → 46,1%, Ochota 68,6% → 44,2% | slajd z dzielnicami |

Zawsze z założeniem: „jeśli syreny analogowe nie mają zasilania awaryjnego” (tryb przypuszczający, SPEC §7).

- [ ] **Krok 3: teksty.** Podmień zdania z 69,1% w `scenariusz.md` (wypowiedź i tabela liczb), `pytania.md` (odpowiedź o założeniu syren), `DOKUMENTACJA.md` (wyniki) i `index.html` (`data-notatka` slajdu z mapą). Propozycja zdania do scenariusza: „Dziś syrenę słychać przy 92,5% adresów w Warszawie. Jeśli zabraknie prądu, a syreny analogowe nie mają zasilania awaryjnego, głośnej syreny, 75 decybeli i więcej, ubywa z 48,3% do 36,6% adresów. Najbardziej na Pradze-Południe.”
- [ ] **Krok 4: `dane.js`.** W `build_dane.py` (ok. linia 97, `'po': podsum['adresy_zasieg_tylko_cyfrowe_pct']`) dodaj obok stałe z `WYNIKI.md`: `'glosne_przed': 48.3, 'glosne_po': 36.6, 'po_przyblizenie': 91.5`, zostaw `'po'` jako najgorszy wariant; w `index.html` pokaż na slajdzie `glosne_przed → glosne_po` jako główną liczbę. Wygeneruj: `python -I docs/pitch/prezentacja/build_dane.py` i otwórz `docs/pitch/prezentacja/index.html` w przeglądarce.
- [ ] **Krok 5: demo nowego przepływu** — w `scenariusz.md` zastąp blok demo (1:30–3:00):
  1. Link z `?lokalizacja=52.2457,21.0874` (Grochowska 200) → „Użyj mojej lokalizacji”.
  2. „Sprawdzam połączenie…” → „Jest połączenie. Dane na żywo włączone.”
  3. Karty: Syreny (klik → okręgi syren na mapie), Najbliższe miejsce schronienia (klik → trasa piesza po chodnikach), Pomoc medyczna, Powietrze, Bliscy.
  4. Wyłączenie Wi-Fi, odświeżenie → „Brak sieci. Działam na danych z paczki z …” → klik w miejsce schronienia → ta sama trasa „zapisana w telefonie”.
  Plan B: link `?offline=1` (po wcześniejszym przejściu online) i nagranie wideo demo.
- [ ] **Krok 6: próba** o 23:30 na `main` (po V4) z zespołem; poprawki scenariusza. Zrzuty kart do `docs/pitch/zrzuty/` + zdanie w `zrzuty.md`.
- [ ] **Krok 7: PR** `L4: liczby syren i demo v3`.

**Gotowe, gdy:** w materiałach do oddania nie ma 69,1% jako głównej liczby (zostaje jako „najgorszy wariant”), liczby zgadzają się z `WYNIKI.md`, scenariusz demo opisuje nowy przepływ, próba o 23:30 się odbyła.

---

## Pokrycie HANDOFF-v3 (samokontrola)

| HANDOFF-v3 | Zadanie |
|---|---|
| §2.1 adresy + „Użyj mojej lokalizacji” | V2 (V2a: `najblizszyAdres`) |
| §2.2 „Sprawdzam połączenie…”, test `/api/live/wiatr` 4 s, pobranie paczki, status w pasku | V3 |
| §2.3 pusta mapa, kafelki u góry, lista kart u dołu | V4 (ekran), P4 (kafelki, pusta mapa) |
| §2.4 klik w kartę pokazuje na mapie i szczegóły | V4 (`Karty`, `wykonajNaMapie`) |
| §3 karta 1 Syreny + okręgi 75/70/65 dB | S1, S2 |
| §3 karta 2 Najbliższe miejsce schronienia + trasa + aplikacja PSP | P2 (+ V4/V5 trasa) |
| §3 karta 3 Pomoc medyczna z przychodniami OSM | P1, P3 |
| §3 karta 4 Powietrze i wiatr, progi PM2,5, „Widzę dym” | L2 |
| §3 karta 5 Dotarcie do bliskich, Veturilo, blackout | S3, L3 |
| §3 poziomy kart, zasady treści | V1 (typ `Poziom`), każda karta; Ograniczenia globalne |
| §4 ukryte: Dojazd, „co jeździ”, dolne menu, lista Veturilo; Google Maps nie | V4 (bez menu i paneli), P1 (OSM zamiast Google) |
| §5 trasy online przez proxy, cache Workera 24 h i IndexedDB | L1, V5 |
| §5 zapis ok. 50 tras na offline | V5 (`zapiszTrasyOffline`, w tle) |
| §5 offline bez zapisu: linia prosta z napisem | V1 (`trasaProsta`), V4 (`opisTrasy`, linia przerywana) |
| §5 atrybucja OSRM w stopce | V5 |
| §6 kontrakt i funkcje publiczne | V1 (+ V2a, L3) |
| §7 L4 pitch | L4 |
| §8 harmonogram, §9 ryzyka | sekcje „Harmonogram” i „Kolejność i zależności”; plan B tras: linia prosta (V1), Overpass: zapis próbki (P1), geolokalizacja: `?lokalizacja=` (V2) |
