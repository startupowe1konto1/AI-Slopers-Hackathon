# Scenariusz pitchu: 5 minut

**Teza pitchu:** Warszawa w trybie kryzysowym odpowiada mieszkańcowi pod jego adresem na trzy pytania: czy usłyszy alarm, gdzie jest najbliższa pomoc i jak dotrze do bliskich. Działa także bez sieci i stoi na danych, które miasto i PSP już publikują.

Jury ma to usłyszeć w 45. sekundzie, na końcu otwarcia. Reszta pitchu to dowody.

| SCQA | Treść |
|---|---|
| Sytuacja | Warszawa ma syreny, miejsca schronienia według PSP i rządowy poradnik. |
| Komplikacja | Przy ataku i blackoucie znika prąd, a z nim sieć komórkowa, alarmy w telefonie i mapy. Jeśli syreny analogowe nie mają zasilania awaryjnego, prawie co czwarty adres w Warszawie traci zasięg syren. |
| Pytanie | Skąd mieszkanka zawczasu wie, czy usłyszy alarm, gdzie szukać pomocy i jak dotrzeć do bliskich, gdy nie ma sieci? |
| Odpowiedź | Aplikacja, która odpowiada na te trzy pytania pod jej adresami i działa offline. |

Stan: wersja robocza P1 (sobota, 17.10). Po P4 (21:00, przejście na działającej stronie) poprawiamy czasy i teksty demo.

---

## Pitch w skrócie

Same nagłówki czytane po kolei dają cały wywód.

| Czas | Sek. | Odcinek: co jury ma zapamiętać | Kryterium oceny |
|---|---|---|---|
| 0:00–0:45 | 45 | Kiedy w Kijowie pada prąd, znikają alarmy, mapy i tramwaje | związek z realiami Warszawy (15%) |
| 0:45–1:30 | 45 | Kasia ma trzy pytania, na które nikt nie odpowiada pod jej adresem | praktyczne zastosowanie (20%) |
| 1:30–3:00 | 90 | Aplikacja odpowiada na wszystkie trzy, także po wyłączeniu Wi-Fi | innowacyjność (25%), praktyczne zastosowanie |
| 3:00–3:45 | 45 | Jeśli syreny analogowe staną bez prądu, prawie co czwarty adres traci zasięg | innowacyjność, otwarte dane (20%) |
| 3:45–4:20 | 35 | Wszystko stoi na danych, które miasto i PSP już publikują | otwarte dane Warszawy (20%) |
| 4:20–5:00 | 40 | Miasto może to wdrożyć na danych, które już publikuje, a „jeśli” zamienić w pewność | potencjał wdrożeniowy (20%) |

Prezenter: **DO USTALENIA**. Druga osoba obsługuje laptop w czasie demo.

Tempo: około 130 słów na minutę. Tekst ma około 630 słów, czyli mieści się w 5 minutach bez zapasu. Jeśli próba (P7) wyjdzie za długa, tniemy w tej kolejności: drugi krok wdrożenia (19115), lista dzielnic do dwóch (Żoliborz i Wola), zdanie o mapie punktów w Kijowie.

Oznaczenie ⚠️ przy odcinku znaczy, że pokazujemy funkcję, której jeszcze nie ma na `main`. Szczegóły w sekcji „Zależności demo”.

---

## 0:00–0:45 · Kiedy w Kijowie pada prąd, znikają alarmy, mapy i tramwaje

**Na ekranie:** ciemny slajd, jeden napis: „Kijów, styczeń 2026. Bez prądu, bez sieci, bez mapy.” Bez zdjęć zniszczeń i ważnych obiektów (poradnik zakazuje ich publikowania).

**Mówimy:**

> Kijów, styczeń 2026. Rosja uderza w sieć energetyczną i duża część miasta zostaje bez prądu. Z prądem znika zasięg komórkowy, a z nim alarmy w telefonie i mapy. Mapa punktów, gdzie można się ogrzać i naładować telefon, bez internetu nie działała. Władze radziły spisać adresy na kartce. Tramwaje i trolejbusy stanęły.
>
> Warszawa ma syreny i miejsca schronienia według PSP. Ale część syren potrzebuje prądu, a mapy w telefonie potrzebują sieci.
>
> Dlatego zbudowaliśmy Warszawę w trybie kryzysowym. To aplikacja, która pod twoim adresem mówi, czy usłyszysz alarm, gdzie jest najbliższa pomoc i jak dotrzesz do bliskich. Także wtedy, gdy nie ma sieci.

---

## 0:45–1:30 · Kasia ma trzy pytania, na które nikt nie odpowiada pod jej adresem

**Na ekranie:** slajd z Kasią. Szkic mapy Warszawy z czterema punktami: dom (Bemowo), przedszkole syna (Bemowo), praca (rondo Daszyńskiego), mama (Grochów). Pod spodem trzy pytania, które prezenter czyta.

**Mówimy:**

> To jest Kasia. Ma 34 lata i mieszka na Bemowie, w dziesięciopiętrowym bloku. Pracuje przy rondzie Daszyńskiego, dojeżdża tramwajem i metrem. Syn chodzi do przedszkola na Bemowie, a mama, 72 lata, mieszka sama na Grochowie. Poradnik bezpieczeństwa Kasia dostała. Leży w szufladzie, bo mówi o całej Polsce, a w sprawach lokalnych odsyła do gminy.
>
> Kasia ma trzy pytania. Czy usłyszę alarm w domu, także kiedy nie będzie prądu? Gdzie jest najbliższe miejsce schronienia, apteka albo SOR? I jak dotrę do syna i do mamy, kiedy stoją tramwaje i metro?
>
> Pokażemy odpowiedzi na żywo.

---

## 1:30–3:00 · Aplikacja odpowiada na wszystkie trzy, także po wyłączeniu Wi-Fi

**Na ekranie:** przeglądarka na laptopie w widoku telefonu (DevTools, tryb urządzenia). Cztery adresy Kasi są zapisane przed wejściem na scenę, paczka offline pobrana. Onboardingu nie pokazujemy, bo zjada czas.

Adresy demo (sprawdzone w `dane/soia-warszawa/analiza/syreny_blackout_utracony_zasieg.geojson`: każdy dziś jest w zasięgu, przy blackoucie traci zasięg):

| Rola | Adres | Dzielnica |
|---|---|---|
| dom | ul. Lazurowa 71 | Bemowo |
| praca | Rondo I. Daszyńskiego 2 | Wola |
| bliska osoba (mama) | ul. Grochowska 327 | Praga-Południe (Grochów) |
| przedszkole | **DO USTALENIA**: prawdziwe przedszkole na Bemowie, blisko domu | Bemowo |

Wynik w aplikacji sprawdzić po scaleniu O2-B2 i O2-A2: karta ma pokazać „Normalnie: słychać” i „Przy blackoucie: możesz nie usłyszeć”.

### 1:30–1:45 (15 s) · Na żywo: co jeździ wokół pracy ⚠️

**Na ekranie:** panel „Na żywo” dla pracy: liczba autobusów i tramwajów w promieniu 1 km, linie, strzałka wiatru, „Stan na HH:MM”.

> Kasia raz, przy sieci, wpisała cztery adresy i pobrała paczkę offline. Teraz jest w pracy. Wokół ronda Daszyńskiego jeździ [liczba z ekranu] autobusów i [liczba z ekranu] tramwajów, a wiatr wieje [kierunek z ekranu]. To dane miasta na żywo.

### 1:45–2:05 (20 s) · Pytanie 1: czy usłyszę alarm ⚠️

**Na ekranie:** karta „Syreny” dla domu: dwa wiersze „Normalnie” i „Przy blackoucie”, pod spodem kroki i dopisek o modelu.

> Pierwsze pytanie: alarm. Dziś syrenę pod domem Kasi słychać. Przy blackoucie może jej nie usłyszeć, jeśli syreny analogowe nie mają zasilania awaryjnego. To model dźwięku na zewnątrz. Co zrobić? Włączyć Alert RCB, zainstalować RSO, umówić się z sąsiadem, kto kogo budzi.

### 2:05–2:25 (20 s) · Pytanie 2: gdzie jest pomoc ⚠️

**Na ekranie:** mapa i lista „Najbliższe” dla domu: miejsca schronienia według PSP, wejścia do metra, AED, apteki, SOR, toalety. Każdy punkt ze źródłem i datą. Klik w „Otwórz w aplikacji PSP”, a potem powrót do karty.

> Drugie pytanie: pomoc. Tu są najbliższe miejsca schronienia według PSP, wejścia do metra, defibrylatory, apteki, SOR i toalety. Przy każdym punkcie jest źródło i data danych. Jednym przyciskiem otwieramy oficjalną aplikację PSP w tym samym miejscu.

### 2:25–2:40 (15 s) · Pytanie 3: jak dotrę do bliskich ⚠️

**Na ekranie:** panel „Dojazd”, karta praca → przedszkole: pieszo i rowerem w minutach, autobusy z najbliższego przystanku.

> Trzecie pytanie: dojazd. Z pracy do przedszkola Kasia idzie pieszo [liczba z ekranu] minut. Przy blackoucie tramwaje i metro stoją, więc pokazujemy autobusy z najbliższego przystanku, które dojeżdżają w pobliże przedszkola.

### 2:40–3:00 (20 s) · Wyłączamy Wi-Fi ⚠️

**Na ekranie:** wyłączenie Wi-Fi w laptopie (widać ikonę), odświeżenie strony. Strona się ładuje, karta syren i punkty są na miejscu, panel „Na żywo” pokazuje „Brak sieci. Ostatni stan z HH:MM.”

> A teraz wyłączam Wi-Fi i odświeżam stronę. Działa dalej. Wynik syreny, punkty pomocy i dojazd są zapisane w telefonie. Dane na żywo pokazują ostatni stan i godzinę. Kasia nie zostaje z pustym ekranem.

**Plan B, gdy Wi-Fi na sali nie działa od początku:** zaczynamy od linku `?offline=1` i mówimy „Na sali nie ma sieci, więc od razu pokazujemy tryb offline”. Odcinek „Na żywo” pomijamy, a 15 sekund oddajemy syrenom. Gdy laptop nie działa: nagranie wideo demo (P6).

---

## 3:00–3:45 · Jeśli syreny analogowe staną bez prądu, prawie co czwarty adres traci zasięg

**Na ekranie:** `dane/soia-warszawa/analiza/syreny_blackout_mapa.png` (dwie mapy: wszystkie syreny i tylko cyfrowe). Obok duże liczby „92,5% → 69,1%” i cztery dzielnice z największym spadkiem. Pod spodem drobnym drukiem: „Model dźwięku na zewnątrz. Wariant blackout zakłada, że działają tylko syreny cyfrowe. Dane: KG PSP, SOIA 2026.05.”

Opcja na później: zamiast PNG warstwa „utracony zasięg przy blackoucie” w aplikacji (O2-C2) ⚠️.

**Mówimy:**

> Skąd to wiemy? Z otwartych danych Państwowej Straży Pożarnej. W Warszawie jest 451 syren: 235 analogowych i 216 cyfrowych. Model SOIA pokazuje, gdzie ich dźwięk przekracza na zewnątrz 65 decybeli. Sprawdziliśmy to dla każdego z prawie 127 tysięcy adresów.
>
> Dziś w zasięgu jest 92,5% adresów. Jeśli syreny analogowe nie mają zasilania awaryjnego, przy blackoucie zostaje 69,1%. Zasięg traci prawie 30 tysięcy adresów, najwięcej w centrum. Żoliborz traci 57 punktów procentowych, Praga-Północ 54, Wola 52, Praga-Południe 50. Dom Kasi, jej praca i mieszkanie mamy są w tej strefie.
>
> Mówimy „jeśli”, bo nie wiemy, które syreny analogowe mają zasilanie awaryjne.

**Zdanie zapasowe**, gdy jest czas: „Na Woli jest ulica Syreny. Przy blackoucie żaden z jej 36 adresów nie byłby w zasięgu syren.”

---

## 3:45–4:20 · Wszystko stoi na danych, które miasto i PSP już publikują

**Na ekranie:** slajd ze źródłami w trzech kolumnach: dane.um.warszawa.pl i WFS miasta, PSP, inne (dane.gov.pl, OpenStreetMap). Pod spodem prosty schemat: dane → paczka offline w telefonie; API miasta → nasz serwer → telefon.

**Mówimy:**

> Wszystko to stoi na otwartych danych. Z portalu Warszawy bierzemy defibrylatory, toalety, pozycje autobusów i tramwajów, pogodę z wiatrem, jakość powietrza i utrudnienia w ruchu. Z miejskiego WFS apteki, wejścia do metra i prawie 127 tysięcy punktów adresowych, więc adres znajdziesz bez GPS. Od PSP mamy model syren i miejsca schronienia. Wyniki dla każdego adresu liczymy z góry, więc telefon tylko je odczytuje i nie potrzebuje sieci. Klucz do API miasta zostaje na naszym serwerze.

⚠️ O miejscach schronienia mówimy „za zgodą PSP” tylko wtedy, gdy zgoda jest potwierdzona na piśmie (mail). Do tego czasu: „od PSP”.

---

## 4:20–5:00 · Miasto może to wdrożyć na danych, które już publikuje, a „jeśli” zamienić w pewność

**Na ekranie:** trzy następne kroki, potem slajd końcowy z trzema linkami: pełna wersja, wersja `?offline=1`, repozytorium.

**Mówimy:**

> To zwykła strona internetowa, bez sklepu z aplikacjami i bez kont. Adresy zostają w telefonie.
>
> Co dalej? Po pierwsze: z PSP i Stołecznym Centrum Bezpieczeństwa sprawdzić, które syreny analogowe mają zasilanie awaryjne. Wtedy zamiast „jeśli” powiemy Kasi, jak jest. Po drugie: porównać model ze zgłoszeniami, które Warszawa zbierała przez 19115 w czasie ćwiczeń Syrena-26. Po trzecie: wpiąć tryb kryzysowy w aplikację, której warszawiacy używają na co dzień. Tak zrobił Kijów, bo aplikacji kryzysowej nikt nie instaluje przed kryzysem.
>
> Kasia nie musi szukać poradnika w szufladzie. Ma odpowiedź pod swoim adresem, także bez sieci. Dziękujemy.

---

## Zależności demo

Stan na 17.10, około 15:30: na `main` jest tylko szkielet O1-A1. Każdy odcinek demo zależy od pracy innych pasów. Na przejściu P4 (21:00) odhaczamy, co działa, i skracamy scenariusz o resztę.

| Odcinek | Funkcja | Zadanie w PLAN.md | Jeśli nie zdąży |
|---|---|---|---|
| całe demo | wdrożona strona i dwa linki | T0 (projekt Cloudflare), O1-A1 | demo z `npm run dev` na laptopie |
| całe demo | zapisane 4 adresy Kasi, wyszukiwanie offline | O1-A1 (onboarding), O2-B1, O2-A1 | adresy z 20 adresów testowych szkieletu |
| 1:30 Na żywo | pozycje pojazdów i wiatr przez proxy | O4-B1, O4-A1, klucz `WARSAW_API_TOKEN` w Cloudflare | pomijamy, 15 s oddajemy syrenom |
| 1:45 Syreny | klasa syreny dla adresu, kroki, dopisek | O2-B2, O2-A2 | slajd z mapą z analizy (`syreny_blackout_mapa.png`) |
| 2:05 Pomoc | 6 rodzajów punktów, lista, przycisk PSP | O3-B1, O3-A1, eksport PSP (`kontekst/TODO-schrony-eksport.md`) | punkty bez miejsc schronienia, tylko przycisk PSP |
| 2:25 Dojazd | czas pieszo i rowerem, autobusy | O2-C1 (pas C, najbardziej zagrożony) | pomijamy, mówimy jedno zdanie o scenariuszach transportu |
| 2:40 Wi-Fi | działanie po odświeżeniu bez sieci, „stan na …” | O1-B1 (decyzja o mapie offline o 16:30), `src/offline/live-cache.ts` | plan B z SPEC §12: offline bez mapy wektorowej, same listy |
| 3:00 Syreny | warstwa utraconego zasięgu w aplikacji | O2-C2 (opcjonalne) | PNG z analizy |
| pytania jury | karta do wydruku | O2-C2 | pokazujemy kroki z karty syren |

## Przygotowanie przed wejściem na scenę

- [ ] Strona otwarta na pełnej wersji, widok telefonu, powiększenie czytelne z sali.
- [ ] Cztery adresy Kasi zapisane, paczka offline pobrana (sprawdzić w DevTools: Application → Storage).
- [ ] Próba na sucho tuż przed pitchem: wyłączyć Wi-Fi, odświeżyć, włączyć z powrotem.
- [ ] Link `?offline=1` w drugiej karcie, nagranie demo na pulpicie.
- [ ] Wyłączone powiadomienia systemowe i komunikatory.

## Liczby w pitchu i skąd je mamy

Sprawdzone 17.10 na plikach w repo, nie przepisane z HANDOFF.

| Liczba w pitchu | Dokładna wartość | Źródło |
|---|---|---|
| 92,5% adresów w zasięgu | 92,5 | `dane/soia-warszawa/analiza/syreny_blackout_podsumowanie.csv` |
| 69,1% przy blackoucie | 69,1 | jw. |
| prawie 30 tysięcy adresów traci zasięg | 29 676 | jw. |
| prawie co czwarty adres | 29 676 / 126 923 = 23,4% | jw. |
| prawie 127 tysięcy adresów | 126 923 (suma dzielnic w CSV się zgadza) | jw. i `syreny_blackout_dzielnice.csv` |
| Żoliborz −57, Praga-Północ −54, Wola −52, Praga-Południe −50 pp | 57,2 / 53,9 / 51,8 / 50,3 | `syreny_blackout_dzielnice.csv` |
| Bemowo (dom Kasi) | 93,0% → 55,1%, −37,9 pp | jw. |
| 451 syren: 235 analogowych, 216 cyfrowych | 451 / 235 / 216 | `dane/soia-warszawa/tabele/syreny_inwentaryzacja_warszawa.csv` |
| ul. Syreny: 36 z 36 adresów traci zasięg | 36 / 36 | geojson utraconego zasięgu × punkty adresowe |

Uwagi:
- Właściciele syren: wojewoda 234, Prezydent Miasta 197, KW PSP 18, OSP 2. HANDOFF podaje tylko dwie pierwsze grupy.
- Nie mieszać liczb: 92,5% to **adresy** w naszej analizie, a 96,8% w README SOIA to **mieszkańcy** (GUS NSP 2021) i dotyczy wszystkich syren, nie blackoutu.
- Analiza liczy lokalizacje syren z modelu zasięgu: 221 analogowych i 223 cyfrowe. Inwentaryzacja liczy syreny: 235 i 216. Na pitchu podajemy liczby z inwentaryzacji.

## Fakty do potwierdzenia przed P5

W repo nie ma linku do źródła tych trzech stwierdzeń:

- [ ] Kijów, styczeń 2026: stanęły tramwaje i trolejbusy (`kontekst/rozwiazanie-podsumowanie.md`, bez linku).
- [ ] Syrena-26: Warszawa zbierała zgłoszenia o słyszalności przez 19115 (jw.).
- [ ] Zgoda PSP na użycie miejsc schronienia z gdziesieukryc.pl (HANDOFF §6: „zespół deklaruje”).

## Czego nie mówimy

- „Schrony”. Zawsze „miejsca schronienia według PSP”.
- „Na pewno nie usłyszysz”. Zawsze „jeśli syreny analogowe nie mają zasilania awaryjnego” i „model dźwięku na zewnątrz”.
- Że aplikacja ogłasza alarmy. Pomaga upewnić się, że alarm dotrze.
- Że tunele metra są płytkie albo że miejsca schronienia są niebezpieczne. To nie nasza ocena, a w jury jest miasto.
- O lukach w danych miasta jako głównym wątku. Zespół tego nie chce (HANDOFF §2).
