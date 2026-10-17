# Dane i import — Rozłóż i wyrzuć

## Oficjalne zbiory

| ID | Dokumentacja | Potwierdzony adres usługi |
|---|---|---|
| WASTE | [Segregacja odpadów](https://dane.um.warszawa.pl/pl/catalogue/152838ce-0f39-4814-a6db-93aa3caf2e0c) | POST `https://dane.um.warszawa.pl/api/action/get_bmm_segregacja_odpadow` |
| TYPES | [Typy odpadów](https://dane.um.warszawa.pl/pl/catalogue/92942779-493f-4737-9c97-6de471f66f0a) | POST `https://dane.um.warszawa.pl/api/action/get_bmm_typy_odpadow` |
| ECO | [Eko punkty](https://dane.um.warszawa.pl/pl/catalogue/8129064a-9e5a-4e73-936e-53fa874045ed) | POST `https://dane.um.warszawa.pl/api/action/get_bos_ekopunkty` |

Dokumentacja używa `Authorization` z tokenem użytkownika. Nie dopisuj `Bearer` bez potwierdzenia. Adresy powyżej odczytano z przykładów w portalu; wymagają jeszcze sprawdzenia działającym żądaniem. Nie skanuj listy zgadywanych URL, jeśli usługa nie odpowiada.

Dokumentacja TYPES potwierdza nazwy, synonimy, opisy, informacje dodatkowe, włączenia i wyłączenia. ECO potwierdza kategorie, adresy, geometrię i informacje o dniach pracy; opis zbioru dotyczy leków oraz sprzętu AGD. Struktura WASTE i sposób połączenia z TYPES nie zostały potwierdzone pełną odpowiedzią API.

## Pierwsze odkrywanie

1. Pobierz po jednej odpowiedzi WASTE/TYPES, potem ECO, jeśli potwierdzono endpoint.
2. Zapisz kształt obwiedni, identyfikatory, typy, null, format tekstu i ewentualną paginację.
3. Sprawdź relację między przedmiotem, typem i zaleceniem. Nie łącz po przypadkowo podobnym ID ani nie zakładaj wspólnej numeracji.
4. Ustal, czy odpowiedź WASTE zawiera gotowe instrukcje i wyjątki, czy odsyła do innego zasobu.
5. W ECO sprawdź rzeczywisty format `typ_punktu` i `dni_pracy`. Przykład dokumentacji pokazuje listę kategorii z ID i nazwą oraz listę zawierającą obiekt tygodnia; dni mają flagi całodobowo/nieczynne, pola od/do i uwagi. To wskazówka parsera, nie gwarancja jednolitości całego zbioru. Dokumentacja i przykład różnią się też typowaniem niektórych wartości, np. współrzędnych; waliduj rzeczywiste rekordy.
6. Wybierz obsługiwane scenariusze na podstawie źródeł. Zapisz wszystkie luki.

## Dane normalizowane — projektowane

```text
WasteType:
  id, sourceId, name, synonyms[], descriptionText,
  includesText[], excludesText[], additionalText,
  evidenceIds[], snapshotId

WasteEntry:
  id, sourceId?, label, synonyms[], sourceTypeRefs[],
  instructionText?, sourceEvidenceIds[], snapshotId

CollectionPoint:
  id, sourceId?, name, address, districtRaw?,
  lat?, lng?, sourceCategoryRefs[],
  verifiedAcceptedCategories[], acceptanceEvidenceIds[],
  hoursRaw?, hoursNormalized?, phone?, snapshotId
```

Identyfikator wewnętrzny stabilny dla wersji rekordu. Jeśli źródło nie ma ID, użyj udokumentowanego skrótu stabilnych pól i zapisz metodę. Kategorie aplikacji i kody miejskie to osobne pojęcia. Ich połączenie wymaga zweryfikowanej tabeli mapowania.

## Reguły redagowane przez zespół

Utwórz oddzielny zbiór `ReviewedRule`, opisany w dokumencie 05. Może ustrukturyzować tekst miejski, ale każda decyzja i warunek mają evidenceIds i przegląd człowieka. Nie zmieniaj redakcji zespołu w rzekome oficjalne pole. Zachowaj tekst oryginalny oraz informację `derivedBy=team`, `reviewStatus` i wersję.

## Dowody i pochodzenie

Evidence: datasetId, sourceRecordId, field, text, dokumentacyjny URL, szczegółowy URL jeśli istnieje, snapshotId. Jeśli brak strony pojedynczego rekordu, odsyłaj do katalogu i pokazuj ID. Nie konstruuj nieistniejącego linku. W UI jawnie rozdziel oryginalną regułę i jej uproszczoną prezentację.

## Czyszczenie

Zachowaj negacje, zakresy i wyjątki. HTML usuń bez gubienia treści list. Nie tłumacz automatycznie nazw kategorii na kolory pojemników bez potwierdzenia. Synonimy nie mogą rozszerzać zakresu reguły na inny przedmiot. Duplikaty scalaj tylko po zweryfikowanym kluczu. Rekordy z konfliktem zachowaj w raporcie, nie wybieraj arbitralnie wygodnej wersji.

Godziny i współrzędne punktu są opcjonalne. Nieparsowalny harmonogram pokaż jako oryginalny opis. Brak współrzędnych pozwala pokazać adres, ale wyklucza ranking odległości dla tego punktu. Stosuj Europe/Warsaw i uwzględnij nieznane wyjątki świąteczne; nie twierdź „otwarte teraz” bez pełnego zrozumienia harmonogramu.

## Raport danych

Liczba typów, wpisów, punktów; niepołączone rekordy; brak instrukcji; konflikty; brak kategorii przyjęcia; brak geometrii i godzin; liczba ręcznie zweryfikowanych reguł. Zakres publikowany w aplikacji. Źródła i licencje zgodnie z dokumentem wspólnym.

## Awaria

Jeśli WASTE jest nieczytelne, można ograniczyć zakres do instrukcji jednoznacznie potwierdzonych w pozostałych miejskich danych, pokazując to ograniczenie. Jeśli żadna wiarygodna instrukcja nie jest dostępna, nie generuj zaleceń. Jeśli ECO nie ma zgodnych kategorii, pokaż brak pasującego punktu; lista niewłaściwych lokalizacji nie jest dobrym fallbackiem.
