# Dokumentacja: Warszawa w trybie kryzysowym

Zespół AI Slopers, Warsaw Open Data Hackathon, 17–18.10.2026.

**W skrócie:** strona internetowa (PWA) dla mieszkańców Warszawy na czas ataku i blackoutu. Pod adresem mieszkańca pokazuje, czy usłyszy syrenę (normalnie i przy blackoucie), gdzie są najbliższe punkty pomocy i jak dotrzeć do bliskich pieszo albo rowerem. Zamiast zakładek ma jeden ekran „Twoja sytuacja” z pięcioma kartami dla wybranego miejsca: Syreny, Najbliższe miejsce schronienia według PSP, Pomoc medyczna, Powietrze i wiatr, Dotarcie do bliskich. Działa także bez sieci. Korzysta z otwartych danych m.st. Warszawy, Państwowej Straży Pożarnej i innych otwartych źródeł.

Ten dokument spełnia wymóg regulaminu (§4 ust. 6): wykorzystane dane miejskie, założenia, frameworki i narzędzia. Opis użycia AI (§4 ust. 4) jest w sekcji 4.

| Link | Adres |
|---|---|
| Repozytorium | https://github.com/startupowe1konto1/AI-Slopers-Hackathon |
| Pełna wersja | https://warszawa-kryzys.startupaplikujmy.workers.dev/ |
| Wersja offline | https://warszawa-kryzys.startupaplikujmy.workers.dev/?offline=1 |
| Prezentacja | [docs/pitch/prezentacja/index.html](pitch/prezentacja/index.html), otwierana w przeglądarce (strzałki, F: pełny ekran, N: notatki) |

Szczegóły projektu: [SPEC.md](SPEC.md) (specyfikacja), [PLAN.md](PLAN.md) (plan prac), [HANDOFF.md](../HANDOFF.md) (koncepcja i uzasadnienia).

---

## 1. Wykorzystane dane

Warunek oceny (§4 ust. 9) spełniamy z zapasem: aplikacja korzysta z ośmiu zbiorów m.st. Warszawy (portal dane.um.warszawa.pl i WFS). Sześć z nich widać w interfejsie, dwa (pozycje pojazdów i utrudnienia) są w kodzie i w proxy.

Zasady, których się trzymamy:
- Aplikacja nie odpytuje WFS na żywo. Warstwy WFS pobieramy raz i zapisujemy w paczce offline.
- Każdy punkt w aplikacji ma źródło, a paczka ma datę pobrania.
- Klucz API portalu zostaje na serwerze (proxy), nigdy w przeglądarce.

### 1.1. Dane m.st. Warszawy

| Zbiór | Źródło i identyfikator | Do czego | Rekordy | Pobrano |
|---|---|---|---|---|
| Punkty adresowe | WFS `wfs:PUNKTY_ADRESOWE_WGS84` | wyszukiwanie adresu offline, bez GPS; podstawa analizy syren | 126 923 | 17.10.2026 |
| Apteki | WFS `wfs:APTEKI` | najbliższe punkty | 679 (stan danych w WFS: marzec 2017) | 17.10.2026 |
| Lokalizacja defibrylatorów (AED) | portal, `get_scb_lokalizacja_defibrylatorow` | najbliższe punkty | 610 w granicach paczki (710 w API) | 17.10.2026 |
| Toalety | portal, `get_m_toalety` | najbliższe punkty (blackout) | 695 | 17.10.2026 |
| Lokalizacja pojazdów komunikacji miejskiej | portal, `get_ztm_lokalizacja_pojazdow` (`type` 1 i 2) | autobusy i tramwaje do 1 km od adresu (w tej wersji niewidoczne w interfejsie, kod i dane zostają w repo) | ok. 1100 aktualnych pozycji | na żywo |
| Pogoda (stacje ZOM) | portal, `get_zom_pogoda` | kierunek i prędkość wiatru z najbliższej stacji; kierunek stożka dymu | 16 stacji | na żywo |
| Monitoring jakości powietrza | portal, `get_bopipk_monitoring_jakosci_powietrza` | PM2.5 i PM10 ze stacji najbliższej adresowi albo zgłoszonemu dymowi | 140 stacji z pomiarem pyłów (miejskie, GIOŚ, czujniki w gminach) | na żywo |
| Utrudnienia w ruchu drogowym | portal, `get_bin_utrudnienia_drogowe` | utrudnienia do 2 km od adresu (w tej wersji niewidoczne w interfejsie, kod zostaje w repo) | 61 aktywnych lub zaczynających się w ciągu 3 dni | na żywo |

Liczby rekordów dla danych na żywo pochodzą z odpowiedzi API z 17.10.2026 ok. 16:40. Wiatr i powietrze zasilają kartę „Powietrze i wiatr”. Pozycje pojazdów i utrudnienia w ruchu są w kodzie i w proxy (PR #5 i #8), ale interfejs v3 ich nie pokazuje (`HANDOFF-v3.md` §4). Proxy odrzuca pozycje pojazdów starsze niż 5 minut od najnowszej, bo API zwraca też pozycje sprzed dni, a nawet lat.

Punkty pomocy w wersji końcowej (`public/pack/punkty/`, 11 299 punktów, pobrane 17.10.2026): 8006 miejsc schronienia według PSP, 1044 przychodnie, gabinety i szpitale z OpenStreetMap, 695 toalet, 679 aptek, 610 AED, 253 wejścia do metra i 12 SOR. Wejścia do metra bierzemy z rozkładu GTFS, bo warstwa WFS `METRO_WEJSCIA` nie ma pięciu nowych stacji M2.

### 1.2. Dane Państwowej Straży Pożarnej

| Zbiór | Źródło | Do czego | Rekordy | Licencja |
|---|---|---|---|---|
| SOIA: zasięg syren alarmowych, wersja 2026.05 | KG PSP, Zenodo [10.5281/zenodo.21921103](https://doi.org/10.5281/zenodo.21921103), wycinek w `dane/soia-warszawa/` | klasa słyszalności syreny dla każdego adresu, normalnie i przy blackoucie | 961 zasięgów, 451 syren | CC BY 4.0 (składowe: ODbL, GUS, GUGiK) |
| Miejsca schronienia | PSP, [gdziesieukryc.pl](https://gdziesieukryc.pl), eksport CSV (poza repozytorium) | najbliższe miejsca schronienia według PSP; przycisk „Otwórz w aplikacji PSP” | 8006 w rejonie Warszawy | informacja sektora publicznego, ponowne wykorzystywanie (art. 14 ust. 1 ustawy o otwartych danych) |

Miejsca schronienia publikuje KG PSP w serwisie gdziesieukryc.pl. To informacja sektora publicznego. Według art. 14 ust. 1 ustawy z 11 sierpnia 2021 r. o otwartych danych i ponownym wykorzystywaniu informacji sektora publicznego udostępnia się ją do ponownego wykorzystywania bezwarunkowo, chyba że podmiot określi warunki (art. 14 ust. 2). Warunków dla tych danych nie znaleźliśmy. Podajemy źródło i datę pobrania, nie zmieniamy opisu punktów, a przycisk „Otwórz w aplikacji PSP” prowadzi do oficjalnej, aktualnej wersji.

### 1.3. Inne otwarte źródła

| Zbiór | Źródło | Do czego | Licencja |
|---|---|---|---|
| Szpitalne oddziały ratunkowe (SOR) | Rejestr Państwowego Ratownictwa Medycznego, eksport publiczny [rprm.ezdrowie.gov.pl](https://rprm.ezdrowie.gov.pl/) (ten sam rejestr jest na dane.gov.pl, zbiór 1642) | najbliższe punkty (12 SOR) | CC BY 4.0 |
| Przychodnie, gabinety i szpitale | OpenStreetMap przez Overpass API | najbliższe punkty pomocy medycznej (1044) | ODbL |
| Rozkład jazdy GTFS | [mkuran.pl/gtfs/warsaw.zip](https://mkuran.pl/gtfs/warsaw.zip), źródło nieoficjalne na podstawie danych ZTM | wejścia do metra w punktach pomocy (253); przejazd jedną linią autobusu, tramwaju albo metra w arkuszu trasy | rozkład: warunki korzystania z danych ZTM Warszawa; przebiegi autobusów: ODbL |
| Stacje Veturilo | GBFS nextbike (`gbfs.nextbike.net/maps/gbfs/v2/nextbike_vw/gbfs.json`), bez klucza | najbliższa stacja z wolnymi rowerami, w karcie „Dotarcie do bliskich”, na żywo | CC0-1.0 (pole `license_id` w `system_information` feedu) |
| Mapa | Protomaps, plik `20261017.pmtiles` wycięty do Warszawy, dane OpenStreetMap | mapa online i offline | ODbL |

---

## 2. Założenia i ograniczenia

### Syreny

- Model SOIA liczy poziom dźwięku **na zewnątrz** budynków. Nie mówi, czy syrenę słychać w mieszkaniu przy zamkniętych oknach.
- Wariant „blackout” zakłada, że syreny analogowe nie działają bez prądu, a cyfrowe działają na akumulatorach. **To założenie, nie fakt.** Nie wiemy, które syreny analogowe mają zasilanie awaryjne. Dlatego aplikacja i pitch mówią „jeśli”.
- Liczymy punkty adresowe, nie mieszkańców. Blok z setką mieszkań i dom jednorodzinny to po jednym punkcie.
- Wynik dla całego miasta (`pipeline/syreny/WYNIKI.md`, 126 923 adresy): przy wszystkich syrenach 92,5% adresów jest w zasięgu co najmniej 65 dB(A), a 48,3% w zasięgu co najmniej 75 dB(A), czyli głośnej syreny. Jeśli zabraknie prądu, a syreny analogowe nie mają zasilania awaryjnego (przybliżenie): 91,5% adresów przy 65 dB, a przy 75 dB tylko 36,6%. Zasięg 65 dB traci wtedy około tysiąca adresów (1 230; wrażliwość ±1 dB: 697–1 928). Największy spadek głośnej syreny: Praga-Południe z 81,7% do 45,2% adresów (−36,5 pp), Praga-Północ z 85,5% do 52,6% (−32,9), Żoliborz z 93,0% do 64,0% (−29,0), Wola z 88,2% do 60,4% (−27,8).
- Przybliżenie szacuje poziom najgłośniejszej syreny cyfrowej z odległości i mocy (`pipeline/syreny/przyblizenie.py`), bo SOIA nie podaje go tam, gdzie dominuje syrena analogowa. Zgadza się z SOIA co do progu 65 dB na 95,6% adresów, a co do klasy głośności na 76,3%. Błąd na progu 65 dB (około 4% adresów) jest większy niż różnica między wszystkimi syrenami a samymi cyfrowymi, dlatego liczbę adresów tracących zasięg traktujemy jako rząd wielkości. Przybliżenie pomija syreny cyfrowe z gmin sąsiednich, więc przy granicach miasta może zaniżać zasięg.
- Najgorszy wariant (dolne oszacowanie z `dane/soia-warszawa/analiza/`): gdyby uznać, że tam, gdzie SOIA pokazuje syrenę analogową, nie ma żadnej syreny, zostaje 69,1% adresów w zasięgu 65 dB, a 29 676 adresów traci zasięg. To wariant skrajny, nie nasz wynik główny.
- Klasy ryzyka i luki priorytetowe w SOIA dotyczą ostrzegania powodziowego (mapy ISOK). Nie używamy ich.

### Dym i powietrze

- Dym pokazujemy jako kierunek wiatru z najbliższej stacji i pomiary powietrza. To nie jest model rozprzestrzeniania się skażeń. Aplikacja pisze to wprost: „To kierunek wiatru, nie model rozprzestrzeniania się dymu.”
- Stożek ma 30° szerokości i 3 km długości. Kierunek bierzemy ze stacji pogodowej najbliższej zaznaczonemu punktowi. Przy 0 m/s stożka nie ma, a aplikacja wyjaśnia dlaczego.
- Stacji wiatru jest 16, więc najbliższa stacja bywa kilka kilometrów od miejsca zgłoszenia. Aplikacja zawsze podaje jej nazwę i godzinę pomiaru.
- Punkt dymu zostaje tylko w telefonie (`localStorage`). Nie wysyłamy go nigdzie.
- Stacje powietrza w API mają dwa zapisy pyłu PM2.5 (`PM25` w stacjach miejskich, `PM2.5` w GIOŚ i gminach), a GIOŚ podaje współrzędne jako tekst. Parser obsługuje oba warianty; stacja bez pomiaru pyłów jest pomijana.

### Miejsca schronienia według PSP

- Nie nazywamy ich „schronami”. Dane PSP nie mówią o pojemności (są zanonimizowane z mocy ustawy).
- Pokazujemy źródło i datę danych. Przycisk „Otwórz w aplikacji PSP” prowadzi do oficjalnej, aktualnej wersji.
- Podstawa użycia: ponowne wykorzystywanie informacji sektora publicznego (sekcja 1.2).

### Dotarcie do bliskich

- Karta pokazuje dla każdego zapisanego adresu czas pieszo i rowerem po ulicach (trasy z OSRM, „Trasy: OSRM, © OpenStreetMap contributors”) oraz najbliższą stację Veturilo z rowerami.
- Jeśli zabraknie prądu, zakładamy, że tramwaje, metro i SKM stoją. To założenie, nie fakt.
- Zakładka Dojazd, „co jeździ w okolicy” (pozycje tramwajów i autobusów) i dolne menu modułów są w tej wersji ukryte (`HANDOFF-v3.md` §4). Arkusz trasy pokazuje za to przejazd komunikacją miejską jedną linią, bez przesiadek, z rozkładu GTFS.

### Dane na żywo

- Proxy pozwala buforować odpowiedzi: pojazdy 15 s, Veturilo 60 s, wiatr 5 min, powietrze i utrudnienia 10 min. Karty odświeżają dane na żywo, gdy jest sieć.
- Bez sieci aplikacja pokazuje ostatni zapisany stan z godziną („Brak sieci. Ostatni stan z HH:MM.”). Gdy padnie tylko źródło, pokazuje ostatni stan z dopiskiem, że źródło nie odpowiada.
- API ZTM obejmuje tylko autobusy i tramwaje, bez metra (w tej wersji niewidoczne w interfejsie).
- Utrudnienia: pokazujemy zgłoszenia trwające albo zaczynające się w ciągu 3 dni. Trzy zgłoszenia nie mają daty końca, więc pokazujemy je jako „do odwołania”.
- Veturilo: stacja liczy się tylko wtedy, gdy ma wolne rowery i wypożycza.

### Bezpieczeństwo i prywatność

- Aplikacja nie ogłasza alarmów. To rola RCB, RSO i syren. Pomagamy upewnić się, że alarm dotrze do mieszkańca.
- Nie pokazujemy miejsc uderzeń.
- Adresy użytkownika zostają w przeglądarce (IndexedDB). Nie ma kont ani logowania.
- Lokalizacja z GPS zostaje w przeglądarce, poza tym, że może być punktem startu trasy. Zapytanie o trasę niesie tylko współrzędne początku i celu oraz profil (pieszo albo rower) i idzie przez nasz serwer do publicznego serwera OSRM (`routing.openstreetmap.de`), bez kont i identyfikatorów użytkownika; klucz API miasta w nim nie uczestniczy.

### Zakres demo

- Interfejs v3: ekran „Twoja sytuacja” z pięcioma kartami i kafelkami warstw. Zakładka Dojazd, „co jeździ w okolicy” i dolne menu są ukryte, kod zostaje w repo.
- Demo działa w przeglądarce na laptopie, w widoku telefonu. Nie testowaliśmy aplikacji na telefonach.
- Na iOS dane offline przetrwają dłużej niż 7 dni tylko po dodaniu strony do ekranu głównego.
- Do wersji końcowej nie weszły: zakładka Dojazd, „co jeździ w okolicy” (pozycje tramwajów i autobusów), utrudnienia w ruchu, dolne menu modułów i lista stacji Veturilo (`HANDOFF-v3.md` §4). Kod zostaje w repo. Mapa offline działa, więc plan B z SPEC §12 nie był potrzebny.

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
| Przetwarzanie danych | Python, `uv`, skrypty w `pipeline/`: `geopandas`, `shapely`, `pandas`, `rasterio`, `pyproj`, `requests`, `pytest` | `geopandas`, `shapely`, `pandas`, `rasterio`: BSD-3-Clause; `pyproj`, `pytest`: MIT; `requests`: Apache-2.0 |
| Analiza syren | Python, `geopandas`, `rasterio` (`dane/soia-warszawa/`) | BSD-3-Clause |
| Proxy na żywo | TypeScript w `server/live/`, Cloudflare Worker | — |
| Testy | Vitest, Playwright | MIT, Apache-2.0 |
| Lint | oxlint | MIT |
| Hosting | Cloudflare Workers ze statycznymi plikami (darmowy plan) | usługa |

### Architektura w jednym akapicie

Skrypty w Pythonie liczą z góry wyniki dla każdego adresu (klasa syreny, najbliższe punkty, przystanki) i zapisują je jako paczkę JSON. Service worker trzyma aplikację i paczkę w pamięci przeglądarki, a mapa jest jednym plikiem `pmtiles` w OPFS. Telefon tylko odczytuje gotowe wyniki, więc działa bez sieci. Dane na żywo idą przez proxy na Cloudflare Worker, który trzyma klucz API miasta. Schemat: [SPEC.md, sekcja 4](SPEC.md#4-architektura).

### Uruchomienie i testy

Polecenia uruchomienia:

```bash
npm ci && npm run typecheck && npm test && npm run build && uv run --project pipeline pipeline/validate.py && npm run test:e2e
```

Lokalnie `npm run dev`. Dane na żywo wymagają klucza `WARSAW_API_TOKEN` w `.env` (wzór w `.env.example`).

Wynik czystej instalacji na świeżym klonie `main` (commit `dc2945f`, 18.10.2026 ok. 8:45, Windows 11, Node 24, uv): `npm ci`, `npm run typecheck` i `npm run build` bez błędów; `npm test`: 53 pliki, 360 testów zielonych; `validate.py`: „paczka OK”. Test e2e ścieżki Kasi (`npm run test:e2e`) uruchamiamy na macOS z zainstalowanym Chrome; na Windowsie trzeba najpierw `npx playwright install chromium`.

---

## 4. Użycie AI

Regulamin (§4 ust. 4) dopuszcza AI i wymaga opisania zakresu jego użycia. Pełny opis dla całego zespołu: [AI_USAGE.md](AI_USAGE.md).

Wszystkie cztery osoby w zespole pracowały z **Claude Code** (model Claude Opus 5.5). Każda osoba prowadziła swój pas prac w osobnym `git worktree` i zlecała subagentom zadania z [PLAN.md](PLAN.md), tylko w swoich folderach. Sama aplikacja nie korzysta z AI.

AI pomagało w:
- rozpoznaniu regulaminu, źródeł danych i doświadczeń Kijowa (research w `kontekst/`);
- specyfikacji i planie prac;
- pisaniu kodu modułów i skryptów przetwarzania danych, zaczynając od testów;
- analizie zasięgu syren przy blackoucie;
- scenariuszu pitchu i tej dokumentacji.

Kontrola po stronie ludzi: każda zmiana wchodzi na `main` przez pull request z CI (typy, testy, build, walidacja paczki). Liczby w pitchu i dokumentacji sprawdzaliśmy na plikach z danymi, nie z pamięci modelu.

Czego AI nie zrobiło dobrze i co trzeba było poprawić:
- Plan wygenerowany przez AI zakładał jeden zapis pyłu `PM25` i konstruktor, którego nie przepuszcza konfiguracja TypeScriptu. Parsery pisaliśmy więc od nowa na zapisanych próbkach odpowiedzi (`dane/probki/`).
- Błąd znikającego stożka dymu po przeładowaniu strony wyszedł dopiero przy zrzutach z produkcji, nie w testach.
- Pętla autopilota zrobiła i scaliła kilka zadań, nad którymi ktoś pracował jeszcze lokalnie. Od tej pory zadanie trzeba było najpierw zająć na GitHubie.

---

## 5. Atrybucje

Te same oznaczenia są w stopce aplikacji i w zakładce „O danych”.

- **SOIA (syreny):** „Dane: KG PSP, SOIA, wersja danych 2026.05 (Zenodo 10.5281/zenodo.21921103); przycięte do granic m.st. Warszawy (TERYT 1465011) przez zespół hackathonowy”. Źródła składowe: OpenStreetMap contributors (ODbL), GUS, GUGiK. Licencja CC BY 4.0. Pełny opis: [dane/soia-warszawa/README.md](../dane/soia-warszawa/README.md).
- **m.st. Warszawa:** dane z [dane.um.warszawa.pl](https://dane.um.warszawa.pl) i WFS m.st. Warszawy. Katalog portalu podaje licencję „Creative Commons Attribution” bez numeru wersji. Dane na żywo oznaczamy w aplikacji nazwą źródła: ZTM (pojazdy), Zarząd Oczyszczania Miasta (pogoda), Biuro Ochrony Powietrza i Polityki Klimatycznej (powietrze), Biuro Infrastruktury (utrudnienia). Warstwy WFS oznaczamy w stopce „m.st. Warszawa: dane.um.warszawa.pl i WFS” (CC BY) oraz nazwami z paczki: „m.st. Warszawa, WFS PUNKTY_ADRESOWE_WGS84” i „m.st. Warszawa, apteki (WFS, dane z marca 2017)”.
- **PSP, miejsca schronienia:** dane z [gdziesieukryc.pl](https://gdziesieukryc.pl), informacja sektora publicznego użyta na zasadach ponownego wykorzystywania (art. 14 ustawy o otwartych danych).
- **Przychodnie, gabinety i szpitale:** © OpenStreetMap contributors (ODbL).
- **SOR:** Rejestr Państwowego Ratownictwa Medycznego z [dane.gov.pl](https://dane.gov.pl), CC BY 4.0.
- **Mapa:** © OpenStreetMap contributors (ODbL), kafle Protomaps.
- **Rozkład GTFS:** ZTM Warszawa, Mikołaj Kuranowski (mkuran.pl), OpenStreetMap contributors. Rozkład na warunkach korzystania z danych ZTM Warszawa, przebiegi autobusów na ODbL.
- **Veturilo:** Nextbike Polska, feed GBFS, licencja CC0-1.0 (deklaracja w feedzie). Dobudowa weszła do wersji końcowej.

---

## 6. Oddanie

- Kanał: e-mail na `rozwiazania@42warsaw.pl`, do 10:59 w niedzielę 18.10.2026 (wymóg organizatora).
- Wysyłamy: prezentację, link do repozytorium, nazwę projektu („Warszawa w trybie kryzysowym”), nazwę zespołu („AI Slopers”) i jego numer.
- Skan sekretów (18.10.2026, 8:48): w całej historii gita (`git log -p --all`) nie ma wartości klucza API ani nagłówka `Authorization` z kluczem. Plik `.env` nie jest w repozytorium.
- Po zakończeniu etapu II nie zmieniamy repozytorium (regulamin §5A ust. 6).
