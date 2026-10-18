# Do zrobienia w przyszłości

Poprawki z przeglądu QA, przygotowane w PR #58 („Propozycje ulepszeń w przyszłości”). Nie weszły do wersji oddanej na hackathon, bo funkcje były zamrożone, a PR zamknęliśmy przed oddaniem.

**Gotowy kod:** zamknięty PR [#58](https://github.com/startupowe1konto1/AI-Slopers-Hackathon/pull/58). Commity zostają w `refs/pull/58/head`, a gałąź `claude/clever-poincare-aabcbe` można przywrócić przyciskiem „Restore branch” na stronie PR. Przed scaleniem trzeba go zrebase'ować na aktualny `main`: od tamtej pory doszły m.in. wersja tylko online na Vercelu i uchwyt panelu.

## 1. Podpowiedzi adresu z klawiatury (`src/app/Onboarding.tsx`)

- [ ] Strzałki w górę i w dół zaznaczają podpowiedź (w kółko), Enter ją wybiera, a Escape i wyjście z pola zamykają listę.
- [ ] Wzorzec combobox ARIA: `aria-expanded`, `aria-activedescendant`, `aria-selected`, `aria-autocomplete="list"`.
- [ ] Zaznaczona podpowiedź ma pasek akcentu i pogrubienie, bo samo jasne tło jest prawie niewidoczne.
- [ ] Klik myszą działa jak wcześniej (mousedown na podpowiedzi nie zabiera fokusu polu).

## 2. Karty nie skaczą podczas ładowania (`src/app/wskazowki.ts`, `src/app/Karty.tsx`)

- [ ] Szkielet stoi tam, gdzie pojawi się karta modułu (10, 20 i 30 dla punktów, 40, 50), a gotowa karta go zastępuje.
- [ ] Karta błędu modułu też trafia na swoje miejsce, a nie na koniec.
- [ ] `useWskazowki().ladowanie` to lista miejsc (`number[]`), a nie liczba.

## 3. Wybrane miejsce na wąskim ekranie (`src/app/App.tsx`, `src/index.css`)

- [ ] Select „Wybrane miejsce” zajmuje cały wiersz, a przyciski i stan sieci są pod nim. Przy 390 px widać „Dom: ul. Grochowska 202” w całości.
- [ ] Select ma `id="wybrane-miejsce"` i `name="miejsce"`.

## 4. Kontrolki MapLibre po polsku (`src/map/MapView.tsx`, opcja `locale`)

- [ ] „Przybliż”, „Oddal”, „Pokaż lub ukryj źródła mapy”, „Zgłoś błąd na mapie”, „Mapa”, „Znacznik na mapie”, „Zamknij dymek”.

## 5. Klawiatura w kartach (`src/app/WyborTrybu.tsx`, `src/index.css`)

- [ ] „Pieszo | Komunikacja” jako radiogroup: w kolejności Tab jest tylko zaznaczony przycisk, strzałki zmieniają wybór i przenoszą fokus.
- [ ] Fokus karty z klawiatury to niebieska obwódka do środka. Zwykłą obwódkę ucina `overflow: hidden` karty.

## 6. Teksty

- [ ] Godziny przychodni z OSM po polsku: „Godziny: pn–pt 08:00–19:00; sob–nd nieczynne” (`src/modules/punkty/godziny.ts`). Z 274 wartości w paczce 272 wychodzą czysto, 2 to nietypowe wpisy OSM.
- [ ] „…od wejścia, 310 m” zamiast „…od wejścia., 310 m”.
- [ ] „Aleje Jerozolimskie 200” zamiast „ul. Aleje Jerozolimskie 200”. Poprawka w pipeline (`nazwa_psp`) obejmuje 222 miejsca schronienia PSP, także „al. Aleja KEN”. Wymaga przebudowania paczki punktów i manifestu.
- [ ] Stopka: „nazwa · licencja, pobrano …”, bez nawiasu wokół licencji. SOIA raz, w pełnej wersji ze stałych atrybucji.
- [ ] Komunikat lokalizacji w pasku: „… Zostaję przy poprzednim miejscu.” zamiast „Wpisz adres”, bo w pasku nie ma pola adresu. Znika po 8 s albo po wyborze innego miejsca. W onboardingu: „… Wpisz adres poniżej.”
- [ ] Po pobraniu paczki przycisk nazywa się „Odśwież paczkę offline”.

## Inne otwarte sprawy

- [ ] `src/modules/punkty/Panel.test.tsx` („kierunek do punktu i odcinek na mapie”) pada mniej więcej raz na 9 biegów przy równoległych testach.
- [ ] „Widzę dym”: punkt nie rysuje się od razu (z listy w #57).
- [ ] Testy `pipeline/transport` wymagają numpy.
- [ ] `pyproj` nie buduje się na macOS 13; paczkę punktów budowaliśmy przez `uv run --no-project --python 3.12`.
- [ ] Mapa w Safari: zapis mapy do OPFS przez `createWritable` nie działa, więc w wersji z trybem offline mapa się nie wyświetla (wersja na Vercelu czyta kafelki zapytaniami Range i działa).
