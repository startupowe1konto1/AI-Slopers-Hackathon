# Scenariusz pitchu: 5 minut

**Teza pitchu:** Warszawa w trybie kryzysowym daje mieszkańcom spokój, który działa, gdy wszystko pada. Pod własnym adresem każdy wie, czy usłyszy alarm, gdzie jest pomoc i jak dotrze do bliskich. Aplikacja działa także bez internetu i stoi na danych, które miasto i PSP już publikują.

**Zdanie, które jury ma powtórzyć:** „Działa, gdy wszystko pada”.

| SCQA | Treść |
|---|---|
| Sytuacja | Napięcie geopolityczne rośnie. Miasto takie jak Warszawa powinno dawać mieszkańcom spokój. |
| Komplikacja | Kijów pokazał, że przy ataku najpierw pada prąd, a z nim sieć, alarmy w telefonie, mapy i tramwaje. W Warszawie przy blackoucie prawie co czwarty adres może stracić zasięg syren. |
| Pytanie | Jak dać mieszkańcowi odpowiedzi, które działają także wtedy, gdy wszystko pada? |
| Odpowiedź | Rozpisaliśmy zadania mieszkańców, połączyliśmy je z otwartymi danymi i zbudowaliśmy aplikację, która odpowiada pod adresem i działa offline. |

**Forma:** prezentacja w HTML, typograficzna i minimalistyczna, jak startupowy pitch deck. Dwa żywe elementy: przełącznik blackoutu na mapie syren i działająca aplikacja w makiecie telefonu na slajdzie. Plik: [prezentacja/index.html](prezentacja/index.html), obsługa w [prezentacja/README.md](prezentacja/README.md).

Stan: wersja 2 (sobota, 17.10, wieczór), po rozmowie z Wojciechem o wizji. Zastępuje wersję 1 z PR #2. Po P4 (przejście na działającej stronie) poprawiamy czasy i teksty demo.

---

## Pitch w skrócie

Same nagłówki czytane po kolei dają cały wywód.

| Czas | Sek. | Slajd: co jury ma zapamiętać | Kryterium oceny |
|---|---|---|---|
| 0:00–0:20 | 20 | Napięcie rośnie, a ludzie pytają: co zrobię, jeśli to się stanie tutaj? | związek z realiami Warszawy (15%) |
| 0:20–0:35 | 15 | Miasto ma dawać spokój także wtedy, gdy zawiedzie prąd i sieć | związek z realiami Warszawy |
| 0:35–0:55 | 20 | Kijów pokazał, co pada najpierw: prąd, sieć, alarmy, mapy, tramwaje | związek z realiami Warszawy |
| 0:55–1:20 | 25 | W Warszawie przy blackoucie prawie co czwarty adres może nie usłyszeć syreny | innowacyjność (25%), otwarte dane (20%) |
| 1:20–1:40 | 20 | Zaczęliśmy od zadań mieszkańców, nie od danych | innowacyjność |
| 1:40–2:05 | 25 | Każde zadanie połączyliśmy z danymi i widać, gdzie dane pomagają, a gdzie nie | otwarte dane Warszawy (20%) |
| 2:05–2:30 | 25 | Sześć funkcji w jednej stronie, a to, co da się policzyć z góry, jest w telefonie | praktyczne zastosowanie (20%) |
| 2:30–4:05 | 95 | Kasia przechodzi przez cały kryzys, a aplikacja pomaga na każdym etapie | praktyczne zastosowanie, innowacyjność |
| 4:05–4:40 | 35 | Mieszkaniec zyskuje spokój, a miasto narzędzie na danych, które już ma | potencjał wdrożeniowy (20%) |
| 4:40–5:00 | 20 | Działa, gdy wszystko pada | jakość prezentacji (20%) |

Prezenter: **DO USTALENIA**. Druga osoba klika w telefonie na slajdzie.

Tempo: około 130 słów na minutę. Tekst ma około 530 słów, czyli około 4:10 mówienia. Reszta to kliknięcia, animacje i pauzy. Jeśli próba (P7) wyjdzie za długa, tniemy w tej kolejności: zdanie o mapie punktów w Kijowie, lista grup mieszkańców (zostaje sama liczba), drugi krok wdrożenia (Syrena-26).

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

## 0:55–1:20 · W Warszawie przy blackoucie prawie co czwarty adres może nie usłyszeć syreny

**Na ekranie:** mapa Warszawy, zielony zasięg syren, duża liczba „92,5%”. Prezenter klika przełącznik „wyłącz prąd”: znika zasięg syren analogowych, liczba spada do „69,1%”, a cztery dzielnice z największym spadkiem podświetlają się. Na dole drobnym drukiem: „Model dźwięku na zewnątrz. Wariant blackout: działają tylko syreny cyfrowe. Dane: KG PSP, SOIA 2026.05.”

Dane do slajdu: `dane/soia-warszawa/analiza/syreny_zasieg_tylko_cyfrowe.geojson`, `syreny_blackout_utracony_zasieg.geojson`, `granica_warszawy.geojson`.

**Mówimy:**

> A w Warszawie? Sprawdziliśmy syreny na danych Państwowej Straży Pożarnej. Dziś w zasięgu jest 92,5% adresów. [klik: wyłącz prąd] Jeśli syreny analogowe nie mają zasilania awaryjnego, zostaje 69,1%. Prawie co czwarty adres traci zasięg, a na Żoliborzu, Woli i Pradze ponad połowa. To model dźwięku na zewnątrz, dlatego mówimy „jeśli”.

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

## 2:05–2:30 · Sześć funkcji w jednej stronie, a to, co da się policzyć z góry, jest w telefonie

**Na ekranie:** sześć kafli z jednym słowem i krótkim opisem: „Syrena pod adresem”, „Punkty pomocy”, „Dojazd przy blackoucie”, „Na żywo”, „Karta do wydruku”, „Paczka offline”. Pod spodem prosty diagram: dane → paczka w telefonie (offline); API miasta → nasz serwer → telefon (na żywo).

**Mówimy:**

> Tak powstała Warszawa w trybie kryzysowym. Sześć funkcji w jednej stronie internetowej: syrena pod twoim adresem, najbliższe punkty pomocy, dojazd, gdy stoją tramwaje i metro, dane na żywo, karta do wydruku i paczka offline. Wszystko, co da się policzyć z góry, jest w telefonie. Działa, gdy wszystko pada.

---

## 2:30–4:05 · Kasia przechodzi przez cały kryzys, a aplikacja pomaga na każdym etapie

**Na ekranie:** z lewej oś z pięcioma etapami. Przy każdym etapie trzy linijki: problem Kasi, co robi aplikacja, wartość. Z prawej makieta telefonu, a w niej działająca aplikacja (iframe z `https://warszawa-kryzys.startupaplikujmy.workers.dev/`). Kliknięcie etapu podświetla go na osi. Druga osoba przełącza moduł w telefonie (menu na dole aplikacji). Na ostatnim etapie przełącznik „wyłącz sieć” przeładowuje telefon z `?offline=1`.

Adresy Kasi zapisane w telefonie przed pitchem (każdy dziś w zasięgu syren, przy blackoucie traci zasięg; sprawdzone na `syreny_blackout_utracony_zasieg.geojson`):

| Rola | Adres | Dzielnica |
|---|---|---|
| dom | ul. Lazurowa 71 | Bemowo |
| praca | Rondo I. Daszyńskiego 2 | Wola |
| bliska osoba (mama) | ul. Grochowska 327 | Praga-Południe (Grochów) |
| przedszkole | **DO USTALENIA**: prawdziwe przedszkole na Bemowie, blisko domu | Bemowo |

| Etap | Problem | Co robi aplikacja | Wartość |
|---|---|---|---|
| Przed kryzysem | „Czy usłyszę alarm?” | wynik syreny pod adresem, kroki, karta do wydruku | wie zawczasu i ma plan na papierze |
| Alarm, 0–15 min | „Gdzie się schować?” | miejsca schronienia według PSP, wejścia do metra, przycisk PSP | nie szuka w panice |
| Uderzenie, 15–60 min | „Czy dym idzie na mnie?” | wiatr i pomiar powietrza, AED, SOR | wie, gdzie jest pomoc medyczna |
| Powrót, 1–6 h | „Jak dotrę do syna?” | autobusy z przystanku, co jeździ w okolicy | dociera do bliskich bez tramwaju i metra |
| Blackout, 1–3 dni | „Nie ma sieci” | wszystko z paczki działa, dane na żywo jako „stan na …”, toalety, apteki | nie zostaje z pustym ekranem |

**Mówimy:**

> Pokażę to na Kasi. Mieszka na Bemowie, pracuje przy rondzie Daszyńskiego, syn chodzi do przedszkola, a mama mieszka sama na Grochowie.

**Przed kryzysem (20 s)** ⚠️

> Przed kryzysem Kasia raz wpisuje cztery adresy i pobiera paczkę. Od razu widzi, że syrenę w domu słychać, ale przy blackoucie może jej nie usłyszeć. Dostaje kroki: włączyć Alert RCB, zainstalować RSO, umówić się z sąsiadem. I kartę do wydruku.

**Alarm (15 s)**

> Alarm. Kasia jest w pracy. Telefon pokazuje najbliższe miejsca schronienia według PSP i wejścia do metra, z odległością. Jednym przyciskiem otwiera oficjalną aplikację PSP.

**Uderzenie (15 s)** ⚠️

> Po uderzeniu widzi, skąd wieje wiatr i w którą stronę może iść dym, a obok pomiar powietrza. Ma pod ręką najbliższy defibrylator i SOR.

**Powrót (15 s)** ⚠️

> Kasia chce dotrzeć do syna. Tramwaje stoją, więc aplikacja pokazuje autobusy z przystanku przy pracy, które dojeżdżają w pobliże przedszkola. I to, co naprawdę jeździ teraz w okolicy.

**Blackout (20 s)**

> Wieczorem pada sieć. [klik: wyłącz sieć] Aplikacja dalej działa: syrena, punkty pomocy, dojazd. Dane na żywo pokazują ostatni stan z godziną. Toalety i apteki są na mapie.

---

## 4:05–4:40 · Mieszkaniec zyskuje spokój, a miasto narzędzie na danych, które już ma

**Na ekranie:** dwie kolumny, „Dla mieszkańca” i „Dla miasta”, po dwie linijki. Pod spodem trzy następne kroki.

**Mówimy:**

> Kasia wie zawczasu, co zrobić, i to pod swoim adresem, a nie dla całej Polski. Miasto dostaje narzędzie na danych, które już publikuje, bez kont i bez sklepu z aplikacjami. Następne kroki: z PSP i Stołecznym Centrum Bezpieczeństwa sprawdzić zasilanie syren analogowych, porównać model ze zgłoszeniami z 19115 z ćwiczeń Syrena-26 i wpiąć tryb kryzysowy w aplikację, której warszawiacy używają na co dzień.

---

## 4:40–5:00 · Działa, gdy wszystko pada

**Na ekranie:** czarne tło jak na pierwszym slajdzie. Trzy linijki: „Czasy są niepewne.” → „Warszawa może dać spokój.” → „Działa, gdy wszystko pada.” Na dole małe linki: aplikacja, wersja offline, repozytorium.

**Mówimy:**

> Czasy są niepewne. Warszawa może dać mieszkańcom spokój. Taki, który działa, gdy wszystko pada. Dziękujemy.

---

## Zależności demo

Stan na 17.10 wieczorem. Na `main` są: szkielet (O1-A1), mapa offline (O1-A2, O1-B1), proxy na żywo (O4-B1), punkty pomocy (O3-A1) i test ścieżki Kasi (O1-C1). W toku są PR-y: moduł na żywo (#5), dane punktów (#6) i poprawka proxy (#7). Na przejściu P4 odhaczamy, co działa.

| Slajd lub etap | Funkcja | Zadanie w PLAN.md | Jeśli nie zdąży |
|---|---|---|---|
| 0:55 Syreny | mapa z przełącznikiem w prezentacji | O4-P (prezentacja), dane w repo | gotowe dane, zależy tylko od prezentacji |
| 1:40 Siatka | siatka zadań i danych w prezentacji | O4-P | statyczny obraz siatki |
| 2:30 telefon | aplikacja w iframe z adresami Kasi | wdrożenie na Workerze (jest); O2-B1, O2-A1 (adresy) | zrzuty ekranu zamiast iframe |
| Przed kryzysem | wynik syreny, kroki | O2-B2, O2-A2 | zrzut karty syren z danych testowych |
| Przed kryzysem | karta do wydruku | O2-C2 (dobudowa) | pomijamy „i kartę do wydruku” |
| Alarm | miejsca schronienia według PSP, metro, przycisk PSP | O3-A1 (jest), O3-B1 (#6), eksport PSP | przycisk PSP i wejścia do metra |
| Uderzenie | wiatr | O4-B1 (jest), O4-A1 (#5) | sam wiatr bez dymu |
| Uderzenie | dym i pomiar powietrza | O4-C1 (dobudowa) | mówimy tylko o wietrze |
| Uderzenie | AED i SOR | O3-B1 (#6) | jw. |
| Powrót | autobusy z przystanku | O2-C1 | pokazujemy „co jeździ w okolicy” z modułu na żywo |
| Powrót | co jeździ w okolicy | O4-A1 (#5) | zrzut ekranu |
| Blackout | `?offline=1` w telefonie | O1 (jest) | przejście na drugą kartę z `?offline=1` |

Ryzyko techniczne iframe: przeglądarka trzyma pamięć strony w ramce osobno od zwykłej karty. Rozwiązanie w prezentacji: przed pitchem otwieramy ją z `?edycja=1` i w telefonie na slajdzie wpisujemy adresy Kasi oraz pobieramy paczkę (instrukcja w `prezentacja/README.md`). Podawanie prezentacji z adresu aplikacji (`/pitch/`) nie jest potrzebne.

Przydałby się też link otwierający aplikację na konkretnym module (np. `?panel=punkty`). Dziś aplikacja tego nie ma, więc moduły przełączamy ręcznie w menu telefonu. To prośba do O1, nie warunek demo.

## Przygotowanie przed wejściem na scenę

- [ ] Prezentacja otwarta na pełnym ekranie, telefon na slajdzie załadowany z adresami Kasi i pobraną paczką.
- [ ] Próba na sucho: przełącznik blackoutu na mapie, przełączenie modułów w telefonie, „wyłącz sieć”.
- [ ] Zapas: druga karta z `?offline=1`, nagranie demo na pulpicie.
- [ ] Wyłączone powiadomienia systemowe i komunikatory.

## Liczby w pitchu i skąd je mamy

Sprawdzone 17.10 na plikach w repo.

| Liczba w pitchu | Dokładna wartość | Źródło |
|---|---|---|
| 92,5% adresów w zasięgu | 92,5 | `dane/soia-warszawa/analiza/syreny_blackout_podsumowanie.csv` |
| 69,1% przy blackoucie | 69,1 | jw. |
| prawie co czwarty adres traci zasięg | 29 676 / 126 923 = 23,4% | jw. |
| Żoliborz, Wola, Praga: ponad połowa | spadek 57,2 / 51,8 / 53,9 (Północ) / 50,3 (Południe) pp | `syreny_blackout_dzielnice.csv` |
| 6 grup mieszkańców, 7 faz, 24 zadania | M1–M6, F0–F6, 24 z 31 zadań | `kontekst/jtbd-kryzys-warszawa.md` |
| pokrycie danymi: 3 pełne, 13 częściowe, 7 brak, 1 n/d | jw. | jw., część 6 |
| wojna od ponad czterech lat | pełnoskalowa inwazja od 24.02.2022 | wiedza ogólna |

Uwaga: „ponad połowa” dotyczy spadku w punktach procentowych. Na Żoliborzu zasięg spada ze 100% do 42,8%, na Woli z 99,9% do 48,1%, na Pradze-Północ z 99,9% do 46,0%, na Pradze-Południe z 99,7% do 49,4%. W każdej z tych dzielnic przy blackoucie poza zasięgiem jest ponad połowa adresów.

## Fakty do potwierdzenia przed oddaniem

W repo nie ma linku do źródła tych stwierdzeń:

- [ ] Kijów: stanęły tramwaje przy blackoucie w styczniu 2026 (`kontekst/rozwiazanie-podsumowanie.md`, bez linku).
- [ ] Syrena-26: Warszawa zbierała zgłoszenia o słyszalności przez 19115 (jw.).
- [ ] Zgoda PSP na użycie miejsc schronienia z gdziesieukryc.pl (HANDOFF §6: „zespół deklaruje”). Do potwierdzenia mówimy „od PSP”, nie „za zgodą PSP”.

## Czego nie mówimy

- „Schrony”. Zawsze „miejsca schronienia według PSP”.
- „Na pewno nie usłyszysz”. Zawsze „jeśli syreny analogowe nie mają zasilania awaryjnego” i „model dźwięku na zewnątrz”.
- Że aplikacja ogłasza alarmy. Pomaga upewnić się, że alarm dotrze.
- Że tunele metra są płytkie albo że miejsca schronienia są niebezpieczne.
- Konkretnych zagrożeń i scenariuszy ataku na Warszawę. O geopolityce mówimy ogólnie.
- O lukach w danych miasta jako głównym wątku. Szare węzły na siatce to uczciwość analizy, nie zarzut wobec miasta.
