# Warszawa w sytuacji ataku: segmenty, JTBD godzina po godzinie i dane

Analiza od zera, niezależna od dotychczasowych pomysłów zespołu. Opiera się na doświadczeniach z Kijowa (`research-kijow.md`), rządowym „Poradniku bezpieczeństwa” (`research-defense-dane.md`) i sprawdzonych źródłach danych. Przy każdym zadaniu oceniam też, czy aplikacja jest w ogóle właściwym narzędziem.

Format JTBD: **Kiedy [sytuacja], chcę [zrobić], żeby [rezultat].**

---

## Część 1. Założony scenariusz

Dzień powszedni, jesień. Napięcie trwa od tygodni, alarmy zdarzają się od kilku dni. O 14:10 rusza zmasowany atak dronów i rakiet na infrastrukturę energetyczną. Trafiona jest podstacja na Woli i elektrociepłownia. Część miasta traci prąd. Sieć komórkowa jest przeciążona, a w strefie bez prądu po kilku godzinach gaśnie, bo stacje bazowe wyczerpują baterie.

To scenariusz modelowy, nie prognoza. Każdy element ma odpowiednik w Kijowie: ataki na energetykę, kilkanaście alarmów dziennie, gasnąca łączność, wychłodzenie bloków.

## Część 2. Fazy czasowe: co się dzieje

| Faza | Czas | Co się dzieje (na podstawie Kijowa i poradnika) |
|---|---|---|
| F0 | dni i tygodnie przed | Rośnie napięcie, pojawiają się pierwsze alarmy, poradnik leży w szufladzie, ludzie robią zapasy albo je odkładają |
| F1 | 0–15 min | Syrena, Alert RCB, RSO. Trzeba zdecydować, gdzie się ukryć. Ludzie są w pracy, w szkole, w drodze. Telefony są przeciążone |
| F2 | 15–60 min | Wybuchy, pożary, dym. Lokalnie gaśnie prąd. Komunikacja staje na odcinkach naziemnych. Kolejne uderzenia albo odwołanie alarmu |
| F3 | 1–6 h | Powrót ze schronienia. Ludzie szukają bliskich i dzieci, wracają do domów. Transport jest rozbity. Krążą sprzeczne informacje i plotki |
| F4 | 6–24 h | Noc. Brak prądu w części miasta, nie działają windy, pompy wody na wyższych piętrach, ogrzewanie. Kolejne alarmy w nocy, ludzie nie śpią |
| F5 | 1–3 dni | Przedłużający się blackout. Brak wody, chłód, leki wymagające lodówki, ładowanie telefonów, gotówka, higiena. Seniorzy zostają odizolowani |
| F6 | 3+ dni | Stopniowe przywracanie usług. Pytania: co już działa? Zmęczenie psychiczne, powrót do pracy i szkoły w nowym rytmie |

---

## Część 3. Segmenty

### Mieszkańcy

| Kod | Segment | Dlaczego osobno |
|---|---|---|
| M1 | **Pracujący rodzic, dojeżdżający**, dziecko w szkole lub przedszkolu | Rodzina rozproszona po mieście. Odebranie dziecka jest celem nadrzędnym |
| M2 | **Senior mieszkający sam albo osoba z niepełnosprawnością ruchową**, często w bloku z windą | Windy stają, schody są barierą. Słabszy dostęp do smartfona. Izolacja |
| M3 | **Osoba przewlekle chora, zależna od prądu lub leków** (insulina w lodówce, koncentrator tlenu, dializy) | Blackout bezpośrednio zagraża życiu |
| M4 | **Osoba nieznająca polskiego albo lokalnych systemów** (migranci, uchodźcy, turyści, studenci z zagranicy) | Komunikaty RSO i RCB są po polsku. Nie zna miasta. Uchodźcy z Ukrainy mają za to doświadczenie wojenne |
| M5 | **Młoda osoba bez zapasów** (student, wynajmowany pokój) | Polega na telefonie i karcie, nie ma gotówki, latarki ani radia |
| M6 | **Osoba w drodze w chwili alarmu** (pasażer, kierowca, rowerzysta) | Daleko od domu, w nieznanym miejscu, transport się zatrzymuje |

### Instytucje (klienci i wdrażający)

| Kod | Segment | Rola |
|---|---|---|
| I1 | **Zarządzanie kryzysowe miasta** (Stołeczne Centrum Bezpieczeństwa, biuro zarządzania kryzysowego UM) | Obraz sytuacji, koordynacja, komunikaty dla mieszkańców |
| I2 | **Operator transportu** (ZTM, Tramwaje Warszawskie, Metro, dyspozytornia) | Utrzymanie kursów, komunikacja zastępcza, transport ewakuacyjny |
| I3 | **Pomoc społeczna i wolontariusze** (MOPS, OPS, NGO) | Dotarcie do osób zależnych od pomocy |
| I4 | **Zarządca budynku** (spółdzielnia, wspólnota) | Windy, pompy, piwnice jako ukrycia, informacja dla lokatorów |
| I5 | **Dyrektor szkoły lub przedszkola** | Bezpieczeństwo dzieci i przekazanie ich rodzicom |
| I6 | **Szpital lub SOR** | Napływ poszkodowanych, zasilanie awaryjne, kierowanie pacjentów |

---

## Część 4. JTBD godzina po godzinie

Oznaczenia ważności: 🔴 życie i zdrowie, 🟠 bezpieczeństwo i rodzina, 🟡 komfort i porządek.

### F0. Dni i tygodnie przed

| Seg. | JTBD | Ważność |
|---|---|---|
| M1 | Kiedy rośnie napięcie, chcę ułożyć plan rodzinny (kto odbiera dziecko, gdzie się spotykamy), żeby nie improwizować w panice | 🟠 |
| M1, M5 | Kiedy czytam poradnik, chcę wiedzieć, gdzie konkretnie w mojej okolicy się schronić, bo poradnik odsyła do gminy, żeby znać drogę zawczasu | 🔴 |
| M2 | Kiedy mieszkam sam, chcę, żeby ktoś z sąsiedztwa wiedział, że może być mi potrzebna pomoc, żeby nie zostać zapomnianym | 🔴 |
| M3 | Kiedy zależę od prądu albo leku, chcę mieć plan awaryjny (zapas leku, gdzie naładować sprzęt, który szpital), żeby przetrwać kilka dni blackoutu | 🔴 |
| M4 | Kiedy nie znam polskiego, chcę rozumieć zasady i sygnały alarmowe w swoim języku, żeby zareagować poprawnie | 🔴 |
| I1 | Kiedy przygotowuję miasto, chcę wiedzieć, które obszary mają najsłabszy dostęp do ukryć, AED, szpitali i alternatywnego transportu, żeby je wzmocnić | 🟠 |
| I3 | Kiedy przygotowuję pomoc, chcę wiedzieć, gdzie mieszka najwięcej osób zależnych od pomocy, żeby zaplanować obchody | 🔴 |
| I4 | Kiedy zarządzam budynkiem, chcę wiedzieć, które piwnice lub garaże nadają się do ukrycia i jak o tym poinformować lokatorów | 🟠 |

### F1. 0–15 minut: alarm

| Seg. | JTBD | Ważność |
|---|---|---|
| wszyscy | Kiedy słyszę syrenę, chcę natychmiast wiedzieć, czy to alarm czy odwołanie i co mam zrobić, żeby nie tracić minut | 🔴 |
| M1, M6 | Kiedy jestem poza domem, chcę znaleźć najbliższe miejsce ukrycia w zasięgu kilku minut pieszo, nawet bez internetu, żeby zdążyć | 🔴 |
| M6 | Kiedy jadę tramwajem lub autobusem, a pojazd się zatrzymuje, chcę wiedzieć, dokąd iść z tego przystanku | 🔴 |
| M2 | Kiedy winda nie działa albo nie zejdę po schodach, chcę wiedzieć, jakie jest najbezpieczniejsze miejsce w mieszkaniu (z dala od okien, przy ścianie nośnej) | 🔴 |
| M4 | Kiedy dostaję alert po polsku, chcę zrozumieć jego treść | 🔴 |
| I5 | Kiedy rusza alarm w trakcie lekcji, chcę sprowadzić dzieci do ukrycia i mieć listę obecności | 🔴 |
| I2 | Kiedy ogłoszono alarm, chcę zatrzymać pojazdy w bezpiecznych miejscach i wiedzieć, gdzie są wszystkie pojazdy | 🔴 |

### F2. 15–60 minut: uderzenie i bezpośrednie skutki

| Seg. | JTBD | Ważność |
|---|---|---|
| wszyscy | Kiedy słyszę wybuch albo widzę dym, chcę wiedzieć, czy mnie to dotyczy (kierunek dymu), żeby zdecydować: zostać i uszczelnić okna czy odejść | 🔴 |
| M1, M6 | Kiedy droga do ukrycia albo do domu prowadzi obok miejsca zdarzenia, chcę ją ominąć | 🔴 |
| wszyscy | Kiedy ktoś obok jest ranny albo nieprzytomny, chcę najszybciej znaleźć AED i zadzwonić po pomoc | 🔴 |
| M3 | Kiedy gaśnie prąd, chcę wiedzieć, jak długo może nie być prądu i gdzie zasilę sprzęt medyczny | 🔴 |
| I1 | Kiedy następuje uderzenie, chcę w ciągu minut wiedzieć, które obszary straciły prąd i łączność, gdzie jest dym i co stoi w transporcie, żeby skierować służby i komunikaty | 🔴 |
| I6 | Kiedy rusza napływ poszkodowanych, chcę wiedzieć, ile ich będzie i z jakiego obszaru | 🔴 |

### F3. 1–6 godzin: powrót, łączenie rodzin, chaos informacyjny

| Seg. | JTBD | Ważność |
|---|---|---|
| M1 | Kiedy alarm odwołano, chcę dotrzeć do dziecka, choć tramwaje i metro stoją, żeby je bezpiecznie odebrać | 🟠 |
| M1, M2 | Kiedy bliski nie odbiera, chcę wiedzieć, czy w jego rejonie stało się coś poważnego, żeby zdecydować, czy jechać | 🟠 |
| M6, M5 | Kiedy jestem daleko od domu i transport nie działa, chcę wiedzieć, czym wrócę (autobus, rower, pieszo) i ile to potrwa | 🟠 |
| wszyscy | Kiedy na komunikatorach krążą sprzeczne wiadomości („most zamknięty”, „metro nie jeździ”, „ewakuacja”), chcę sprawdzić, co jest prawdą, żeby nie panikować | 🟠 |
| I2 | Kiedy część sieci tramwajowej jest bez zasilania, chcę szybko zdecydować, które linie zastąpić autobusami i ile ich potrzeba | 🟠 |
| I5 | Kiedy rodzice nie mogą dojechać, chcę zapewnić dzieciom opiekę do czasu odbioru i wiedzieć, kto po kogo przyjedzie | 🟠 |
| I1 | Kiedy rozchodzą się plotki, chcę szybko wydać lokalne, konkretne komunikaty, które zastąpią ogólne | 🟠 |

### F4. 6–24 godziny: noc i blackout

| Seg. | JTBD | Ważność |
|---|---|---|
| M2 | Kiedy w bloku nie działa winda ani woda, chcę, żeby ktoś przyniósł wodę i sprawdził, czy wszystko u mnie w porządku | 🔴 |
| M3 | Kiedy lodówka nie działa, chcę wiedzieć, gdzie przechować insulinę albo zdobyć nowy zapas (apteka czynna, szpital) | 🔴 |
| wszyscy | Kiedy w nocy znowu wyje syrena, chcę szybko ocenić, czy schodzić do ukrycia, żeby się wyspać, gdy to bezpieczne | 🟠 |
| M5 | Kiedy telefon się rozładowuje, chcę wiedzieć, gdzie go naładować | 🟠 |
| I3 | Kiedy zapada noc bez prądu, chcę wiedzieć, do których budynków iść najpierw (wysokie bloki, seniorzy) | 🔴 |
| I4 | Kiedy budynek nie ma prądu, chcę poinformować lokatorów, gdzie jest najbliższa woda i pomoc | 🟠 |

### F5. 1–3 dni: przedłużający się blackout

| Seg. | JTBD | Ważność |
|---|---|---|
| wszyscy | Kiedy nie ma bieżącej wody, chcę wiedzieć, gdzie zdobyć wodę pitną i skorzystać z toalety | 🔴 |
| wszyscy | Kiedy nie działają terminale płatnicze, chcę wiedzieć, gdzie wypłacę gotówkę lub zrobię zakupy | 🟡 |
| M2, M3 | Kiedy mieszkanie się wychładza, chcę wiedzieć, gdzie jest ogrzewany punkt (odpowiednik kijowskich punktów niezłomności) | 🔴 |
| wszyscy | Kiedy potrzebuję leku, chcę wiedzieć, która apteka jest czynna | 🔴 |
| M4 | Kiedy nie rozumiem lokalnych komunikatów, chcę dostać je w swoim języku | 🟠 |
| I1 | Kiedy blackout się przedłuża, chcę wiedzieć, gdzie rozstawić punkty wody, ciepła i ładowania, żeby objęły jak najwięcej osób | 🔴 |

### F6. 3+ dni: powrót do normalności

| Seg. | JTBD | Ważność |
|---|---|---|
| wszyscy | Kiedy usługi wracają, chcę wiedzieć, co już działa (transport, prąd w mojej dzielnicy), żeby wrócić do pracy | 🟡 |
| wszyscy | Kiedy stres się kumuluje, chcę wiedzieć, gdzie szukać wsparcia psychologicznego | 🟠 |
| I1, I2 | Kiedy kryzys mija, chcę ocenić, co zadziałało i co poprawić | 🟡 |

---

## Część 5. Inwentarz danych

### A. Dostępne teraz: dane miasta (spełniają wymóg regulaminu)

- **Portal dane.um.warszawa.pl** (klucz API):
  - AED, toalety;
  - jakość powietrza (PM2.5, PM10, NO2, CO), pogoda ZOM (z wiatrem);
  - ZTM: pozycje pojazdów co 10 s, przystanki, linie na przystanku, odjazdy, tabor z pojemnością i zajezdnią;
  - utrudnienia (co 1 min, z geometrią), parkingi z wolnymi miejscami;
  - kalendarz wydarzeń, otwarte boiska, zajęcia sportowe, trasy turystyczne;
  - ekopunkty, segregacja i typy odpadów;
  - budżet obywatelski, konsultacje, Rejestr Cen Nieruchomości.
- **Geoportal, warstwy WFS** (bez klucza):
  - zdrowie i pomoc: apteki, domy pomocy społecznej, kluby seniora, inne punkty pomocy społecznej, domy dziecka;
  - transport i porządek: wejścia do metra, parkingi P+R, policja, stacje rowerowe, trasy rowerowe;
  - adresy i przestrzeń: punkty adresowe, ulice, granice dzielnic, obwody szkół podstawowych, place i skwery, drzewa;
  - inne: biblioteki, biura urzędu, akademiki, hotele, pływalnie, teatry, cmentarze.
- **Geoportal, warstwy WMS:** mapy hałasu, plany miejscowe, ortofotomapy.
- **Stare API** (część bez klucza): drzewa, zgłoszenia 19115 (z kluczem), szkoły (dane z 2015).

### B. Do pozyskania: otwarte źródła zewnętrzne (warstwa uzupełniająca)

- **GIOŚ:** 10 stacji jakości powietrza w Warszawie, API bez klucza.
- **Veturilo (GBFS):** 349 stacji, rowery na żywo, bez klucza.
- **GTFS (mkuran.pl):** rozkłady ZTM razem z metrem i SKM. Źródło nieoficjalne.
- **Ewidencja SOR i centrów urazowych (RPRM)** na dane.gov.pl: CC BY 4.0, CSV. Plik z 2021 roku ma 344 wpisy zawierające „Warszawa”; aktualność trzeba sprawdzić. Adresy bez współrzędnych, ale można je zgeokodować punktami adresowymi z WFS.
- **Rejestr Aptek** (dane.gov.pl / ezdrowie): CC BY 4.0, aktualizowany codziennie, CSV/XLSX/XML.
- **NFZ, API Terminy Leczenia:** CC BY 4.0, placówki ze świadczeniami.
- **RPWDL** (rejestr wszystkich podmiotów leczniczych): publiczna wyszukiwarka. Nie znalazłem potwierdzenia eksportu ani API.
- **IMGW, dane publiczne:** pogoda, ostrzeżenia meteorologiczne.
- **OpenStreetMap (licencja ODbL):** szpitale, przychodnie, apteki, przejścia podziemne, garaże podziemne, sieć dróg do wyznaczania tras.
- **Kijów jako źródło reguł scenariuszy:** research w `research-kijow.md`.

### C. Niedostępne: luki

- **Schrony, ukrycia i miejsca doraźnego schronienia.** Rejestr Punktów Schronienia PSP (87 308 punktów w Polsce) nie ma otwartego eksportu ani licencji. Lista ratusza (ponad 200 schronów, około 1300 ukryć, ponad 16 tys. miejsc doraźnego schronienia) nie jest opublikowana jako zbiór danych.
- **Stan sieci energetycznej i harmonogramy wyłączeń** (operator dystrybucyjny).
- **Stan sieci komórkowej.**
- **Alarmy:** RCB, RSO i syreny.
- **Punkty wody, ciepła i ładowania.** W kryzysie dopiero by powstały.
- **Osoby zależne od pomocy.** To dane wrażliwe. Są tylko lokalizacje instytucji z WFS.
- **Dyżury aptek i godziny pracy w kryzysie.**
- **Bieżące obłożenie szpitali.**

---

## Część 6. Zadania a dane

Ocena: **pokrycie danymi** (✅ pełne, ⚠️ częściowe lub pośrednie, ❌ brak) i **czy aplikacja to właściwe narzędzie**.

| # | JTBD (skrót) | Seg. | Faza | Dane | Pokrycie | Offline? | Czy aplikacja to właściwe narzędzie? |
|---|---|---|---|---|---|---|---|
| 1 | Co oznacza syrena, co robić | wszyscy | F1 | brak (RCB, RSO) | ❌ | — | Nie. Syrena, RSO i radio są szybsze. Aplikacja może najwyżej uczyć sygnałów w F0 |
| 2 | Najbliższe ukrycie w kilka minut, bez sieci | M1, M6 | F1 | wejścia do metra (WFS); parkingi z poziomami (portal); OSM: przejścia i garaże podziemne; rejestr PSP niedostępny | ⚠️ | ✅ | Tak, jeśli dane są wiarygodne. Ryzyko: wskazanie niezweryfikowanego miejsca |
| 3 | Dokąd iść z zatrzymanego pojazdu | M6 | F1 | przystanki (portal) i ukrycia z punktu 2 | ⚠️ | ✅ | Tak |
| 4 | Najbezpieczniejsze miejsce w mieszkaniu | M2 | F1 | wiedza z poradnika, bez danych | n/d | ✅ | Ulotka wystarczy |
| 5 | Alert w moim języku | M4 | F1, F5 | brak treści alertów | ❌ | — | Tłumaczenie treści RCB to zadanie państwa |
| 6 | Czy dym idzie w moją stronę | wszyscy | F2 | wiatr ZOM, powietrze (portal), GIOŚ, IMGW; brak lokalizacji pożaru | ⚠️ | ⚠️ ostatni odczyt | Tak, z zastrzeżeniem, że stacji jest mało |
| 7 | Ominąć miejsce zdarzenia | M1, M6 | F2, F3 | utrudnienia (portal), dane o ciszy czujników (pośrednio) | ⚠️ | ❌ | Tak, gdy działa sieć |
| 8 | Najbliższe AED | wszyscy | F2 | AED (portal) | ✅ | ✅ | Tak (poradnik wprost to zaleca) |
| 9 | Gdzie zasilić sprzęt medyczny, ile potrwa blackout | M3 | F2, F4 | brak danych o sieci energetycznej i punktach zasilania; szpitale (RPRM) | ❌, ⚠️ szpitale | ✅ szpitale | Częściowo |
| 10 | Obraz sytuacji w pierwszych minutach | I1 | F2 | pozycje ZTM (cisza i postoje), parkingi, stacje pomiarowe, utrudnienia | ⚠️ pośrednie | — | Tak, jako narzędzie dla miasta, nie dla mieszkańców |
| 11 | Dotrzeć do dziecka bez tramwaju i metra | M1 | F3 | pozycje ZTM (`typ` = tramwaj albo autobus), odjazdy, GTFS, Veturilo, trasy rowerowe (WFS) | ✅ | ⚠️ scenariusze policzone z góry | Tak |
| 12 | Czy w rejonie bliskiego stało się coś poważnego | M1, M2 | F3 | cisza czujników, utrudnienia, powietrze | ⚠️ | ❌ | Ryzykowne: publiczna mapa uderzeń. Lepiej pokazywać ogólny stan usług |
| 13 | Czym i jak długo wrócę | M5, M6 | F3 | jak w punkcie 11 plus utrudnienia | ✅ | ⚠️ | Tak |
| 14 | Co jest prawdą (plotki) | wszyscy | F3 | pozycje ZTM, utrudnienia (fakty o transporcie); reszta poza danymi | ⚠️ | ❌ | Częściowo, tylko dla twierdzeń o transporcie i drogach |
| 15 | Które linie zastąpić autobusami i ilu | I2 | F3 | pozycje, tabor z pojemnością, odjazdy, GTFS | ✅ | — | Tak, jako narzędzie dla ZTM |
| 16 | Kto odbiera które dziecko | I5 | F3 | brak (dane prywatne) | ❌ | — | Rozwiązuje to system szkoły |
| 17 | Lokalne komunikaty zamiast ogólnych | I1 | F3 | granice dzielnic, adresy (WFS) | ⚠️ | — | Tak (geotargetowanie komunikatów) |
| 18 | Woda i sprawdzenie, czy wszystko w porządku | M2, I3 | F4 | domy pomocy społecznej, kluby seniora (WFS), adresy; brak listy osób i danych o wysokości budynków | ⚠️ | ✅ | Tak, dla pomocy społecznej |
| 19 | Gdzie przechować lek albo zdobyć nowy | M3 | F4, F5 | apteki (WFS i Rejestr Aptek), szpitale (RPRM), NFZ; brak godzin w kryzysie | ⚠️ | ✅ lokalizacje | Tak, ale bez gwarancji, że placówka jest czynna |
| 20 | Czy schodzić przy nocnym alarmie | wszyscy | F4 | brak danych o zagrożeniu | ❌ | — | Nie (decyzja należy do komunikatów służb) |
| 21 | Gdzie naładować telefon | M5 | F4, F5 | brak (punkty dopiero powstaną) | ❌ | — | Tak, jeśli miasto opublikuje punkty |
| 22 | Kogo odwiedzić najpierw | I3 | F4 | jak w punkcie 18 | ⚠️ | ✅ | Tak |
| 23 | Woda pitna i toaleta | wszyscy | F5 | toalety (portal); OSM: poidełka, studnie; brak punktów wody kryzysowej | ⚠️ | ✅ | Tak |
| 24 | Gotówka i zakupy | wszyscy | F5 | brak bankomatów i sklepów w danych miasta; OSM częściowo | ❌, ⚠️ | ✅ | Słaby przypadek |
| 25 | Ogrzewany punkt | M2, M3 | F5 | brak (punkty dopiero powstaną); kandydaci: biblioteki, kluby seniora, biura urzędu (WFS) | ⚠️ | ✅ | Tak, jeśli miasto ogłosi punkty |
| 26 | Która apteka jest czynna | wszyscy | F5 | lokalizacje tak, stan czynny nie | ⚠️ | ✅ | Częściowo |
| 27 | Gdzie rozstawić punkty pomocy | I1 | F5 | adresy, budynki (WFS), boiska (portal), przystanki, biblioteki, kluby seniora | ✅ | — | Tak, jako analiza dla miasta |
| 28 | Co już działa | wszyscy | F6 | pozycje ZTM (transport); brak danych o prądzie | ⚠️ | ❌ | Częściowo |
| 29 | Wsparcie psychologiczne | wszyscy | F6 | brak w danych miasta | ❌ | ✅ lista telefonów z poradnika | Ulotka wystarczy |
| 30 | Plan rodzinny z konkretnymi miejscami | M1 | F0 | place i skwery, adresy (WFS), ukrycia z punktu 2 | ⚠️ | ✅ | Tak |
| 31 | Mapa luk w dostępie do ukryć, AED, szpitali i transportu | I1 | F0 | wszystkie warstwy powyżej plus adresy | ⚠️ (brak ukryć) | — | Tak, jako analiza dla miasta |

---

## Część 7. Wnioski (obiektywne)

1. **Najlepsze pokrycie danymi mają zadania transportowe** (11, 13, 15) oraz AED (8). Dane miasta pokrywają je w pełni, także na żywo, i spełniają wymóg regulaminu.
2. **Najważniejsze zadanie, czyli ukrycie w pierwszych minutach (2), ma najsłabsze dane.** Oficjalny rejestr jest zamknięty, a zamienniki są niezweryfikowane. To realne ryzyko wprowadzenia w błąd.
3. **Część kluczowych zadań w ogóle nie jest dla aplikacji:** syrena i alarmy (1, 20), tłumaczenie alertów (5), odbiór dzieci (16). Tu działają kanały państwowe i instytucjonalne.
4. **Zadania instytucji (10, 15, 17, 22, 27, 31) mają lepsze pokrycie niż wiele zadań mieszkańców.** Instytucje zarazem odpowiadają kryterium wdrożenia: jest konkretny odbiorca, który płaci i utrzymuje rozwiązanie.
5. **Offline da się zrobić dla danych statycznych** (AED, apteki, szpitale, ukrycia, adresy, sieć dróg, scenariusze transportu policzone z góry). **Dane na żywo** (dym, opóźnienia, cisza czujników) z natury wymagają sieci.
6. **Największe luki do pokazania miastu:** brak otwartej listy miejsc schronienia, brak warstwy szpitali w danych miasta i brak danych o punktach pomocy w kryzysie.

## Źródła

- Research Kijów: `research-kijow.md`. Poradnik i API: `research-defense-dane.md`.
- [Ewidencja SOR i centrów urazowych (dane.gov.pl)](https://api.dane.gov.pl/1.4/datasets/1642,ewidencja-szpitalnych-oddziaow-ratunkowych-centrow-urazowych-centrow-urazowych-dla-dzieci-i-jednostek-organizacyjnych-szpitali-udzielajacych-swiadczen-w-zakresie-ratownictwa-medycznego)
- [Rejestr Aptek (dane.gov.pl)](https://api.dane.gov.pl/1.4/datasets/1925,rejestr-aptek)
- [API Terminy Leczenia NFZ (dane.gov.pl)](https://api.dane.gov.pl/1.4/datasets/1455,informator-o-terminach-leczenia)
- [Repozytorium gdziesieukryc.pl (KG PSP)](https://github.com/KGPSP/gdziesieukryc.pl)
- [warszawa19115: miejsca doraźnego schronienia](https://warszawa19115.pl/en/-/miejsca-dora%C5%BAnego-schronienia)
- [kb.pl: schrony w Warszawie](https://kb.pl/aktualnosci/dzieje-sie-w-polsce/schrony-przeciwatomowe-w-warszawie/)
