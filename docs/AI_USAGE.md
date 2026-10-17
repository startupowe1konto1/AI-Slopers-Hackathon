# Użycie narzędzi AI

Regulamin (§4 ust. 4) wymaga opisania zakresu użycia AI w dokumentacji rozwiązania. Każda osoba dopisuje tu, do czego używała AI.

| Kto | Narzędzie | Do czego |
|---|---|---|
| Wojciech | Claude Code (Claude Opus) | rozpoznanie regulaminu i źródeł danych, katalog zbiorów, notatka `kontekst/`, plan prac |
| O3 | Claude Code | moduł `punkty`: najbliższe punkty (kdbush), panel z 4 stanami, warstwy mapy, testy |
| Wojciech | Claude Code (Claude Opus) | scenariusz pitchu (`docs/pitch/scenariusz.md`) i szkielet dokumentacji (`docs/DOKUMENTACJA.md`); sprawdzenie liczb o syrenach na plikach CSV, wybór adresów do demo z analizy zasięgu, sprawdzenie licencji bibliotek w npm |
| O1 (Wojciech) | Claude Code (Claude Opus) | specyfikacja i plan budowy (`docs/SPEC.md`, `docs/PLAN.md`), szkielet PWA, mapa offline (PMTiles w OPFS), service worker, Worker Cloudflare, test e2e ścieżki Kasi (Playwright), przeglądy i scalanie PR-ów zespołu, stopka z atrybucjami |
| Wojciech | Claude Code (Claude Opus) | prezentacja pitchu w HTML (`docs/pitch/prezentacja/`) i pytania jury z odpowiedziami (`docs/pitch/pytania.md`); sprawdzenie w kodzie, że lokalizacja nie wychodzi z telefonu |
| O4 | Claude Code (Claude Opus) z subagentami | dane na żywo: proxy `/api/live/*` (`server/`), panel „Na żywo” (`src/modules/live/`), stożek dymu, Veturilo, jakość powietrza i utrudnienia; trzy handlery serwerowe (powietrze, Veturilo, utrudnienia) napisali równolegle subagenci, a ich kod przejrzał człowiek; parsery pisane na zapisanych próbkach API (`dane/probki/`), testy przed kodem (TDD); sprawdzenie w przeglądarce na prawdziwym API; zrzuty z produkcji skryptem Playwright; diagnoza błędów CI i znikającego stożka dymu |
