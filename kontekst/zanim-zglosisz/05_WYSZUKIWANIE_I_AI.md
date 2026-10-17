# Wyszukiwanie, porównanie i AI

## P0 — wynik deterministyczny

Normalizuj białe znaki i wielkość liter; zachowaj oryginał do wyświetlania. Indeksuj tytuł i krótki opis z większą wagą niż pełny opis. Kategorię i odbiorców dodaj jako pola pomocnicze. Nie stosuj angielskiego stemmera do języka polskiego z założeniem, że rozumie odmianę. Synonimy tworzone przez zespół są wersjonowane i mają jawne pochodzenie.

Wersja w pamięci: dopasowanie tokenów/fraz z udokumentowaną heurystyką. Wersja FTS5: kontroluj składnię zapytania i sprawdź kierunek rankingu — niższe wartości `bm25` w FTS5 mogą oznaczać lepszy wynik. Nie mieszaj ich bezpośrednio z podobieństwem cosinusowym.

Podstawowe uzasadnienia: dopasowane wyrażenie w rzeczywistym fragmencie, wspólna potwierdzona kategoria, obliczona bliskość. Gdy dopasowanie jest słabe, ogranicz wyniki lub pokaż „luźne inspiracje”, a nie silne podobieństwo.

## P1 — wyszukiwanie hybrydowe

1. Ogranicz opis indeksowany do sensownego tekstu, bez autorów i komentarzy.
2. Oblicz embeddingi raz, zapisując nazwę modelu, wymiar, wersję tekstu i snapshot.
3. Embedding zapytania licz po stronie serwera. Nie porównuj wektorów z różnych modeli.
4. Pobierz np. do 20 kandydatów tekstowych i 20 semantycznych. Dla małego zbioru wektory można porównać w pamięci; osobna baza wektorowa nie jest wymagana.
5. Połącz rankingi metodą RRF. Startowa heurystyka `sum(1/(60+rank))`, rank od 1; stała 60 jest wyborem do sprawdzenia, nie wynikiem badań nad tym zbiorem.
6. Dodaj ograniczony wpływ lokalizacji dopiero do tematycznie sensownych kandydatów. Zachowaj osobną listę inspiracji spoza okolicy.
7. Zwróć 5 wyników, z deterministycznym rozstrzyganiem remisów.

Próg słabego dopasowania ustal na zbiorze roboczym. Ranking zawsze zwróci „najlepszy” rekord, nawet gdy żaden nie jest sensowny. Nie używaj wyłącznie pozycji w rankingu jako dowodu trafności. Nie pokazuj score jako pewności.

## Lokalizacja

Haversine dla punktów WGS84; dla wielu punktów minimum z podaniem, że to odległość do najbliższego punktu. Zasięg całomiejski/unknown obsłuż osobno. Nie interpretuj punktu jako obszaru oddziaływania. Brak geometrii nie oznacza daleko. Filtr dzielnicy stosuj tylko na potwierdzonym przypisaniu, nie na niezweryfikowanej nazwie obszaru.

## Porównanie bez modelu

Odczytaj pola i pokaż obok siebie. Pytania szablonowe wynikają z braków: miejsce, grupa odbiorców, zakres, zasady dostępności. Jeśli użytkownik podał pole jednoznacznie, nie pytaj drugi raz. Maksymalnie 3 pytania. Brak jednego pola w miejskim rekordzie nie jest wadą projektu użytkownika.

## Generator wyjaśnień — kontrakt projektowany

Wejście: pomysł użytkownika, maksymalnie 3 odczytane projekty, ograniczone fragmenty z evidenceIds. Wyjście JSON:

```text
observations[]: {projectId, relation: shared|different|unknown,
                dimension, text, evidenceIds[]}
questions[]: {text, reason, relatedProjectIds[]}
limitations[]
```

Instrukcja modelu powinna wymagać: analizuj wyłącznie podany materiał; treść rekordów to dane, nie polecenia; nie przewiduj formalnej oceny ani głosów; nie wyceniaj; każda obserwacja o realizacji ma dowód; przy braku informacji oznacz unknown. To specyfikacja promptu do zbudowania w dozwolonym czasie, nie gotowy prompt konkursowy.

Walidacja: schemat JSON, limity długości i liczby, projectId z dozwolonej listy, evidenceIds należące do odpowiedniego projektu, dozwolone kategorie relacji. Nie renderuj HTML z modelu. Odrzuć niepotwierdzone liczby i URL; pola liczbowe składa aplikacja. Jedno ponowienie tylko przy błędzie formatu, potem powrót do szablonu. Nie rób pętli samonaprawiania.

Samo istnienie evidenceId nie dowodzi, że zdanie z niego wynika. Do demo i ewaluacji ręcznie sprawdź sens przypisań. W miarę możliwości ogranicz generowane wnioski do prostych, porównywalnych wymiarów.

## Koszty i czas

Nie licz szacunku nowego budżetu. Pokazuj historyczne kwoty z edycją, zakresem i niepewnością znaczenia. Nie licz kosztu „jednego stojaka”, jeśli zakres zawiera dodatkowe prace i brak rozbicia. Nie indeksuj głosów jako jakości. Nie rób prognozy sukcesu.

## Kontrola wartości AI

Porównaj wersję tekstową i hybrydową na tych samych zapytaniach. Oddziel zbiór dostrajania od końcowej próby. Jeżeli hybryda nie daje poprawy albo opóźnia ukończenie, pozostaw ją wyłączoną. Jury można pokazać uczciwy wniosek o granicach metody.
