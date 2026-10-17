import { useEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { distance } from 'geokdbush';
import type { MiejsceUzytkownika, Punkt, Wsp } from '../../contracts';
import { najblizsze } from '../punkty';
import { DOPISEK, KLASA, KROKI } from './teksty';
import { wynikSyreny, type WynikSyrenyZSzacunkiem } from './wynik';
import './syreny.css';

type DaneMiejsca = { miejsce: MiejsceUzytkownika; syreny: WynikSyrenyZSzacunkiem | null; punkty: Punkt[] | null };

const LISTA_PSP = 'Najbliższe miejsca schronienia według PSP';

function odleglosc(a: Wsp, b: Wsp): string {
  const m = distance(a.lon, a.lat, b.lon, b.lat) * 1000;
  return m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`;
}

// Karta ma się wydrukować także bez części danych: brak jednego źródła nie blokuje reszty.
export async function wczytaj(miejsce: MiejsceUzytkownika): Promise<DaneMiejsca> {
  const [syreny, punkty] = await Promise.all([
    wynikSyreny(miejsce.adres.id).catch(() => null),
    najblizsze(miejsce.adres, 'schronienie_psp', 3).catch(() => null),
  ]);
  return { miejsce, syreny, punkty };
}

export function Tresc({ dane, data }: { dane: DaneMiejsca[]; data: string }) {
  return (
    <>
      <h2 style={{ fontSize: 18, margin: '0 0 8px' }}>Karta na czas alarmu i blackoutu</h2>
      {dane.map(({ miejsce, syreny, punkty }) => {
        const tytul = `${miejsce.etykieta}: ${miejsce.adres.ulica} ${miejsce.adres.numer}`;
        return (
          <article key={miejsce.rola} aria-label={tytul} style={{ marginBottom: 10 }}>
            <h3 style={{ fontSize: 15, margin: '0 0 4px' }}>{tytul}</h3>
            <p style={{ margin: '0 0 4px' }}>
              {syreny
                ? `Syrena normalnie: ${KLASA[syreny.normalnie].tekst}. Przy blackoucie: ${KLASA[syreny.blackout].tekst}${syreny.blackoutSzacunek ? ' (szacunek)' : ''}.`
                : 'Brak danych o syrenach dla tego adresu.'}
            </p>
            {punkty ? (
              <>
                <p style={{ margin: '0 0 2px' }}>{LISTA_PSP}:</p>
                <ol aria-label={LISTA_PSP} style={{ margin: 0, paddingLeft: 20 }}>
                  {punkty.map((p) => (
                    <li key={p.id}>
                      {[p.nazwa, p.adres].filter(Boolean).join(', ')}: {odleglosc(miejsce.adres, p)}
                      {p.dostepnosc ? `, ${p.dostepnosc}` : ''}
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <p style={{ margin: 0 }}>Brak danych o miejscach schronienia według PSP w paczce offline.</p>
            )}
          </article>
        );
      })}
      <h3 style={{ fontSize: 15, margin: '0 0 4px' }}>Co zrobić</h3>
      <ol style={{ margin: 0, paddingLeft: 20 }}>
        {KROKI.filter((k) => !k.startsWith('Wydrukuj')).map((k) => (
          <li key={k}>{k}</li>
        ))}
      </ol>
      <p style={{ fontSize: 12, margin: '8px 0 0' }}>
        {DOPISEK} Miejsca schronienia: PSP (gdziesieukryc.pl). Adresy: m.st. Warszawa. Stan na {data}.
      </p>
    </>
  );
}

function drukuj() {
  // Do druku trafia tylko kopia karty wstawiona w <body> (syreny.css), bez mapy i menu.
  document.body.classList.add('druk-karty');
  window.addEventListener('afterprint', () => document.body.classList.remove('druk-karty'), { once: true });
  window.print();
}

const ramka: CSSProperties = { border: '1px solid var(--linia)', borderRadius: 8, padding: '10px 12px', margin: '10px 0' };

export function KartaDoDruku({ miejsca }: { miejsca: MiejsceUzytkownika[] }) {
  const [karta, setKarta] = useState<{ dane: DaneMiejsca[]; data: string } | null>(null);

  useEffect(() => {
    let aktualne = true;
    Promise.all(miejsca.map(wczytaj)).then((dane) => aktualne && setKarta({ dane, data: new Date().toLocaleDateString('pl-PL') }));
    return () => {
      aktualne = false;
    };
  }, [miejsca]);

  return (
    <section aria-label="Karta do wydruku" style={ramka}>
      {!karta ? (
        <p role="status" style={{ margin: 0 }}>Przygotowuję kartę…</p>
      ) : (
        <>
          <Tresc {...karta} />
          <button className="przycisk" style={{ marginTop: 10 }} onClick={drukuj}>
            Drukuj
          </button>
          {createPortal(
            <div className="karta-druk-portal">
              <Tresc {...karta} />
            </div>,
            document.body,
          )}
        </>
      )}
    </section>
  );
}
