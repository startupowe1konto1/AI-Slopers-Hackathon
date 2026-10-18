# Pytania jury: 8 odpowiedzi do ćwiczenia

Na pytania mamy 2 minuty, więc każda odpowiedź mieści się w 30 sekundach (do około 65 słów). Zaczynamy od odpowiedzi, potem jeden dowód. Pod każdą odpowiedzią są fakty w zanadrzu na dopytanie, ze źródłem w repo.

Zasady jak w pitchu: mówimy „miejsca schronienia według PSP”, nigdy „schrony”. Przy syrenach zawsze „model dźwięku na zewnątrz” i „jeśli syreny analogowe nie mają zasilania awaryjnego”.

Oznaczenie ⚠️ znaczy, że odpowiedź opiera się na czymś, co trzeba potwierdzić albo czego jeszcze nie ma na `main`. Przed próbą P7 sprawdzamy te miejsca jeszcze raz.

| # | Pytanie | Kto odpowiada |
|---|---|---|
| 1 | Licencje i dane PSP | **DO USTALENIA** |
| 2 | Skąd założenie, że syreny analogowe padną przy blackoucie? | **DO USTALENIA** |
| 3 | Kto i jak to wdroży? | **DO USTALENIA** |
| 4 | Ile kosztuje utrzymanie? | **DO USTALENIA** |
| 5 | Dlaczego nie gdziesieukryc.pl? | **DO USTALENIA** |
| 6 | Na ile dokładny jest model syren? | **DO USTALENIA** |
| 7 | Co z prywatnością adresów? | **DO USTALENIA** |
| 8 | Co z ludźmi bez smartfona? | **DO USTALENIA** |

---

## 1. Czy możecie legalnie używać tych danych? Także miejsc schronienia PSP?

> Tak. Dane miasta są na licencji CC BY, a model syren SOIA od Komendy Głównej PSP na CC BY 4.0 z Zenodo. Mapa to OpenStreetMap na ODbL. Każde źródło podpisujemy w aplikacji. Miejsca schronienia to informacja sektora publicznego, którą PSP publikuje w gdziesieukryc.pl. Ustawa o otwartych danych (art. 14) pozwala ją ponownie wykorzystywać bez osobnej zgody, jeśli urząd nie postawił warunków. Podajemy źródło i datę, a przycisk otwiera oficjalną aplikację PSP w tym samym miejscu. Biblioteki to open source z licencjami, które pozwalają na użycie komercyjne.

**Fakty w zanadrzu:**
- SOIA: KG PSP, wersja danych 2026.05, Zenodo 10.5281/zenodo.21921103, CC BY 4.0. Wymagane oznaczenie jest w `dane/soia-warszawa/README.md`.
- Biblioteki i ich licencje: MIT, BSD-3-Clause, ISC, Apache-2.0. Lista jest w `docs/DOKUMENTACJA.md`, sekcja 3.
- Przycisk PSP prowadzi pod `gdziesieukryc.pl/?lat=…&lng=…`, czyli kieruje ludzi do oficjalnego źródła.
- Miejsca schronienia PSP: art. 14 ust. 1 ustawy z 11 sierpnia 2021 r. o otwartych danych i ponownym wykorzystywaniu informacji sektora publicznego (bezwarunkowo, chyba że podmiot określi warunki; dla tych danych warunków nie znaleźliśmy). Szczegóły: `docs/DOKUMENTACJA.md`, sekcja 1.2.

---

## 2. Skąd założenie, że przy blackoucie działają tylko syreny cyfrowe?

> To założenie, ale oparte na dokumentach. 233 z 235 syren analogowych w Warszawie należy do wojewody, a w jego przetargu to syreny wirnikowe na silnikach 4–7,5 kW, bez słowa o zasilaniu rezerwowym. Cyfrowe mają akumulatory. Nie wiemy, czy któraś analogowa ma agregat, dlatego mówimy „jeśli”. Gdyby nie miały, głośnej syreny (75 dB i więcej) ubyłoby z 48,3% do 36,6% adresów. Pierwszy krok to potwierdzić to u wojewody.

**Fakty w zanadrzu:**
- 451 syren: 235 analogowych, 216 cyfrowych. Właściciele: wojewoda 234, Prezydent Miasta 197, KW PSP 18, OSP 2 (`dane/soia-warszawa/tabele/syreny_inwentaryzacja_warszawa.csv`).
- Liczby z `pipeline/syreny/WYNIKI.md`. Wszystkie syreny: 92,5% adresów ≥ 65 dB i 48,3% adresów ≥ 75 dB. Jeśli zabraknie prądu (przybliżenie): 91,5% i 36,6%. Zasięg 65 dB traci 1 230 adresów (wrażliwość ±1 dB: 697–1 928), więc mówimy „ok. tysiąca”, rząd wielkości.
- Najgorszy wariant (dolne oszacowanie: tylko strefy, gdzie SOIA pokazuje syrenę cyfrową): 69,1% adresów w zasięgu 65 dB, zasięg traci 29 676 ze 126 923 adresów. Jest skrajny, bo tam, gdzie SOIA pokazuje syrenę analogową, zakłada, że nie ma żadnej syreny. Nie jest naszą główną liczbą.
- Dlaczego przybliżenie: SOIA dzieli miasto według syreny dominującej, czyli najgłośniejszej. Tam, gdzie dominuje analogowa, nie podaje poziomu syreny cyfrowej. Przybliżenie szacuje poziom najgłośniejszej syreny cyfrowej z odległości i mocy (`pipeline/syreny/przyblizenie.py`).
- Największy spadek adresów ≥ 75 dB: Praga-Południe 81,7% → 45,2% (−36,5 pp), Praga-Północ 85,5% → 52,6% (−32,9), Żoliborz 93,0% → 64,0% (−29,0), Wola 88,2% → 60,4% (−27,8) (`WYNIKI.md`, tabela „Dzielnice”).
- Właściciele a rodzaj (z inwentaryzacji): wojewoda ma 233 syreny analogowe i 1 cyfrową, OSP 2 analogowe, a wszystkie 197 syren Prezydenta Miasta i 18 syren KW PSP to cyfrowe. Pytanie o zasilanie syren analogowych idzie więc do wojewody (Mazowiecki Urząd Wojewódzki), nie do miasta.
- Syreny wojewody: opis przedmiotu zamówienia z czerwca 2024, „Przegląd techniczny 235 oraz modernizacja 40 syren alarmowych… na terenie m. st. Warszawy”. Punkt alarmowy to „syrena wirnikowa napędzana silnikiem elektrycznym 3-fazowym o mocy 4–7,5 kW”, skrzynka ze stycznikiem i sterowanie radiowe. O zasilaniu rezerwowym dokument nie mówi nic ([bip.mazowieckie.pl](https://bip.mazowieckie.pl/attachments/download/44393)).
- Nowa syrena elektroniczna dla Warszawy (wojewoda, lipiec 2022): zasilanie 230 V i „zasilanie rezerwowe… na bazie akumulatorów” AGM, co najmniej 10 trzyminutowych alarmów w ciągu 48 godzin od zaniku prądu, zgłaszanie zaniku zasilania do centrali ([bip.mazowieckie.pl](https://bip.mazowieckie.pl/attachments/download/33459)).
- Program KG PSP w KPO wymienia w Polsce syreny analogowe na cyfrowe. Specyfikacja wymaga dwóch akumulatorów 12 V AGM po co najmniej 30 Ah i co najmniej 10 dni czuwania ([dokument przetargowy, gov.pl](https://www.gov.pl/attachment/9c13ea6f-5e72-416c-a007-e7bb54237ca8)).
- Uwaga na długi blackout: akumulatory syren cyfrowych też się kiedyś kończą (wymóg z 2022 r. to 48 godzin alarmów). Nasz wariant blackout dotyczy pierwszych godzin i dni.
- W inwentaryzacji SOIA nie ma pola o zasilaniu awaryjnym. Sama PSP pisze, że przed zakupem syren trzeba potwierdzić m.in. zasilanie, a wyłączenie energii to utrata kanału ostrzegania (repozytorium KGPSP/soia-analiza-zasiegu).
- Szczegóły i metoda: `dane/soia-warszawa/zasilanie-syren.md`.
- Kiedy dostaniemy listę syren analogowych z zasilaniem awaryjnym, przeliczamy wariant blackout skryptami z `pipeline/syreny/` i `dane/soia-warszawa/analiza/syreny_blackout.py`.

---

## 3. Kto i jak miałby to wdrożyć?

> Najprościej jako tryb kryzysowy w aplikacji, której warszawiacy już używają na co dzień, na przykład w Warszawie 19115. Kijów zrobił tak z Kyiv Digital, bo aplikacji kryzysowej nikt nie instaluje przed kryzysem. Gospodarzem byłoby miasto, czyli zarządzanie kryzysowe, a PSP dostarcza dane o syrenach i miejscach schronienia. Technicznie nic nie trzeba budować od nowa: to strona internetowa na danych, które miasto już publikuje.

**Fakty w zanadrzu:**
- To strona internetowa (PWA): bez sklepu z aplikacjami, bez kont i bez instalacji.
- Dane statyczne odświeża jeden zestaw skryptów, dane na żywo idą przez API portalu dane.um.warszawa.pl.
- Lekcja z Kijowa (`kontekst/research-kijow.md`, sekcja 7): miejska aplikacja transportowa, którą ludzie mieli w telefonach, w kryzysie stała się narzędziem ratunkowym.
- W czasie ćwiczeń Syrena-26 mieszkańcy zgłaszali przez 19115, czy słyszą syreny ⚠️ (źródło do potwierdzenia, `docs/pitch/scenariusz.md`). Nasz model daje odpowiedź dla każdego adresu od razu.

---

## 4. Ile kosztuje utrzymanie?

> Bardzo mało. Dziś aplikacja działa na darmowym planie Cloudflare. Paczka z danymi to pliki statyczne, a mapa Warszawy waży 12 MB, więc serwer tylko je wysyła. Jedyny element na żywo to mały serwer pośredniczący, który trzyma klucz do API miasta. Utrzymanie to głównie regularne odświeżanie paczki danych i pilnowanie, czy źródła miasta odpowiadają.

**Fakty w zanadrzu:**
- Hosting: Cloudflare Worker ze statycznymi plikami, darmowy plan (`docs/SPEC.md`, sekcja 3).
- Mapa: jeden plik `warszawa.pmtiles`, 12 MB, zoom do 13. Bez opłat za kafle i bez klucza do map.
- Wyniki dla adresów są liczone z góry. Telefon tylko je czyta, więc serwer nie liczy niczego dla każdego użytkownika.
- Nie podajemy kwot dla skali całego miasta, bo ich nie liczyliśmy.

---

## 5. Dlaczego nie wystarczy gdziesieukryc.pl?

> Nie konkurujemy z gdziesieukryc.pl, tylko do niego odsyłamy. Przycisk w aplikacji otwiera aplikację PSP dokładnie w miejscu, w którym jest użytkownik. Dodajemy to, czego tam nie ma: czy usłyszysz syrenę pod swoim adresem, także przy blackoucie, jak dotrzesz do bliskich pieszo albo rowerem, jeśli zabraknie prądu, a tramwaje i metro stoją, oraz AED, apteki, SOR i toalety w jednym miejscu. Wszystko dla twoich adresów i bez sieci.

**Fakty w zanadrzu:**
- Odrzuciliśmy pomysł kolejnej mapy miejsc schronienia właśnie dlatego, że gdziesieukryc.pl już istnieje (HANDOFF §2).
- Słyszalności syreny pod adresem dla mieszkańca nie znaleźliśmy w żadnym przeglądanym rozwiązaniu, ani w Polsce, ani w Ukrainie, Izraelu czy krajach nordyckich (HANDOFF §4).
- W rejonie Warszawy PSP ma 8006 miejsc schronienia. Dane nie podają pojemności, bo są zanonimizowane z mocy ustawy (HANDOFF §6).

---

## 6. Na ile dokładny jest model syren?

> To model Komendy Głównej PSP, nie nasz. Liczy, gdzie dźwięk syreny przekracza na zewnątrz 65 decybeli. Nie mówi, czy usłyszysz ją w mieszkaniu przy zamkniętych oknach. Wariant blackoutu to nasze przybliżenie, dopasowane do tego modelu, więc podajemy je jako rząd wielkości. Liczymy punkty adresowe, nie mieszkańców. Model porównamy ze zgłoszeniami mieszkańców z ćwiczeń.

**Fakty w zanadrzu:**
- SOIA modeluje zasięgi 65, 70 i 75 dB(A). Rastry w wycinku mają komórki 100 m (`dane/soia-warszawa/README.md`).
- Według SOIA przy wszystkich syrenach co najmniej 65 dB(A) ma 96,8% mieszkańców Warszawy (GUS NSP 2021). Nasze 92,5% to adresy, nie mieszkańcy. Tych liczb nie mieszamy.
- Klasy ryzyka w SOIA dotyczą ostrzegania przed powodzią. Nie używamy ich.
- Model nie uwzględnia zasilania awaryjnego syren analogowych. Patrz pytanie 2.
- Przybliżenie blackoutu (`WYNIKI.md`): zgadza się z SOIA co do progu 65 dB na 95,6% adresów, a co do klasy głośności na 76,3%. Błąd na progu 65 dB (około 4% adresów) jest większy niż różnica między wszystkimi syrenami a samymi cyfrowymi, dlatego liczbę adresów tracących zasięg traktujemy jako rząd wielkości.
- Przybliżenie pomija syreny cyfrowe z gmin sąsiednich (inwentaryzacja nie ma ich współrzędnych), więc przy granicach miasta może zaniżać zasięg.

---

## 7. Co z prywatnością? Wpisuję tam adres domu i przedszkola dziecka.

> Adresy zostają w telefonie. Nie ma kont ani logowania. Adres wyszukujemy w telefonie, w paczce 126 923 punktów adresowych. Lokalizację z GPS bierzemy tylko wtedy, gdy sam klikniesz „Użyj mojej lokalizacji”, i zostaje w telefonie. Jedyny wyjątek to trasa po chodnikach: do jej policzenia współrzędne początku i celu oraz sposób poruszania się (pieszo albo rower) idą przez nasz serwer do publicznego serwera tras OSRM, na danych OpenStreetMap. Bez konta i bez żadnego identyfikatora użytkownika. Zapisane trasy są potem w telefonie, więc offline nic nie wychodzi.

**Fakty w zanadrzu:**
- Zapisane miejsca: IndexedDB w przeglądarce (`src/app/miejsca.ts`).
- Dane na żywo (wiatr, powietrze i inne): telefon pyta `/api/live/<źródło>` bez żadnych parametrów, a filtruje w przeglądarce (`src/offline/live-cache.ts`; w v3 widać to w karcie „Powietrze i wiatr”, zadanie L2, `src/modules/live/wskazowki.ts`, jeszcze niescalone na `main`).
- Trasy (`server/live/trasa.ts`, PR #24; `HANDOFF-v3.md` §5): `GET /api/live/trasa?od=lon,lat&do=lon,lat&profil=pieszo|rower` niesie tylko współrzędne początku i celu oraz profil. Idzie przez naszego Workera do publicznego serwera OSRM `routing.openstreetmap.de` (FOSSGIS), z ogólnym User-Agent projektu. Nie ma kont ani identyfikatorów użytkownika, a klucz API miasta w ogóle nie bierze w tym udziału. Lokalizacja z GPS zostaje w przeglądarce, poza tym, że może być punktem startu trasy. Odpowiedź trafia do cache Workera na 24 h.
- Lokalizacja z przeglądarki (V2): zgoda użytkownika w oknie przeglądarki, potem najbliższy punkt adresowy z paczki, liczony w telefonie. Na demo jest też `?lokalizacja=lat,lon`.
- Klucz API miasta jest tylko na serwerze, nigdy w przeglądarce.
- ⚠️ Wyszukiwanie adresów offline (moduł `adresy`, O2) nie jest jeszcze na `main`. Przed pitchem sprawdzić, że działa bez zapytań do sieci.

---

## 8. Co z ludźmi bez smartfona, na przykład seniorami?

> Dla nich jest karta do wydruku ⚠️. Kasia drukuje ją dla mamy z Grochowa: adres, czy słychać tam syrenę, najbliższe miejsca schronienia według PSP i co zrobić. Karta działa bez prądu i bez telefonu. Do tego jeden z kroków to umówić się z sąsiadem, kto kogo budzi. Nie zastępujemy syren, radia ani Alertu RCB. Pomagamy upewnić się, że alarm dotrze do każdego.

**Fakty w zanadrzu:**
- ⚠️ Karta do wydruku jest w module syren na `main` (`KartaDoDruku` w `src/modules/syreny/Karta.tsx`). W v3 ma być akcją karty Syreny (zadanie S1, `HANDOFF-v3.md` §7). Przed pitchem sprawdzić na próbie, że przycisk „Drukuj” jest osiągalny z karty Syreny na ekranie „Twoja sytuacja”. Jeśli nie, mówimy: „Karta do wydruku jest następna w planie”.
- Seniorzy to w analizie JTBD osobna grupa (M2): windy stają, schody są barierą, a smartfona częściej brak (`kontekst/jtbd-kryzys-warszawa.md`).
- Aplikacja nie ogłasza alarmów. To rola RCB, RSO i syren (SPEC, sekcja 7).

---

## Pytania zapasowe

Krótkie odpowiedzi, gdyby jury zapytało o coś spoza listy.

- **Czy to nie daje fałszywego poczucia bezpieczeństwa?** Nie nazywamy niczego „schronem”, przy każdym punkcie pokazujemy źródło i datę, a wynik syreny ma zastrzeżenie o modelu i blackoucie. Pokazujemy też, czego dane nie wiedzą (szare zadania na siatce).
- **Dym: skąd wiecie, gdzie leci?** Nie wiemy i tak to mówimy. Aplikacja pokazuje stożek w kierunku wiatru z najbliższej stacji i pomiar PM2.5 i PM10. W aplikacji jest dopisek: „To kierunek wiatru, nie model rozprzestrzeniania się dymu”.
- **Co działa na żywo?** Wiatr i pomiary PM2.5 i PM10 (karta Powietrze i wiatr), stacje Veturilo z rowerami (karta Dotarcie do bliskich) i trasy po ulicach z OSRM. Bez sieci aplikacja pokazuje ostatni stan z godziną, a zapisane trasy są w telefonie. Pozycje autobusów i utrudnienia mamy w kodzie, ale w tej wersji ich nie pokazujemy.
- **Dlaczego nie aplikacja ze sklepu?** Strona otwiera się od razu z linku, bez instalacji i bez konta. Na iOS warto ją dodać do ekranu głównego, bo inaczej Safari po 7 dniach usuwa dane offline.
