# Handoff: Warszawa w trybie kryzysowym

Kontekst do dalszej pracy: plan budowy, specyfikacja, prezentacja i narracja. Stan na koniec etapu koncepcji. Kod jeszcze nie powstał.

Szczegóły i źródła są w folderze `kontekst/`, mapa plików na końcu.

---

## 1. Hackathon: to, co nas wiąże

Warsaw Open Data Hackathon, 42 Warsaw. Regulamin: `kontekst/regulamin.txt`.

- **Ścieżka:** **wyzwanie 3 („Warszawa: Twój ruch!”, dowolna forma)**. Decyzja zespołu z 17.10, 16:25.
- **Warunek oceny (§4 ust. 9):** co najmniej jeden zbiór otwartych danych m.st. Warszawy z dane.um.warszawa.pl lub z miejskiego API. Mamy ich z zapasem.
- **Wszystko powstaje w trakcie wydarzenia (§4 ust. 3).** Wolno używać darmowych bibliotek open source z licencją dopuszczającą użycie komercyjne.
- **AI dozwolone (§4 ust. 4):** zakres użycia trzeba opisać w dokumentacji.
- **Do oddania przed końcem etapu II, czyli 24 godzin pracy (§4 ust. 5–6):** prezentacja (pitch deck), link do repozytorium, dokumentacja (wykorzystane dane miejskie, założenia, frameworki i narzędzia). Po końcu etapu II nie wolno nic zmieniać (§5A ust. 6).
- **Prezentacja:** do 5 minut plus do 2 minut na pytania jury. Według strony wydarzenia praca kończy się w niedzielę o 11:00, prezentacje są w godzinach 11:30–13:30.
- **Ocena (§5A ust. 11–12):** każdy juror daje 1–5 punktów w każdym kryterium. Wynik to średnia ważona:

| Kryterium | Waga |
|---|---|
| Innowacyjność i pomysłowość | 25% |
| Wykorzystanie i związek z otwartymi danymi Warszawy | 20% |
| Praktyczne zastosowanie i potencjał wdrożeniowy | 20% |
| Jakość prezentacji | 20% |
| Związek z wyzwaniami i realiami Warszawy | 15% |

- **Licencje:** materiały opisujące rozwiązanie każdy zespół licencjonuje organizatorowi i miastu, bez kodu (§3 ust. 16). Nagrodzone rozwiązania wraz z kodem na 10 lat, potem bezterminowo (§7).
- **Jury:** strategia miasta (dr Paulina Nowicka-Karpińska), Wydział Zarządzania Danymi UM (Monika Rogowska), Ministerstwo Cyfryzacji (Karol Wilczyński), Play (Michał Ziółkowski), Bielik.AI (Sonia Staniek), Artur Kurasiński, dwie osoby z 42 Warsaw.

---

## 2. Decyzje zespołu

**Wybrany kierunek:** obronność i odporność cywilna. Rozwiązanie **tylko dla osób prywatnych** (mieszkańców).

**Wymagania zespołu:** innowacyjne (nie podobne do istniejących narzędzi), realne do wdrożenia, rozwiązujące konkretny problem, działające offline.

**Odrzucone lub odłożone:**
- Kolejna mapa schronów: gdziesieukryc.pl już istnieje.
- „Tryb awaryjny dla bloku” i „Od drzwi do drzwi”: zespół odrzucił.
- **Konsola dla miasta** (wykrywanie ciszy czujników, autobusy zastępcze, punkty pomocy): odłożona, bo rozmywała wizję. Opis zostaje jako kierunek rozwoju w `kontekst/mozliwosci-i-customer-journeys.md`.
- „Zanim zgłosisz” (budżet obywatelski): oficjalny serwis bo.um.warszawa.pl ma już wyszukiwarkę, filtry i mapę. Analiza w `kontekst/zanim-zglosisz/`.
- Narracja oparta na lukach w danych miasta: zespół jej nie chce.

---

## 3. Koncepcja

**Jedno zdanie:** Warszawa w trybie kryzysowym. Aplikacja dla mieszkańców, która działa także bez sieci, zbudowana na otwartych danych Warszawy i PSP oraz na doświadczeniach Kijowa.

**Problem:** w czasie ataku i blackoutu znikają prąd, sieć komórkowa, alarmy i mapy. Mieszkańcy nie wiedzą, czy usłyszą alarm, jak dotrzeć do bliskich bez tramwaju i metra ani gdzie jest najbliższa pomoc.

**Na jakie pytania odpowiadamy:**

| Tryb offline (zawsze działa) | Tryb online (gdy jest sieć) |
|---|---|
| Czy usłyszę alarm pod moim adresem, także przy blackoucie? Co zrobić, jeśli nie? | Czy dym idzie w moją stronę? |
| Gdzie najbliższe miejsce schronienia, AED, apteka, SOR, toaleta? | Co naprawdę jeździ w mojej okolicy? |
| Jak dotrę do dziecka lub do domu, gdy stoją tramwaje i metro? | Gdzie są wolne rowery i co jest zamknięte? |

Bez sieci aplikacja pokazuje ostatni zapisany stan z godziną („stan na 14:02”). Mieszkaniec nigdy nie zostaje z pustym ekranem.

**Dla kogo:** rodzice, opiekunowie seniorów, osoby w drodze, osoby nieznające polskiego, młodzi bez zapasów. Pełne segmenty i 31 zadań JTBD: `kontekst/jtbd-kryzys-warszawa.md`.

**Persona przewodnia:** Kasia, 34 lata.
- Mieszka na Bemowie w 10-piętrowym bloku.
- Pracuje przy rondzie Daszyńskiego, dojeżdża tramwajem i metrem.
- Syn chodzi do przedszkola na Bemowie, mama (72 lata) mieszka sama na Grochowie.
- Poradnik bezpieczeństwa dostała, ale leży w szufladzie.

**Customer journey:**
1. **Przed kryzysem (online, raz):**
   - instaluje aplikację (PWA) i wpisuje adresy: dom, praca, przedszkole, mama;
   - pobiera paczkę offline (dane i mapa, około 30–60 MB);
   - dostaje wynik: „syrenę u Ciebie słychać słabo albo nie usłyszysz jej przy blackoucie”, z krokami: włącz Alert RCB i RSO, ustal z sąsiadem, kto kogo budzi, wydrukuj kartę.
2. **Alarm, 0–15 min (offline):** najbliższe miejsca schronienia i wejścia do metra, trasa piesza, przycisk „Otwórz w aplikacji PSP” w miejscu, w którym jest.
3. **Uderzenie, 15–60 min:** online widzi kierunek wiatru, strefę dymu i utrudnienia na trasie. Offline ma najbliższe AED i SOR.
4. **Powrót, 1–6 h:** offline dostaje trasę w scenariuszu blackoutu (autobusy, pieszo, rower). Online widzi, co faktycznie jeździ („tramwaje w Twojej okolicy nie kursują od 14:10”) i gdzie są wolne rowery.
5. **Blackout, 1–3 dni (offline):** toalety, apteki, AED, SOR.

Diagram całości: `kontekst/architektura-diagram.md`.

---

## 4. Innowacyjność

Przegląd konkurencji: Ukraina, Izrael, kraje nordyckie i bałtyckie, Niemcy, Szwajcaria, Tajwan, Japonia, Polska, platformy komercyjne. Szczegóły w `kontekst/rozwiazanie-podsumowanie.md`, sekcja 8.

- **Powszechne, więc samo w sobie nie jest nowością:** alerty, mapy schronów (często offline), AED w aplikacji, poradniki. Najbliżej nas jest Kyiv Digital razem z Diią.
- **Czego nie znaleźliśmy nigdzie:**
  1. **Słyszalność syreny pod konkretnym adresem dla mieszkańca.** Są tylko płatne narzędzia GIS dla planistów. Warszawa podczas ćwiczeń Syrena-26 zbierała zgłoszenia o słyszalności ręcznie przez 19115.
  2. **Zasięg syren przy blackoucie.**
  3. **Scenariusze komunikacji przy blackoucie, offline.** Kijów przeżył to w styczniu 2026 (stanęły tramwaje i trolejbusy), ale tylko w komunikatach.
- **Nowe jest połączenie** tych trzech elementów z paczką offline i warstwą na żywo w jednej aplikacji.

---

## 5. Dowód z danych: syreny przy blackoucie

Analiza: `dane/soia-warszawa/analiza/` (skrypt `syreny_blackout.py`, mapa PNG, tabele CSV, GeoJSON).

- **Wszystkie syreny:** 92,5% ze 126 923 punktów adresowych Warszawy jest w zasięgu co najmniej 65 dB(A).
- **Tylko syreny cyfrowe:** 69,1%. Zasięg traci 29 676 adresów. Założenie: syreny analogowe nie działają bez prądu, do weryfikacji.
- **Największe spadki:** Żoliborz −57 pp, Praga-Północ −54, Wola −52, Praga-Południe −50, Bielany −41, Mokotów −41.
- **W Warszawie jest 451 syren:** 235 analogowych, 216 cyfrowych. Właściciele: wojewoda 234, Prezydent Miasta 197.
- **Zastrzeżenia, które trzeba mówić wprost:**
  - model dotyczy dźwięku na zewnątrz, nie w mieszkaniu;
  - punkt adresowy to nie liczba mieszkańców;
  - nie wiemy, które syreny analogowe mają zasilanie awaryjne.

---

## 6. Dane

**Portal dane.um.warszawa.pl (klucz API):** 9 koniecznych zbiorów, 1 do ustalenia, 2 dodatkowe.

| Zbiór | Do czego | Priorytet |
|---|---|---|
| Lokalizacja defibrylatorów (AED) | paczka offline | konieczny |
| Toalety | paczka offline (blackout) | konieczny |
| Lokalizacja pojazdów komunikacji miejskiej | co jeździ w okolicy | konieczny |
| Lokalizacja przystanków | trasy, scenariusze | konieczny |
| Linie dostępne na przystanku | tramwaj czy autobus w scenariuszach | konieczny |
| Odjazdy linii z przystanku | rozkład w scenariuszach | konieczny |
| Utrudnienia w ruchu drogowym | zamknięte drogi | konieczny |
| Pogoda (stacje ZOM, z wiatrem) | kierunek dymu | konieczny |
| Monitoring jakości powietrza | dym (PM2.5, PM10, NO2, CO) | konieczny |
| Pojazdy transportu publicznego | rodzaj trakcji | do ustalenia |
| Wolne miejsca parkingowe | parkingi wielopoziomowe jako miejsca ukrycia | przydatny |
| Otwarte boiska | miejsca spotkań w planie rodzinnym | opcjonalny |

**WFS m.st. Warszawy (bez klucza, `wfs.um.warszawa.pl/serwis`, WFS 1.0/1.1, GML):** APTEKI, METRO_WEJSCIA, PUNKTY_ADRESOWE_WGS84 (126 923 adresy, wyszukiwanie bez GPS), ULICE_WGS84, GRANICE_DZIELNIC, STACJE_ROWEROWE, TRASY_ROWEROWE, DOMY_POMOCY_SPOLECZNEJ, KLUBY_SENIORA, PLACE_SKWERY_WGS84, BIBLIOTEKI.

**PSP:**
- **Syreny SOIA:** Zenodo 21921103, licencja CC BY 4.0. Wycinek dla Warszawy jest w `dane/soia-warszawa/` razem z README i wymaganą atrybucją.
- **Punkty schronienia z gdziesieukryc.pl:** zespół deklaruje zgodę PSP. Eksport odłożony, instrukcja w `kontekst/TODO-schrony-eksport.md`. W rejonie Warszawy jest 8006 punktów (6982 na żądanie, 890 w określonych godzinach, 134 całodobowe), bez pojemności, bo dane są zanonimizowane ustawowo. Aplikacja PSP przyjmuje w linku współrzędne: `gdziesieukryc.pl/?lat=…&lng=…`.

**Zewnętrzne otwarte:**
- Ewidencja SOR (RPRM, CC BY 4.0) i Rejestr Aptek (CC BY 4.0), obie z dane.gov.pl;
- GIOŚ: 10 stacji jakości powietrza w Warszawie;
- Veturilo GBFS: 349 stacji, bez klucza;
- GTFS z mkuran.pl: rozkłady razem z metrem i SKM, źródło nieoficjalne;
- OpenStreetMap: sieć dróg i mapa.

**Pułapki API portalu:**
- zapytania idą przez POST z nagłówkiem `Authorization: <klucz>`;
- bez klucza API zwraca błąd 500, co łatwo wziąć za awarię;
- dokumentacja pól jest w plikach `_pa.json` i `_pw.json`;
- pozycje ZTM obejmują tylko autobusy (`typ` 1) i tramwaje (`typ` 2), metra tam nie ma;
- w sobotę w południe było około 1028 pojazdów jednocześnie, sygnał świeży (mediana 7 s).

**Klucz API:** jeszcze go nie mamy. Ktoś z zespołu musi go wygenerować na dane.um.warszawa.pl/pl/key-api i wpisać do `.env` jako `WARSAW_API_TOKEN`. Nie wklejać go do czatu.

---

## 7. Technika: propozycja wyjściowa

- **Aplikacja:** PWA w przeglądarce telefonu, bez instalacji ze sklepu. Wcześniejsze plany zakładały Next.js i TypeScript. Stos do potwierdzenia w planie budowy.
- **Mapa:** MapLibre GL JS i jeden plik `warszawa.pmtiles` wycięty z Protomaps (zmierzone: około 27 MB do zoomu 14, około 60 MB do zoomu 15; licencja ODbL, bez klucza). Ten sam plik działa online i offline.

```
pmtiles extract https://build.protomaps.com/20261017.pmtiles warszawa.pmtiles --bbox=20.85,52.09,21.28,52.37 --maxzoom=15
```

- **Mapa miasta jako opcja w trybie online:** WMTS urzędu (`mapa.um.warszawa.pl/mapviewer/wmts`, warstwa `AA_SPATIAL_ST_MAPA`).
- **Nie używać do offline kafli z tile.openstreetmap.org.** Polityka OSM tego zabrania.
- **Przechowywanie offline:**
  - paczka w pamięci przeglądarki (OPFS) i wywołanie `navigator.storage.persist()`;
  - fonty i ikony mapy trzymane lokalnie;
  - na iOS zachęta „Dodaj do ekranu głównego”, bo inaczej Safari usuwa dane po 7 dniach.
- **Obliczenia z góry, w paczce:**
  - zasięg syreny dla każdego adresu, w wariancie normalnym i przy blackoucie;
  - najbliższe punkty dla adresów;
  - scenariusze transportu.

  Telefon tylko odczytuje gotowe wyniki.
- **Na żywo:** proxy na serwerze trzyma klucz API (nigdy w kodzie frontendu) i agreguje pozycje ZTM, utrudnienia, pogodę, powietrze i Veturilo.

---

## 8. Ryzyka i zasady

- **Fałszywe poczucie bezpieczeństwa.** NIK krytykował to przy danych PSP. Nie nazywać miejsc „schronami”, mówić „miejsca schronienia według PSP”. Zawsze pokazywać źródło i datę danych.
- **Aplikacja nie ogłasza alarmów.** To rola RCB, RSO i syren. My pomagamy upewnić się, że alarm do kogoś dotrze.
- **Nie pokazywać miejsc uderzeń na żywo.** Pomogłoby to przeciwnikowi ocenić skutki ataku. Poradnik też zakazuje publikowania zdjęć ważnych obiektów.
- **Syreny przy blackoucie to założenie.** Na pitchu mówić „jeśli”, nie „na pewno”.
- **Dym:** stacji pomiarowych jest mało, a to nie jest model rozprzestrzeniania skażeń.
- **Atrybucje i licencje:**
  - SOIA: KG PSP, dane w wersji 2026.05;
  - OSM i Protomaps: ODbL;
  - portal miasta: CC BY;
  - PSP gdziesieukryc: zgoda zespołu.

---

## 9. Narracja: materiał do pitchu

- **Otwarcie od Kijowa.** Kiedy pada prąd, padają sieć komórkowa, alarmy i mapy. Mapa punktów niezłomności nie działała bez internetu, ludziom radzono spisać adresy na kartce. Przy blackoucie w styczniu 2026 stanęły tramwaje i trolejbusy.
- **Warszawa ma mniejsze metro niż Kijów,** a krytycy wskazują, że tunele są płytkie. Tramwaje, tak jak metro, bez prądu stoją.
- **Liczba, która robi wrażenie:** jeśli syreny analogowe nie działają bez prądu, zasięg syren spada z 92,5% do 69,1% adresów, a w centralnych dzielnicach o około połowę.
- **Rządowy poradnik bezpieczeństwa jest ogólnopolski i papierowy.** W sprawach lokalnych odsyła do gminy. My dajemy jego lokalną, warszawską warstwę pod konkretny adres.
- **Warszawa w październiku zbierała zgłoszenia o słyszalności syren ręcznie przez 19115.** Nasz model pokazuje to dla każdego adresu od razu.
- **Moment demo:** włączamy tryb samolotowy na żywo, a aplikacja dalej działa.
- **Proponowany szkielet 5 minut:** problem (Kijów) → Kasia i jej trzy pytania → demo offline → dowód z danych (syreny) → dane miasta i PSP → wdrożenie i następne kroki.

---

## 10. Otwarte sprawy (kolejność do ustalenia w planie)

1. Klucz API portalu i pierwsze prawdziwe zapytania (pola, liczby stacji pogody i powietrza).
2. Eksport punktów schronienia PSP (`kontekst/TODO-schrony-eksport.md`).
3. Weryfikacja: które syreny analogowe mają zasilanie awaryjne (pytanie do mentorów, Stołeczne Centrum Bezpieczeństwa lub PSP).
4. Scenariusze transportu: źródło rozkładu (portal czy GTFS), sposób liczenia tras, zakres demo.
5. Wycięcie mapy Warszawy (PMTiles) i test rozmiaru paczki offline na telefonie.
6. ~~Potwierdzenie ścieżki wyzwania~~: zespół startuje w wyzwaniu 3.
7. Plan budowy, specyfikacja, podział ról, prezentacja, dokumentacja z opisem użycia AI.

---

## 11. Mapa plików

| Plik | Zawartość |
|---|---|
| `kontekst/rozwiazanie-podsumowanie.md` | pełne podsumowanie koncepcji (dane, mapa, schrony, konkurencja) |
| `kontekst/architektura-diagram.md` | diagram (Mermaid), wersja tylko dla mieszkańców |
| `kontekst/jtbd-kryzys-warszawa.md` | 12 segmentów, 31 zadań JTBD godzina po godzinie, inwentarz danych |
| `kontekst/mozliwosci-i-customer-journeys.md` | klocki, syreny S1–S4, opcje produktu, odłożona konsola |
| `kontekst/research-kijow.md` | problemy mieszkańców Kijowa, ze źródłami |
| `kontekst/research-defense-dane.md` | poradnik bezpieczeństwa, pola API, precedensy |
| `kontekst/koncepcja-oskara-dane-i-persona.md` | pierwsza koncepcja zespołu a dane |
| `kontekst/TODO-schrony-eksport.md` | odłożony eksport punktów schronienia PSP |
| `kontekst/dane-warszawa.md`, `kontekst/regulamin.txt` | rozpoznanie hackathonu i regulamin |
| `kontekst/dokumentacja-api/`, `kontekst/katalogi/` | opisy pól API portalu (`_pa.json`, `_pw.json`) i katalogi zbiorów |
| `docs/AI_USAGE.md` | rejestr użycia AI (regulamin, §4 ust. 4) |
| `dane/soia-warszawa/` | wycinek SOIA dla Warszawy, README z licencją, analiza syren przy blackoucie |
