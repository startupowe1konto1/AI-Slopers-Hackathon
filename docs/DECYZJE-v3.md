# Decyzje v3 (odpowiedzi z góry dla pętli autopilota)

Przyjęte przez O1 17.10 ok. 20:15: wszędzie odpowiedź rekomendowana. Pętla czyta ten plik przed każdym zadaniem i nie pyta ludzi. Zmiana decyzji = PR do tego pliku. Numery linii dotyczą [PLAN-v3.md](PLAN-v3.md).

## Wspólne

- **W1. Pliki spoza gita.** Po `git worktree add` pętla robi symlinki z głównego katalogu do `.env` i `dane/psp-schronienia/`. Nic z tego nie trafia do commita. Agent nigdy nie czyta ani nie wypisuje `.env` ani `apiKey.txt`. Przed zadaniem z `pipeline/` pętla sprawdza `uv --version` (na maszynie O1 `uv` leży w `~/Library/Python/3.9/bin`). Bez klucza karta Powietrze jest szara i jest to poprawny wynik.
- **W2. Kiedy scalać.** Wszystkie warunki naraz:
  - `ci` zielone,
  - base to `main`,
  - wszystkie zadania z `po` są zrobione.
  
  Przy własnym PR tuż przed scaleniem: `git fetch && git rebase origin/main` i ponownie `typecheck`, `test`, `build` (oraz komendy pipeline z zadania). Cudzego PR nie rebase'ujemy. Sprawdzamy `git merge-tree --write-tree origin/main origin/<gałąź>`, a po scaleniu czy `ci` na `main` jest zielone. Czerwony `Workers Builds` na gałęzi PR pomijamy, podgląd Cloudflare nie jest wymagany. Gdy PR-baza (np. P2) jest już scalona, PR na nim oparty dostaje `gh pr edit --base main` i rebase (robi to autor albo przejmujący).
- **W3. P4 po V4.** P4 usuwa punkty z obecnego ekranu, więc scala się dopiero po V4 (w `zadania-v3.json` P4 ma `po: V4`). V4 scala się bez P4.
- **W4. Wspólne pliki.**
  - `public/pack/manifest.json` nigdy nie scalamy ręcznie. Po konflikcie: `git checkout origin/main -- public/pack/manifest.json`, `build_manifest.py`, `validate.py`, commit.
  - W `index.tsx` modułów zostają obie zmiany.
  - W `docs/pitch/zrzuty.md` tylko dopisujemy linie na końcu.
- **W5. Kanał zespołu = GitHub.** Błąd e2e, pominięta atrapa i blokada dla człowieka to `gh issue create --title "<ID>: …"` z jednym zdaniem „co zrobić” plus komentarz w PR. Po otwarciu issue pętla przechodzi do następnego zadania.
- **W6. Usługi zewnętrzne.**
  - Danych nie zastępujemy ani nie wymyślamy.
  - Overpass: 3 próby, potem zadanie czeka na człowieka.
  - OSRM przy 429 albo 5xx: linia prosta, bez dodatkowych ponowień i bez innego serwera w kodzie.
  - API miasta bez klucza albo z błędem: karta `brak` z nazwą źródła.
- **W7. Tytuły PR.** Tytuł zaczyna się od ID z `zadania-v3.json` (`V2b: …`, `L4b: …`). `[kontrakt]` mają tylko zmiany poza własnym folderem, których nie ma w „Pliki” zadania. V2a scala O1 z dopiskiem „FYI O2”.
- **W8. Czas i priorytety.**
  - Godzina zawsze z `TZ=Europe/Warsaw date`.
  - Do 24:00 zadania ruszają w kolejności ważności z linii 59.
  - Po 00:00 nie startujemy zadań funkcjonalnych. Kończymy PR-y z zielonym `ci`, resztę zostawiamy jako szkice z issue. V6 i L4b mogą ruszyć po 00:00.
  - V6 rusza o 22:30 nawet przy atrapach: testy atrap się pomijają, a dla właściciela każdej atrapy powstaje issue.
- **W9. Demo z czystą paczką.** Przed próbą 23:30 i przed pitchem przeglądarka na czystym profilu (albo „Wyczyść dane witryny”). L4b dopisuje to do scenariusza.

## O1

- **O1-1. V4 a `App.tsx`.** Agent V4 nie wkleja całego pliku z planu. Zachowuje zmiany z V2b i V3 na `main` i wypisuje je w opisie PR.
- **O1-2. GPS.** Agent testuje `?lokalizacja=lat,lon` i atrapę `navigator.geolocation`. Prawdziwy GPS sprawdza człowiek na telefonie na `workers.dev` przed 23:30. Demo opiera się na `?lokalizacja=`.
- **O1-3. E2e tylko na maszynie O1,** jeden bieg naraz (przed startem sprawdzić, czy port 4174 jest wolny). Agenci O2–O4 e2e nie uruchamiają. Do czasu V4 czerwone e2e nie blokuje scalania cudzych PR-ów.
- **O1-4. Stan API w `vite preview`.** Kod z planu zostaje bez zmian. E2e nie sprawdza stanu API, a w opisie PR V3 trzeba zaznaczyć, że w podglądzie `api` jest zawsze prawdą.

## O2

- **O2-1.** Dopisek o modelu i blackoucie zostaje w `szczegoly` karty Syreny, nazwa modelu w `zrodlo`. Przypiętych tekstów testu nie zmieniamy.
- **O2-2.** Okręgi i wynik SOIA mogą się różnić. Wystarcza `DOPISEK_OKREGOW`, a w opisie PR S2b trzeba zapisać ostrzeżenie dla prezentera.
- **O2-3.** S2b, S3, P4 (poza W3), L2 i L3 nie czekają na V4 z ręczną kontrolą. Po scaleniu V4 zrzut ekranu przez Playwright, a przy błędzie PR z poprawką.

## O3

- **O3-1. P1 wymaga sieci z dostępem do Overpass i katalogu `dane/psp-schronienia/`.** Pipeline uruchamia się lokalnie: `pobierz.py osm-przychodnie`, `build.py`, `build_manifest.py`, `validate.py`. Commit obejmuje `dane/probki/osm-przychodnie.json` i `public/pack/*`. Przy awarii Overpass próbujemy innego publicznego serwera (np. overpass.kumi.systems). Nie obniżamy progu testu ani nie usuwamy źródła PSP, żeby test przeszedł.
- **O3-2. Próg przychodni.** Przy wyniku 850–900 próg spada do 800 z komentarzem w teście. Przy wyniku poniżej 800 progu nie zmieniamy: sprawdzamy zapytanie i zgłaszamy issue.
- **O3-3.** Godziny z OSM (`opening_hours`) zostają w surowej postaci. Tłumaczenie skrótów najwcześniej po 24:00.
- **O3-4.** Włączony kafelek bez paczki nic nie pokazuje. W v3 to akceptujemy.

## O4

- **O4-1. L1 po wdrożeniu.** Około 60 s po scaleniu dwa razy `curl` na `https://warszawa-kryzys.startupaplikujmy.workers.dev/api/live/trasa?od=21.0122,52.2297&do=21.018,52.231&profil=pieszo`, wynik i nagłówki w komentarzu do PR #24. Przy 502 issue. Brak cache Workera akceptujemy.
- **O4-2. L4.** L4a to PR #29 (scalony). L4b to osobny PR po V4: próba, zrzuty, poprawki scenariusza. Przyjmujemy cztery dzielnice z `WYNIKI.md`. Zmianę liczb w `HANDOFF.md` O1 zatwierdził i wprowadził razem z tym plikiem. Prezentacja do oddania to HTML z repo.
- **O4-3.** „Widzę dym” zostaje jak w planie. Ścieżkę z kliknięciem mapy człowiek sprawdza ręcznie po V4.
