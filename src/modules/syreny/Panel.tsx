import { useEffect, useId, useState, type CSSProperties, type ReactElement } from 'react';
import type { MiejsceUzytkownika, ModulProps } from '../../contracts';
import { KartaDoDruku } from './Karta';
import { DOPISEK, KLASA, KROKI } from './teksty';
import { pokazStrefy, strefyWidoczne } from './warstwy';
import { ocena, wynikSyreny, type Poziom, type WynikSyrenyZSzacunkiem } from './wynik';

const OPIS: Record<Poziom, string> = {
  slychac: 'Syrena powinna być słyszalna na zewnątrz.',
  slabo: 'Syrena może być słabo słyszalna, zwłaszcza w mieszkaniu.',
  ryzyko_blackout: 'Jeśli syreny analogowe nie mają zasilania awaryjnego, przy blackoucie możesz jej nie usłyszeć.',
  nie_slychac: 'W tym miejscu syrena prawdopodobnie nie jest słyszalna.',
};

const s = {
  karta: { border: '1px solid var(--linia)', borderRadius: 8, padding: '10px 12px', marginBottom: 10 },
  naglowek: { fontSize: 15, margin: '0 0 8px' },
  wiersze: { display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 10px', alignItems: 'center', margin: 0 },
  klasa: { justifySelf: 'start', margin: 0, padding: '2px 8px', borderRadius: 999, color: '#fff', fontSize: 13, fontWeight: 600 },
  opis: { margin: '8px 0 0' },
  szkielet: { height: 22, borderRadius: 6, background: 'var(--linia)', marginTop: 6 },
  przygaszony: { color: 'var(--przygaszony)', fontSize: 13, margin: '0 0 10px' },
  dopisek: { color: 'var(--przygaszony)', fontSize: 12, margin: '10px 0 0' },
  przelacznik: { display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14, margin: '12px 0 0' },
} satisfies Record<string, CSSProperties>;

type Stan = { adresId: string; wynik: WynikSyrenyZSzacunkiem | null } | { adresId: string; blad: true };

function Wynik({ w }: { w: WynikSyrenyZSzacunkiem }) {
  return (
    <>
      <dl style={s.wiersze}>
        <dt>Normalnie</dt>
        <dd style={{ ...s.klasa, background: KLASA[w.normalnie].kolor }}>{KLASA[w.normalnie].tekst}</dd>
        <dt>Przy blackoucie</dt>
        <dd style={{ ...s.klasa, background: KLASA[w.blackout].kolor }}>{KLASA[w.blackout].tekst}
          {w.blackoutSzacunek && ' (szacunek)'}
        </dd>
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
  const [karta, setKarta] = useState(false);
  const [strefy, setStrefy] = useState(strefyWidoczne);
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
      <label style={s.przelacznik}>
        <input
          type="checkbox"
          checked={strefy}
          onChange={(e) => {
            pokazStrefy(e.target.checked);
            setStrefy(e.target.checked);
          }}
        />
        Pokaż na mapie strefy, w których najgłośniejsza jest syrena analogowa (jeśli zabraknie prądu, może tam być ciszej)
      </label>
      <button className="przycisk drugi" aria-expanded={karta} onClick={() => setKarta((k) => !k)}>
        Karta do wydruku
      </button>
      {karta && <KartaDoDruku miejsca={miejsca} />}
    </div>
  );
}
