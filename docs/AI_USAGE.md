# Użycie narzędzi AI

Regulamin (§4 ust. 4) dopuszcza narzędzia AI, jeśli zespół opisze w dokumentacji zakres ich użycia. Ten opis dotyczy całego zespołu AI Slopers. Za treści przygotowane z pomocą AI odpowiadamy tak samo jak za własne (§4 ust. 4, §7 ust. 8).

## Narzędzia

- Claude Code (Anthropic) z modelem Claude Opus 5.5. Część mniejszych zadań subagentów wykonały Claude Sonnet 5.5 i Claude Haiku 5.5. Z Claude Code pracowały wszystkie cztery osoby z zespołu.
- Automatyczna transkrypcja rozmów zespołu z 17.10. Transkrypty posłużyły jako kontekst do planu. Nie są częścią aplikacji ani repozytorium.

Sama aplikacja nie wywołuje żadnego modelu AI. Pokazuje dane ze źródeł wymienionych w [DOKUMENTACJA.md](DOKUMENTACJA.md), sekcja 1.

## Jak pracowaliśmy

Każda osoba prowadziła swój pas prac w osobnym `git worktree`. Claude Code dostawał zadania z [PLAN.md](PLAN.md), a od wieczora 17.10 z [PLAN-v3.md](PLAN-v3.md), i zmieniał tylko pliki w folderach danej osoby ([SPEC.md](SPEC.md), sekcja 9). Zasady dla modelu są w [CLAUDE.md](../CLAUDE.md), m.in.: najpierw test, potem kod; parser odpowiedzi API tylko na podstawie zapisanej próbki; klucz API wyłącznie w `.env`.

Większe zadania Claude Code dzielił między subagentów, którzy pracowali równolegle. Tak powstały na przykład trzy handlery proxy danych na żywo (powietrze, Veturilo, utrudnienia). Od 17.10, ok. 20:15, sesje Claude Code na komputerach zespołu działały w pętli opisanej w [AUTOPILOT-v3.md](AUTOPILOT-v3.md): co kilka minut sprawdzały stan na GitHubie, brały wolne zadania, recenzowały i scalały pull requesty. Zasady pętli zatwierdził lider zespołu.

Każda zmiana trafiała na `main` przez pull request z CI: sprawdzenie typów, testy, build i walidacja paczki offline.

## Do czego użyliśmy AI

- Rozpoznanie: regulamin, zbiory portalu dane.um.warszawa.pl i dokumentacja API, doświadczenia Kijowa z blackoutów, zadania mieszkańców w czasie kryzysu (`kontekst/`).
- Specyfikacja i plan prac (`HANDOFF.md`, `HANDOFF-v3.md`, `docs/SPEC.md`, `docs/PLAN.md`, `docs/PLAN-v3.md`).
- Kod aplikacji: szkielet PWA, mapa offline, service worker, karty ekranu „Twoja sytuacja”, wygląd i ikony SVG, proxy danych na żywo.
- Skrypty danych w Pythonie (`pipeline/`): adresy, syreny z modelu SOIA, punkty pomocy, przystanki z GTFS, walidacja paczki offline.
- Analiza zasięgu syren przy blackoucie, razem z przybliżeniem poziomu syren cyfrowych (`pipeline/syreny/WYNIKI.md`).
- Testy w Vitest i test ścieżki Kasi w Playwright.
- Pitch: scenariusz, prezentacja w HTML, pytania jury z odpowiedziami, zrzuty ekranu z produkcji robione skryptem Playwright.
- Przeglądy: recenzje pull requestów, przegląd aplikacji na adresach z demo (`docs/PRZEGLAD.md`), szukanie przyczyn błędów CI.
- Ta dokumentacja.

## Co sprawdzali i o czym decydowali ludzie

- Pomysł, wybór wyzwania 3 (decyzja zespołu z 17.10, 16:25), zakres i kolejność prac.
- Zasady pracy modelu i pętli autopilota.
- Dane i liczby. AI nie wymyślało danych: każdą liczbę w aplikacji liczy skrypt z `pipeline/` na pobranym zbiorze, a liczby w pitchu i dokumentacji sprawdzaliśmy na plikach z danymi, nie z pamięci modelu.
- Licencje danych i bibliotek oraz podstawa użycia danych PSP o miejscach schronienia.
- Teksty o bezpieczeństwie. Aplikacja nie ogłasza alarmów i nie pokazuje miejsc uderzeń. Pisze „miejsca schronienia według PSP”, a przy wyniku syren podaje założenia modelu.

## Czego AI nie zrobiło dobrze

- Plan wygenerowany przez AI zakładał, że pył PM2.5 ma w API jeden zapis (`PM25`). Zakładał też konstruktor, którego nie przepuszcza konfiguracja TypeScriptu. Parsery napisaliśmy więc od nowa na zapisanych próbkach odpowiedzi (`dane/probki/`).
- Błąd znikającego stożka dymu po przeładowaniu strony przeszedł przez testy. Znaleźliśmy go dopiero przy zrzutach z produkcji.
- Pętla autopilota zrobiła i scaliła kilka zadań, nad którymi ktoś z zespołu pracował jeszcze lokalnie, więc część pracy powstała dwa razy. Od tej pory przed startem zadania trzeba było zająć je na GitHubie.
