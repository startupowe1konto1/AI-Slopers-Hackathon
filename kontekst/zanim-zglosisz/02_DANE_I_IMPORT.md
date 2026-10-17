# Dane i import — Zanim zgłosisz

## Źródło i kontrakt zewnętrzny

[Oficjalna dokumentacja BO](https://dane.um.warszawa.pl/pl/catalogue/fb4a355f-cc99-4a86-af27-e271b9c77d38).

POTWIERDZONE W DOKUMENTACJI: usługa POST `https://dane.um.warszawa.pl/api/action/get_cks_budzet_obywatelski`, nagłówek `Authorization` z tokenem użytkownika. Przykład używa filtrów `rok` oraz `status` o wartościach `zrealizowane` lub `w_realizacji`. Nie dopisuj prefiksu `Bearer` z przyzwyczajenia. Sprawdź działające wywołanie; token pobieraj ze środowiska. Potwierdź wymagany Content-Type i zachowanie pominiętych filtrów.

Dokumentacja opisuje projekty realizowane i zrealizowane. Liczebność, paginacja, limity, zakres edycji i kształt obwiedni odpowiedzi wymagają sprawdzenia. Przykład odpowiedzi pokazuje obiekt projektu; nie dowodzi, że pełny endpoint zawsze zwraca pojedynczy obiekt. Parametry przykładu i pokazana edycja nie uzasadniają automatycznego założenia zgodności filtrów.

## Odkrywanie — limit około 60 minut

1. Wykonaj jedno małe wywołanie dla jawnego roku/statusu.
2. Obejrzyj status HTTP, typ treści i kształt JSON. Nie loguj nagłówków autoryzacji.
3. Zapisz surową odpowiedź lokalnie, z dostępem ograniczonym do zespołu.
4. Zanotuj: obiekt/lista/obwiednia, paginacja, null, puste tablice, format kosztu, statusy i współrzędne.
5. Porównaj kilka rekordów z ich stroną źródłową. Liczbowe statusy wymagają potwierdzonego słownika lub pozostają nieznane.
6. Ustal zakres importu; nie odpytuj lat od nieograniczonego początku.
7. Wygeneruj raport jakości. Jeśli nie ma odpowiednich danych, zastosuj ograniczenie z dokumentu ryzyk.

## Model normalizowany — projektowany

```text
Project
  id: string                  # np. zbiór + potwierdzony sourceId
  sourceId: string
  title: string
  descriptionText: string
  shortDescriptionText: string | null
  editionLabel: string | null
  editionYear: number | null
  statusRaw: string | number | null
  statusLabel: string | null   # tylko potwierdzone mapowanie
  categories: string[]
  recipients: string[]
  localityRaw: string | null
  districtVerified: string | null
  locationText: string | null
  locations: {lat:number,lng:number}[]
  scope: local | district | citywide | unknown
  costPLN: decimal-string | null
  costRaw: string | null
  costMeaning: string | null
  costSummaryText: string | null
  availabilityText: string | null
  sourceUrl: string | null
  snapshotId: string
  evidenceIds: string[]
```

To kontrakt wewnętrzny, nie twierdzenie o dokładnym JSON miasta.

## Mapowanie i pułapki

- Identyfikator miejskiego projektu traktuj jako tekst; przed deduplikacją sprawdź stabilność między edycjami.
- Pola tekstowe oczyszczaj z HTML, zachowując akapity i polskie znaki. Nie usuwaj negacji.
- `pins` może mieć wiele punktów; dokumentacyjny przykład ma puste główne `lat/lng` i punkt w `pins`. Nie ignoruj `pins`.
- Pole opisane jako nazwa regionu nie gwarantuje dzielnicy: w przykładzie dokumentacji występuje nazwa lokalnego obszaru. Zachowaj oryginał, nie wciskaj wartości do słownika dzielnic.
- Odrzuć niepoprawne współrzędne; odwrócenie osi nie jest automatyczną naprawą. Zgłoś je do raportu.
- Brak wartości kosztu nie jest zerem. Kwoty parsuj jako wartości dziesiętne; obliczenia pieniężne w groszach lub bibliotece dziesiętnej, nie przypadkowe floaty.
- Edycja projektu i data zgłoszenia to różne daty. Nie wyznaczaj edycji z `submitted`.
- `votes=0` może nie oznaczać braku poparcia; nie interpretuj tego w rankingu.
- Nie pobieraj automatycznie załączników; mogą mieć wygasające linki i niepotrzebne dane.
- Nie przenoś danych autora/komentarzy do indeksu ani wywołania AI.

## Dowody

Evidence: `id`, `projectId`, `field`, `text`, `snapshotId`, `sourceUrl`. Generuj stabilny identyfikator dla pola i wersji. Krótkie fragmenty do UI mają być wybrane z rzeczywistego tekstu. Jeśli wyjaśnienie ma cytat, sprawdź, że jest podciągiem po jawnej normalizacji białych znaków. Walidacja cytatu nie dowodzi jeszcze poprawności interpretacji — wymaga testu jakościowego.

## Raport jakości

Liczba rekordów, zakres edycji i filtrów, duplikaty, brak tytułu/opisu/URL, brak lokalizacji, wiele lokalizacji, nieznany status, brak/nieparsowalny koszt, rekordy odrzucone. Procent zawsze z mianownikiem. Zakres ten trafia na stronę „O danych”.

## Tryb awaryjny

Brak API: użyj wcześniej pobranej podczas wydarzenia, zweryfikowanej kopii, jeśli istnieje. Brak takiej kopii: zbuduj przepływ na oznaczonych fixtures; zgłoś, że miejska integracja jest zablokowana. Nie zamieniaj ich w dane rzekomo prawdziwe. Brak geometrii: wyszukiwanie i porównanie tekstowe działają, lokalizacja ma stan unknown. Mały zbiór: ogranicz obietnicę pokrycia.
