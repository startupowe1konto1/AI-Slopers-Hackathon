# Warsaw Open Data Hackathon 2026: rozpoznanie

Źródła: [strona hackathonu](https://42warsaw.pl/pl/hackathon-otwarte-dane-warszawa/), [regulamin (PDF)](https://42warsaw.pl/wp-content/uploads/2026/09/Regulamin-Warsaw-Open-Data-Hackathon_2026.pdf) (tekst w `regulamin.txt`), [dane.um.warszawa.pl](https://dane.um.warszawa.pl/pl).

## Hackathon w skrócie

- **Termin:** 24 h kodowania, od soboty 11:00 do niedzieli 11:00. Miejsce: 42 Warsaw, al. Solidarności 171B. Tylko na miejscu, język polski.
- **Drużyny:** 3–5 osób, maks. 120 uczestników. Organizator może przemieszać drużyny i przenosić je między wyzwaniami.
- **Wyzwania:**
  1. **Warszawa 2076**: rozwiązanie dzisiejszego problemu, które przybliża Warszawę, w jakiej chcielibyśmy żyć za 50 lat.
  2. **Warszawa – złap oddech!**: work-life balance, odkrywanie miasta, bycie na bieżąco.
  3. **Warszawa: Twój ruch!**: dowolna forma (gra, aplikacja, wizualizacja, model predykcyjny, bot).
  Szczegółowe specyfikacje wyzwań pokażą dopiero na otwarciu w sobotę o 10:00.
- **Warunek konieczny (§2.11, §4.9):** rozwiązanie musi korzystać z co najmniej jednego zbioru danych m.st. Warszawy (z dane.um.warszawa.pl albo z API miasta). Bez tego jury go nie oceni.
- **Oddajemy do nd 11:00:** pitch deck, link do repo, dokumentację (użyte zbiory danych miasta, założenia, frameworki i narzędzia, **zakres użycia AI**). Pitch: 5 min + 2 min pytań.
- **Nic nie przygotowujemy wcześniej:** zakaz „fragmentów kodu ani innych elementów przygotowanych przed Wydarzeniem”. Rozpoznanie danych, klucze API i konfiguracja narzędzi powinny być w porządku. Kodu, makiet ani slajdów nie robimy przed startem.
- **AI dozwolone**, trzeba je ujawnić w dokumentacji.

### Kryteria oceny (średnia ważona, skala 1–5)

| Kryterium | Waga |
|---|---|
| Innowacyjność i kreatywność | 25% |
| Wykorzystanie otwartych danych Warszawy | 20% |
| Praktyczność i potencjał wdrożenia | 20% |
| Jakość pitchu | 20% |
| Dopasowanie do wyzwań i realiów Warszawy | 15% |

### Nagrody i licencja

- W każdej ścieżce: 4000 zł brutto za 1. miejsce, 1000 zł za 2., nagroda rzeczowa za 3. (razem 18 000 zł).
- **Zwycięzcy muszą udzielić** organizatorowi i miastu nieodpłatnej, niewyłącznej licencji na całe rozwiązanie **razem z kodem**: na 10 lat, potem bezterminowo. Odmowa oznacza utratę nagrody (§7.2–7.5).

### Jury

Połowa z miasta i administracji, połowa z technologii i AI:
- dr Paulina Nowicka-Karpińska (strategia miasta)
- Monika Rogowska (Wydział Zarządzania Danymi, Biuro Informatyki UM, prawdopodobnie gospodarz portalu)
- Karol Wilczyński (Ministerstwo Cyfryzacji)
- Michał Ziółkowski (CTO Play)
- Sonia Staniek (COO Bielik.AI)
- Artur Kurasiński
- dwie osoby z 42 Warsaw

## Dane: co jest dostępne

### 1. Nowy portal dane.um.warszawa.pl (podstawowe źródło)

- **Tylko 23 zbiory.** Wszystkie to API JSON i **każdy wymaga klucza**. Plików do pobrania nie ma. Pełna lista: `katalogi/dane_um_warszawa_catalog.csv`.
- **Klucz jest darmowy i od ręki:** https://dane.um.warszawa.pl/pl/key-api (wystarczy nick i akceptacja regulaminu, bez konta). **Każdy z drużyny powinien go zdobyć przed sobotą.**
- **Wywołanie:** `POST https://dane.um.warszawa.pl/api/action/get_<zbiór>` z nagłówkiem `Authorization: <klucz>` i parametrami w JSON-ie w body.
  ```bash
  curl -X POST https://dane.um.warszawa.pl/api/action/get_ztm_lokalizacja_pojazdow \
    -H 'Authorization: KLUCZ' -H 'Content-Type: application/json' -d '{"type":1}'
  ```
- **Bez klucza** API zwraca `500 Service unavailable` zamiast 401, co łatwo wziąć za awarię.
- **Katalog bez klucza:** `GET https://dane.um.warszawa.pl/api/datasets?page=1&size=100&lang=pl`.
- **Licencja:** CC BY, oprócz Rejestru Cen Nieruchomości, który licencji nie ma.

| Kategoria | Zbiory (endpoint `get_…`) | Odświeżanie |
|---|---|---|
| Transport | położenie autobusów i tramwajów (`ztm_lokalizacja_pojazdow`, `type` 1/2) | 10 s |
| | przystanki, linie na przystanku, odjazdy z przystanku, lista pojazdów | codziennie |
| | utrudnienia w ruchu (`bin_utrudnienia_drogowe`, z geometrią) | 1 min |
| | wolne miejsca parkingowe (`m_parkingi_wolne_miejsca`) | 1 min |
| Środowisko | jakość powietrza (`bopipk_monitoring_jakosci_powietrza`) | 10 min |
| | pogoda ze stacji ZOM, m.in. temperatura nawierzchni (`zom_pogoda`) | 10 min |
| | segregacja i typy odpadów, ekopunkty, toalety | różnie |
| Aktywni mieszkańcy | budżet obywatelski (projekty, koszty, głosy, pinezki), konsultacje społeczne, trasy turystyczne | tydzień / 2 h |
| Nieruchomości | Rejestr Cen Nieruchomości (`bgk_rcn`, GeoJSON, filtry: dzielnica, rodzaj, rynek, rok) | codziennie |
| Zdrowie | defibrylatory AED (`scb_lokalizacja_defibrylatorow`) | — |
| Sport | otwarte boiska, zajęcia sportowe | tydzień |
| Wydarzenia | kalendarz wydarzeń (`bmm_kalendarz_wydarzen`) | 2 h |

Dokumentacja każdego zbioru (parametry `_pa.json` i przykłady `_pw.json`) leży w `dokumentacja-api/`. Uwaga: 9 plików ma BOM UTF-8, a niektóre przykłady mają złe tytuły (np. parkingi opisane jako „Utrudnienia drogowe”).

### 2. Stare API api.um.warszawa.pl (z 2015, „wkrótce wyłączane”)

- 63 pozycje: `katalogi/legacy_api_catalog.csv`. Klucz wymaga konta (login, e-mail, captcha).
- **Część zbiorów działa bez klucza** (`datastore_search`):
  - **Drzewa: 139 348 rekordów** z gatunkiem, wysokością, obwodem, stanem zdrowia, dzielnicą i współrzędnymi WGS84 (ID `ed6217dd-c8d0-4f7b-8bed-3b7eb81a95ba`)
  - lasy: 63 tys.
  - grupy krzewów: 82 tys.
  - grupy drzew: 29 tys.
  - krzewy: 22 tys.
  - szkoły (dane z 2015)
  ```
  GET https://api.um.warszawa.pl/api/action/datastore_search/?resource_id=ed6217dd-c8d0-4f7b-8bed-3b7eb81a95ba&limit=1000&offset=0
  ```
- **Tylko tutaj są zgłoszenia 19115** (`19115store_getNotifications`, wymaga klucza). Nie ma ich ani na nowym portalu, ani na dane.gov.pl.
- **Ryzyko:** API może zniknąć i dane są stare (drzewa z placeholderem daty 18991230). Do dema warto zrobić lokalną kopię w trakcie hackathonu.

### 3. Geoportal mapa.um.warszawa.pl (WMS/WFS, bez klucza)

- **WMS** `https://wms.um.warszawa.pl/serwis`: 212 warstw, m.in.:
  - mapy hałasu 2017/2022
  - plany miejscowe (MPZP)
  - pozwolenia na budowę
  - ortofotomapy 1945–2021
  - plan z 1939
- **WFS** `https://wfs.um.warszawa.pl/serwis`: 35 typów obiektów, m.in.:
  - apteki, policja
  - wejścia do metra, P+R
  - trasy rowerowe
  - biblioteki, teatry
  - obwody szkół
  - granice dzielnic
  - adresy
- **WFS** `https://wms2.um.warszawa.pl/geoserver/wfs/wfs`: budynki, działki, ulice.

To dane miejskie, ale nie z portalu dane.um.warszawa.pl. Żeby spełnić §2.11 na pewno, trzymajmy je jako uzupełnienie obok co najmniej jednego zbioru z nowego portalu.

### 4. Źródła pozamiejskie (tylko jako uzupełnienie, nie spełniają wymogu)

- **GTFS ZTM (nieoficjalny):** https://mkuran.pl/gtfs/warsaw.zip (aktualizowany codziennie, ok. 107 MB)
- **Pozycje pojazdów bez klucza:** `https://mkuran.pl/gtfs/warsaw/positions.json`
- **Veturilo (GBFS, 348 stacji):** https://gbfs.nextbike.net/maps/gbfs/v2/nextbike_vw/gbfs.json
- **GIOŚ (jakość powietrza):** `https://api.gios.gov.pl/pjp-api/v1/rest/station/findAll`
- **dane.gov.pl:** te same zbiory warszawskie (instytucje 7621 i 65) plus Adresy SHP i Rzeczy znalezione XLSX.

## Wnioski strategiczne

1. **Klucze API przed sobotą** dla każdego z drużyny. Sprawdźcie też, czy zgadzacie się na licencję dla miasta w razie wygranej.
2. **Najmocniejsze dane do łączenia** to dane na żywo z geolokalizacją:
   - pojazdy ZTM co 10 s
   - parkingi i utrudnienia co 1 min
   - powietrze i pogoda co 10 min

   Do tego warstwy statyczne: drzewa, ceny nieruchomości, budżet obywatelski, AED, hałas (WMS). Za „wykorzystanie danych” dostaje się 20%, więc łączenie kilku zbiorów miejskich w jednym rozwiązaniu powinno punktować.
3. **Jury ocenia potencjał wdrożenia,** a jest w nim osoba odpowiedzialna za dane w urzędzie. Warto pokazać, że rozwiązanie da się wdrożyć na API miasta, i wskazać braki w danych, które miasto mogłoby uzupełnić. Materiał już mamy: 23 zbiory na nowym portalu wobec 63 w starym, brak 19115, błędy w dokumentacji.
4. **Pitch to 20%,** tyle samo co dane. Trzeba zostawić czas na demo i slajdy. Termin oddania (nd 11:00) jest sztywny.
5. **W API jest dużo pułapek:**
   - wszystko idzie przez POST
   - brak klucza daje mylący błąd 500
   - pliki z BOM
   - stare API może przestać działać

   Dlatego w trakcie hackathonu od razu cache'ujemy odpowiedzi lokalnie.

## Wstępne pomysły (do burzy mózgów, nie decyzja)

- **Warszawa 2076:**
  - Mapa miejskich wysp ciepła i miejsc do posadzenia drzew: drzewa (139 tys.) + temperatura nawierzchni ze stacji ZOM + WFS budynków.
  - Dostępność transportu a ceny mieszkań: RCN + przystanki i odjazdy ZTM.
- **Złap oddech:**
  - „Gdzie dziś wyjść?”: jakość powietrza + pogoda + wydarzenia + boiska + trasy turystyczne + toalety.
  - Mapa cichych i zielonych miejsc: mapa hałasu (WMS) + drzewa + lasy.
- **Twój ruch:**
  - Model opóźnień ZTM: pozycje GPS kontra rozkład.
  - „Najbliższy AED”: lokalizacje defibrylatorów + czas dojścia lub dojazdu.
  - Bot do budżetu obywatelskiego i konsultacji („co dzieje się w mojej dzielnicy”).

## Koncepcja wybrana do dalszej pracy: „Gdzie się ukryć” (odporność miasta)

Zakres: schronienie, pomoc medyczna, skutki zdarzenia, analiza luk dla miasta i aplikacja dla mieszkańca. Ewakuację transportem publicznym odrzuciliśmy, bo podczas ataku może nie działać.

### UWAGA: aplikacja dla mieszkańca już istnieje

MSWiA i PSP prowadzą [gdziesieukryc.pl](https://gdziesieukryc.pl) („Gdzie się ukryć”):
- ok. 70 tys. punktów schronienia, z czego około ćwierć dostępna całodobowo
- nawigacja do najbliższego punktu
- **tryb offline po pobraniu paczki danych gminy**
- wśród zagrożeń wprost wymieniony atak z powietrza

Wcześniej działała mapa PSP „Schrony” (schrony.straz.gov.pl), oparta na inwentaryzacji 235 tys. obiektów.

Krytyka, z której możemy skorzystać:
- **NIK:** dane PSP są niewiarygodne i mogą dawać fałszywe poczucie bezpieczeństwa; część obiektów jest niedostępna; miejsce w schronie lub ukryciu znalazłoby mniej niż 4% mieszkańców; aplikacja pokazuje wszystkie punkty, więc nie zapobiega przepełnieniu (PAP/Infor).
- **android.com.pl:** część punktów to zwykłe piwnice, garaże i sklepy, a ich właściciele nie wiedzą o oznaczeniu.
- **Stołeczne Centrum Bezpieczeństwa:** w Warszawie nie ma ani jednego obiektu spełniającego ustawową definicję schronu (kb.pl).

**Wniosek:** nie robimy drugiego „Gdzie się ukryć”, bo za innowacyjność jest 25%, a w jury siedzi Ministerstwo Cyfryzacji. Uzupełniamy to, czego rządowa aplikacja nie ma:
- pomoc medyczna (AED, szpitale, apteki)
- skutki po zdarzeniu (powietrze, wiatr, utrudnienia)
- analiza luk i pojemności dla miasta
- ewentualnie przydział mieszkańców do punktów według pojemności, czyli odpowiedź na zarzut NIK o przepełnieniu

Sprawdzić: czy dane gdziesieukryc.pl (paczki gmin) da się legalnie pobrać i jakie mają pola (pojemność? godziny dostępności?). Strona ma ochronę przed botami, curl dostaje 403.

### Skąd dane

| Moduł | Dane miejskie | Dane zewnętrzne |
|---|---|---|
| Gdzie się ukryć | stacje i wejścia metra (WFS), budynki, adresy, granice dzielnic (WFS) | **schrony, ukrycia i miejsca doraźnego schronienia: tylko PSP/MSWiA** ([gdziesieukryc.pl](https://gdziesieukryc.pl), paczki gmin do trybu offline; otwartego zbioru nie znaleźliśmy); OSM jako uzupełnienie |
| Pomoc medyczna | **AED (portal, klucz)**, szpitale, apteki (WFS) | opcjonalnie: lista SOR i godziny otwarcia aptek (NFZ) |
| Skutki po zdarzeniu | **jakość powietrza, pogoda z wiatrem, utrudnienia w ruchu (portal, klucz)**, zgłoszenia 19115 (stare API, klucz) | opcjonalnie: stacje GIOŚ |
| Analiza luk | budynki, adresy, metro, szkoły i obwody, szpitale, AED | liczba ludności w siatce (GUS, do sprawdzenia), sieć chodników do routingu (OSM), schrony PSP |
| Aplikacja mieszkańca | wszystko powyżej | podkład mapy (OSM) |

- **Wymóg z §2.11 spełniamy z zapasem:** AED, powietrze, pogoda i utrudnienia pochodzą wprost z dane.um.warszawa.pl.
- **Najsłabsze ogniwo to warstwa schronów:**
  - Miasto jej nie publikuje.
  - PSP i MSWiA udostępniają ją w aplikacji gdziesieukryc.pl, ale nie jako otwarty zbiór danych.
  - Na dane.gov.pl jedyny zbiór schronów dotyczy Krosna.
  - Centralna ewidencja obiektów ochrony zbiorowej (PSP, ustawa o ochronie ludności z 2025 r.) dopiero powstaje.

  To jednocześnie mocny punkt pitchu: pokazujemy lukę w danych i proponujemy, żeby miasto opublikowało ten zbiór.
- **Uwaga merytoryczna:** według Stołecznego Centrum Bezpieczeństwa w Warszawie nie ma ani jednego obiektu spełniającego ustawową definicję schronu, a eksperci krytykują metro jako schron. W aplikacji używamy więc pojęć „ukrycie” i „miejsce doraźnego schronienia”, a nie „schron”.

### Działanie przy zakłóceniach sieci (założenia architektury)

1. **Najpierw offline.** Aplikacja jest PWA: Service Worker trzyma powłokę aplikacji, a dane leżą w IndexedDB.
   - Paczka danych dla Warszawy ma kilka MB i jest pobierana z góry.
   - Mapa działa offline jako jeden plik kafli wektorowych (np. PMTiles z OSM).
   - Na iOS trzeba dodać aplikację do ekranu głównego i poprosić o trwałe przechowywanie, bo Safari czyści dane stron po kilku dniach nieużywania.
2. **Bez routingu na telefonie.** Analiza luk liczy z góry, dla każdego adresu, 3 najbliższe miejsca ukrycia, najbliższy AED i szpital, a także odległość pieszo. Aplikacja tylko odczytuje gotową tabelę. Jeden potok danych daje więc dwa produkty: mapę luk dla miasta i dane do aplikacji.
3. **Bez GPS.** GPS bywa zakłócany, dlatego lokalizację można ustawić z offline'owej wyszukiwarki adresów (adresy z WFS) albo przez wybór punktu na mapie. Wtedy aplikacja pokazuje kierunek i odległość.
4. **Dane na żywo tylko jako dodatek.** Powietrze, wiatr i utrudnienia pokazujemy, gdy jest sieć, zawsze z godziną ostatniej aktualizacji. Bez sieci aplikacja działa dalej, tylko bez tej warstwy.
5. **Rozwiązanie awaryjne bez prądu:** drukowalna karta dla budynku lub klatki schodowej (najbliższe ukrycia, AED, szpital, mapka z QR). Miasto lub spółdzielnia może ją wywiesić z góry.
6. **Rozszerzenia (poza zakresem 24 h):** bot SMS (wysyłasz adres, dostajesz najbliższe ukrycie), przekazywanie paczki danych między telefonami.
7. **Moment na pitch:** włączamy tryb samolotowy na żywo i pokazujemy, że aplikacja dalej działa.

## Zawartość folderu

- `regulamin.txt`: pełny tekst regulaminu
- `katalogi/dane_um_warszawa_catalog.csv`: 23 zbiory z nowego portalu (endpoint, parametry, odświeżanie, licencja)
- `katalogi/legacy_api_catalog.csv`: 63 pozycje ze starego API (resource ID, metoda, format)
- `dokumentacja-api/`: parametry i przykłady wywołań każdego zbioru oraz OpenAPI YAML dla pojazdów ZTM. W przykładzie budżetu obywatelskiego zamazałem wygasłe dane uwierzytelniające S3.
