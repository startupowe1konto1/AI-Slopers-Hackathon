import { useEffect, useId, useState, type CSSProperties, type ReactElement } from 'react';
import type { KlasaSyreny, MiejsceUzytkownika, ModulProps, WynikSyreny } from '../../contracts';
import { ocena, wynikSyreny, type Poziom } from './wynik';

const OPIS: Record<Poziom, string> = {
  slychac: 'Syrena powinna być słyszalna na zewnątrz.',
  slabo: 'Syrena może być słabo słyszalna, zwłaszcza w mieszkaniu.',
  ryzyko_blackout: 'Jeśli syreny analogowe nie mają zasilania awaryjnego, przy blackoucie możesz jej nie usłyszeć.',
  nie_slychac: 'W tym miejscu syrena prawdopodobnie nie jest słyszalna.',
};

const KLASA: Record<KlasaSyreny, { tekst: string; kolor: string }> = {
  '75+': { tekst: '75 dB i więcej', kolor: '#15803d' },
  '70-75': { tekst: '70–75 dB', kolor: '#4d7c0f' },
  '65-70': { tekst: '65–70 dB', kolor: '#b45309' },
  ponizej_65: { tekst: 'poniżej 65 dB', kolor: '#b91c1c' },
};

const KROKI = ['Włącz Alert RCB w telefonie', 'Zainstaluj aplikację RSO', 'Umów się z sąsiadem, kto kogo budzi', 'Wydrukuj kartę z adresami'];
const DOPISEK = 'Model dźwięku na zewnątrz budynków (KG PSP, SOIA 2026.05). Wariant blackout zakłada, że działają tylko syreny cyfrowe.';

const s = {
  karta: { border: '1px solid var(--linia)', borderRadius: 8, padding: '10px 12px', marginBottom: 10 },
  naglowek: { fontSize: 15, margin: '0 0 8px' },
  wiersze: { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 10px', alignItems: 'center', margin: 0 },
  klasa: { justifySelf: 'start', margin: 0, padding: '2px 8px', borderRadius: 999, color: '#fff', fontSize: 13, fontWeight: 600 },
  opis: { margin: '8px 0 0' },
  szkielet: { height: 22, borderRadius: 6, background: 'var(--linia)', marginTop: 6 },
  przygaszony: { color: 'var(--przygaszony)', fontSize: 13, margin: '0 0 10px' },
  dopisek: { color: 'var(--przygaszony)', fontSize: 12, margin: '10px 0 0' },
} satisfies Record<string, CSSProperties>;

type Stan = { adresId: string; wynik: WynikSyreny | null } | { adresId: string; blad: true };

function Wynik({ w }: { w: WynikSyreny }) {
  return (
    <>
      <dl style={s.wiersze}>
        <dt>Normalnie</dt>
        <dd style={{ ...s.klasa, background: KLASA[w.normalnie].kolor }}>{KLASA[w.normalnie].tekst}</dd>
        <dt>Przy blackoucie</dt>
        <dd style={{ ...s.klasa, background: KLASA[w.blackout].kolor }}>{KLASA[w.blackout].tekst}</dd>
      </dl>
      <p style={s.opis}>{OPIS[ocena(w).poziom]}</p>
    </>
  );
}

function KartaMiejsca({ miejsce, online }: { miejsce: MiejsceUzytkownika; online: boolean }) {
  const id = useId();
  const adresId = miejsce.adres.id;
  const [stan, setStan] = useState<Stan | null>(null);

  // Ponowna próba po powrocie sieci, gdy wcześniej nie udało się wczytać paczki.
  useEffect(() => {
    let aktualne = true;
    wynikSyreny(adresId).then(
      (wynik) => aktualne && setStan({ adresId, wynik }),
      () => aktualne && setStan({ adresId, blad: true }),
    );
    return () => {
      aktualne = false;
    };
  }, [adresId, online]);

  const biezacy = stan?.adresId === adresId ? stan : null;
  let tresc: ReactElement;
  if (!biezacy) {
    tresc = (
      <>
        <p role="status" style={s.przygaszony}>Sprawdzam zasięg syren…</p>
        <div aria-hidden="true" style={s.szkielet} />
        <div aria-hidden="true" style={s.szkielet} />
      </>
    );
  } else if ('blad' in biezacy) {
    tresc = online ? (
      <p>Źródło chwilowo niedostępne. Nie udało się wczytać danych o syrenach, spróbuj ponownie za chwilę.</p>
    ) : (
      <p>Brak sieci, a dane o syrenach nie są zapisane w telefonie. Gdy wróci sieć, pobierz paczkę offline (przycisk „Adresy”).</p>
    );
  } else if (!biezacy.wynik) {
    tresc = <p>Brak danych dla tego miejsca. Sprawdziliśmy model zasięgu syren KG PSP, SOIA 2026.05.</p>;
  } else {
    tresc = <Wynik w={biezacy.wynik} />;
  }

  return (
    <article aria-labelledby={id} style={s.karta}>
      <h3 id={id} style={s.naglowek}>
        {miejsce.etykieta}: {miejsce.adres.ulica} {miejsce.adres.numer}
      </h3>
      {tresc}
    </article>
  );
}

export function Panel({ miejsca, online }: ModulProps) {
  return (
    <div data-testid="wynik-syreny">
      {!online && <p style={s.przygaszony}>Bez sieci: wynik z paczki offline.</p>}
      {miejsca.map((m) => (
        <KartaMiejsca key={m.rola} miejsce={m} online={online} />
      ))}
      <h3 style={s.naglowek}>Żeby alarm do Ciebie dotarł:</h3>
      <ol style={{ margin: 0, paddingLeft: 20 }}>
        {KROKI.map((k) => (
          <li key={k}>{k}</li>
        ))}
      </ol>
      <p style={s.dopisek}>{DOPISEK}</p>
    </div>
  );
}
