# Zrzuty ekranu do prezentacji

Zrzuty z wersji produkcyjnej, kolumna aplikacji 480 px w dwukrotnej rozdzielczości.

## Ekran „Twoja sytuacja” (v3)

Kasia jest u mamy na Grochowie: link `?lokalizacja=52.2457,21.0874` (ul. Grochowska 200), „Użyj mojej lokalizacji”. Do karty bliskich dodane adresy testowe Kasi (dom: ul. Powstańców Śląskich 10, praca: rondo Daszyńskiego 1).

| Plik | Krok demo | Co pokazuje |
|---|---|---|
| [v3-ekran-glowny.png](zrzuty/v3-ekran-glowny.png) | 1. Start | Mapa z punktem „Tutaj” i lista kart: Syreny, Najbliższe miejsce schronienia według PSP, Pomoc medyczna, Powietrze i wiatr. Wszystkie zielone. |
| [v3-syreny-okregi.png](zrzuty/v3-syreny-okregi.png) | 2. Syreny | Po kliknięciu karty okręgi najbliższych syren (analogowe pomarańczowe, cyfrowe niebieskie) i szczegóły: odległość do każdej syreny, w którym okręgu jest Kasia, zastrzeżenie o modelu na zewnątrz i o blackoucie. |
| [v3-trasa-schronienie.png](zrzuty/v3-trasa-schronienie.png) | 3. Miejsce schronienia | Trasa piesza po ulicach do najbliższego miejsca schronienia według PSP (70 m), dwa kolejne miejsca i przycisk „Otwórz w aplikacji PSP”. |
| [v3-powietrze.png](zrzuty/v3-powietrze.png) | 4. Pozostałe karty | Karta Powietrze i wiatr rozwinięta: PM2,5 i PM10 ze stacji 230 m dalej, wiatr ze stacji Torwar, przycisk „Widzę dym”. |
| [v3-bliscy.png](zrzuty/v3-bliscy.png) | 4. Pozostałe karty | Karta Dotarcie do bliskich: do domu 12,9 km po ulicach (pieszo ok. 172 min, rowerem ok. 58 min), „jeśli zabraknie prądu, tramwaje i metro stoją”, najbliższa stacja Veturilo z wolnymi rowerami. |
| [v3-offline-trasa.png](zrzuty/v3-offline-trasa.png) | 5. Brak sieci | Po wyłączeniu sieci i odświeżeniu pasek „Offline · paczka z 17.10, 20:52”, karty działają z paczki, a trasa do miejsca schronienia jest „zapisana w telefonie”. |

Stan danych: 17.10.2026 ok. 21:00. Liczby z kart na żywo (powietrze, rowery) zmieniają się z minuty na minutę.

## Wcześniejsze zrzuty (przed v3, nie pokazywać jako obecnej aplikacji)

Panele „co jeździ” i lista Veturilo są w v3 ukryte (`HANDOFF-v3.md` §4). Zrzuty zostają jako zapis prac.

| Plik | PR | Co pokazuje |
|---|---|---|
| [o4-a1-na-zywo.png](zrzuty/o4-a1-na-zywo.png) | #5 O4-A1 | Przy rondzie Daszyńskiego Kasia widzi, które autobusy i tramwaje jeżdżą teraz w promieniu 1 km, a na mapie kropki z numerami linii. |
| [o4-c1-veturilo-utrudnienia.png](zrzuty/o4-c1-veturilo-utrudnienia.png) | #8 O4-C1 | Ten sam adres po przewinięciu: najbliższe stacje Veturilo z wolnymi rowerami i utrudnienia w ruchu do 2 km, z liniami na mapie. |
| [o4-c1-dym.png](zrzuty/o4-c1-dym.png) | #8 O4-C1 | Kasia zaznacza dym przy domu na Bemowie: szary stożek pokazuje, dokąd niesie go wiatr ze stacji Lazurowa, obok PM2,5 i PM10 z najbliższej stacji i zastrzeżenie, że to kierunek wiatru, a nie model. |

Stan danych wcześniejszych zrzutów: 17.10.2026 ok. 16:40.
