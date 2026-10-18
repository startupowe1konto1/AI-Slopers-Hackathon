# Przezorny Obywatel

Bezpieczny w swoim mieście. Strona internetowa (PWA) dla mieszkańców Warszawy na czas ataku i blackoutu. Dla wybranego adresu pokazuje jeden ekran „Twoja sytuacja” z pięcioma kartami: Syreny, Najbliższe miejsce schronienia według PSP, Pomoc medyczna, Powietrze i wiatr, Dotarcie do bliskich. Działa także bez sieci. Korzysta z otwartych danych m.st. Warszawy, Państwowej Straży Pożarnej i innych otwartych źródeł.

## Nazwa projektu

**Przezorny Obywatel**

## Zespół

| | |
|---|---|
| Nazwa zespołu | **AI Slopers** |
| Numer zespołu | **15** |
| Wydarzenie | Warsaw Open Data Hackathon (42 Warsaw), 17–18.10.2026, wyzwanie 3 |

## Gotowa prezentacja

[`docs/pitch/3_AISlopers_przezornyObywatel.html`](docs/pitch/3_AISlopers_przezornyObywatel.html): cała prezentacja w jednym pliku, nazwanym według zasady `numerWyzwania_nazwaDrużyny_nazwaProjektu`. Otwórz go w przeglądarce; działa bez sieci. Sterowanie: strzałki (slajdy), F (pełny ekran), N (notatki). Źródła slajdów są w [`docs/pitch/prezentacja/`](docs/pitch/prezentacja/).

## Całe rozwiązanie

| Link | Adres |
|---|---|
| Pełna wersja (z trybem offline) | https://warszawa-kryzys.startupaplikujmy.workers.dev/ |
| Tryb offline (symulacja) | https://warszawa-kryzys.startupaplikujmy.workers.dev/?offline=1 |
| Wersja do testu na telefonie (kod QR z prezentacji; bez trybu offline, nic nie zapisuje w telefonie) | https://przezorny-obywatel.vercel.app/ |

| Ścieżka | Zawartość |
|---|---|
| `src/` | aplikacja (React, Vite, MapLibre); karty i warstwy mapy w `src/modules/`, tryb offline w `src/offline/` |
| `server/live/`, `worker/` | dane na żywo z API Warszawy przez Cloudflare Worker; klucz API zostaje na serwerze |
| `pipeline/` | skrypty Pythona, które budują paczkę danych offline |
| `public/pack/`, `public/map/` | paczka danych offline i mapa Warszawy |
| `dane/` | wycinek SOIA (syreny), adresy i próbki odpowiedzi API |
| `tests/e2e/` | test Playwright ścieżki mieszkanki, także bez sieci |
| `docs/` | [dokumentacja](docs/DOKUMENTACJA.md) (dane, założenia, frameworki; regulamin §4 ust. 6), [użycie AI](docs/AI_USAGE.md) (§4 ust. 4), [specyfikacja](docs/SPEC.md), [plan prac](docs/PLAN.md), [do zrobienia w przyszłości](docs/TODO-na-przyszlosc.md), prezentacja w `docs/pitch/` |
| `kontekst/` | research, regulamin, dokumentacja API portalu |

### Uruchomienie

```bash
npm ci
npm run dev
```

Dane na żywo wymagają klucza API portalu dane.um.warszawa.pl w pliku `.env` jako `WARSAW_API_TOKEN` (wzór: `.env.example`). Plik `.env` nie trafia do repozytorium.

Testy: `npm run typecheck && npm test && npm run build && npm run test:e2e`. Walidacja paczki danych: `uv run --project pipeline pipeline/validate.py`.
