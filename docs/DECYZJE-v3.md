# Decyzje v3 (odpowiedzi z góry dla pętli autopilota)

Przyjęte przez O1 17.10 ok. 20:15: wszędzie odpowiedź rekomendowana. Pętla czyta ten plik przed każdym zadaniem i nie pyta ludzi. Zmiana decyzji = PR do tego pliku. Numery linii dotyczą [PLAN-v3.md](PLAN-v3.md).

## Wspólne

- **W1. Pliki spoza gita.** Po `git worktree add` pętla robi symlinki z głównego katalogu, ale tylko dla zadań, które ich potrzebują: `.env` dla V3 i L2 (sprawdzają API miasta w `npm run dev`) i `dane/psp-schronienia` dla P1. Nic z tego nie trafia do commita: `.gitignore` ma wpis `dane/psp-schronienia` bez ukośnika (z ukośnikiem nie łapie symlinku), a subagent dodaje pliki jawnie i nigdy nie robi `git add -A`. Agent nigdy nie czyta ani nie wypisuje `.env` ani `apiKey.txt`. Przed zadaniem z `pipeline/` pętla sprawdza `uv --version` (na maszynie O1 `uv` leży w `~/Library/Python/3.9/bin`). Na macOS 13 `uv sync --project pipeline` może się nie udać przez `pyproj`. Skrypty używające samej biblioteki standardowej uruchamiasz wtedy przez `uv run --no-project --python 3.12 --with pytest <polecenie>` zamiast `uv run --project pipeline <polecenie>` (np. `… pytest pipeline/punkty`); skrypty z `pyproj` tak nie ruszą. Bez klucza karta Powietrze jest szara i jest to poprawny wynik.
- **W2. Kiedy scalać.** Warunki są zapisane tylko w [AUTOPILOT-v3.md](AUTOPILOT-v3.md), krok 3 (m.in. `ci` zielone na bieżącym HEAD, zatwierdzenie dla tego HEAD, base `main`, zadania z `po` zrobione, nigdy `--admin`). Tu tylko to, czego tam nie ma:
  - Własny PR rebase'ujemy dopiero przy konflikcie, a nie dlatego, że jest `BEHIND`. Po rebase ponownie `typecheck`, `test`, `build` (oraz komendy pipeline z zadania). Cudzego PR nie rebase'ujemy.
  - Czerwony `Workers Builds` na gałęzi PR pomijamy, podgląd Cloudflare nie jest wymagany.
  - PR oparty na gałęzi innego PR (np. na P2): po scaleniu bazy (squash) dostaje `gh pr edit <n> --base main` i `git rebase --onto origin/main origin/<stara-baza>`, potem `git push --force-with-lease` (robi to autor albo przejmujący). Gdy gałęzi bazy już nie ma, weź jej ostatni commit z `gh pr view <nr-bazy> --json headRefOid`.
- **W3. P4 po V4.** P4 usuwa punkty z obecnego ekranu, więc scala się dopiero po V4 (w `zadania-v3.json` P4 ma `po: V4`). V4 scala się bez P4.
- **W4. Wspólne pliki.**
  - `public/pack/manifest.json` nigdy nie scalamy ręcznie. Po konflikcie w trakcie rebase: `git checkout origin/main -- public/pack/manifest.json`, `uv run --project pipeline python pipeline/build_manifest.py`, `uv run --project pipeline python pipeline/validate.py`, `git add public/pack/manifest.json`, `git rebase --continue`.
  - W `index.tsx` modułów zostają obie zmiany.
  - W `docs/pitch/zrzuty.md` tylko dopisujemy linie na końcu.
- **W5. Kanał zespołu = GitHub.** Błąd e2e, pominięta atrapa i blokada dla człowieka to `gh issue create --title "<ID>: …"` z jednym zdaniem „co zrobić” plus komentarz w PR. Po otwarciu issue pętla przechodzi do następnego zadania.
- **W6. Usługi zewnętrzne.**
  - Danych nie zastępujemy ani nie wymyślamy.
  - Overpass: 3 próby na głównym serwerze, potem jedna próba na `overpass.kumi.systems`, potem zadanie czeka na człowieka.
  - OSRM przy 429 albo 5xx: linia prosta, bez dodatkowych ponowień i bez innego serwera w kodzie.
  - API miasta bez klucza albo z błędem: karta `brak` z nazwą źródła.
- **W7. Tytuły PR.** Tytuł zaczyna się od ID z `zadania-v3.json` (`V2b: …`, `L4b: …`). `[kontrakt]` mają tylko zmiany poza własnym folderem, których nie ma w „Pliki” zadania. V2a scala O1 z dopiskiem „FYI O2”.
- **W8. Czas i priorytety.**
  - Godzina zawsze z `TZ=Europe/Warsaw date`. Progi to chwile, nie godziny z zegara: 21:15 = 2026-10-17T21:15+02:00, 22:30 = 2026-10-17T22:30+02:00, 24:00 = 2026-10-18T00:00+02:00.
  - Do 24:00 zadania ruszają w kolejności ważności z linii 59, w ID z `zadania-v3.json`: S1, P2, V4, V5a, V5b, L1, potem P1, P3, potem L2, potem S3, L3, potem P4, na końcu S2a, S2b. Zadania spoza tej listy (V1, V2a, V2b, V3, L4a, L4b) ruszają, gdy są `gotowe`.
  - V6 rusza, gdy zadania z jego `po` (V4, V5b) są zrobione i jest 22:30 albo później, albo wcześniej, gdy zrobione są też wszystkie zadania z pola `miekkie` (S1, P2, P3, L2, S3). Testy kart, które są jeszcze atrapami, e2e pomija, a dla właściciela każdej atrapy powstaje issue.
  - Po 00:00 nie startujemy zadań funkcjonalnych. Kończymy PR-y z zielonym `ci`, resztę zostawiamy jako wersje robocze (draft) z issue. V6 i L4b mogą ruszyć po 00:00.
- **W9. Demo z czystą paczką.** Przed próbą 23:30 i przed pitchem przeglądarka na czystym profilu (albo „Wyczyść dane witryny”). L4b dopisuje to do scenariusza.

## O1

- **O1-1. V4 a `App.tsx`.** Agent V4 nie wkleja całego pliku z planu. Zachowuje zmiany z V2b i V3 na `main` i wypisuje je w opisie PR.
- **O1-2. GPS.** Agent testuje `?lokalizacja=lat,lon` i atrapę `navigator.geolocation`. Prawdziwy GPS sprawdza człowiek na telefonie na `workers.dev` przed 23:30. Demo opiera się na `?lokalizacja=`.
- **O1-3. E2e tylko na maszynie O1,** jeden bieg naraz.
  - Pętla `wszyscy` uruchamia je co najwyżej raz na godzinę (godzina ostatniego biegu jest w lokalnym dzienniku), tylko gdy port 4174 jest wolny (`lsof -i :4174 -sTCP:LISTEN`).
  - Subagenci V3, V4 i V6 uruchamiają je tylko przy wolnym porcie 4174. Gdy jest zajęty, czekają raz 60 sekund, a potem pomijają e2e i piszą o tym w opisie PR. Agenci O2–O4 e2e nie uruchamiają.
  - Czerwone e2e na `main` to issue „e2e czerwone na main”. Zamykamy je, gdy kolejny bieg jest zielony.
  - Do czasu V4 czerwone e2e nie blokuje scalania. Po V4 wstrzymuje scalanie PR-ów UI (`src/app`, `src/map`, `src/modules`) do naprawy; PR z poprawką i PR-y tylko z docs albo pipeline scalamy dalej.
- **O1-4. Stan API w `vite preview`.** Kod z planu zostaje bez zmian. E2e nie sprawdza stanu API, a w opisie PR V3 trzeba zaznaczyć, że w podglądzie `api` jest zawsze prawdą.

## O2

- **O2-1.** Dopisek o modelu i blackoucie zostaje w `szczegoly` karty Syreny, nazwa modelu w `zrodlo`. Przypiętych tekstów testu nie zmieniamy.
- **O2-2.** Okręgi i wynik SOIA mogą się różnić. Wystarcza `DOPISEK_OKREGOW`, a w opisie PR S2b trzeba zapisać ostrzeżenie dla prezentera.
- **O2-3.** S2b, S3, P4 (poza W3), L2 i L3 nie czekają na V4 z ręczną kontrolą. Po scaleniu V4 zrzut ekranu przez Playwright, a przy błędzie PR z poprawką.

## O3

- **O3-1. P1 wymaga sieci z dostępem do Overpass i katalogu `dane/psp-schronienia/`.** Pipeline uruchamia się lokalnie:
  - `uv run --project pipeline python pipeline/punkty/pobierz.py osm-przychodnie`
  - `uv run --project pipeline python pipeline/punkty/build.py`
  - `uv run --project pipeline python pipeline/build_manifest.py`
  - `uv run --project pipeline python pipeline/validate.py`

  Commit obejmuje `dane/probki/osm-przychodnie.json` i `public/pack/*`. Przy awarii Overpass działamy według W6 (3 próby na głównym serwerze, jedna na `overpass.kumi.systems`, potem człowiek). Nie obniżamy progu testu ani nie usuwamy źródła PSP, żeby test przeszedł.
- **O3-2. Próg przychodni.** Przy wyniku od 800 do 900 próg w teście spada do 800 z komentarzem o prawdziwym wyniku. Przy wyniku poniżej 800 progu nie zmieniamy: sprawdzamy zapytanie i zgłaszamy issue.
- **O3-3.** Godziny z OSM (`opening_hours`) zostają w surowej postaci. Tłumaczenie skrótów najwcześniej po 24:00.
- **O3-4.** Włączony kafelek bez paczki nic nie pokazuje. W v3 to akceptujemy.

## O4

- **O4-1. L1 po wdrożeniu: zrobione.** Sprawdzone 17.10 o 20:27: `https://warszawa-kryzys.startupaplikujmy.workers.dev/api/live/trasa?od=21.0122,52.2297&do=21.018,52.231&profil=pieszo` odpowiada 200, a nagłówek pokazuje `cf-cache-status: HIT`. Pętla tego nie powtarza.
- **O4-2. L4.** L4a to PR #29 (scalony). L4b to osobny PR po V4: próba, zrzuty, poprawki scenariusza. Przyjmujemy cztery dzielnice z `WYNIKI.md`. Zmianę liczb w `HANDOFF.md` O1 zatwierdził i wprowadził razem z tym plikiem. Prezentacja do oddania to HTML z repo.
- **O4-3.** „Widzę dym” zostaje jak w planie. Ścieżkę z kliknięciem mapy człowiek sprawdza ręcznie po V4.
