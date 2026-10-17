# Autopilot v3: pasy pracują same

Cel: zadania z [PLAN-v3.md](PLAN-v3.md) ruszają, gdy ich zależności są na `main`, bez czekania na ludzi. Każdy komputer ma jedną sesję Claude Code z pętlą `/loop`, która co około 5 minut sprawdza stan na GitHubie i robi kolejny krok: startuje zadanie, recenzuje, scala. Zasady zatwierdził O1 (17.10, ok. 20:15).

Źródło prawdy to GitHub, nie pamięć sesji:
- [`docs/zadania-v3.json`](zadania-v3.json): zadania, właściciele, gałęzie i zależności (`po` blokuje start, `miekkie` tylko opóźnia V6),
- [`scripts/stan.mjs`](../scripts/stan.mjs): co jest zrobione, w toku, porzucone, gotowe do startu i na co czeka,
- [`docs/DECYZJE-v3.md`](DECYZJE-v3.md): odpowiedzi na pytania, zebrane z góry.

```bash
node scripts/stan.mjs O2
```

Stany zadania (gałąź zadania to `galaz` z JSON albo `o1/<id małymi literami>-przejete`):
- `zrobione`: PR zadania jest scalony do `main`,
- `w_toku`: jest otwarty PR (także wersja robocza) albo gałąź na `origin`, której ostatni commit ma mniej niż 45 minut,
- `porzucone`: PR zamknięto bez scalenia albo gałąź bez PR nie dostała nowego commitu od 45 minut,
- `gotowe`: zależności `po` są zrobione, a nikt zadania nie zajął,
- `czeka`: brakuje zadań z `po`.

## Dla ludzi: co zrobić raz na każdym komputerze

1. W katalogu repo: `git pull`, `npm ci`, `uv sync --project pipeline` (na macOS 13 może paść na `pyproj`, patrz DECYZJE W1), `gh auth status` (zalogowany do `startupowe1konto1/AI-Slopers-Hackathon`). Plik `.env` z `WARSAW_API_TOKEN` tylko tam, gdzie zadania sprawdzają API miasta w `npm run dev`: V3 (ekran połączenia) i L2 (karta Powietrze).
2. Komputer na zasilaczu, z otwartą pokrywą. W terminalu: `caffeinate -i -t 21600` (6 godzin bez usypiania).
3. Nowa sesja Claude Code w katalogu repo. Tryb uprawnień wybierasz sam. W trybie auto aplikacja może czasem poprosić o zgodę i pas poczeka na kliknięcie.
4. Wklej polecenie swojego pasa (sekcja niżej) i odejdź.

Zatrzymanie: zatrzymaj sesję w aplikacji. Podgląd: `node scripts/stan.mjs wszyscy`.

**Jeśli pracujesz nad zadaniem ręcznie,** wypchnij gałąź zaraz po jej utworzeniu (`git push -u origin <gałąź>`) i od razu otwórz PR jako wersję roboczą (draft). Otwarty PR zawsze oznacza zajęte zadanie. Sama gałąź, na której przez 45 minut nie przybył żaden commit, wygląda na porzuconą i pętla `wszyscy` może ją przejąć.

## Polecenie pętli

Komputer O1 (pas O1, przegląd PR-ów całego zespołu, przejmowanie zadań, w których nikt nie pracuje):

```
/loop Jesteś pętlą autopilota pasa wszyscy. Wykonaj jedną iterację według sekcji „Iteracja” w docs/AUTOPILOT-v3.md (czytaj wersję z origin/main) i zaplanuj następną za około 5 minut.
```

Komputery O2, O3 i O4 (wpisz swój pas zamiast `O2`):

```
/loop Jesteś pętlą autopilota pasa O2. Wykonaj jedną iterację według sekcji „Iteracja” w docs/AUTOPILOT-v3.md (czytaj wersję z origin/main) i zaplanuj następną za około 5 minut.
```

## Iteracja (instrukcja dla pętli)

`<REPO>` to bezwzględna ścieżka katalogu, w którym działa sesja. Worktree podawaj zawsze pełną ścieżką `<REPO>/../ws-<id>`, bo przy każdym poleceniu katalog roboczy wraca do początkowego (w jednym poleceniu `cd … && …`). `<PAS>` to `O1`…`O4` albo `wszyscy` (= O1, przegląd PR-ów zespołu i przejmowanie). **PR gotowy** to PR, który nie jest wersją roboczą (draft), a jego check `ci` się skończył (zielony albo czerwony).

Pętla nie pyta ludzi. Kanałem zespołu jest GitHub: blokady i błędy zgłasza jako issue plus komentarz w PR (DECYZJE W5). Gdy brakuje decyzji, bierze odpowiedź z `DECYZJE-v3.md`, a gdy jej tam nie ma, wybiera wariant najbliższy planowi i najmniejszy, po czym zapisuje go w opisie PR w sekcji „Decyzje bez ludzi”.

1. **Stan.** Raz na sesję: `git -C <REPO> worktree add --detach <REPO>/../ws-main origin/main` (jeśli `<REPO>/../ws-main` już jest po poprzedniej sesji, użyj go). W każdej iteracji: `git -C <REPO> fetch -q origin && git -C <REPO>/../ws-main checkout -q --detach origin/main`. Przeczytaj `<REPO>/../ws-main/docs/AUTOPILOT-v3.md` (mogła się zmienić) i uruchom `cd <REPO>/../ws-main && node scripts/stan.mjs <PAS> --json`. Dla `O1` i `wszyscy` wynik zawiera też `kontrakty`, czyli PR-y `[kontrakt]` z innych pasów. Gdy skrypt kończy się kodem 1 (brak sieci, `gh` bez logowania), nie zgaduj stanu: zapisz to w dzienniku i przejdź do kroku 8.
2. **Dziennik.** `<REPO>/.superpowers/sdd/autopilot.md` (lokalny, poza gitem; katalog tworzy `sdd-workspace` z superpowers albo `mkdir -p` z wpisem w `.git/info/exclude`): które zadania mają działających subagentów i jakie zatwierdzenia już wystawiono (pełny SHA). Zadania z działającym subagentem pomijasz w tej iteracji.
3. **Otwarte PR-y.** Pas `O1`…`O4`: PR-y własnych zadań. Pas `wszyscy`: PR-y wszystkich zadań z `docs/zadania-v3.json`. Dane PR: `gh pr view <n> --json isDraft,mergeable,baseRefName,headRefOid,statusCheckRollup`.
   - Liczy się tylko check `ci`. `Workers Builds: warszawa-kryzys` na gałęziach PR jest zawsze czerwony (znany problem podglądu Cloudflare; na `main` działa), więc go pomijasz.
   - PR w wersji roboczej (draft) albo z etykietą lub komentarzem „nie scalać”: nie ruszasz. Cudze PR-y (pas `wszyscy`) recenzujesz dopiero, gdy są gotowe.
   - **Zatwierdzenie** to komentarz `Recenzja autopilota: zatwierdzone @<sha7>`, gdzie `<sha7>` to 7 pierwszych znaków HEAD, który recenzent przeczytał. Obowiązuje tylko dla tego HEAD. Takiego samego komentarza używają wszystkie pasy i krok 4.
   - Nie ma zatwierdzenia dla bieżącego HEAD, a PR jest gotowy: uruchom recenzenta (krok 5.4). Jeśli wcześniej zatwierdzono inny HEAD, recenzent sprawdza tylko różnicę od niego: `git diff <stary-sha>..HEAD`, a po rebase `git range-diff $(git merge-base origin/main <stary-sha>)..<stary-sha> origin/main..HEAD`. Uwagi do cudzego PR wpisz jako komentarz, a poprawki rób tylko w PR-ach własnych albo przejętych.
   - Sam rebase bez zmiany treści nie wymaga recenzji. Sprawdzenie: `git diff origin/main...<stary-sha> | git patch-id --stable` i to samo dla `HEAD` dają ten sam wynik (gdy brakuje obiektu starego SHA: `git fetch origin <stary-sha>`, a gdy to nie pomaga, traktuj PR jak zmieniony). Dopisz wtedy nowy komentarz `Recenzja autopilota: zatwierdzone @<nowy sha7>` z dopiskiem „rebase bez zmian”.
   - `ci` czerwone we własnym PR: subagent poprawiający w worktree zadania, potem push. Wynik sprawdzisz w kolejnej iteracji.
   - Konflikt we własnym PR (`mergeable` = `CONFLICTING` albo `git merge-tree` zgłasza konflikt): `git fetch && git rebase origin/main`, rozwiąż konflikt, `npm run typecheck && npm test && npm run build`, `git push --force-with-lease`. Samego `BEHIND` nie poprawiasz rebase'em; rebase robisz dopiero wtedy, gdy `gh pr merge` odmówi z powodu nieaktualnej gałęzi. W cudzym PR konflikt zgłaszasz komentarzem.
   - Scalasz (`gh pr merge <n> --squash`, nigdy z `--admin`), gdy spełnione są wszystkie warunki. To jest jedyna definicja warunków scalenia, a krok 4 i DECYZJE W2 tylko do niej odsyłają:
     - PR jest gotowy,
     - wszystkie checki `ci` na bieżącym HEAD są zielone,
     - zatwierdzenie jest dla bieżącego HEAD,
     - `mergeable` = `MERGEABLE`, a `git merge-tree --write-tree origin/main origin/<gałąź>` przechodzi bez konfliktu,
     - base to `main`,
     - wszystkie zadania z `po` są `zrobione` (DECYZJE W2, W3); `miekkie` nie blokują,
     - e2e nie wstrzymuje scalenia (DECYZJE O1-3): gdy V4 jest już na `main`, a issue „e2e czerwone na main” jest otwarte, nie scalasz PR-ów zmieniających `src/app`, `src/map` ani `src/modules`, dopóki nie zostanie naprawione (PR z poprawką wolno scalić). PR-y tylko z docs albo pipeline nie są wstrzymane.
   - Po scaleniu sprawdź, czy `ci` na `main` jest zielone. Gdy nie jest, utwórz issue i zrób PR z poprawką. Po scaleniu własnego PR `git worktree remove <REPO>/../ws-<id>`.
4. **PR-y `[kontrakt]`** z innych pasów (`O1` i `wszyscy`, lista w `kontrakty`): recenzent sprawdza, że zmiana jest mała, zgodna z planem i że typy w `src/contracts.ts` zmienia tylko V1. Zatwierdzenie to ten sam komentarz co w kroku 3, a scalasz na warunkach z kroku 3. Inaczej komentarz z uwagami.
5. **Zadania własnego pasa.** W pasie najwyżej 2 zadania naraz, a przejęcia z kroku 6 też się liczą. Nie startuj zadania, które ma `konflikty` z zadaniem w toku.
   1. **Zajęcie albo wznowienie.**
      - Zadanie `gotowe` (albo `porzucone` z PR zamkniętym co najmniej 45 minut temu i bez gałęzi na `origin`): `git -C <REPO> worktree add <REPO>/../ws-<id> -b <galaz> origin/main`, w nim `git commit --allow-empty -m "autopilot: zajmuję <ID> ($(hostname -s))"` i `git push -u origin <galaz>`. Gdy push zostanie odrzucony, zadanie zajął ktoś inny: `git worktree remove <REPO>/../ws-<id>`, `git branch -D <galaz>` i pomiń zadanie.
      - Zadanie `w_toku` bez PR albo `porzucone` z gałęzią na `origin`, bez subagenta w dzienniku: jeśli `git log origin/main..origin/<galaz> --format=%s` zawiera `autopilot: zajmuję <ID> ($(hostname -s))`, to nasza przerwana praca (np. po restarcie sesji). Wznów ją na tej samej gałęzi: gdy `<REPO>/../ws-<id>` już istnieje, użyj go, inaczej `git worktree add <REPO>/../ws-<id> <galaz>` (bez `-b`). Subagent zaczyna od `git log` i `git diff origin/main`, żeby nie powtarzać zrobionego. Gałęzi bez takiego commitu (ręczna praca, inny komputer) nie ruszasz.
   2. **Przygotowanie.** W worktree `npm ci`, a przy zadaniach z `pipeline/` także `uv --version` i `uv sync --project pipeline`. Symlinki z `<REPO>` tylko tam, gdzie zadanie ich potrzebuje: `.env` (V3 i L2) i `dane/psp-schronienia` (P1), patrz DECYZJE W1. Nie czytasz ani nie wypisujesz `.env`.
   3. **Implementacja.** Subagent `general-purpose` w tle z poleceniem z PLAN-v3 („Praca z subagentami”, pkt 2) i dodatkiem: „Przeczytaj też docs/DECYZJE-v3.md. Nie pytaj ludzi. Pytanie bez odpowiedzi rozstrzygnij wariantem najbliższym planowi i opisz to w PR w sekcji »Decyzje bez ludzi«. Do commitów dodawaj tylko pliki z sekcji »Pliki« zadania, podając ścieżki wprost (`git add <ścieżki>`), nigdy `git add -A` ani `git add .`. Nie scalaj PR.”
   4. **Recenzja.** Recenzent (spec i jakość, PLAN-v3 pkt 3) czyta diff PR. Uwagi krytyczne albo ważne: poprawka i ponowna recenzja różnicy. Po zatwierdzeniu komentarz w PR: `Recenzja autopilota: zatwierdzone @<sha7>` z krótkim uzasadnieniem.
   5. Pole `czlowiek` w zadaniu: zrób część automatyczną, a krok dla człowieka wpisz w opisie PR w sekcji „Do zrobienia przez człowieka”.
6. **Przejmowanie** (tylko `wszyscy`): zadanie innego pasa przejmij, gdy:
   - ma stan `gotowe`, jest po 21:15 (chwila z kroku 9) i od `gotoweOd` minęło co najmniej 60 minut (przy `gotoweOd` = null liczy się sama chwila), albo
   - ma stan `porzucone` i `porzuconeOd` jest sprzed co najmniej 45 minut (bez `porzuconeOd` od razu).

   Zadanie `gotowe` zajmujesz jak własne (krok 5.1). Zadanie `porzucone` przejmujesz tak:
   - Gałąź zajęcia zawiera tylko pusty commit „autopilot: zajmuję …” (`git rev-list --count origin/main..origin/<galaz>` daje 1, `git diff --quiet origin/main...origin/<galaz>` kończy się kodem 0) i PR nie był zamknięty: wolno ci na nią pisać (jedyny wyjątek od zakazu pushowania do cudzej gałęzi). `git worktree add <REPO>/../ws-<id> -b <galaz> origin/<galaz>`, w nim `git rebase origin/main`, `git commit --allow-empty -m "autopilot: przejmuję <ID> ($(hostname -s))"` i `git push --force-with-lease origin <galaz>`. Gdy push zostanie odrzucony, ktoś był szybszy: sprzątanie jak w 5.1.
   - W pozostałych przypadkach (na gałęzi są prawdziwe zmiany albo PR zamknięto) nie ruszasz cudzej gałęzi: zajmij zadanie nową gałęzią `o1/<id małymi literami>-przejete` z `origin/main`, tak jak w 5.1. Z pracy poprzednika możesz wziąć, co dobre (`git cherry-pick`). `stan.mjs` rozpoznaje tę gałąź jako gałąź zadania.

   Dalej robisz zadanie jak własne (krok 5.2 i następne) w folderach tego pasa, a w opisie PR dopisujesz „Przejęte przez autopilota O1”.
7. **Integracja e2e** (tylko `wszyscy`, czyli komputer O1; DECYZJE O1-3). Co najwyżej raz na godzinę czasu Warszawy: gdy w dzienniku nie ma wpisu `e2e <HH>` z bieżącej godziny, a port 4174 jest wolny (`lsof -i :4174 -sTCP:LISTEN` nic nie wypisuje), uruchom w `<REPO>/../ws-main` `npm ci && npm run test:e2e` i dopisz do dziennika `e2e <HH>: zielone` albo `e2e <HH>: czerwone`. Port zajęty: spróbujesz w następnej iteracji.
   - Czerwone i nie ma otwartego issue „e2e czerwone na main”: utwórz je z ostatnimi liniami wyniku. Po scaleniu V4 wstrzymuje ono scalanie PR-ów UI (krok 3).
   - Zielone, a issue „e2e czerwone na main” jest otwarte: zamknij je (`gh issue close <n> --comment "e2e zielone na main @<sha7>"`).
   - Pętle O2–O4 nie uruchamiają e2e. Subagenci zadań V3, V4 i V6 (komputer O1) uruchamiają je tylko wtedy, gdy port 4174 jest wolny. Gdy jest zajęty, czekają raz 60 sekund, a potem pomijają e2e i piszą o tym w opisie PR.
8. **Dziennik i następna iteracja.** Dopisz do `.superpowers/sdd/autopilot.md` jedną linię: godzina, co zrobiono, które subagenty działają, wystawione zatwierdzenia (pełny SHA) i wpisy `e2e`. Zaplanuj kolejną iterację za około 270 sekund.
9. **Czas** zawsze z `TZ=Europe/Warsaw date` (DECYZJE W8). Progi to chwile, nie godziny z zegara, żeby po północy nic się nie odwróciło: 21:15 = `2026-10-17T21:15+02:00` (19:15 UTC), 22:30 = `2026-10-17T22:30+02:00` (20:30 UTC), 24:00 = `2026-10-18T00:00+02:00` (22:00 UTC). Porównuj w UTC: `date -u +%Y-%m-%dT%H:%M`.
   - Do 24:00 zadania ruszają w kolejności ważności z DECYZJE W8.
   - V6 rusza, gdy zadania z jego `po` są zrobione i jest 22:30 albo później, albo wcześniej, gdy `miekkieBrakuje` jest puste. Testy kart, które są jeszcze atrapami, e2e pomija, a dla właściciela każdej atrapy tworzysz issue.
   - Po 00:00 nie startujesz zadań funkcjonalnych, a V6 i L4b mogą ruszyć. Kończysz PR-y z zielonym `ci`, resztę zostawiasz jako wersje robocze (draft) z issue.
   - Gdy wszystkie zadania pasa są zrobione, a PR-y zamknięte, zakończ pętlę.

**Nigdy:** push na `main` z pominięciem PR, `--force` bez `--with-lease`, push do cudzej gałęzi (jedyny wyjątek to przejęcie z kroku 6), `gh pr merge --admin`, `git add -A`, zmiany ustawień repo, klucz API w kodzie, logach, PR albo komentarzach, scalenie przy czerwonym `ci`, nowe zależności npm, zmiana `src/contracts.ts` poza PR `[kontrakt]`.
