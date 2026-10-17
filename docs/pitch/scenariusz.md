# Scenariusz pitchu: 5 minut

**Teza pitchu:** Warszawa w trybie kryzysowym daje mieszkańcom spokój, który działa, gdy wszystko pada. Pod własnym adresem każdy wie, czy usłyszy alarm, gdzie jest pomoc i jak dotrze do bliskich. Aplikacja działa także bez internetu i stoi na danych, które miasto i PSP już publikują.

**Zdanie, które jury ma powtórzyć:** „Działa, gdy wszystko pada”.

| SCQA | Treść |
|---|---|
| Sytuacja | Napięcie geopolityczne rośnie. Miasto takie jak Warszawa powinno dawać mieszkańcom spokój. |
| Komplikacja | Kijów pokazał, że przy ataku najpierw pada prąd, a z nim sieć, alarmy w telefonie, mapy i tramwaje. W Warszawie, jeśli zabraknie prądu, głośnej syreny (75 dB i więcej) może ubyć z 48,3% do 36,6% adresów. |
| Pytanie | Jak dać mieszkańcowi odpowiedzi, które działają także wtedy, gdy wszystko pada? |
| Odpowiedź | Rozpisaliśmy zadania mieszkańców, połączyliśmy je z otwartymi danymi i zbudowaliśmy aplikację, która odpowiada pod adresem i działa offline. |

**Forma:** prezentacja w HTML, 12 slajdów na jasnym tle, z ikonami, znakiem Warszawy i logo 42 Warsaw. Na każdym slajdzie jedna myśl w nagłówku. Dwa elementy ruchome: przełącznik blackoutu na mapie syren (slajd 4) i demo „Dzień Kasi” (slajd 9). Demo to zaprogramowany przebieg aplikacji na prawdziwych zrzutach z produkcji, prowadzony tymi samymi strzałkami co cały pitch, bez sieci i bez żywej aplikacji. Slajd 12 to żart zespołu w stylu stron z lat 90., poza czasem pitchu, na pytania jury. Plik: [prezentacja/index.html](prezentacja/index.html), uruchomienie i struktura w [prezentacja/README.md](prezentacja/README.md).

Stan: wersja 4 (sobota, 17.10, późny wieczór). Liczby syren z `pipeline/syreny/WYNIKI.md` (przybliżenie, nie najgorszy wariant 69,1%). Demo na przepływie z aplikacji na produkcji: otwarcie → „Sprawdzam połączenie…” → „Jest połączenie…” → „Tutaj” → karty „Twoja sytuacja” → trasa → brak sieci. Czasy poniżej policzone ze słów (130 słów na minutę), jeszcze nie zmierzone zegarem: pomiar na próbie (P7).

---

## Pitch w skrócie

Same nagłówki czytane po kolei dają cały wywód.

| Czas | Sek. | Slajd | Co jury ma zapamiętać | Kryterium oceny |
|---|---|---|---|---|
| 0:00–0:20 | 20 | 1 | Napięcie rośnie, a ludzie pytają: co zrobię, jeśli to się stanie tutaj? | związek z realiami Warszawy (15%) |
| 0:20–0:35 | 15 | 2 | Miasto ma dawać spokój także wtedy, gdy zawiedzie prąd i sieć | związek z realiami Warszawy |
| 0:35–0:54 | 19 | 3 | Kijów pokazał, co pada najpierw: prąd, sieć, alarmy, mapy, tramwaje | związek z realiami Warszawy |
| 0:54–1:19 | 25 | 4 | Jeśli zabraknie prądu, głośnej syreny ubywa z 48,3% do 36,6% adresów | innowacyjność (25%), otwarte dane (20%) |
| 1:19–1:38 | 19 | 5 | Zaczęliśmy od zadań mieszkańców, nie od danych | innowacyjność |
| 1:38–2:00 | 22 | 6 | Każde zadanie połączyliśmy z danymi i widać, gdzie dane pomagają, a gdzie nie | otwarte dane Warszawy (20%) |
| 2:00–2:20 | 20 | 7 | Pięć kart w jednej stronie, a to, co da się policzyć z góry, jest w telefonie | praktyczne zastosowanie (20%) |
| 2:20–2:40 | 20 | 8 | Stoimy na otwartych danych: sześć zbiorów miasta, miejsca schronienia i syreny od PSP | otwarte dane Warszawy (20%) |
| 2:40–4:14 | 94 | 9 | Aplikacja sama pokazuje, co jest ważne w tym miejscu, także gdy padnie sieć | praktyczne zastosowanie, innowacyjność |
| 4:14–4:45 | 31 | 10 | Mieszkaniec zyskuje spokój, a miasto narzędzie na danych, które już ma | potencjał wdrożeniowy (20%) |
| 4:45–5:00 | 15 | 11 | Działa, gdy wszystko pada | jakość prezentacji (20%) |
| poza czasem | | 12 | AI Slopers: żart zespołu, zostaje na ekranie podczas pytań jury | |

Suma: 300 s. Slajd 12 nie wlicza się w limit: wchodzimy na niego jednym naciśnięciem po „Dziękujemy”.

Prezenter: **DO USTALENIA**. Ta sama osoba mówi i prowadzi prezentację strzałkami lub pilotem (27 naciśnięć do końca slajdu 11, 28 do slajdu 12). Telefon na slajdzie 9 steruje się sam, więc druga osoba nie musi nic klikać (może pilnować czasu).

Tempo: około 130 słów na minutę. Tekst bez opcji ma około 550 słów, czyli około 4:10 mówienia. Zdania w [nawiasach kwadratowych] to opcje (znacznik [→] to naciśnięcie strzałki, nie opcja): wchodzą, jeśli próba (P7) zmieści się w limicie, z nimi tekst ma około 610 słów (4:40). Reszta czasu to kliknięcia, animacje telefonu i pauzy. Jeśli próba wyjdzie za długa, tniemy w tej kolejności: opcje w nawiasach, zdanie o Veturilo w kroku 4 demo, zdanie „Za kartami są dane na żywo…” na slajdzie 7 (dane są jeszcze raz na slajdzie 8).

---

## 0:00–0:20 · Slajd 1 · Napięcie rośnie, a ludzie pytają: co zrobię, jeśli to się stanie tutaj?

**Na ekranie:** jasne tło z żółtą kreską u góry. Trzy krótkie linijki pojawiają się jedna po drugiej, w rytm mówienia: „Wojna za wschodnią granicą.” (od razu) → „Rosnące napięcie.” → „Co zrobię, jeśli to się stanie tutaj?” („tutaj” zakreślone na żółto). Pierwsze dwie linijki są szare, ostatnia grafitowa. W rogach na każdym slajdzie: znak Warszawy (lewy górny), numer slajdu i logo 42 Warsaw (prawy dolny).

**Klikamy:** → dwa razy (dwie kolejne linijki).

**Mówimy:**

> Od ponad czterech lat za naszą wschodnią granicą trwa wojna. [→] Napięcie w regionie rośnie. Rząd wydał poradnik bezpieczeństwa. [→] Nikt nie chce o tym myśleć, a jednak coraz więcej osób zadaje sobie pytanie: co zrobię, jeśli to się stanie tutaj?

---

## 0:20–0:35 · Slajd 2 · Miasto ma dawać spokój także wtedy, gdy zawiedzie prąd i sieć

**Na ekranie:** jedno zdanie, duża typografia: „Miasto ma dawać spokój.” Po naciśnięciu strzałki pod hasłem pojawia się zdanie „Nie obietnicę, że nic się nie stanie. Pewność, że każdy wie, co zrobić, także gdy zawiedzie prąd i sieć.” i trzy pigułki z ikonami: „bez prądu”, „bez sieci”, „każdy wie, co zrobić” (ostatnia zielona).

**Klikamy:** → raz (zdanie i pigułki).

**Mówimy:**

> Miasto takie jak Warszawa powinno dawać mieszkańcom spokój. [→] Nie obietnicę, że nic się nie stanie, tylko pewność, że każdy wie, co zrobić. Także wtedy, gdy zawiedzie prąd i sieć.

---

## 0:35–0:54 · Slajd 3 · Kijów pokazał, co pada najpierw

**Na ekranie:** tytuł „Kijów pokazał, co pada najpierw.” i rząd pięciu kafli z ikonami, połączonych strzałkami: prąd → sieć → alarmy → mapy → tramwaje. Po naciśnięciu strzałki kafle przewracają się kolejno jak domino, szarzeją i przekreśla je czerwona kreska. Pod spodem notka z ikoną ołówka: „Adresy punktów, gdzie można się ogrzać i naładować telefon, bez internetu trzeba było spisywać na kartce.” Bez zdjęć zniszczeń i ważnych obiektów.

**Klikamy:** → raz, po zdaniu „Rosja uderza w sieć energetyczną” (kafle przewracają się, kiedy mówimy o skutkach).

**Mówimy:**

> Kijów pokazał, co pada najpierw. Rosja uderza w sieć energetyczną. [→] Bez prądu znika zasięg komórkowy, a z nim alarmy w telefonie i mapy. [Mapa punktów, gdzie można się ogrzać, bez internetu nie działała, więc ludziom radzono spisać adresy na kartce.] Stanęły tramwaje.

---

## 0:54–1:19 · Slajd 4 · Jeśli zabraknie prądu, głośnej syreny ubywa z 48,3% do 36,6% adresów

**Na ekranie:** po lewej „A w Warszawie?”, zdanie „Dziś syrenę słychać (65 dB i więcej na zewnątrz) przy 92,5% adresów. Głośną, 75 dB i więcej, przy:” i duża liczba „48,3%”, pod nią przełącznik „Wyłącz prąd” (zielony, gdy prąd jest). Po prawej mapa Warszawy w kolorze zasięgu syren. Prezenter naciska strzałkę (albo klika przełącznik): liczba spada do „36,6%” i robi się czerwona, pod nią pojawia się „Przy 65 dB i więcej zostaje 91,5% adresów: zasięg traci ok. tysiąca (rząd wielkości)”, a cztery dzielnice z największym spadkiem dostają podpis „przed → po” (Praga-Południe 81,7 → 45,2%, Praga-Północ 85,5 → 52,6%, Żoliborz 93,0 → 64,0%, Wola 88,2 → 60,4%). Na dole drobnym drukiem: „Model dźwięku na zewnątrz budynków, wynik przybliżony. Blackout: jeśli syreny analogowe nie mają zasilania awaryjnego, a cyfrowe działają. Dane: KG PSP, SOIA 2026.05.”

**Klikamy:** → raz (albo przełącznik „Wyłącz prąd”). ← wraca do stanu „prąd jest”.

**Uwaga o mapie.** Kształt mapy pochodzi z najgorszego wariantu (dolne oszacowanie: tylko strefy, gdzie SOIA pokazuje syrenę cyfrową, 69,1% adresów w zasięgu 65 dB). Legenda pod mapą mówi to wprost: przed kliknięciem „zasięg wszystkich syren”, po kliknięciu „najgorszy wariant: zasięg zostaje tylko w strefach syren cyfrowych (69,1%)” i czerwony obszar „zasięg tracony w najgorszym wariancie”. Podpis pod liczbą dodaje: „Czerwony obszar na mapie to najgorszy wariant, nie ta liczba.” Nie mówimy ze sceny „mapa pokazuje spadek do 69,1%”. Gdy O2 doda okręgi z modelu (`okregi.json`, zadanie S2), można wymienić mapę na przybliżenie.

Dane do slajdu: liczby z `pipeline/syreny/WYNIKI.md` (czyta je `prezentacja/build_dane.py` do `dane.js`), kształt mapy z `dane/soia-warszawa/analiza/syreny_zasieg_tylko_cyfrowe.geojson`, `syreny_blackout_utracony_zasieg.geojson`, `granica_warszawy.geojson`.

**Mówimy:**

> A w Warszawie? Sprawdziliśmy syreny na danych Państwowej Straży Pożarnej. Dziś syrenę słychać przy 92,5% adresów. [→ wyłącz prąd] Jeśli zabraknie prądu, a syreny analogowe nie mają zasilania awaryjnego, głośnej syreny, 75 decybeli i więcej, ubywa z 48,3% do 36,6% adresów. Najbardziej na Pradze-Południe. To model dźwięku na zewnątrz i przybliżenie, dlatego mówimy „jeśli”.

Jeśli ktoś dopyta o najgorszy wariant: „Gdybyśmy wyrzucili wszystkie strefy, w których SOIA nie pokazuje syreny cyfrowej, zostaje 69,1% adresów w zasięgu 65 dB. To wariant skrajny, dolne oszacowanie, nie nasza główna liczba.”

---

## 1:19–1:38 · Slajd 5 · Zaczęliśmy od zadań mieszkańców, nie od danych

**Na ekranie:** po lewej wielka czerwona „24”, obok tytuł „zadania mieszkańców w kryzysie” i podtytuł „Zaczęliśmy od ludzi, nie od danych: 6 grup mieszkańców, 7 faz kryzysu.” Pod spodem oś siedmiu faz: „dni przed”, „0–15 min”, „15–60 min”, „1–6 h”, „6–24 h”, „1–3 dni”, „3+ dni”. Niżej sześć kart z grupami: Rodzic dojeżdżający do pracy (15 zadań), Senior lub osoba z niepełnosprawnością (14), Osoba przewlekle chora (13), Osoba nieznająca polskiego (11), Młoda osoba bez zapasów (12), Osoba w drodze (14). Każda karta ma ikonę i dwa przykładowe zadania (np. „Dotrzeć do dziecka bez tramwaju”, „Zasilanie sprzętu medycznego”, „Alert w moim języku”). Przypis: „Liczba przy grupie: ile z 24 zadań ta grupa może mieć do wykonania. 10 zadań dotyczy wszystkich.” Bez kliknięć.

Źródło: `kontekst/jtbd-kryzys-warszawa.md`, części 3, 4 i 6. Plik ma 31 zadań, w tym 7 zadań wyłącznie instytucji. Na slajdzie pokazujemy 24 zadania mieszkańców, bo aplikacja jest dla mieszkańców. Liczby przy grupach nie sumują się do 24, bo zadanie „dla wszystkich” liczy się każdej grupie.

**Mówimy:**

> Nie zaczęliśmy od danych. Zaczęliśmy od ludzi. Rozpisaliśmy, co w kryzysie musi zrobić sześć grup mieszkańców[: rodzic dojeżdżający do pracy, senior, osoba przewlekle chora, ktoś, kto nie zna polskiego, młody bez zapasów i ktoś w drodze]. Od dni przed atakiem po powrót do normalności. Wyszły 24 zadania.

---

## 1:38–2:00 · Slajd 6 · Każde zadanie połączyliśmy z danymi i widać, gdzie dane pomagają, a gdzie nie

**Na ekranie:** tytuł „Każde zadanie połączyliśmy z danymi”. Pod nim rząd 24 kwadratów (jeden kwadrat to jedno zadanie), a niżej trzy karty z dużą liczbą: **13** „W telefonie, bez sieci” (zielona), **5** „Na żywo, przez sieć” (żółta), **6** „Żadne dane nie pomagają” (szara, przerywana ramka). Każda karta ma trzy przykładowe zadania i zbiory danych (np. „12 zbiorów do zapisania w telefonie, np. Syreny SOIA, Punkty adresowe, Miejsca schronienia”). Dwa zadania z zielonej grupy korzystają też z danych na żywo (kwadraty pół na pół). Wniosek na dole: „18 z 24 zadań łączy się z danymi. Tam budujemy. Pozostałe 6 pokazujemy uczciwie na szaro.” Bez kliknięć.

Liczby liczy slajd z `dane.js`: zadanie z co najmniej jednym zbiorem w paczce to „w telefonie”, zadanie tylko ze zbiorami na żywo to „na żywo”, zadanie bez zbiorów to szare. Połączenia zadań ze zbiorami: `build_dane.py`, słownik `ZADANIA` (na podstawie kolumny „Dane” w pliku JTBD; zadanie 1 przestawione na SOIA, zadanie 2 na dane PSP, bo analiza powstała przed pozyskaniem obu źródeł).

Uwaga: podział pochodzi z analizy zadań, nie z listy funkcji wersji 3. Karta „Na żywo” wymienia m.in. utrudnienia w ruchu, a aplikacja v3 ich nie pokazuje (`HANDOFF-v3.md` §4). Gdy jury zapyta, mówimy, że to analiza zadań i danych, a pokazane funkcje to pięć kart.

**Mówimy:**

> Każde zadanie połączyliśmy z danymi: miejskimi, PSP i innymi otwartymi. Zielone działa w telefonie bez sieci, żółte potrzebuje sieci. Szare to zadania, których żadne dane nie rozwiązują, na przykład gdzie naładować telefon. Tego nie udajemy. Zbudowaliśmy rozwiązanie tam, gdzie zadanie łączy się z danymi.

---

## 2:00–2:20 · Slajd 7 · Pięć kart w jednej stronie, a to, co da się policzyć z góry, jest w telefonie

**Na ekranie:** tytuł „Warszawa w trybie kryzysowym” i sześć kafli z ikoną, numerem i jedną linijką. Pięć to karty z ekranu „Twoja sytuacja”: „Syreny”, „Najbliższe miejsce schronienia według PSP”, „Pomoc medyczna”, „Powietrze i wiatr”, „Dotarcie do bliskich”. Szósty, zielony kafel z przerywaną ramką to „Paczka offline”: „Dane, mapa Warszawy i trasy w telefonie. Działa bez sieci.” Bez kliknięć.

**Mówimy:**

> Tak powstała Warszawa w trybie kryzysowym. Jedna strona internetowa, a po wpisaniu adresu pięć kart dopasowanych do twojej sytuacji[: syreny, najbliższe miejsce schronienia według PSP, pomoc medyczna, powietrze i wiatr, dotarcie do bliskich]. Za kartami są dane na żywo, a wszystko, co da się policzyć z góry, jest w telefonie. Działa, gdy wszystko pada.

---

## 2:20–2:40 · Slajd 8 · Stoimy na otwartych danych Warszawy i PSP

**Na ekranie:** tytuł „Na jakich danych stoimy” i trzy kolumny połączone liniami: „Źródła danych” → „W aplikacji” → „Pytania mieszkańca”.
- Źródła: wyróżniona czerwoną ramką „Otwarte dane m.st. Warszawy” (dane.um.warszawa.pl, API miasta, WFS, „6 zbiorów”: defibrylatory AED, toalety publiczne, punkty adresowe 126 923, apteki, pogoda i wiatr, jakość powietrza), „Państwowa Straż Pożarna” (miejsca schronienia według PSP 8 006, syreny SOIA 2026.05) i „Inne otwarte dane” (OpenStreetMap, trasy OSRM, rejestr SOR, GTFS Warszawa, Veturilo).
- W aplikacji: „Paczka offline” (w telefonie, bez sieci) i „Na żywo” (gdy jest sieć, przez nasz serwer).
- Pytania mieszkańca: pięć kart (Czy usłyszę alarm? Gdzie się schronić? Gdzie pomoc medyczna? Czy mogę wietrzyć? Jak dotrę do bliskich?).

Linie z danych miasta są czerwone, linie do „Na żywo” kropkowane. Bez kliknięć. Ten slajd odpowiada na kryterium otwartych danych Warszawy (20%) i na warunek oceny z regulaminu (§4 ust. 9: użycie zbiorów m.st. Warszawy).

| Zbiór miasta na slajdzie | Droga | Dowód w repo |
|---|---|---|
| Defibrylatory AED | API `get_scb_lokalizacja_defibrylatorow`, w paczce | `public/pack/punkty/meta.json` (`um-aed`) |
| Toalety publiczne | API `get_m_toalety`, w paczce | `public/pack/punkty/meta.json` (`um-toalety`) |
| Pogoda i wiatr (ZOM) | API `get_zom_pogoda`, na żywo | `server/live/wiatr.ts` |
| Jakość powietrza | API `get_bopipk_monitoring_jakosci_powietrza`, na żywo | `server/live/powietrze.ts` |
| Punkty adresowe (126 923) | WFS `PUNKTY_ADRESOWE_WGS84`, w paczce | `public/pack/adresy/meta.json` |
| Apteki | WFS `APTEKI`, w paczce | `public/pack/punkty/meta.json` (`wfs-apteki`) |

Z PSP: 8 006 miejsc schronienia (`public/pack/punkty/punkty.json`, rodzaj `schronienie_psp`) i syreny SOIA 2026.05 (`public/pack/syreny/meta.json`). Apteki z WFS to dane z marca 2017 (tak mówi `public/pack/punkty/meta.json`), więc przy aptekach nie mówimy „aktualne”. `docs/DOKUMENTACJA.md` §1.1 liczy dziewięć zbiorów miasta, bo wlicza też wejścia do metra (WFS) oraz pozycje pojazdów i utrudnienia w ruchu, które w v3 są ukryte. Slajd pokazuje sześć używanych w v3. Gdy jury zapyta o liczbę: „sześć w aplikacji, dziewięć w dokumentacji”.

Notatka prezentera (`data-notatka`, klawisz N) ma tu pełną listę zbiorów (ok. 90 słów, 40 s). Ze sceny mówimy skrót poniżej, żeby zmieścić się w 20 s, a pełna lista jest na slajdzie.

**Mówimy:**

> Stoimy na otwartych danych. Sześć zbiorów to dane Warszawy, z API i WFS miasta: między innymi defibrylatory, pogoda, powietrze i punkty adresowe. Do tego PSP: miejsca schronienia i syreny. Co da się policzyć z góry, jest w telefonie, resztę bierzemy na żywo.

---

## 2:40–4:14 · Slajd 9 · Aplikacja sama pokazuje, co jest ważne w tym miejscu, także gdy padnie sieć

**Na ekranie:** z lewej tytuł „Dzień Kasi”, podtytuł „Kasia jest u mamy na Grochowie, ul. Grochowska 200”, oś pięciu etapów (Start, Karta Syreny, Miejsce schronienia, Pozostałe karty, Brak sieci) i duży podpis, który zmienia się z każdym krokiem. Z prawej makieta telefonu.

To nie jest żywa aplikacja. Ekrany to prawdziwe zrzuty z produkcji z 17.10 (ok. 21:00, Grochowska 200), a ruch (palec, przejścia, podświetlenia) jest zaprogramowany w `prezentacja/telefon.js`. Każde naciśnięcie strzałki to jeden krok. Wejście na slajd pokazuje stan początkowy (`#9.0`), potem jest 9 kroków (`#9.1`–`#9.9`), a dziesiąte naciśnięcie przechodzi na slajd 10. Strzałka wstecz cofa o krok bez animacji. Szybkie klikanie jest bezpieczne: animacja się przerywa, a telefon pokazuje właściwy stan.

Fabuła: Kasia jest u mamy na Grochowie (ul. Grochowska 200). Telefon pokazuje przebieg z produkcji: aplikacja sprawdza połączenie już przy otwarciu, a „Tutaj” tylko zmienia miejsce (zamiast adresu domu Kasia wybiera to, w którym stoi). Przepływ ekranów: `HANDOFF-v3.md` §2, karty: §3.

| Czas | Etap na osi | Naciskamy | Widać na telefonie | Podpis na slajdzie |
|---|---|---|---|---|
| 2:40–3:02 | Start | wejście na slajd (`#9.0`) | ekran „Sprawdzam połączenie…” z kółkiem | Kasia otwiera aplikację u mamy na Grochowie. / Najpierw aplikacja sprawdza, czy jest sieć. |
| (cd.) | Start | → 1 | ten sam ekran, tekst zmienia się na „Jest połączenie. Dane na żywo włączone. Trasy na offline zapisuję w tle.” | Jest sieć, więc dane na żywo są włączone. / W tle zapisuje trasy na wypadek, gdyby sieci zabrakło. |
| (cd.) | Start | → 2 | ekran z adresem „Dom: ul. Powstańców Śląskich 10” (ok. 1 s), palec dotyka „Tutaj”, ekran zmienia się na Grochowską 200 z pięcioma kartami, podświetlony pasek „Tutaj: ul. Grochowska 200” | Jedno dotknięcie: „Tutaj”. / Zamiast adresu domu miejsce, w którym Kasia stoi. Pięć kart dla tego miejsca. |
| 3:02–3:17 | Karta Syreny | → 3 | palec dotyka karty Syreny, na mapie okręgi najbliższych syren (analogowe pomarańczowe, cyfrowe niebieskie), podświetlone elipsą | Karta Syreny: okręgi najbliższych syren. / Kasia wie, czy usłyszy alarm, także jeśli zabraknie prądu. |
| 3:17–3:32 | Miejsce schronienia | → 4 | powrót do listy, palec dotyka karty schronienia, na mapie trasa piesza (70 m), podświetlona; niżej przycisk „Otwórz w aplikacji PSP” | Miejsce schronienia według PSP: 70 m. / Trasa piesza po ulicach. Kasia nie szuka w panice. |
| 3:32–3:49 | Pozostałe karty | → 5 | palec przewija listę, wjeżdża karta Powietrze i wiatr, podświetlone „Powietrze dobre. Możesz wietrzyć.” | Powietrze i wiatr: „Możesz wietrzyć”. / Rekomendacja z pomiaru 230 m dalej, a nie suche dane. |
| (cd.) | Pozostałe karty | → 6 | kolejne przewinięcie, karta Dotarcie do bliskich, podświetlona linia: do domu pieszo ok. 172 min, rowerem ok. 58 min, „Jeśli zabraknie prądu, tramwaje i metro stoją” | Do domu pieszo 172 min, rowerem 58. / Jeśli zabraknie prądu, tramwaje i metro stoją. Najbliższe Veturilo: 280 m. |
| 3:49–4:14 | Brak sieci | → 7 | w pasku stanu przekreślone Wi-Fi, szary zasięg, dymek „Brak sieci”, aplikacja przyciemniona | Pada sieć. / Bez prądu znika zasięg. Tak było w Kijowie. |
| (cd.) | Brak sieci | → 8 | „odświeżenie”: „Sprawdzam połączenie…” → „Brak sieci. Działam na danych z paczki z 17.10, 20:52.” → ekran główny z paskiem „Offline · paczka z 17.10, 20:52” | Odświeżamy: aplikacja działa dalej z paczki w telefonie. / Pasek mówi wprost: offline, dane z 17.10, 20:52. |
| (cd.) | Brak sieci | → 9 | palec dotyka karty schronienia, ta sama trasa i napis „(trasa zapisana w telefonie)” | Ta sama trasa, zapisana w telefonie. / Działa, gdy wszystko pada. |

Karty Pomoc medyczna w przebiegu nie pokazujemy (jest na slajdzie 7 i w aplikacji).

**Mówimy:**

**Krok 1, start (22 s)**

> Pokażę to na Kasi. Jest u mamy na Grochowie i otwiera aplikację, a ta sprawdza połączenie. [→ 1] Jest sieć, więc dane na żywo działają, a trasy na wypadek braku sieci zapisują się w tle. [→ 2] Kasia dotyka „Tutaj” i dostaje pięć kart dla miejsca, w którym stoi.

**Krok 2, karta Syreny (15 s)**

> [→ 3] Pierwsza karta: syreny. Okręgi pokazują najbliższe syreny, a tekst mówi, czy Kasia usłyszy alarm i co zrobić. Jeśli zabraknie prądu, a syreny analogowe nie mają zasilania awaryjnego, może być ciszej.

**Krok 3, miejsce schronienia (15 s)**

> [→ 4] Druga karta: najbliższe miejsce schronienia według PSP. Tutaj to 70 metrów, a trasa piesza prowadzi po ulicach. Obok jest przycisk do aplikacji PSP. Kasia nie szuka w panice.

**Krok 4, pozostałe karty (17 s)**

> [→ 5] Powietrze i wiatr: „Możesz wietrzyć”, czyli rekomendacja, a nie tabela pomiarów. [→ 6] Dotarcie do bliskich: do domu pieszo prawie trzy godziny, rowerem niecała godzina. Jeśli zabraknie prądu, tramwaje i metro stoją, więc aplikacja podpowiada najbliższe Veturilo.

**Krok 5, brak sieci (25 s)**

> [→ 7] A teraz najgorsze: pada sieć. Jeśli zabraknie prądu, znika zasięg, jak w Kijowie. [→ 8] Kasia odświeża aplikację. Pasek mówi wprost: offline, dane z paczki z 17 października. Karty dalej działają. [→ 9] Klika miejsce schronienia i jest ta sama trasa, zapisana w telefonie. Działa, gdy wszystko pada.

**Jeśli jury zapyta, czy demo jest na żywo:** „To zaprogramowany przebieg na prawdziwych zrzutach z produkcji, żeby pokaz nie zależał od sieci na sali. Żywa aplikacja jest pod linkiem i można ją sprawdzić od razu.”

**Plan B (kolejność):**
1. Jeśli animacja telefonu się zetnie: wpisać adres kroku w pasku przeglądarki (`#9.k`) albo ← i → (każdy skok ustawia stan od razu).
2. Jeśli prezentacja nie wstaje z serwera lokalnego: otworzyć `prezentacja/index.html` z dysku (działa bez serwera; font Archivo bez sieci przechodzi na systemowy).
3. Zapas na pytania jury: żywa aplikacja z linku `https://warszawa-kryzys.startupaplikujmy.workers.dev/?lokalizacja=52.2457,21.0874` (Grochowska 200) w drugiej karcie. Bez sieci na sali: zrzuty z `prezentacja/ekrany/` i `docs/pitch/zrzuty/` (opis w `zrzuty.md`).

---

## 4:14–4:45 · Slajd 10 · Mieszkaniec zyskuje spokój, a miasto narzędzie na danych, które już ma

**Na ekranie:** tytuł „Spokój dla mieszkańców, narzędzie dla miasta” i dwie karty z ikonami. „Dla mieszkańca”: wie, co zrobić, pod swoim adresem; zawczasu, a nie dla całej Polski; odpowiedzi działają bez sieci. „Dla miasta”: dane, które Warszawa i PSP już publikują; bez kont i sklepu z aplikacjami; tani hosting. Po naciśnięciu strzałki pod spodem pojawia się oś „Następne kroki” z trzema węzłami (wojewoda i zasilanie syren, 19115 i Syrena-26, wpięcie w codzienną aplikację).

**Klikamy:** → raz, przy słowach „Następne kroki”.

**Mówimy:**

> Kasia wie zawczasu, co zrobić, i to pod swoim adresem, a nie dla całej Polski. Miasto dostaje narzędzie na danych, które już publikuje, bez kont i bez sklepu z aplikacjami. [→] Następne kroki: z wojewodą mazowieckim, właścicielem syren analogowych, sprawdzić ich zasilanie[, porównać model ze zgłoszeniami z 19115 z ćwiczeń Syrena-26] i wpiąć tryb kryzysowy w aplikację, której warszawiacy używają na co dzień.

---

## 4:45–5:00 · Slajd 11 · Działa, gdy wszystko pada

**Na ekranie:** jasne tło z żółtą kreską u góry, jak na pierwszym slajdzie. Trzy linijki: „Czasy są niepewne.” → „Warszawa może dać spokój.” → „Działa, gdy wszystko pada.” („pada” zakreślone na żółto). Na dole linki z ikonami: aplikacja, wersja offline (`?offline=1`), repozytorium, „Zespół AI Slopers”.

**Klikamy:** → dwa razy (druga i trzecia linijka). Po „Dziękujemy” jeszcze raz → na slajd 12.

**Mówimy:**

> Czasy są niepewne. [→] Warszawa może dać mieszkańcom spokój. [→] Taki, który działa, gdy wszystko pada. Dziękujemy.

---

## Poza czasem · Slajd 12 · AI Slopers (na pytania jury)

**Na ekranie:** żart zespołu w stylu stron z lat 90.: tęczowy napis „AI Slopers” (WordArt, falujące litery), migające „NEW!”, przesuwany pas „Witamy na naszej stronie!”, licznik odwiedzin „Jesteś gościem nr …”, pas „UWAGA! STRONA W BUDOWIE”, przyciski „Netscape NOW!” i „Zrobione w Notatniku”, „Dzięki za uwagę!!!1”. Animacja rusza sama po wejściu na slajd. Slajd celowo łamie paletę reszty prezentacji.

Wchodzimy na niego jednym naciśnięciem po „Dziękujemy”. Zostaje na ekranie podczas pytań jury. Nie wlicza się w 5 minut.

**Mówimy:**

> Zespół AI Slopers. Dziękujemy!

---

## Zależności demo

Stan na 17.10 ok. 21:00: ekran z kartami (V4) jest na `main` i na produkcji. Kroki demo przeszliśmy na produkcji z linkiem demo, a ekrany z tego przejścia są zrzutami w `prezentacja/ekrany/`. Na scenie demo nie zależy od aplikacji ani od sieci.

| Element | Z czego korzysta | Jeśli nie zadziała |
|---|---|---|
| Slajd 4, mapa i przełącznik | `dane.js` z `build_dane.py`, liczby z `WYNIKI.md` | strzałka → albo `#4.1` ustawia blackout; w ostateczności same liczby z tekstu |
| Slajdy 5 i 6, persony i zadania z danymi | `dane.js` (liczone w przeglądarce) | brak zależności od aplikacji |
| Slajd 8, zbiory danych | ręcznie wpisane liczby i nazwy w `index.html` | brak zależności od aplikacji; liczby do sprawdzenia po odświeżeniu paczki (126 923 adresy, 8 006 miejsc schronienia) |
| Slajd 9, demo „Dzień Kasi” | `telefon.js`, `telefon.css`, `ekrany/*.jpg` | `#9.k` w pasku adresu, ← i →; zapas: żywa aplikacja z linku |
| Zapas na pytania jury | żywa aplikacja na Workerze (jest), `?lokalizacja=…` | zrzuty z `ekrany/` i `docs/pitch/zrzuty/` |

Skąd ekrany w telefonie: `glowny`, `syreny`, `trasa`, `powietrze`, `bliscy`, `offline-trasa` to zrzuty z produkcji (`docs/pitch/zrzuty/v3-*.png`, przeskalowane), `dom` to nowy zrzut z produkcji (aplikacja po ponownym otwarciu z wybranym adresem Dom), a `offline-glowny` jest złożony z dwóch prawdziwych zrzutów (ekran główny i pasek „Offline · paczka z 17.10, 20:52”). Ekran „Sprawdzam połączenie…” jest odtworzony w HTML (tekst jak w `src/app/Polaczenie.tsx`). Godzina w pasku stanu to stałe 21:04.

Karta Syreny dla Grochowskiej 200 mówi: „Jesteś w zasięgu syreny (75 dB i więcej). Jeśli zabraknie prądu (70–75 dB, szacunek), nadal powinna być słyszalna na zewnątrz.” Najbliższe miejsce schronienia według PSP jest pod tym samym adresem (70 m), więc trasa na mapie jest krótka.

**Znany błąd paczki offline (zgłoszony do O1).** Dotyczy tylko żywej aplikacji, czyli zapasu na pytania jury, nie prezentacji. Przy pierwszym wejściu `adresy.json` (pierwszy plik paczki, 5,4 MB) pobiera się, zanim service worker przejmie stronę, i nie trafia do zapisu. Bez sieci karta Syreny pokazuje wtedy „dane o syrenach nie są zapisane w telefonie”. Obejście: po pobraniu paczki odświeżyć aplikację raz z siecią. Po drugim wejściu wszystkie karty działają bez sieci.

## Przygotowanie przed wejściem na scenę

Telefonu, adresów, paczki ani czystego profilu przygotowywać nie trzeba: demo nie używa żywej aplikacji.

- [ ] Serwer prezentacji: `python -m http.server 8765 --bind 127.0.0.1 --directory docs/pitch/prezentacja` (z katalogu repo), w przeglądarce http://127.0.0.1:8765/ na pełnym ekranie (F). Sprawdzone na laptopie, z którego wystąpimy, i na rzutniku.
- [ ] Przejście na sucho strzałkami lub pilotem od `#1.0` do slajdu 12: 12 slajdów, 28 naciśnięć, w tym 9 kroków demo na slajdzie 9. Pilot musi wysyłać strzałki albo PageDown.
- [ ] Slajd 4: strzałka włącza blackout (liczba 36,6% na czerwono, podpisy dzielnic), ← wraca.
- [ ] Slajd 9: telefon w całości widoczny na rzutniku (nie zachodzi na numer slajdu), podpisy po lewej czytelne z końca sali. Tekst w samym telefonie jest drobny, więc treść niosą podpisy i podświetlenia.
- [ ] Klawisz N (notatki) pokazuje notatki na tym samym ekranie: przy rzutniku zostaje wyłączony.
- [ ] Internet nie jest potrzebny. Bez sieci tylko font Archivo przechodzi na systemowy (wygląd nieco inny).
- [ ] Próba na sucho z zegarem (P7): czasy z tabeli, opcje w nawiasach kwadratowych włączamy tylko, jeśli się mieszczą.
- [ ] Zapas na pytania jury: żywa aplikacja z linku `https://warszawa-kryzys.startupaplikujmy.workers.dev/?lokalizacja=52.2457,21.0874` w drugiej karcie, z siecią. Gdyby jury poprosiło o pokaz offline na żywo: w „Adresy” wpisać dom (ul. Powstańców Śląskich 10), pracę (rondo Daszyńskiego 1) i bliską osobę (ul. Grochowska 200), kliknąć „Tutaj”, odczekać ok. 30 s (trasy na offline zapisują się w tle), odświeżyć raz z siecią (obejście błędu paczki), potem wyłączyć Wi-Fi. Bez domu przycisk „Zapisz” jest nieaktywny.
- [ ] Wyłączone powiadomienia systemowe i komunikatory.

## Liczby ze slajdów 5, 6 i 8 (nowe w wersji 4)

Liczby na slajdach 5 i 6 liczy przeglądarka z `dane.js` (z `build_dane.py` i `kontekst/jtbd-kryzys-warszawa.md`). Liczby na slajdzie 8 są wpisane ręcznie w `index.html`.

| Liczba w pitchu | Wartość | Źródło |
|---|---|---|
| zadania na grupę (slajd 5) | Rodzic 15, Senior 14, Przewlekle chora 13, Nie zna polskiego 11, Młoda bez zapasów 12, W drodze 14; 10 zadań dotyczy wszystkich | `dane.js`, pole `grupy` zadania; zadanie „dla wszystkich” liczy się każdej grupie |
| podział zadań na dane (slajd 6) | 13 w telefonie bez sieci (w tym 2 także z danymi na żywo), 5 na żywo, 6 bez danych; 18 z 24 łączy się z danymi | `dane.js`, pole `rodzaj` zbioru (`ZADANIA` i `ZBIORY` w `build_dane.py`) |
| 6 zbiorów otwartych danych Warszawy (slajd 8) | AED, toalety, pogoda i wiatr, jakość powietrza, punkty adresowe, apteki | tabela w sekcji slajdu 8 |
| 126 923 punkty adresowe | liczba rekordów paczki adresów | `public/pack/adresy/meta.json` |
| 8 006 miejsc schronienia według PSP | punkty rodzaju `schronienie_psp` | `public/pack/punkty/punkty.json` |

Wiersz o pokryciu danymi (3 pełne, 13 częściowe, 7 brak, 1 n/d) w tabeli „Liczby w pitchu i skąd je mamy” poniżej opisuje analizę JTBD, a nie slajd 6. Na slajdzie jest podział 13 / 5 / 6, zbudowany inaczej (według tego, czy zbiór jest w paczce, czy na żywo). Ze sceny nie mieszamy tych dwóch podziałów.

## Liczby w pitchu i skąd je mamy

Sprawdzone 17.10 na `pipeline/syreny/WYNIKI.md`. Liczby na slajdzie czyta z niego `prezentacja/build_dane.py`, więc nie są wpisane ręcznie.

| Liczba w pitchu | Dokładna wartość | Źródło w `WYNIKI.md` |
|---|---|---|
| dziś syrenę słychać przy 92,5% adresów | 92,5% adresów ≥ 65 dB, wszystkie syreny (SOIA) | tabela „Miasto”, wiersz „Wszystkie syreny” |
| głośnej syreny ubywa z 48,3% do 36,6% adresów (główna liczba) | ≥ 75 dB: 48,3% → 36,6% | tabela „Miasto”, kolumna „Adresy ≥ 75 dB”, wiersze „Wszystkie syreny” i „Blackout, przybliżenie” |
| przy 65 dB i więcej zostaje 91,5%, ok. tysiąca adresów traci zasięg | 91,5%, 1 230 adresów (wrażliwość ±1 dB: 697–1 928) | tabela „Miasto” i „Wrażliwość” |
| Praga-Południe 81,7% → 45,2% | ≥ 75 dB normalnie → blackout | tabela „Dzielnice” |
| Praga-Północ 85,5% → 52,6%, Żoliborz 93,0% → 64,0%, Wola 88,2% → 60,4% | jw. | jw. |
| 126 923 adresy | liczba punktów adresowych | „Adresów” pod tabelą „Miasto” |
| najgorszy wariant: 69,1%, 29 676 adresów | dolne oszacowanie, tylko strefy, gdzie SOIA pokazuje syrenę cyfrową | tabela „Miasto”, wiersz „dolne oszacowanie”. Mówimy tylko, gdy ktoś zapyta, z nazwą „najgorszy wariant” |
| 6 grup mieszkańców, 7 faz, 24 zadania | M1–M6, F0–F6, 24 z 31 zadań | `kontekst/jtbd-kryzys-warszawa.md` |
| pokrycie danymi: 3 pełne, 13 częściowe, 7 brak, 1 n/d | jw. | jw., część 6 |
| wojna od ponad czterech lat | pełnoskalowa inwazja od 24.02.2022 | wiedza ogólna |

Uwagi:
- Dzielnice dobiera `build_dane.py`: cztery z największym spadkiem udziału adresów ≥ 75 dB w punktach procentowych (Praga-Południe 36,5 pp, Praga-Północ 32,9, Żoliborz 29,0, Wola 27,8). Mokotów (72,6% → 46,1%) i Ochota (68,6% → 44,2%) mają spadek mniejszy (26,5 i 24,4 pp), więc nie są w czwórce. „Najbardziej na Pradze-Południe” zgadza się z tabelą.
- Przybliżenie ma błąd na progu 65 dB około 4% adresów, większy niż różnica między wszystkimi syrenami a samymi cyfrowymi. Dlatego 1 230 podajemy jako rząd wielkości („ok. tysiąca”), nie jako dokładną liczbę.
- Przybliżenie pomija syreny cyfrowe z gmin sąsiednich, więc przy granicach miasta zasięg może być zaniżony.
- Poprzednia liczba (69,1%, „prawie co czwarty adres”, „na Żoliborzu, Woli i Pradze ponad połowa”) była wariantem skrajnym. Nie używamy jej jako głównej liczby ani zdania o „co czwartym adresie”.

## Fakty do potwierdzenia przed oddaniem

W repo nie ma linku do źródła tych stwierdzeń:

- [ ] Kijów: stanęły tramwaje przy blackoucie w styczniu 2026 (`kontekst/rozwiazanie-podsumowanie.md`, bez linku).
- [ ] Syrena-26: Warszawa zbierała zgłoszenia o słyszalności przez 19115 (jw.).
- [ ] Zgoda PSP na użycie miejsc schronienia z gdziesieukryc.pl (HANDOFF §6: „zespół deklaruje”). Do potwierdzenia mówimy „od PSP”, nie „za zgodą PSP”.

## Czego nie mówimy

- „Schrony”. Zawsze „miejsca schronienia według PSP”.
- „Na pewno nie usłyszysz”. Zawsze „jeśli syreny analogowe nie mają zasilania awaryjnego” i „model dźwięku na zewnątrz”.
- „Prawie co czwarty adres traci zasięg” i 69,1% jako głównej liczby. To najgorszy wariant. Główna liczba to 48,3% → 36,6% adresów ≥ 75 dB.
- Że aplikacja ogłasza alarmy. Pomaga upewnić się, że alarm dotrze.
- Że tunele metra są płytkie albo że miejsca schronienia są niebezpieczne.
- Konkretnych zagrożeń i scenariuszy ataku na Warszawę. O geopolityce mówimy ogólnie.
- O lukach w danych miasta jako głównym wątku. Szare węzły na siatce to uczciwość analizy, nie zarzut wobec miasta.
