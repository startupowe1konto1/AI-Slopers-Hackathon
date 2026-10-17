# Autopilot v3: pasy pracują same

Cel: zadania z [PLAN-v3.md](PLAN-v3.md) ruszają, gdy ich zależności są na `main`, bez czekania na ludzi. Każdy komputer ma jedną sesję Claude Code z pętlą `/loop`, która co około 5 minut sprawdza stan na GitHubie i robi kolejny krok: startuje zadanie, recenzuje, scala. Zasady zatwierdził O1 (17.10, ok. 20:10).

Źródło prawdy to GitHub, nie pamięć sesji:
- [`docs/zadania-v3.json`](zadania-v3.json): zadania, właściciele, gałęzie i zależności,
- [`scripts/stan.mjs`](../scripts/stan.mjs): co jest zrobione, w toku, gotowe do startu i na co czeka,
- [`docs/DECYZJE-v3.md`](DECYZJE-v3.md): odpowiedzi na pytania, zebrane z góry.

```bash
node scripts/stan.mjs O2
```

## Dla ludzi: co zrobić raz na każdym komputerze

1. W katalogu repo: `git pull`, `npm ci`, `uv sync --project pipeline`, `gh auth status` (zalogowany do `startupowe1konto1/AI-Slopers-Hackathon`). Plik `.env` z `WARSAW_API_TOKEN` tylko tam, gdzie zadania używają API miasta (lista w `DECYZJE-v3.md`).
2. Komputer na zasilaczu, z otwartą pokrywą. W terminalu: `caffeinate -i -t 21600` (6 godzin bez usypiania).
3. Nowa sesja Claude Code w katalogu repo. Tryb uprawnień wybierasz sam. W trybie auto aplikacja może czasem poprosić o zgodę i pas poczeka na kliknięcie.
4. Wklej polecenie swojego pasa (sekcja niżej) i odejdź.

Zatrzymanie: zatrzymaj sesję w aplikacji. Podgląd: `node scripts/stan.mjs wszyscy`.

**Jeśli pracujesz nad zadaniem ręcznie,** wypchnij gałąź zaraz po jej utworzeniu (`git push -u origin <gałąź>`). Gałąź na `origin` oznacza zajęte zadanie i żadna pętla go nie ruszy.

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

`<REPO>` to katalog, w którym działa sesja. `<PAS>` to `O1`…`O4` albo `wszyscy` (= O1, przegląd PR-ów zespołu i przejmowanie). Pętla nie pyta ludzi. Kanałem zespołu jest GitHub: blokady i błędy zgłasza jako issue plus komentarz w PR (DECYZJE W5). Gdy brakuje decyzji, bierze odpowiedź z `DECYZJE-v3.md`, a gdy jej tam nie ma, wybiera wariant najbliższy planowi i najmniejszy, po czym zapisuje go w opisie PR w sekcji „Decyzje bez ludzi”.

1. **Stan.** Raz na sesję: `git -C <REPO> worktree add --detach ../ws-main origin/main`. W każdej iteracji: `git -C <REPO> fetch -q origin && git -C ../ws-main checkout -q --detach origin/main`. Przeczytaj `../ws-main/docs/AUTOPILOT-v3.md` (mogła się zmienić) i uruchom w `../ws-main`: `node scripts/stan.mjs <PAS> --json` (dla `wszyscy` także `node scripts/stan.mjs O1 --json`, które pokazuje PR-y `[kontrakt]`).
2. **Dziennik.** `<REPO>/.superpowers/sdd/autopilot.md` (lokalny, poza gitem; katalog tworzy `sdd-workspace` z superpowers albo `mkdir -p` z wpisem w `.git/info/exclude`): które zadania mają działających subagentów. Takie zadania pomijasz w tej iteracji.
3. **Otwarte PR-y.** Pas `O1`…`O4`: PR-y własnych zadań. Pas `wszyscy`: PR-y wszystkich zadań z `docs/zadania-v3.json`.
   - Liczy się tylko check `ci`. `Workers Builds: warszawa-kryzys` na gałęziach PR jest zawsze czerwony (znany problem podglądu Cloudflare; na `main` działa), więc go pomijasz.
   - PR jako szkic (draft) albo z etykietą lub komentarzem „nie scalać”: nie ruszasz.
   - Brak komentarza `Recenzja autopilota: zatwierdzone`, a PR jest gotowy: uruchom recenzenta (krok 5.4). Uwagi do cudzego PR wpisz jako komentarz, a poprawki rób tylko w PR-ach własnych albo przejętych.
   - `ci` czerwone we własnym PR: subagent poprawiający w worktree zadania, potem push. Wynik sprawdzisz w kolejnej iteracji.
   - Konflikt albo `BEHIND` we własnym PR: `git fetch && git rebase origin/main`, rozwiąż konflikt, `npm run typecheck && npm test && npm run build`, `git push --force-with-lease`.
   - Scalasz (`gh pr merge <n> --squash`), gdy spełnione są wszystkie warunki:
     - `ci` zielone,
     - recenzja zatwierdzona,
     - `mergeable` = `MERGEABLE`,
     - base to `main`,
     - wszystkie zadania z `po` są `zrobione` (DECYZJE W2, W3).
     
     Własny PR tuż przed scaleniem: rebase na `origin/main` i ponownie `typecheck`, `test`, `build`. Cudzy PR: `git merge-tree --write-tree origin/main origin/<gałąź>` musi przejść bez konfliktu. Gdy autor wypchnął commit po recenzji, dorecenzuj różnicę. Po scaleniu sprawdź, czy `ci` na `main` jest zielone. Gdy nie jest, utwórz issue i zrób PR z poprawką. Po scaleniu własnego PR `git worktree remove ../ws-<id>`.
4. **PR-y `[kontrakt]`** z innych pasów (`O1` i `wszyscy`): recenzent sprawdza, że zmiana jest mała, zgodna z planem i że typy w `src/contracts.ts` zmienia tylko V1. Zatwierdzone i `ci` zielone: komentarz `Recenzja autopilota O1: zatwierdzone`, `gh pr merge --squash`. Inaczej komentarz z uwagami.
5. **Start zadań** ze stanem `gotowe` z własnego pasa. W pasie najwyżej 2 zadania naraz. Nie startuj zadania, które ma `konflikty` z zadaniem w toku.
   1. **Zajęcie.** `git -C <REPO> worktree add ../ws-<id> -b <galaz> origin/main`, w nim `git commit --allow-empty -m "autopilot: zajmuję <ID> ($(hostname -s))"` i `git push -u origin <galaz>`. Gdy push zostanie odrzucony, zadanie zajął ktoś inny: usuń worktree i pomiń zadanie.
   2. **Przygotowanie.** W worktree `npm ci`, a przy zadaniach z `pipeline/` także `uv --version` i `uv sync --project pipeline`. Symlinki z `<REPO>` do `.env` i `dane/psp-schronienia/` (DECYZJE W1). Nie czytasz ani nie wypisujesz `.env`.
   3. **Implementacja.** Subagent `general-purpose` w tle z poleceniem z PLAN-v3 („Praca z subagentami”, pkt 2) i dodatkiem: „Przeczytaj też docs/DECYZJE-v3.md. Nie pytaj ludzi. Pytanie bez odpowiedzi rozstrzygnij wariantem najbliższym planowi i opisz to w PR w sekcji »Decyzje bez ludzi«. Nie scalaj PR.”
   4. **Recenzja.** Recenzent (spec i jakość, PLAN-v3 pkt 3) czyta diff PR. Uwagi krytyczne albo ważne: poprawka i ponowna recenzja. Po zatwierdzeniu komentarz w PR: `Recenzja autopilota: zatwierdzone` z krótkim uzasadnieniem.
   5. Pole `czlowiek` w zadaniu: zrób część automatyczną, a krok dla człowieka wpisz w opisie PR w sekcji „Do zrobienia przez człowieka”.
6. **Przejmowanie** (tylko `wszyscy`): zadanie innego pasa ze stanem `gotowe` przejmij, gdy jest po 21:15 i od `gotoweOd` minęło co najmniej 60 minut (przy `gotoweOd` = null liczy się sama godzina). Robisz je jak własne (krok 5) w folderach tego pasa, a w opisie PR dopisujesz „Przejęte przez autopilota O1”.
7. **Integracja co godzinę** (tylko maszyna O1, DECYZJE O1-3). Pierwsza iteracja po pełnej godzinie, jeden bieg naraz, port 4174 musi być wolny. W `../ws-main` uruchom `npm ci && npm run test:e2e`. Gdy test jest czerwony i nie ma otwartego issue „e2e czerwone na main”, utwórz je z ostatnimi liniami wyniku. Pętle O2–O4 nie uruchamiają e2e.
8. **Dziennik i następna iteracja.** Dopisz do `.superpowers/sdd/autopilot.md` jedną linię: godzina, co zrobiono, które subagenty działają. Zaplanuj kolejną iterację za około 270 sekund.
9. **Czas** zawsze z `TZ=Europe/Warsaw date` (DECYZJE W8).
   - Do 24:00 zadania ruszają w kolejności ważności z PLAN-v3 (linia 59).
   - Od 22:30 V6 może ruszyć przy atrapach. Ich testy się pomijają, a dla właściciela każdej atrapy tworzysz issue.
   - Po 00:00 nie startujesz zadań funkcjonalnych, a V6 i L4b mogą ruszyć. Kończysz PR-y z zielonym `ci`, resztę zostawiasz jako szkice z issue.
   - Gdy wszystkie zadania pasa są zrobione, a PR-y zamknięte, zakończ pętlę.

**Nigdy:** push na `main` z pominięciem PR, `--force` bez `--with-lease`, push do cudzej gałęzi, zmiany ustawień repo, klucz API w kodzie, logach, PR albo komentarzach, scalenie przy czerwonym `ci`, nowe zależności npm, zmiana `src/contracts.ts` poza PR `[kontrakt]`.
