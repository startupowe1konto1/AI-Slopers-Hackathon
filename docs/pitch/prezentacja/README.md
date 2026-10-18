# Prezentacja pitchu (HTML)

Dwanaście slajdów według [scenariusza](../scenariusz.md), na jasnym tle, ze znakiem promocyjnym Warszawy i logo 42 Warsaw na każdym slajdzie. `index.html` z danymi wykresów w `dane.js` i demo „Dzień Kasi” w `telefon.js` i `telefon.css`. Prezentacja nie potrzebuje sieci ani żywej aplikacji.

## Jak uruchomić

Z katalogu repozytorium:

```bash
python -m http.server 8765 --bind 127.0.0.1 --directory docs/pitch/prezentacja
```

Potem w przeglądarce: http://127.0.0.1:8765/ (pełny ekran: klawisz F).

Sam plik `index.html` otwarty z dysku też działa. Jedyne, co prezentacja ściąga z internetu, to font Archivo z Google Fonts. Bez sieci przechodzi na font systemowy.

### Plik do oddania

`docs/pitch/3_AISlopers_przezornyObywatel.html` to cała prezentacja w jednym pliku (font, zrzuty, logotypy i kod QR w środku). Działa po otwarciu z dysku, bez sieci, na komputerze i telefonie. Nazwa według regulaminu: wyzwanie 3, zespół AI Slopers, projekt Przezorny Obywatel. Po każdej zmianie slajdów odśwież go skryptem i scommituj wynik:

```bash
python -I docs/pitch/prezentacja/build_standalone.py --bez-pdf
```

Bez `--bez-pdf` skrypt robi też PDF w `dist/` (podgląd na Slacku).

## Sterowanie

| Klawisz | Działanie |
|---|---|
| → spacja PageDown Enter | następny krok lub slajd (działa z pilotem) |
| ← PageUp Backspace | wstecz |
| Home / End | pierwszy / ostatni slajd |
| F | pełny ekran |
| N | notatki prezentera (tekst ze scenariusza) na tym samym ekranie |

Przyciski ‹ › w lewym dolnym rogu robią to samo co strzałki.

Adres slajdu jest w pasku adresu: `#N.k` to slajd N, krok k (np. `#4.1` to slajd 4 po wyłączeniu prądu, `#9.5` to piąty krok demo). Po odświeżeniu wracamy w to samo miejsce, a wpisanie nowego `#N.k` przełącza slajd bez przeładowania.

| Slajd | Treść | Kroki (naciśnięcia strzałki) |
|---|---|---|
| 1 | napięcie | 2 (kolejne linijki) |
| 2 | spokój | 1 |
| 3 | Kijów (`s-kijow`) | 1 (domino) |
| 4 | syreny (`s-syreny`) | 1 (przełącznik „Wyłącz prąd”: 48,3% → 36,6% adresów; kształt mapy to najgorszy wariant) |
| 5 | persony i 24 zadania | 0 |
| 6 | zadania ↔ dane (trzy grupy: 13 / 5 / 6) | 0 |
| 7 | pięć kart i paczka offline | 0 |
| 8 | „Na jakich danych stoimy” (`s-dane`) | 0 |
| 9 | demo „Dzień Kasi” (`s-kasia`) | 9 |
| 10 | wartość dla mieszkańca i miasta | 1 (następne kroki) |
| 11 | zamknięcie | 2 (kolejne linijki) |
| 12 | AI Slopers, żart w stylu lat 90. (`s-slopers`) | 0, na pytania jury |

Od początku do końca slajdu 11 to 27 naciśnięć, do slajdu 12 jest ich 28.

## Demo „Dzień Kasi” (slajd 9)

To zaprogramowany przebieg w `telefon.js`, a nie żywa aplikacja. Ekrany telefonu to prawdziwe zrzuty z produkcji (`ekrany/`), a ruch (palec, przejścia, podświetlenia) jest w kodzie. Każda strzałka to jeden krok. Wejście na slajd pokazuje stan początkowy, potem jest 9 kroków:

| Krok | Co się dzieje |
|---|---|
| 0 | „Sprawdzam połączenie…” (aplikacja sprawdza sieć już przy otwarciu) |
| 1 | „Jest połączenie. Dane na żywo włączone. Trasy na offline zapisuję w tle.” |
| 2 | palec dotyka „Tutaj”, karty dla ul. Grochowskiej 200 |
| 3 | karta Syreny, okręgi na mapie |
| 4 | miejsce schronienia według PSP, trasa piesza (70 m) |
| 5 | przewinięcie do karty Powietrze i wiatr |
| 6 | karta Dotarcie do bliskich |
| 7 | pada sieć (przekreślone Wi-Fi, „Brak sieci”) |
| 8 | odświeżenie, „Offline · paczka z 17.10, 20:52”, karty działają |
| 9 | ta sama trasa, „zapisana w telefonie” |

Krok do przodu gra animację, każdy inny skok (wstecz, `#9.k`, powrót na slajd) ustawia stan od razu. Szybkie klikanie jest bezpieczne: animacja się przerywa i telefon pokazuje właściwy stan. Przy `prefers-reduced-motion` zostają same przejścia przezroczystości.

Przebieg zmienia się w tablicy `KROKI` w `telefon.js` (ekran, gest, podświetlenia i podpisy). Liczbę kroków `index.html` czyta z `window.telefonDemo.kroki`, więc dodanie kroku nie wymaga zmian w `index.html`.

### Skąd ekrany (`ekrany/`)

Zrzuty z produkcji (`https://warszawa-kryzys.startupaplikujmy.workers.dev/`) z 17.10.2026, ok. 21:00, dla ul. Grochowskiej 200 (`?lokalizacja=52.2457,21.0874`). Pliki mają 768×1536 px (proporcje 1:2). Współrzędne gestów i podświetleń (`M` w `telefon.js`) są liczone w układzie 960×1920 tego samego kadru.

- `glowny`, `syreny`, `trasa`, `powietrze`, `bliscy`, `offline-trasa`: zrzuty z `docs/pitch/zrzuty/v3-*.png`, przeskalowane.
- `dom`: nowy zrzut z produkcji (aplikacja po ponownym otwarciu z wybranym adresem Dom).
- `offline-glowny`: złożony z dwóch prawdziwych zrzutów (ekran główny z paskiem „Offline · paczka z 17.10, 20:52” z `offline-trasa`).
- Ekran „Sprawdzam połączenie…” jest odtworzony w HTML i CSS (tekst jak w `src/app/Polaczenie.tsx`), nie jest zrzutem.
- Godzina w pasku stanu to stałe 21:04.

Odświeżenie ekranów: nowe zrzuty tym samym linkiem, w tym samym kadrze, pod tymi samymi nazwami plików. Jeśli zmieni się układ aplikacji, trzeba poprawić współrzędne w `M`.

### Żywa aplikacja (zapas na pytania jury)

Demo jej nie używa. Zostaje jako link, gdy ktoś z jury chce zobaczyć aplikację naprawdę: `https://warszawa-kryzys.startupaplikujmy.workers.dev/?lokalizacja=52.2457,21.0874` (ul. Grochowska 200).

Obejście znanego błędu paczki offline: przy pierwszym wejściu plik adresów nie zapisuje się w paczce i bez sieci karta Syreny jest szara. Po pobraniu paczki odświeżyć aplikację raz z siecią, potem sprawdzić z wyłączonym Wi-Fi, że karta Syreny jest zielona. Po kliknięciu „Tutaj” odczekać ok. 30 s, bo trasy na offline zapisują się w tle.

Adresy Kasi do wpisania w „Adresy” (najpierw dom, bez niego przycisk „Zapisz” jest nieaktywny; bez domu i pracy karta Dotarcie do bliskich jest szara):

| Rola | Adres |
|---|---|
| dom | ul. Powstańców Śląskich 10, Bemowo |
| praca | rondo Ignacego Daszyńskiego 1, Wola |
| bliska osoba | ul. Grochowska 200, Praga-Południe |

## Struktura plików

| Plik | Co to |
|---|---|
| `index.html` | cała prezentacja: slajdy, style, silnik (kroki, klawisze, `#N.k`, notatki), slajd 8 wpisany ręcznie |
| `dane.js` | dane wykresów (mapa syren, zadania JTBD, zbiory), generowane skryptem `build_dane.py` |
| `build_dane.py` | generator `dane.js` |
| `telefon.js`, `telefon.css` | demo „Dzień Kasi” na slajdzie 9 (klasy z prefiksem `dk-`) |
| `ekrany/` | osiem zrzutów aplikacji (`*.jpg`) |
| `logo/` | `warszawa-znak.svg` (znak promocyjny Warszawy, kadrowany w `index.html` przez `viewBox`, plik bez zmian) i `42warsaw.png` (logo 42 Warsaw) |

## Dane wykresów

`dane.js` generuje skrypt z plików w repozytorium (SOIA, punkty adresowe, JTBD, `pipeline/syreny/WYNIKI.md`). Z katalogu repozytorium:

```bash
python -I docs/pitch/prezentacja/build_dane.py
```

Uruchamiamy go po zmianie `pipeline/syreny/WYNIKI.md`, danych SOIA, adresów albo `kontekst/jtbd-kryzys-warszawa.md`. Potem sprawdzić slajdy 4, 5 i 6 (liczby i mapa).

- Slajdy 5 i 6 liczy przeglądarka z `dane.js`: liczba zadań na grupę (slajd 5) i podział zadań na „w telefonie” / „na żywo” / „bez danych” (slajd 6, z pola `rodzaj` zbioru).
- Połączenia zadań z danymi są ułożone ręcznie w `build_dane.py` (słownik `ZADANIA`) na podstawie kolumny „Dane” w `kontekst/jtbd-kryzys-warszawa.md`. Zadanie 1 przestawiono na SOIA, a zadanie 2 na dane PSP, bo analiza JTBD powstała przed pozyskaniem obu źródeł.
- Slajd 8 (zbiory danych) nie pochodzi z `dane.js`. Nazwy i liczby są wpisane w `index.html`, więc po odświeżeniu paczki trzeba sprawdzić: 126 923 adresy (`public/pack/adresy/meta.json`) i 8 006 miejsc schronienia według PSP (`public/pack/punkty/punkty.json`).
