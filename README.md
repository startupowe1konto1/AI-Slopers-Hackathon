# Warszawa w trybie kryzysowym

Projekt zespołu AI Slopers na Warsaw Open Data Hackathon (42 Warsaw).

Aplikacja dla mieszkańców Warszawy na czas ataku i blackoutu. Działa także bez sieci i korzysta z otwartych danych Warszawy i PSP.

**Aplikacja:** [https://warszawa-kryzys.startupaplikujmy.workers.dev](https://warszawa-kryzys.startupaplikujmy.workers.dev/) · tryb offline: [https://warszawa-kryzys.startupaplikujmy.workers.dev/?offline=1](https://warszawa-kryzys.startupaplikujmy.workers.dev/?offline=1)

Zacznij od [HANDOFF.md](HANDOFF.md): decyzje, koncepcja, dane, ryzyka, narracja i otwarte sprawy.

| Ścieżka | Zawartość |
|---|---|
| `HANDOFF.md` | punkt wyjścia do dalszej pracy |
| `kontekst/` | research z 17.10, regulamin, dokumentacja API portalu |
| `dane/soia-warszawa/` | wycinek SOIA (syreny) dla Warszawy i analiza zasięgu przy blackoucie |
| `docs/AI_USAGE.md` | rejestr użycia AI (regulamin, §4 ust. 4) |

Klucz API portalu trzymamy w `.env` jako `WARSAW_API_TOKEN`. Plik `.env` nie trafia do repo.
