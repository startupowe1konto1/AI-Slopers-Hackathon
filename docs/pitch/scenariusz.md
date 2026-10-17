# Scenariusz pitchu: 5 minut

**Teza pitchu:** Warszawa w trybie kryzysowym daje mieszkańcom spokój, który działa, gdy wszystko pada. Pod własnym adresem każdy wie, czy usłyszy alarm, gdzie jest pomoc i jak dotrze do bliskich. Aplikacja działa także bez internetu i stoi na danych, które miasto i PSP już publikują.

**Zdanie, które jury ma powtórzyć:** „Działa, gdy wszystko pada”.

| SCQA | Treść |
|---|---|
| Sytuacja | Napięcie geopolityczne rośnie. Miasto takie jak Warszawa powinno dawać mieszkańcom spokój. |
| Komplikacja | Kijów pokazał, że przy ataku najpierw pada prąd, a z nim sieć, alarmy w telefonie, mapy i tramwaje. W Warszawie, jeśli zabraknie prądu, głośnej syreny (75 dB i więcej) może ubyć z 48,3% do 36,6% adresów. |
| Pytanie | Jak dać mieszkańcowi odpowiedzi, które działają także wtedy, gdy wszystko pada? |
| Odpowiedź | Rozpisaliśmy zadania mieszkańców, połączyliśmy je z otwartymi danymi i zbudowaliśmy aplikację, która odpowiada pod adresem i działa offline. |

**Forma:** prezentacja w HTML, typograficzna i minimalistyczna, jak startupowy pitch deck. Dwa żywe elementy: przełącznik blackoutu na mapie syren i działająca aplikacja w makiecie telefonu na slajdzie. Plik: [prezentacja/index.html](prezentacja/index.html), obsługa w [prezentacja/README.md](prezentacja/README.md).

Stan: wersja 3 (sobota, 17.10, wieczór). Liczby syren z `pipeline/syreny/WYNIKI.md` (przybliżenie, nie najgorszy wariant 69,1%) i demo na nowym przepływie: lokalizacja → „Sprawdzam połączenie…” → karty „Twoja sytuacja” → trasa → brak sieci (`HANDOFF-v3.md` §2). Próbę na działającym ekranie z kartami robimy po V4 (23:30) i wtedy poprawiamy czasy i teksty demo.

---

## Pitch w skrócie

Same nagłówki czytane po kolei dają cały wywód.

| Czas | Sek. | Slajd: co jury ma zapamiętać | Kryterium oceny |
|---|---|---|---|
| 0:00–0:20 | 20 | Napięcie rośnie, a ludzie pytają: co zrobię, jeśli to się stanie tutaj? | związek z realiami Warszawy (15%) |
| 0:20–0:35 | 15 | Miasto ma dawać spokój także wtedy, gdy zawiedzie prąd i sieć | związek z realiami Warszawy |
| 0:35–0:55 | 20 | Kijów pokazał, co pada najpierw: prąd, sieć, alarmy, mapy, tramwaje | związek z realiami Warszawy |
| 0:55–1:20 | 25 | Jeśli zabraknie prądu, głośnej syreny ubywa z 48,3% do 36,6% adresów | innowacyjność (25%), otwarte dane (20%) |
| 1:20–1:40 | 20 | Zaczęliśmy od zadań mieszkańców, nie od danych | innowacyjność |
| 1:40–2:05 | 25 | Każde zadanie połączyliśmy z danymi i widać, gdzie dane pomagają, a gdzie nie | otwarte dane Warszawy (20%) |
| 2:05–2:30 | 25 | Pięć kart w jednej stronie, a to, co da się policzyć z góry, jest w telefonie | praktyczne zastosowanie (20%) |
| 2:30–4:05 | 95 | Aplikacja sama pokazuje, co jest ważne w tym miejscu, także gdy padnie sieć | praktyczne zastosowanie, innowacyjność |
| 4:05–4:40 | 35 | Mieszkaniec zyskuje spokój, a miasto narzędzie na danych, które już ma | potencjał wdrożeniowy (20%) |
| 4:40–5:00 | 20 | Działa, gdy wszystko pada | jakość prezentacji (20%) |

Prezenter: **DO USTALENIA**. Druga osoba klika w telefonie na slajdzie.

Tempo: około 130 słów na minutę. Tekst ma około 510 słów, czyli około 3:55 mówienia. Reszta to kliknięcia, animacje i pauzy. Jeśli próba (P7) wyjdzie za długa, tniemy w tej kolejności: zdanie o mapie punktów w Kijowie, lista grup mieszkańców (zostaje sama liczba), drugi krok wdrożenia (Syrena-26).

Oznaczenie ⚠️ znaczy, że slajd pokazuje funkcję, której jeszcze nie ma na `main`. Szczegóły w sekcji „Zależności demo”.

---

## 0:00–0:20 · Napięcie rośnie, a ludzie pytają: co zrobię, jeśli to się stanie tutaj?

**Na ekranie:** czarne tło, białe litery. Trzy krótkie linijki pojawiają się jedna po drugiej, w rytm mówienia: „Wojna za wschodnią granicą.” → „Rosnące napięcie.” → „Co zrobię, jeśli to się stanie tutaj?”

**Mówimy:**

> Od ponad czterech lat za naszą wschodnią granicą trwa wojna. Napięcie w regionie rośnie. Rząd wydał poradnik bezpieczeństwa. Nikt nie chce o tym myśleć, a jednak coraz więcej osób zadaje sobie pytanie: co zrobię, jeśli to się stanie tutaj?

---

## 0:20–0:35 · Miasto ma dawać spokój także wtedy, gdy zawiedzie prąd i sieć

**Na ekranie:** jedno zdanie, duża typografia: „Miasto ma dawać spokój.”

**Mówimy:**

> Miasto takie jak Warszawa powinno dawać mieszkańcom spokój. Nie obietnicę, że nic się nie stanie, tylko pewność, że każdy wie, co zrobić. Także wtedy, gdy zawiedzie prąd i sieć.

---

## 0:35–0:55 · Kijów pokazał, co pada najpierw

**Na ekranie:** rząd pięciu słów jak kostki domina: „prąd → sieć → alarmy → mapy → tramwaje”. Kostki przewracają się jedna po drugiej. Bez zdjęć zniszczeń i ważnych obiektów.

**Mówimy:**

> Kijów pokazał, co pada najpierw. Rosja uderza w sieć energetyczną. Bez prądu znika zasięg komórkowy, a z nim alarmy w telefonie i mapy. Mapa punktów, gdzie można się ogrzać, bez internetu nie działała, więc ludziom radzono spisać adresy na kartce. Stanęły tramwaje.

---

## 0:55–1:20 · Jeśli zabraknie prądu, głośnej syreny ubywa z 48,3% do 36,6% adresów

**Na ekranie:** mapa Warszawy i duża liczba „48,3%” (adresy, gdzie syrena jest głośna, 75 dB i więcej), nad nią „Dziś syrenę słychać przy 92,5% adresów”. Prezenter klika przełącznik „wyłącz prąd”: liczba spada do „36,6%”, pod nią „Przy 65 dB i więcej zostaje 91,5% adresów: zasięg traci ok. tysiąca (rząd wielkości)”, a cztery dzielnice z największym spadkiem podświetlają się z podpisem „przed → po” (Praga-Południe 81,7 → 45,2%, Praga-Północ 85,5 → 52,6%, Żoliborz 93,0 → 64,0%, Wola 88,2 → 60,4%). Na dole drobnym drukiem: „Model dźwięku na zewnątrz, wynik przybliżony. Blackout: jeśli syreny analogowe nie mają zasilania awaryjnego, a cyfrowe działają. Dane: KG PSP, SOIA 2026.05.”

**Uwaga o mapie.** Kształt mapy pochodzi z najgorszego wariantu (dolne oszacowanie: tylko strefy, gdzie SOIA pokazuje syrenę cyfrową, 69,1% adresów w zasięgu 65 dB). Legenda pod mapą mówi to wprost: przed kliknięciem „zasięg wszystkich syren”, po kliknięciu „najgorszy wariant: zasięg zostaje tylko w strefach syren cyfrowych (69,1%)” i czerwony obszar „zasięg tracony w najgorszym wariancie”. Podpis pod liczbą dodaje: „Czerwony obszar na mapie to najgorszy wariant, nie ta liczba.” Nie mówimy ze sceny „mapa pokazuje spadek do 69,1%”. Gdy O2 doda okręgi z modelu (`okregi.json`, zadanie S2), można wymienić mapę na przybliżenie.

Dane do slajdu: liczby z `pipeline/syreny/WYNIKI.md` (czyta je `prezentacja/build_dane.py` do `dane.js`), kształt mapy z `dane/soia-warszawa/analiza/syreny_zasieg_tylko_cyfrowe.geojson`, `syreny_blackout_utracony_zasieg.geojson`, `granica_warszawy.geojson`.

**Mówimy:**

> A w Warszawie? Sprawdziliśmy syreny na danych Państwowej Straży Pożarnej. Dziś syrenę słychać przy 92,5% adresów. [klik: wyłącz prąd] Jeśli zabraknie prądu, a syreny analogowe nie mają zasilania awaryjnego, głośnej syreny, 75 decybeli i więcej, ubywa z 48,3% do 36,6% adresów. Najbardziej na Pradze-Południe. To model dźwięku na zewnątrz i przybliżenie, dlatego mówimy „jeśli”.

Jeśli ktoś dopyta o najgorszy wariant: „Gdybyśmy wyrzucili wszystkie strefy, w których SOIA nie pokazuje syreny cyfrowej, zostaje 69,1% adresów w zasięgu 65 dB. To wariant skrajny, dolne oszacowanie, nie nasza główna liczba.”

---

## 1:20–1:40 · Zaczęliśmy od zadań mieszkańców, nie od danych

**Na ekranie:** macierz. W wierszach 6 grup mieszkańców, w kolumnach 7 faz kryzysu: „dni przed”, „0–15 min”, „15–60 min”, „1–6 h”, „6–24 h”, „1–3 dni”, „3+ dni”. W komórkach kropki, czyli zadania. Na górze liczba „24 zadania”.

Źródło: `kontekst/jtbd-kryzys-warszawa.md`, części 3, 4 i 6. Plik ma 31 zadań, w tym 7 zadań wyłącznie instytucji. Na slajdzie pokazujemy 24 zadania mieszkańców, bo aplikacja jest dla mieszkańców.

**Mówimy:**

> Nie zaczęliśmy od danych. Zaczęliśmy od ludzi. Rozpisaliśmy, co w kryzysie musi zrobić sześć grup mieszkańców: rodzic dojeżdżający do pracy, senior, osoba przewlekle chora, ktoś, kto nie zna polskiego, młody bez zapasów i ktoś w drodze. Od dni przed atakiem po powrót do normalności. Wyszły 24 zadania.

---

## 1:40–2:05 · Każde zadanie połączyliśmy z danymi i widać, gdzie dane pomagają, a gdzie nie

**Na ekranie:** siatka połączeń. Z lewej zadania, z prawej zbiory danych (portal Warszawy, WFS, PSP, dane.gov.pl, OSM), między nimi linie. Kolory: czarne działa offline, niebieskie potrzebuje sieci, szare to zadania bez danych. Najechanie na zadanie podświetla jego zbiory. Na dole wniosek: „Budujemy tam, gdzie zadanie łączy się z danymi.”

Liczby do slajdu (z części 6 pliku JTBD, dla 24 zadań mieszkańców): pokrycie danymi pełne w 3, częściowe w 13, brak w 7, nie dotyczy w 1. Aplikacja jest właściwym narzędziem w 13 zadaniach, a częściowo w 4. Analiza powstała przed pozyskaniem danych PSP o miejscach schronienia. Przy budowie siatki zadanie 2 („najbliższe ukrycie”) trzeba przestawić na pełne pokrycie.

**Mówimy:**

> Każde zadanie połączyliśmy z danymi: miejskimi, PSP i innymi otwartymi. Czarne działa bez sieci, niebieskie potrzebuje sieci. Szare to zadania, których żadne dane nie rozwiązują, na przykład gdzie naładować telefon. Tego nie udajemy. Zbudowaliśmy rozwiązanie tam, gdzie zadanie łączy się z danymi.

---

## 2:05–2:30 · Pięć kart w jednej stronie, a to, co da się policzyć z góry, jest w telefonie

**Na ekranie:** sześć kafli z nazwą i krótkim opisem. Pięć to karty z ekranu „Twoja sytuacja”: „Syreny”, „Najbliższe miejsce schronienia (PSP)”, „Pomoc medyczna”, „Powietrze i wiatr”, „Dotarcie do bliskich”. Szósty kafel to „Paczka offline”. Pod spodem prosty diagram: dane → paczka w telefonie (offline); API miasta → nasz serwer → telefon (na żywo, za kartami Powietrze i wiatr oraz Dotarcie do bliskich).

**Mówimy:**

> Tak powstała Warszawa w trybie kryzysowym. Jedna strona internetowa, a po wpisaniu adresu pięć kart dopasowanych do twojej sytuacji: syreny, najbliższe miejsce schronienia według PSP, pomoc medyczna, powietrze i wiatr, dotarcie do bliskich. Za kartami są dane na żywo, a wszystko, co da się policzyć z góry, jest w telefonie. Działa, gdy wszystko pada.

---

## 2:30–4:05 · Aplikacja sama pokazuje, co jest ważne w tym miejscu, także gdy padnie sieć

**Na ekranie:** z lewej oś z pięcioma krokami (start, karta Syreny, karta miejsca schronienia, pozostałe karty, brak sieci). Z prawej makieta telefonu z działającą aplikacją (iframe z `https://warszawa-kryzys.startupaplikujmy.workers.dev/`). Szóste naciśnięcie klawisza (albo przełącznik „wyłącz sieć”) przeładowuje telefon z `?offline=1`. Kliknięcie kroku podświetla go na osi.

Fabuła: Kasia jest u mamy na Grochowie (ul. Grochowska 200). Demo startuje z linku z lokalizacją, więc nie zależy od GPS na laptopie. Przepływ ekranów: `HANDOFF-v3.md` §2, karty: §3.

**Link demo:** `https://warszawa-kryzys.startupaplikujmy.workers.dev/?lokalizacja=52.2457,21.0874` (Grochowska 200). Telefon na slajdzie ładuje ten sam adres, jeśli prezentację otworzymy z parametrem `app` (adres zakodowany): `?app=https%3A%2F%2Fwarszawa-kryzys.startupaplikujmy.workers.dev%2F%3Flokalizacja%3D52.2457%2C21.0874`.

Jak przygotować telefon na slajdzie: `prezentacja/README.md`, sekcja „Telefon na slajdzie 8” (zapisane adresy Kasi i pobrana paczka, żeby tryb offline miał z czego działać).

| Czas | Krok | Klikamy | Widać | Wartość |
|---|---|---|---|---|
| 2:30–2:50 | 1. Start: lokalizacja i połączenie | link `?lokalizacja=…`, „Użyj mojej lokalizacji”, potem czekamy | „Sprawdzam połączenie…” → „Jest połączenie. Pobieram paczkę offline: … z 11”, potem mapa z punktem „Tutaj” i karty; pasek „Online” | zaczyna od miejsca, w którym stoi, i wie, na jakich danych działa |
| 2:50–3:10 | 2. Syreny | karta Syreny | okręgi najbliższych syren na mapie, tekst o zasięgu i o blackoucie (z „jeśli”) | wie, czy usłyszy alarm, i zna kroki |
| 3:10–3:30 | 3. Miejsce schronienia | karta Najbliższe miejsce schronienia (PSP) | trasa piesza po chodnikach, odległość i czas, przycisk do aplikacji PSP | nie szuka w panice |
| 3:30–3:40 | 4. Pozostałe karty | przewinięcie listy: Pomoc medyczna, Powietrze i wiatr, Dotarcie do bliskich | trzy karty z poziomem (zielony, pomarańczowy, czerwony, szary); w bliskich trasa do domu Kasi i najbliższe Veturilo | rekomendacja, nie suche dane |
| 3:40–4:05 | 5. Brak sieci | wyłączamy Wi-Fi, odświeżamy, klik w miejsce schronienia | pasek „Offline · paczka z 17.10, …”, karty dalej działają, ta sama trasa „zapisana w telefonie” | nie zostaje z pustym ekranem |

**Mówimy:**

**Krok 1, start: lokalizacja i połączenie (20 s)**

> Pokażę to na Kasi. Jest u mamy na Grochowie i otwiera aplikację z linku. Jedno dotknięcie: „Użyj mojej lokalizacji”. Aplikacja sprawdza połączenie. Jest sieć, więc pobiera paczkę z danymi do telefonu, a karty pokazują też dane na żywo.

**Krok 2, karta Syreny (20 s)**

> Pierwsza karta: syreny. Klik i na mapie widać okręgi najbliższych syren. Kasia dowiaduje się, czy usłyszy alarm i co zrobić, jeśli zabraknie prądu.

**Krok 3, miejsce schronienia (20 s)**

> Druga karta: najbliższe miejsce schronienia według PSP, z odległością i czasem. Tutaj to 70 metrów. Klik i trasa piesza po ulicach, a obok przycisk do oficjalnej aplikacji PSP.

**Krok 4, pozostałe karty (10 s)**

> Dalej pomoc medyczna, powietrze i wiatr, dotarcie do bliskich. Do domu Kasia ma prawie trzy godziny pieszo, a jeśli zabraknie prądu, tramwaje i metro stoją. Aplikacja podpowiada najbliższą stację Veturilo z rowerami. Każda karta mówi, co zrobić, a nie tylko pokazuje dane.

**Krok 5, brak sieci (25 s)**

> A teraz najgorsze: pada sieć. [wyłączamy Wi-Fi, odświeżamy] Aplikacja pokazuje „Offline” i datę paczki, a karty dalej działają. Klikamy miejsce schronienia i jest ta sama trasa, zapisana w telefonie. Działa, gdy wszystko pada.

**Plan B (kolejność):**
1. Jeśli Wi-Fi na laptopie sprawia kłopot: przełącznik „wyłącz sieć” w prezentacji albo klawisz O (telefon przeładowuje się z `?offline=1`). Działa tylko po wcześniejszym przejściu online, żeby paczka i trasy były zapisane.
2. Jeśli ekran z kartami się nie ładuje: nagranie wideo demo na pulpicie, a zrzuty kart w `docs/pitch/zrzuty/` (pliki `v3-*.png`, opis w `zrzuty.md`).
3. Jeśli lokalizacja nie działa: link z `?lokalizacja=…` albo zapisany adres Kasi.

---

## 4:05–4:40 · Mieszkaniec zyskuje spokój, a miasto narzędzie na danych, które już ma

**Na ekranie:** dwie kolumny, „Dla mieszkańca” i „Dla miasta”, po dwie linijki. Pod spodem trzy następne kroki.

**Mówimy:**

> Kasia wie zawczasu, co zrobić, i to pod swoim adresem, a nie dla całej Polski. Miasto dostaje narzędzie na danych, które już publikuje, bez kont i bez sklepu z aplikacjami. Następne kroki: z wojewodą mazowieckim, właścicielem syren analogowych, sprawdzić ich zasilanie, porównać model ze zgłoszeniami z 19115 z ćwiczeń Syrena-26 i wpiąć tryb kryzysowy w aplikację, której warszawiacy używają na co dzień.

---

## 4:40–5:00 · Działa, gdy wszystko pada

**Na ekranie:** czarne tło jak na pierwszym slajdzie. Trzy linijki: „Czasy są niepewne.” → „Warszawa może dać spokój.” → „Działa, gdy wszystko pada.” Na dole małe linki: aplikacja, wersja offline, repozytorium.

**Mówimy:**

> Czasy są niepewne. Warszawa może dać mieszkańcom spokój. Taki, który działa, gdy wszystko pada. Dziękujemy.

---

## Zależności demo

Stan na 17.10 ok. 21:00: ekran z kartami (V4) jest na `main` i na produkcji. Kroki 1–5 przeszliśmy na produkcji z linkiem demo (zrzuty w `zrzuty.md`). Kafelki warstw z pustą mapą na starcie (P4, #27) weszły na `main` po zrobieniu zrzutów, więc na próbie sprawdzamy start jeszcze raz.

| Krok demo | Funkcja | Zadanie w PLAN-v3.md | Jeśli nie zdąży |
|---|---|---|---|
| 0:55 Syreny | mapa z przełącznikiem w prezentacji, liczby z `WYNIKI.md` | L4 (to zadanie), dane w repo | gotowe, zależy tylko od prezentacji |
| 1:40 Siatka | siatka zadań i danych w prezentacji | O4-P | statyczny obraz siatki |
| 1. Start: lokalizacja | „Użyj mojej lokalizacji”, `?lokalizacja=lat,lon` | V2 | zapisany adres Kasi zamiast lokalizacji |
| 1. Start: połączenie | „Sprawdzam połączenie…”, automatyczne pobranie paczki | V3 | pomijamy to zdanie, mówimy od razu o kartach |
| 2. Syreny | karta Syreny i okręgi na mapie | S1, S2 | sama karta z tekstem, bez okręgów |
| 3. Miejsce schronienia | karta, trasa piesza, przycisk PSP | P2, L1 (proxy tras), V5 (`trasa()`) | karta bez trasy, trasa jako linia prosta |
| 4. Pozostałe karty | Pomoc medyczna, Powietrze i wiatr, Dotarcie do bliskich | P3, L2, S3 | pokazujemy tylko karty, które są gotowe (bez atrap „Karta w budowie.”) |
| 5. Brak sieci | tryb offline, trasa „zapisana w telefonie” | V3, V5 | `?offline=1`, potem nagranie wideo |
| Telefon w prezentacji | aplikacja w iframe | wdrożenie na Workerze (jest) | zrzuty ekranu zamiast iframe |

Ryzyko techniczne iframe: przeglądarka trzyma pamięć strony w ramce osobno od zwykłej karty. Rozwiązanie w prezentacji: przed pitchem otwieramy ją z `?edycja=1` i w telefonie na slajdzie zapisujemy adresy Kasi oraz pobieramy paczkę (instrukcja w `prezentacja/README.md`). Podawanie prezentacji z adresu aplikacji (`/pitch/`) nie jest potrzebne.

Karta Syreny dla Grochowskiej 200 mówi: „Jesteś w zasięgu syreny (75 dB i więcej). Jeśli zabraknie prądu (70–75 dB, szacunek), nadal powinna być słyszalna na zewnątrz.” Najbliższe miejsce schronienia według PSP jest w tym samym budynku (70 m), więc trasa na mapie jest krótka.

**Znany błąd paczki offline (zgłoszony do O1).** Przy pierwszym wejściu `adresy.json` (pierwszy plik paczki, 5,4 MB) pobiera się, zanim service worker przejmie stronę, i nie trafia do zapisu. Bez sieci karta Syreny pokazuje wtedy „dane o syrenach nie są zapisane w telefonie”. Obejście: po pobraniu paczki odświeżyć aplikację raz z siecią (także w telefonie na slajdzie). Po drugim wejściu wszystkie karty działają bez sieci.

## Przygotowanie przed wejściem na scenę

- [ ] Prezentacja otwarta na pełnym ekranie, telefon na slajdzie załadowany z linkiem `?lokalizacja=52.2457,21.0874`, paczka pobrana.
- [ ] W „Adresy” wpisane dom (ul. Powstańców Śląskich 10) i praca (rondo Daszyńskiego 1). Bez domu przycisk „Zapisz” jest nieaktywny, a bez tych adresów karta Dotarcie do bliskich jest szara.
- [ ] Po pobraniu paczki aplikacja odświeżona raz z siecią (obejście błędu paczki, sekcja „Zależności demo”). Sprawdzić: po wyłączeniu sieci karta Syreny jest zielona, nie szara.
- [ ] Próba na sucho: przełącznik „wyłącz prąd” na mapie, cały przepływ w telefonie (lokalizacja, karty, trasa), wyłączenie sieci i odświeżenie.
- [ ] Zapas: druga karta z `?offline=1` (po wcześniejszym przejściu online), nagranie demo na pulpicie.
- [ ] Wyłączone powiadomienia systemowe i komunikatory.

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
