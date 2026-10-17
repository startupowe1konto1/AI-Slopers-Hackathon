# Możliwości produktowe i customer journeys (obronność, Warszawa)

Bazuje na `jtbd-kryzys-warszawa.md` (31 zadań JTBD, numery w tekście się do nich odnoszą). Celem nie jest pokazywanie luk w danych miasta. Rozwiązanie może służyć zarówno mieszkańcom, jak i instytucjom.

## 1. Rejestr schronów PSP: dlaczego nie da się „po prostu pobrać”

- **Repozytorium `KGPSP/gdziesieukryc.pl` nie zawiera danych.** Są tam tylko README, CHANGELOG i szablon zgłoszenia błędu. Nie ma innych gałęzi, wydań ani tagów, nie ma też licencji.
- **Dane (87 308 punktów, format „gsu-shelters-compact”) pobiera aplikacja w przeglądarce** do trybu offline. Serwer stoi za ochroną antybotową Cloudflare: zapytanie spoza przeglądarki dostaje 403. Automatyczne cykliczne pobieranie oznaczałoby obchodzenie tej ochrony, więc nie wchodzi w grę.
- **Brak licencji, a regulamin hackathonu (§4 ust. 7–8) zabrania naruszania praw osób trzecich.** Skopiowanie bazy bez zgody to ryzyko prawne i ryzyko dyskwalifikacji.
- **Realna szansa na zgodę:** to samo Biuro Informatyki i Łączności KG PSP opublikowało w sierpniu otwarte dane SOIA na licencji CC BY 4.0. Warto napisać do BIŁ KG PSP albo dodać zgłoszenie w repozytorium z prośbą o eksport lub zgodę na ponowne wykorzystanie. Odpowiedź raczej nie przyjdzie w trakcie hackathonu, ale to gotowy krok pilotażu.
- **Na czas hackathonu:**
  - (a) przycisk „Pokaż oficjalne punkty PSP”, który przenosi do gdziesieukryc.pl;
  - (b) własna warstwa „kandydatów” w kategoriach z README PSP (wejścia do metra z WFS, wielopoziomowe parkingi z portalu, przejścia i garaże podziemne z OSM), wyraźnie oznaczona jako niezweryfikowana.

## 2. Nowe źródło: SOIA, czyli zasięg syren alarmowych (KG PSP)

- Repozytorium `KGPSP/soia-analiza-zasiegu` (kod na licencji MIT, dokumentacja CC BY 4.0) i rekord Zenodo `21921103` (CC BY 4.0, warunki ponownego wykorzystania opisane dla każdego pliku).
- **Pakiet quickstart ma 0,32 GB.** Zawiera inwentaryzację syren z parametrami, poligony zasięgu 65, 70 i 75 dB(A), luki priorytetowe, kandydackie lokalizacje syren i „obiekty wrażliwe” (85 317 w Polsce).
- **Pełny pakiet pochodny (5,5 GB)** zawiera ludność GUS NSP 2021 rozdzieloną na budynki OSM.
- Narzędzie CLI generuje paczkę dla wybranego kodu TERYT, czyli także dla Warszawy.
- **Do czego się przydaje:**
  - „czy w moim mieszkaniu usłyszę syrenę?” (JTBD 1 w fazie przygotowania);
  - liczba mieszkańców w budynkach i obszarach (JTBD 10, 18, 22, 27).
- Wymagane oznaczenie: KG PSP, wersja danych 2026.05, data pozyskania, opis przetworzenia.
- **Wycinek dla Warszawy:** `dane/soia-warszawa/` (451 syren, 961 poligonów zasięgu, rastry 100 m, 6134 budynki publiczne).

### Jak syreny odpowiadają na JTBD

Aplikacja nie ogłasza alarmów. Może jednak sprawdzić, czy oficjalny alarm (syrena, Alert RCB, RSO) dotrze do konkretnej osoby, i pomóc domknąć luki.

| # | Zastosowanie | Dla kogo | JTBD | Dane | Tryb |
|---|---|---|---|---|---|
| S1 | **„Czy usłyszę syrenę pod moim adresem?”** Poziom dźwięku i syrena dominująca dla adresu. Przy słabym zasięgu: „włącz Alert RCB i RSO, ustal z sąsiadem, kto kogo budzi” | M1, M2 (przez opiekuna), M4, M5 | 1 (F0), 20 | raster poziomu dźwięku i syreny dominującej, adresy (WFS) | offline (policzone z góry) |
| S2 | **Syreny przy blackoucie.** W Warszawie jest 235 syren analogowych i 216 cyfrowych. Analogowe (elektromechaniczne) zwykle wymagają zasilania sieciowego, cyfrowe częściej mają akumulatory. Dla warszawskich syren to do sprawdzenia, bo SOIA tego nie podaje. Mapa: kto nie usłyszy alarmu, gdy obszar X straci prąd. Z Kijowa: brak prądu oznacza brak alarmów, bo pada też sieć komórkowa | I1, M1 | 1, 10 | `coverage_ranges` (typ syreny), scenariusz obszaru bez prądu | policzone z góry plus online |
| S3 | **Gdzie ostrzegać inaczej.** Obszar bez prądu, syreny bez zasilania i brak sieci komórkowej dają listę ulic do ostrzeżenia megafonem lub osobiście (kanały z poradnika). Priorytet mają domy pomocy społecznej i kluby seniora w strefach słabego zasięgu | I1, I3 | 10, 18, 22 | SOIA, WFS (domy pomocy społecznej, kluby seniora), cisza czujników (K3) | online |
| S4 | **Budynki publiczne jako punkty pomocy.** 6134 budynki (edukacja, zdrowie i opieka, administracja) z liczbą kondygnacji i pojemnością: kandydaci na punkty ciepła, wody i zbiórki | I1 | 25, 27 | `sensitive_objects` (SOIA) | policzone z góry |

Zastrzeżenia: SOIA modeluje poziom dźwięku na zewnątrz budynków. Klasy ryzyka w lukach dotyczą powodzi. Obiekty wrażliwe to heurystyka na podstawie OSM.

## 3. Klocki, które możemy zbudować

| Klocek | Zawartość | Źródła | Tryb |
|---|---|---|---|
| K1. Paczka offline | AED, apteki, SOR i szpitale, toalety, wejścia do metra, kandydaci ukryć, adresy (wyszukiwanie bez GPS), sieć piesza i rowerowa, stacje Veturilo | portal, WFS, RPRM, Rejestr Aptek, OSM | offline, kilka MB |
| K2. Transport w scenariuszach | dostępność celów pieszo, autobusem i rowerem w scenariuszach: blackout (bez tramwajów i metra), przerwy alarmowe, wyłączony most | przystanki, linie, odjazdy, GTFS, tabor | offline, policzone z góry |
| K3. Warstwa na żywo | co jeździ, utrudnienia, rowery, wiatr i dym, cisza czujników | pozycje ZTM, utrudnienia, Veturilo GBFS, pogoda ZOM, powietrze, GIOŚ | online |
| K4. Syreny i ludność | zasięg syren dla adresu (S1), zasięg przy blackoucie (S2), budynki publiczne jako punkty pomocy (S4), ludność budynków | SOIA (KG PSP) | offline, policzone z góry |
| K5. Konsola miasta | wykrywanie anomalii, skutki dla transportu z pojemnością taboru, rozmieszczenie punktów pomocy według liczby mieszkańców | K2, K3, K4, tabor ZTM | online |

## 4. Opcje produktu

### Opcja A: aplikacja mieszkańca (offline i online)
- **Klocki:** K1, K2, K3, K4.
- **Pokryte JTBD:** 1 (przygotowanie: zasięg syren), 2, 3, 6, 7, 8, 11, 13, 14, 19, 23, 26, 30.
- **Mocne strony:** bezpośrednia wartość dla ludzi, efektowne demo (tryb samolotowy).
- **Słabe strony:** pokrywa się z gdziesieukryc.pl w części o ukryciach. Innowacyjność zależy od K2 i K4, nie od samej mapy punktów.

### Opcja B: konsola kryzysowa miasta (Stołeczne Centrum Bezpieczeństwa i ZTM)
- **Klocki:** K3, K4, K5.
- **Pokryte JTBD:** 10, 12 (dla miasta), 15, 17, 22, 27.
- **Mocne strony:** najwyższa innowacyjność (cisza czujników, komunikacja zastępcza z uwzględnieniem pojemności, punkty pomocy według liczby mieszkańców), konkretny odbiorca, mocne kryterium wdrożenia.
- **Słabe strony:** demo wymaga symulacji incydentu. Mieszkaniec korzysta pośrednio.

### Opcja C: jeden system, dwa interfejsy (A + B)
- Wspólne przetwarzanie danych. Miasto widzi i decyduje w konsoli, a mieszkaniec dostaje status usług i trasy w aplikacji. Bez sieci aplikacja przechodzi na paczkę offline.
- **Pokrywa najwięcej zadań:** około 19 z 31.
- **Ryzyko:** zakres na 24 godziny. Trzeba wybrać wąski wycinek MVP (sekcja 6).

### Opcja D: przygotowanie w fazie F0 („mój plan na kryzys”)
- **Klocki:** K1, K4. Plan rodzinny z poradnika, ale z konkretnymi miejscami i zasięgiem syren dla adresu, do wydruku.
- **Pokryte JTBD:** 1 (przygotowanie), 2, 8, 30.
- **Mocne strony:** najmniej ryzykowna technicznie, czysto offline, spójna z rządowym poradnikiem.
- **Słabe strony:** średnia innowacyjność i brak warstwy na żywo.

### Czego nie pokryje żadna opcja
JTBD 1 (sam alarm), 5 (tłumaczenie alertów), 16 (odbiór dzieci), 20 (decyzja przy nocnym alarmie), 21 (ładowanie), 24 (gotówka), 29 (wsparcie psychologiczne). To zadania kanałów państwowych, instytucji albo zwykłej ulotki.

## 5. Customer journeys

### CJ1. Mieszkaniec: pracujący rodzic (M1)

| Faza | Sytuacja | Punkt styku | Dane | Tryb |
|---|---|---|---|---|
| F0 | Napięcie rośnie | Instaluje aplikację, wpisuje adresy: dom, praca, przedszkole, mama. Widzi: „syrenę w domu słychać słabo”, najbliższe miejsca ukrycia, AED, SOR. Pobiera paczkę offline i drukuje plan | K1, K4 | online, potem offline |
| F1 | 14:10, alarm w biurze | Bez sieci otwiera „najbliżej mnie”: wejście do metra 300 m, kandydat ukrycia 150 m (z oznaczeniem „niezweryfikowane”), link do PSP | K1 | offline |
| F2 | Wybuch, dym nad Wolą | Sieć działa z przerwami. Widzi kierunek wiatru i strefę dymu, decyduje o zamknięciu okien albo zmianie trasy | K3 | online |
| F3 | Odwołanie alarmu, trzeba po syna | Scenariusz blackoutu: tramwaje stoją. Dostaje trasę „autobus 523, potem 15 min pieszo” albo rower Veturilo, z czasem przejazdu. Online potwierdza, co faktycznie jedzie | K2, K3 | offline i online |
| F3 | Plotka „mosty zamknięte” | Sprawdza status: utrudnienia i pojazdy na mostach | K3 | online |
| F5 | Drugi dzień bez prądu | Offline: najbliższe toalety, apteki, SOR | K1 | offline |

### CJ2. Opiekun seniora (M2 przez rodzinę)
Senior rzadko korzysta z aplikacji, więc użytkownikiem jest dziecko seniora.
- **F0:** dodaje adres mamy, drukuje dla niej kartę z najbliższymi AED, apteką i SOR oraz informacją o zasięgu syreny. Kartę może też wydrukować spółdzielnia albo pomoc społeczna.
- **F3–F4:** sprawdza status usług w rejonie mamy: czy jeżdżą autobusy, utrudnienia. Planuje dojazd.

### CJ3. Osoba w drodze albo nieznająca polskiego (M6, M4)
- **F1:** stoi na przystanku, tramwaj się zatrzymał. Interfejs w jej języku, offline: „najbliższe miejsca stąd”, numery alarmowe.
- **F3:** pyta, jak wrócić do hotelu lub akademika: trasa piesza, rowerowa albo autobusowa w scenariuszu blackoutu.

### CJ4. Operator centrum kryzysowego miasta (I1)

| Faza | Punkt styku | Dane |
|---|---|---|
| F0 | Mapa ludności, zasięgu syren, dostępu do AED i SOR, dostępności transportu w scenariuszach. Planowanie punktów pomocy | K4, K1, K2 |
| F2 | Alert: „obszar Wola-Odolany ucichł o 14:13” (pojazdy, parkingi, stacje), w tym obszarze około N mieszkańców według budynków. Wiatr wskazuje kierunek dymu | K5, K3, K4 |
| F3 | Wydaje lokalny komunikat o stanie usług (bez lokalizacji uderzenia), który trafia do aplikacji mieszkańców | K5, A |
| F5 | Optymalizacja: gdzie postawić 10 punktów wody i ciepła, żeby objęły najwięcej mieszkańców w zasięgu 15 minut pieszo | K4, K1, WFS |

### CJ5. Dyspozytor ZTM (I2)
- **F2:** konsola pokazuje, które linie tramwajowe straciły zasilanie (pojazdy stoją albo milkną) i które osiedla zostały tylko z tramwajem.
- **F3:** rekomendacja, np. (liczby poglądowe): „zastąp linie 10 i 17: potrzeba N autobusów przegubowych o łącznej pojemności M miejsc, najbliższe zajezdnie: X, Y”. Status trafia do aplikacji mieszkańców.

### CJ6. Koordynator pomocy społecznej (I3)
- **F4:** lista priorytetowych budynków: wysokie bloki z dużą liczbą mieszkańców w strefie bez prądu, blisko domów pomocy społecznej i klubów seniora. Plan obchodów do druku.

## 6. Co realnie zbudować w 24 godziny (wycinek MVP dla opcji C)

1. **Przetwarzanie danych:** paczka offline K1 dla Warszawy plus jeden scenariusz K2 (blackout: bez tramwajów i metra) policzony z góry dla siatki adresów.
2. **Aplikacja mieszkańca (PWA):**
   - „najbliżej mnie” offline (AED, apteki, SOR, kandydaci ukryć, link do PSP);
   - „dojazd w scenariuszu blackoutu”;
   - online: co jeździ i wiatr.
3. **Konsola miasta:** mapa ciszy czujników na nagranym strumieniu ZTM z jawnie zasymulowanym incydentem, plus lista dotkniętych linii z zapotrzebowaniem na autobusy.
4. **Opcjonalnie:** zasięg syren dla adresu (K4), jeśli zdążymy pobrać i przyciąć dane SOIA.

## Źródła
- [KGPSP/gdziesieukryc.pl](https://github.com/KGPSP/gdziesieukryc.pl), [KGPSP/soia-analiza-zasiegu](https://github.com/KGPSP/soia-analiza-zasiegu), [Zenodo 21921103](https://zenodo.org/records/21921103), [analiza SOIA (GitHub Pages)](https://kgpsp.github.io/soia-analiza-zasiegu/)
