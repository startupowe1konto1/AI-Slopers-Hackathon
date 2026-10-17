# Nasze rozwiązanie: jak je rozumiemy (przed planem budowy)

Stan po researchu. Szczegóły: `jtbd-kryzys-warszawa.md` (31 zadań JTBD), `mozliwosci-i-customer-journeys.md` (klocki K1–K5, syreny S1–S4), `architektura-diagram.md`.

## 1. W skrócie

**Jedno zdanie:** Warszawa w trybie kryzysowym. Aplikacja dla mieszkańców, która działa także bez sieci. Zbudowana na otwartych danych Warszawy i PSP oraz na tym, czego nauczył nas Kijów.

**Problem:** w czasie ataku i blackoutu znikają prąd, sieć komórkowa, alarmy i mapy. Mieszkańcy nie wiedzą, czy usłyszą alarm, jak dotrzeć do bliskich bez tramwaju i metra ani gdzie jest najbliższa pomoc.

**Na co odpowiadamy (mieszkaniec):**
1. Czy usłyszę alarm u siebie, także przy blackoucie? Co zrobić, jeśli nie?
2. Gdzie jest najbliższe miejsce schronienia, AED, apteka, SOR, toaleta, także bez sieci?
3. Jak dotrę do dziecka lub do domu, gdy stoją tramwaje i metro?
4. Czy dym idzie w moją stronę? Co naprawdę jeździ w mojej okolicy?

**Dla kogo:** osoby prywatne, czyli rodzice, opiekunowie seniorów, osoby w drodze i osoby nieznające polskiego. Wdrożenie i utrzymanie po stronie miasta (np. jako tryb w istniejących kanałach miejskich) to temat na pilotaż, nie część produktu.

**Poza zakresem:** konsola dla miasta (wykrywanie ciszy czujników, autobusy zastępcze, punkty pomocy). Odłożona, bo rozmywała wizję. Opis zostaje w `mozliwosci-i-customer-journeys.md` jako możliwy kierunek rozwoju.

## 2. Dowód z danych: syreny przy blackoucie

Analiza: `dane/soia-warszawa/analiza/` (skrypt, mapa, tabele).

- **Wszystkie syreny:** 92,5% z 126 923 punktów adresowych Warszawy jest w zasięgu co najmniej 65 dB(A).
- **Tylko syreny cyfrowe** (założenie: analogowe nie działają bez prądu, do weryfikacji): 69,1%. Zasięg traci 29 676 adresów (−23,4 pp).
- **Największy spadek mają dzielnice centralne:** Żoliborz −57 pp, Praga-Północ −54, Wola −52, Praga-Południe −50, Bielany −41, Mokotów −41.
- **Zastrzeżenia:** punkt adresowy to nie liczba mieszkańców (domy jednorodzinne zawyżają np. Wawer). Model dotyczy dźwięku na zewnątrz. Nie wiemy, które warszawskie syreny analogowe mają zasilanie awaryjne.

## 3. Customer journey (offline i online)

Faza „przed” (online, raz):
- instalacja PWA, wpisanie adresów (dom, praca, szkoła, rodzina);
- pobranie paczki offline (dane i mapa Warszawy);
- wynik: „syrena u Ciebie: słaba lub przy blackoucie jej nie usłyszysz”, plus kroki: włącz Alert RCB i RSO, ustal z sąsiadem, kto kogo budzi, wydrukuj kartę.

| Moment | Tryb | Co widzi mieszkaniec | Dane |
|---|---|---|---|
| Alarm, 0–15 min | offline | najbliższe miejsca schronienia, wejścia do metra, trasa piesza, link do PSP z lokalizacją | schrony (gdy miasto je dostarczy), WFS, OSM |
| Uderzenie, 15–60 min | online, jeśli jest sieć | kierunek wiatru i strefa dymu, utrudnienia na trasie | pogoda ZOM, powietrze, utrudnienia |
| Uderzenie, 15–60 min | offline | najbliższe AED i SOR | portal (AED), RPRM |
| Powrót, 1–6 h | offline | trasa w scenariuszu blackoutu: autobusy, pieszo, rower | przystanki, linie, odjazdy, GTFS, trasy rowerowe |
| Powrót, 1–6 h | online | co faktycznie jeździ w okolicy (liczone automatycznie z pozycji pojazdów, np. „tramwaje w Twojej okolicy nie kursują od 14:10”), wolne rowery | pozycje ZTM, Veturilo |
| Blackout, 1–3 dni | offline | toalety, apteki, AED, SOR; punkty ciepła i wody, jeśli miasto je ogłosi (ostatni zapisany stan) | portal, WFS, Rejestr Aptek |

Gdy nie ma sieci, aplikacja pokazuje ostatni zapisany stan z datą („stan na 14:02”). Mieszkaniec nigdy nie widzi ekranu bez danych.

## 4. Konsola miasta: odłożona

Poza zakresem tej wersji (decyzja zespołu). Ewentualny kierunek rozwoju opisuje `mozliwosci-i-customer-journeys.md` (opcja B, CJ4–CJ6).

## 5. Zbiory danych

**Portal dane.um.warszawa.pl**

| Zbiór | Do czego | Priorytet |
|---|---|---|
| Lokalizacja defibrylatorów (AED) | paczka offline | konieczny |
| Toalety | paczka offline (blackout) | konieczny |
| Lokalizacja pojazdów komunikacji miejskiej | co jeździ w okolicy | konieczny |
| Lokalizacja przystanków | trasy, scenariusze | konieczny |
| Linie dostępne na przystanku | scenariusze (tramwaj czy autobus) | konieczny |
| Odjazdy linii z przystanku | rozkład w scenariuszach | konieczny |
| Pojazdy transportu publicznego | rodzaj trakcji (które pojazdy stają bez prądu) | opcjonalny |
| Utrudnienia w ruchu drogowym | zamknięte drogi | konieczny |
| Pogoda (ZOM) | wiatr, czyli dym | konieczny |
| Monitoring jakości powietrza | dym | konieczny |
| Wolne miejsca parkingowe | kandydaci na miejsca ukrycia (parkingi wielopoziomowe) | przydatny |
| Otwarte boiska | miejsca spotkań w planie rodzinnym | opcjonalny |

**WFS m.st. Warszawy:** APTEKI, METRO_WEJSCIA, PUNKTY_ADRESOWE_WGS84 (wyszukiwanie bez GPS, analizy), ULICE_WGS84, GRANICE_DZIELNIC, STACJE_ROWEROWE, TRASY_ROWEROWE, DOMY_POMOCY_SPOLECZNEJ, KLUBY_SENIORA, INNE_POMOC_SPOLECZNA, PLACE_SKWERY_WGS84, BIBLIOTEKI (kandydaci na punkty ciepła).

**Uzupełnienia:** PSP SOIA (syreny, budynki publiczne), RPRM (SOR), Rejestr Aptek, GIOŚ, Veturilo GBFS, GTFS (rozkład metra i SKM), OSM (sieć dróg i mapa).

## 6. Schrony (przy założeniu, że miasto legalnie pozyskuje dane PSP)

- **Co widać w aplikacji PSP dla Warszawy:**
  - identyfikator `OZO-xxxxxx`, typ „Punkt schronienia”;
  - dostępność („ograniczona, określone godziny otwarcia” albo całodobowa);
  - adres z dzielnicą, współrzędne GPS;
  - około 250 obiektów w promieniu 5 km od placu Defilad.
- **Dane są zanonimizowane** zgodnie z ustawą o ochronie ludności (2024). Nie ma pojemności ani nazw właścicieli i nie należy ich oczekiwać.
- **Projekt importu:** adapter przyjmujący oficjalny eksport (CSV albo GeoJSON z polami: id, typ, dostępność, adres, lat, lon). Codzienna aktualizacja z różnicami (dodane, usunięte, zmienione). W aplikacji pokazujemy datę stanu danych i źródło PSP.
- **Przekierowanie bez kopiowania danych:** aplikacja PSP przyjmuje parametry `?lat=…&lng=…`, np. `https://gdziesieukryc.pl/?lat=52.23164&lng=21.00645`. Możemy otworzyć ją od razu w miejscu, w którym jest użytkownik.
- **Pełna baza w przeglądarce (zespół deklaruje zgodę PSP):** aplikacja PSP zapisuje w pamięci przeglądarki (IndexedDB `gsu-national`, magazyn `cells`) wszystkie 87 308 punktów. Każdy rekord ma postać `[id_publiczny, lat, lon, adres, miejscowość, dostępność]`.
  - W prostokącie obejmującym Warszawę jest 8006 punktów: 6982 „na żądanie”, 890 „określone godziny”, 134 „całodobowe”.
  - Dokładne przycięcie do granicy miasta: skryptem po eksporcie.
- **Do zrobienia:** eksport do pliku (`dane/psp-schrony/`). Automatyczny eksport z wbudowanej przeglądarki zablokowały uprawnienia sesji, więc instrukcja ręcznego eksportu jest poniżej.

## 7. Mapa bazowa

Sprawdzone na żywo.

| Opcja | Tryb | Rozmiar dla Warszawy | Licencja | Klucz |
|---|---|---|---|---|
| **Protomaps PMTiles (wycinek Warszawy)**, rekomendowana | online i offline, jeden plik | około 27 MB (zoom do 14), około 60 MB (zoom do 15), zmierzone | ODbL, „© OpenStreetMap contributors” i Protomaps | nie |
| OpenFreeMap | online (offline do 3000 kafli lub 50 MB) | — | „© OpenMapTiles © OpenStreetMap” | nie |
| WMTS miasta, plan (`mapa.um.warszawa.pl/mapviewer/wmts`, warstwa `AA_SPATIAL_ST_MAPA`, EPSG:3857) | online | duże kafle PNG | „Źródło: m.st. Warszawa”, warunki do potwierdzenia | nie |
| WMS miasta (213 warstw, w tym ORTO 2021, policja, straż, budynki; działa w EPSG:3857) | online, nakładki | — | jw. | nie |
| tile.openstreetmap.org | tylko online, offline zabroniony przez politykę OSM | — | — | — |

**Rekomendacja:**
- **Aplikacja mieszkańca:** MapLibre GL JS z biblioteką `pmtiles` i jednym plikiem `warszawa.pmtiles`.
  - Plik zapisujemy w pamięci przeglądarki (OPFS) i wywołujemy `navigator.storage.persist()`.
  - Fonty i ikony (sprite'y) mapy trzymamy lokalnie.
  - Na iOS zachęcamy do „Dodaj do ekranu głównego”, bo inaczej Safari usuwa dane po 7 dniach.
- **Opcjonalnie, tryb online:** przełącznik na plan miasta z WMTS urzędu, co dodatkowo wykorzystuje dane miasta.
- **Wycięcie Warszawy:** narzędzie `pmtiles` (go-pmtiles):

```
pmtiles extract https://build.protomaps.com/20261017.pmtiles warszawa.pmtiles --bbox=20.85,52.09,21.28,52.37 --maxzoom=15
```

## 8. Podobne rozwiązania i innowacyjność

Przegląd: Ukraina, Izrael, kraje nordyckie i bałtyckie, Niemcy, Szwajcaria, Tajwan, Japonia, Polska oraz platformy komercyjne.

| Rozwiązanie | Co ma z naszych funkcji | Czego nie ma |
|---|---|---|
| Kyiv Digital (UA) | alerty, schrony i punkty ogrzewania (mapa offline), harmonogram wyłączeń prądu pod adresem | modelowania syren, scenariuszy transportu, wykrywania awarii |
| Diia, punkty niezłomności (UA) | około 13 tys. punktów z filtrami (generator, woda, ciepło), offline po pobraniu regionu | syren, transportu, konsoli |
| Air Alert / Ajax (UA) | alarm przekazywany tam, gdzie syren nie słychać | modelu słyszalności, offline |
| Svitlobot (UA) | wykrywanie braku prądu w budynku (crowdsourcing) | skali miasta, danych miejskich |
| Pikud HaOref, Tzofar (IL), prywatny Shelter Locator | alerty, schrony offline (w prywatnej aplikacji) | syren pod adresem, transportu |
| 112 Suomi, Helsinki (FI), Krisinformation (SE), LT72 (LT), 112 Latvija (LV) | alerty, AED, mapy schronów (część offline) | syren, transportu, konsoli |
| NINA / KATWARN (DE), Alertswiss (CH), Tajwan, Safety tips (JP) | alerty, poradniki, plan awaryjny, schrony | danych miejskich na żywo |
| gdziesieukryc.pl, RSO, Alert RCB, mObywatel (PL) | schrony offline, alerty regionalne | syren pod adresem, transportu, konsoli |
| Warszawa 19115 | podczas ćwiczeń Syrena-26 mieszkańcy ręcznie zgłaszali, czy słyszą syreny | mapy, modelu |
| Everbridge, Esri (dashboardy, mechanizm „Track Gap Detector”) | konsola kryzysowa, mechanizm wykrywania zamilkłego strumienia | danych Warszawy, mieszkańca, offline |
| CE Sound, prace CNOSSOS-EU | modelowanie zasięgu syren dla planistów | wersji dla mieszkańca |
| IODA | wykrywanie awarii internetu w skali kraju | skali dzielnicy |
| DASh-Bus (Toronto), SINTEF REPLACE | optymalizacja komunikacji zastępczej (badania) | produktu dla ochrony ludności |
| Waze for Cities, AirNow Fire & Smoke | zamknięcia dróg, dym z pożarów lasów | — |

**Co jest powszechne:** alerty push, mapy schronów (często offline), AED w aplikacji, poradniki, punkty pomocy, dashboardy centrów kryzysowych, zamknięcia dróg. Same w sobie nie dają innowacyjności.

**Czego nie znaleźliśmy nigdzie:**
1. **Słyszalność syreny pod adresem dla mieszkańca.** Istnieją tylko płatne narzędzia GIS dla planistów. Warszawa podczas ćwiczeń Syrena-26 zbierała zgłoszenia ręcznie przez 19115, co jest mocnym argumentem w pitchu.
2. **Zasięg syren przy blackoucie.** Nasz wynik: 92,5% adresów spada do 69,1%.
3. **Scenariusze komunikacji w blackoucie offline dla mieszkańca.** Kijów przeżył to w styczniu 2026 (stanęły tramwaje i trolejbusy, uruchomiono autobusy zastępcze), ale tylko w komunikatach, bez narzędzia.
4. (Dotyczy odłożonej konsoli.) Wykrywanie awarii po ciszy miejskich danych w skali dzielnicy. IODA działa w skali kraju, Svitlobot budynku, Esri ma tylko mechanizm.

**Średnia nowość:** komunikacja zastępcza z uwzględnieniem pojemności taboru (jest w badaniach, nie w systemach ochrony ludności), dym i wiatr dla mieszkańca przy pożarze miejskim, punkty pomocy rozmieszczane według liczby ludności.

**Wniosek (wersja tylko dla mieszkańców):** sama mapa schronów i AED to powtórzenie. Nowe jest połączenie trzech rzeczy w jednej aplikacji offline: słyszalności syreny pod adresem (także przy blackoucie), scenariuszy komunikacji przy blackoucie i informacji na żywo o tym, co jeździ i skąd wieje dym. Najbliżej jest Kyiv Digital razem z Diią, ale nie modelują syren, nie mają scenariuszy transportu ani wykrywania awarii.

Do weryfikacji: czy Kyiv Digital pokazuje dziś pojazdy na żywo; jak działa offline w 112 Suomi, LT72 i Ole valmis!; termin uruchomienia mapy schronów w mObywatelu.

Źródła: rubryka.com/en/?p=568481, babel.ua/en/news/101733, ajax.systems/blog/air-alert-via-software-ajax/, rubryka.com/en/?p=664577, eng.lsm.lv/…a600125, android.com.pl/tech/1004585, spidersweb.pl/2026/09/alerty-rcb-mobywatel…, warszawa19115.pl/-/sygnaly-alarmowe, enterprise.arcgis.com/en/geoevent/10.8/analyze/track-gap-detector-processor.htm, blog.apnic.net/2024/09/11/ioda…, news.engineering.utoronto.ca/?p=19680, kyivpost.com/post/67815.
