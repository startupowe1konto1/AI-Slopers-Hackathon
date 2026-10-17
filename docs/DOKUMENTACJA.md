# Dokumentacja: Warszawa w trybie kryzysowym

Zespół AI Slopers, Warsaw Open Data Hackathon, 17–18.10.2026.

**W skrócie:** strona internetowa (PWA) dla mieszkańców Warszawy na czas ataku i blackoutu. Pod adresem mieszkańca pokazuje, czy usłyszy syrenę (normalnie i przy blackoucie), gdzie są najbliższe punkty pomocy i jak dotrzeć do bliskich autobusem albo pieszo. Działa także bez sieci. Korzysta z otwartych danych m.st. Warszawy, Państwowej Straży Pożarnej i innych otwartych źródeł.

Ten dokument spełnia wymóg regulaminu (§4 ust. 6): wykorzystane dane miejskie, założenia, frameworki i narzędzia. Opis użycia AI (§4 ust. 4) jest w sekcji 4.

| Link | Adres |
|---|---|
| Repozytorium | https://github.com/startupowe1konto1/AI-Slopers-Hackathon |
| Pełna wersja | https://warszawa-kryzys.startupaplikujmy.workers.dev/ |
| Wersja offline | https://warszawa-kryzys.startupaplikujmy.workers.dev/?offline=1 |
| Prezentacja | **DO UZUPEŁNIENIA** (HTML w `docs/pitch/`) |

Szczegóły projektu: [SPEC.md](SPEC.md) (specyfikacja), [PLAN.md](PLAN.md) (plan prac), [HANDOFF.md](../HANDOFF.md) (koncepcja i uzasadnienia).

---

## 1. Wykorzystane dane

Warunek oceny (§4 ust. 9) spełniamy z zapasem: aplikacja korzysta z dziewięciu zbiorów m.st. Warszawy (portal dane.um.warszawa.pl i WFS).

Zasady, których się trzymamy:
- Aplikacja nie odpytuje WFS na żywo. Warstwy WFS pobieramy raz i zapisujemy w paczce offline.
- Każdy punkt w aplikacji ma źródło, a paczka ma datę pobrania.
- Klucz API portalu zostaje na serwerze (proxy), nigdy w przeglądarce.

### 1.1. Dane m.st. Warszawy

| Zbiór | Źródło i identyfikator | Do czego | Rekordy | Pobrano |
|---|---|---|---|---|
| Punkty adresowe | WFS `wfs:PUNKTY_ADRESOWE_WGS84` | wyszukiwanie adresu offline, bez GPS; podstawa analizy syren | 126 923 | 17.10.2026 |
| Wejścia do metra | WFS `wfs:METRO_WEJSCIA` | najbliższe punkty | **DO UZUPEŁNIENIA** | **DO UZUPEŁNIENIA** |
| Apteki | WFS `wfs:APTEKI` | najbliższe punkty | **DO UZUPEŁNIENIA** | **DO UZUPEŁNIENIA** |
| Lokalizacja defibrylatorów (AED) | portal, `get_scb_lokalizacja_defibrylatorow` | najbliższe punkty | 710 | **DO UZUPEŁNIENIA** |
| Toalety | portal, `get_m_toalety` | najbliższe punkty (blackout) | 695 | **DO UZUPEŁNIENIA** |
| Lokalizacja pojazdów komunikacji miejskiej | portal, `get_ztm_lokalizacja_pojazdow` (`type` 1 i 2) | co jeździ w okolicy, na żywo | na żywo | na żywo |
| Pogoda (stacje ZOM) | portal, `get_zom_pogoda` | kierunek i prędkość wiatru, na żywo | na żywo | na żywo |
| Monitoring jakości powietrza | portal, `get_bopipk_monitoring_jakosci_powietrza` | pomiary PM2.5 i PM10 przy zgłoszeniu dymu | na żywo | na żywo |
| Utrudnienia w ruchu drogowym | portal, `get_bin_utrudnienia_drogowe` | zamknięte drogi, na żywo | na żywo | na żywo |

**DO UZUPEŁNIENIA** po scaleniu pasów O3 i O4: które zbiory faktycznie weszły do wersji końcowej (część z nich to dobudowa po 19:00).

### 1.2. Dane Państwowej Straży Pożarnej

| Zbiór | Źródło | Do czego | Rekordy | Licencja |
|---|---|---|---|---|
| SOIA: zasięg syren alarmowych, wersja 2026.05 | KG PSP, Zenodo [10.5281/zenodo.21921103](https://doi.org/10.5281/zenodo.21921103), wycinek w `dane/soia-warszawa/` | klasa słyszalności syreny dla każdego adresu, normalnie i przy blackoucie | 961 zasięgów, 451 syren | CC BY 4.0 (składowe: ODbL, GUS, GUGiK) |
| Miejsca schronienia | PSP, [gdziesieukryc.pl](https://gdziesieukryc.pl), eksport CSV (poza repozytorium) | najbliższe miejsca schronienia według PSP; przycisk „Otwórz w aplikacji PSP” | 8006 w rejonie Warszawy | za zgodą PSP, **DO UZUPEŁNIENIA**: forma i data zgody |

### 1.3. Inne otwarte źródła

| Zbiór | Źródło | Do czego | Licencja |
|---|---|---|---|
| Szpitalne oddziały ratunkowe (SOR) | dane.gov.pl, zbiór 1642 (ewidencja RPRM) | najbliższe punkty | CC BY 4.0 |
| Rozkład jazdy GTFS | [mkuran.pl/gtfs/warsaw.zip](https://mkuran.pl/gtfs/warsaw.zip), źródło nieoficjalne na podstawie danych ZTM | linie autobusowe na przystankach (dojazd przy blackoucie) | **DO UZUPEŁNIENIA** |
| Stacje Veturilo | GBFS nextbike (`gbfs.nextbike.net/maps/gbfs/v2/nextbike_vw/gbfs.json`) | wolne rowery w okolicy, na żywo (dobudowa) | **DO UZUPEŁNIENIA** |
| Mapa | Protomaps, plik `20261017.pmtiles` wycięty do Warszawy, dane OpenStreetMap | mapa online i offline | ODbL |

---

## 2. Założenia i ograniczenia

### Syreny

- Model SOIA liczy poziom dźwięku **na zewnątrz** budynków. Nie mówi, czy syrenę słychać w mieszkaniu przy zamkniętych oknach.
- Wariant „blackout” zakłada, że syreny analogowe nie działają bez prądu, a cyfrowe działają na akumulatorach. **To założenie, nie fakt.** Nie wiemy, które syreny analogowe mają zasilanie awaryjne. Dlatego aplikacja i pitch mówią „jeśli”.
- Liczymy punkty adresowe, nie mieszkańców. Blok z setką mieszkań i dom jednorodzinny to po jednym punkcie.
- Wynik dla całego miasta (`dane/soia-warszawa/analiza/`): 92,5% ze 126 923 adresów jest w zasięgu co najmniej 65 dB(A). Przy samych syrenach cyfrowych zostaje 69,1%, a zasięg traci 29 676 adresów.
- Klasy ryzyka i luki priorytetowe w SOIA dotyczą ostrzegania powodziowego (mapy ISOK). Nie używamy ich.

### Dym i powietrze

- Dym pokazujemy jako kierunek wiatru z najbliższej stacji i pomiary powietrza. To nie jest model rozprzestrzeniania się skażeń.
- Stacji pomiarowych jest mało, więc najbliższa stacja może być daleko od miejsca zgłoszenia.

### Miejsca schronienia według PSP

- Nie nazywamy ich „schronami”. Dane PSP nie mówią o pojemności (są zanonimizowane z mocy ustawy).
- Pokazujemy źródło i datę danych. Przycisk „Otwórz w aplikacji PSP” prowadzi do oficjalnej, aktualnej wersji.

### Dojazd

- Wersja minimalna: odległość, czas pieszo i rowerem oraz bezpośrednie linie autobusowe z przystanku przy starcie, które zatrzymują się do 500 m od celu. Bez przesiadek.
- Przy blackoucie zakładamy, że tramwaje, metro i SKM stoją, a autobusy jeżdżą.
- Rozkład pochodzi z nieoficjalnego GTFS.

### Dane na żywo

- Proxy przechowuje odpowiedzi przez 15–30 s. Bez sieci aplikacja pokazuje ostatni zapisany stan z godziną.
- API ZTM obejmuje tylko autobusy i tramwaje, bez metra.

### Bezpieczeństwo i prywatność

- Aplikacja nie ogłasza alarmów. To rola RCB, RSO i syren. Pomagamy upewnić się, że alarm dotrze do mieszkańca.
- Nie pokazujemy miejsc uderzeń.
- Adresy użytkownika zostają w przeglądarce (IndexedDB). Nie ma kont ani logowania.

### Zakres demo

- Demo działa w przeglądarce na laptopie, w widoku telefonu. Nie testowaliśmy aplikacji na telefonach.
- Na iOS dane offline przetrwają dłużej niż 7 dni tylko po dodaniu strony do ekranu głównego.
- **DO UZUPEŁNIENIA:** co ostatecznie nie weszło do wersji końcowej (np. mapa offline, jeśli zadziałał plan B z SPEC §12).

---

## 3. Frameworki i narzędzia

Wszystkie biblioteki są open source z licencją, która pozwala na użycie komercyjne (regulamin §4 ust. 3). Licencje sprawdzone w rejestrze npm 17.10.2026.

| Warstwa | Narzędzie | Licencja |
|---|---|---|
| Frontend | Vite, React, TypeScript | MIT, MIT, Apache-2.0 |
| PWA i offline | `vite-plugin-pwa` (Workbox) | MIT |
| Mapa | MapLibre GL JS, `pmtiles`, `@protomaps/basemaps` | BSD-3-Clause |
| Przechowywanie | Cache Storage (service worker), OPFS (plik mapy), IndexedDB przez `idb-keyval` | `idb-keyval`: Apache-2.0 |
| Najbliższe punkty | `kdbush`, `geokdbush` (w przeglądarce) | ISC |
| Przetwarzanie danych | Python, `uv`, skrypty w `pipeline/` | **DO UZUPEŁNIENIA** (biblioteki z `pipeline/pyproject.toml`) |
| Analiza syren | Python, `geopandas`, `rasterio` (`dane/soia-warszawa/`) | BSD-3-Clause |
| Proxy na żywo | TypeScript w `server/live/`, Cloudflare Worker | — |
| Testy | Vitest, Playwright | MIT, Apache-2.0 |
| Lint | oxlint | MIT |
| Hosting | Cloudflare Workers ze statycznymi plikami (darmowy plan) | usługa |

### Architektura w jednym akapicie

Skrypty w Pythonie liczą z góry wyniki dla każdego adresu (klasa syreny, najbliższe punkty, przystanki) i zapisują je jako paczkę JSON. Service worker trzyma aplikację i paczkę w pamięci przeglądarki, a mapa jest jednym plikiem `pmtiles` w OPFS. Telefon tylko odczytuje gotowe wyniki, więc działa bez sieci. Dane na żywo idą przez proxy na Cloudflare Worker, który trzyma klucz API miasta. Schemat: [SPEC.md, sekcja 4](SPEC.md#4-architektura).

### Uruchomienie i testy

**DO UZUPEŁNIENIA** (zadanie F w PLAN.md): polecenia uruchomienia i wynik czystej instalacji na świeżym klonie:

```bash
npm ci && npm run typecheck && npm test && npm run build && uv run --project pipeline pipeline/validate.py && npm run test:e2e
```

---

## 4. Użycie AI

Regulamin (§4 ust. 4) dopuszcza AI i wymaga opisania zakresu jego użycia. Rejestr osoba po osobie: [AI_USAGE.md](AI_USAGE.md).

Wszystkie cztery osoby w zespole pracowały z **Claude Code**. Każda osoba prowadziła swój pas prac w osobnym `git worktree` i zlecała subagentom zadania z [PLAN.md](PLAN.md), tylko w swoich folderach.

AI pomagało w:
- rozpoznaniu regulaminu, źródeł danych i doświadczeń Kijowa (research w `kontekst/`);
- specyfikacji i planie prac;
- pisaniu kodu modułów i skryptów przetwarzania danych, zaczynając od testów;
- analizie zasięgu syren przy blackoucie;
- scenariuszu pitchu i tej dokumentacji.

Kontrola po stronie ludzi: każda zmiana wchodzi na `main` przez pull request z CI (typy, testy, build, walidacja paczki). Liczby w pitchu i dokumentacji sprawdzaliśmy na plikach z danymi, nie z pamięci modelu.

**DO UZUPEŁNIENIA:** po jednym zdaniu od każdej osoby, czego AI nie zrobiło dobrze i co trzeba było poprawić ręcznie.

---

## 5. Atrybucje

Te same oznaczenia są w stopce aplikacji i w zakładce „O danych”.

- **SOIA (syreny):** „Dane: KG PSP, SOIA, wersja danych 2026.05 (Zenodo 10.5281/zenodo.21921103); przycięte do granic m.st. Warszawy (TERYT 1465011) przez zespół hackathonowy”. Źródła składowe: OpenStreetMap contributors (ODbL), GUS, GUGiK. Licencja CC BY 4.0. Pełny opis: [dane/soia-warszawa/README.md](../dane/soia-warszawa/README.md).
- **m.st. Warszawa:** dane z [dane.um.warszawa.pl](https://dane.um.warszawa.pl) i WFS m.st. Warszawy, licencja CC BY. **DO UZUPEŁNIENIA:** dokładna wersja licencji i wymagane brzmienie oznaczenia.
- **PSP, miejsca schronienia:** dane z [gdziesieukryc.pl](https://gdziesieukryc.pl), użyte za zgodą PSP.
- **SOR:** Rejestr Państwowego Ratownictwa Medycznego z [dane.gov.pl](https://dane.gov.pl), CC BY 4.0.
- **Mapa:** © OpenStreetMap contributors (ODbL), kafle Protomaps.
- **Rozkład GTFS:** mkuran.pl na podstawie danych ZTM Warszawa. **DO UZUPEŁNIENIA:** licencja.
- **Veturilo:** nextbike GBFS. **DO UZUPEŁNIENIA:** licencja (tylko jeśli dobudowa weszła).

---

## 6. Oddanie

**DO UZUPEŁNIENIA** (zadanie F w PLAN.md): godzina oddania, kanał, potwierdzenie organizatora, wynik skanu sekretów.
