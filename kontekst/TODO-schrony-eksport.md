# TODO: eksport punktów schronienia PSP (odłożone)

**Status:** do zrobienia ręcznie. Dane to informacja sektora publicznego, używana na zasadach ponownego wykorzystywania (art. 14 ust. 1 ustawy o otwartych danych).

## Co wiemy

- Aplikacja gdziesieukryc.pl (KG PSP) do trybu offline zapisuje w przeglądarce całą krajową bazę: IndexedDB `gsu-national`, magazyn `cells`, 87 308 punktów, wersja `2751e5d4e011b84f`.
- Rekord: `[id_publiczny, lat, lon, adres, miejscowość, dostępność]`. Dostępność przyjmuje wartości „Na żądanie”, „Określone godziny” albo „Całodobowa”.
- W prostokącie wokół Warszawy (lat 52,09–52,37, lon 20,85–21,28) jest 8006 punktów: 6982 na żądanie, 890 w określonych godzinach, 134 całodobowe.
- Dane są zanonimizowane zgodnie z ustawą o ochronie ludności: nie ma pojemności ani właścicieli.
- Aplikacja przyjmuje w linku współrzędne, np. `https://gdziesieukryc.pl/?lat=52.23164&lng=21.00645`.
- Automatyczny eksport z wbudowanej przeglądarki Claude został zablokowany przez uprawnienia sesji (wysyłanie danych z przeglądarki). Dlatego eksport jest ręczny.

## Kroki

1. W zwykłym Chrome otwórz https://gdziesieukryc.pl i poczekaj, aż aplikacja pobierze bazę.
2. DevTools, zakładka Console (`Cmd+Opt+J`), wklej:

```javascript
const db = await new Promise((res, rej) => { const r = indexedDB.open('gsu-national'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const cells = await new Promise(r => { const q = db.transaction('cells').objectStore('cells').getAll(); q.onsuccess = () => r(q.result); });
const esc = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const rows = cells.flatMap(c => c.r).filter(x => x[1] >= 52.09 && x[1] <= 52.37 && x[2] >= 20.85 && x[2] <= 21.28);
const csv = 'id_publiczny,lat,lon,adres,miejscowosc,dostepnosc\n' + rows.map(r => r.map(esc).join(',')).join('\n');
const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type: 'text/csv'})); a.download = 'psp_punkty_schronienia_warszawa_bbox.csv'; a.click();
```

3. Plik `psp_punkty_schronienia_warszawa_bbox.csv` przenieś do `dane/psp-schrony/`.
4. Przytnij punkty do granicy Warszawy z `dane/soia-warszawa/granica_warszawy.geojson` i zapisz jako GeoJSON do paczki offline.
5. W aplikacji pokazuj źródło („Punkty schronienia: KG PSP, gdziesieukryc.pl”), datę stanu danych i przycisk „Otwórz w aplikacji PSP” (link z `?lat=…&lng=…`).

## Aktualizacja

Raz dziennie porównać wersję bazy (`meta.version` w IndexedDB albo `/api/shelters/dataset/manifest`) i zaktualizować tylko zmienione punkty (dodane, usunięte, zmienione). Docelowo potrzebny jest oficjalny eksport od PSP lub miasta.
