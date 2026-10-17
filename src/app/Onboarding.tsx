import { useEffect, useId, useState } from 'react';
import type { Adres, MiejsceUzytkownika, RolaMiejsca } from '../contracts';
import { znajdzAdres } from '../modules/adresy';
import { zapiszMiejsca } from './miejsca';

const ROLE: { rola: RolaMiejsca; etykieta: string; wymagane: boolean }[] = [
  { rola: 'dom', etykieta: 'Dom', wymagane: true },
  { rola: 'praca', etykieta: 'Praca', wymagane: false },
  { rola: 'przedszkole', etykieta: 'Przedszkole', wymagane: false },
  { rola: 'bliska_osoba', etykieta: 'Bliska osoba', wymagane: false },
];

function PoleAdresu({ etykieta, wartosc, onWybor }: { etykieta: string; wartosc?: Adres; onWybor: (a?: Adres) => void }) {
  const id = useId();
  const [q, setQ] = useState(wartosc ? `${wartosc.ulica} ${wartosc.numer}` : '');
  const [lista, setLista] = useState<Adres[]>([]);
  const [otwarte, setOtwarte] = useState(false);

  useEffect(() => {
    let aktualne = true;
    const t = setTimeout(() => {
      znajdzAdres(q, 8).then((w) => aktualne && setLista(w));
    }, 120);
    return () => {
      aktualne = false;
      clearTimeout(t);
    };
  }, [q]);

  return (
    <div className="pole">
      <label htmlFor={id}>{etykieta}</label>
      <input
        id={id}
        role="combobox"
        aria-expanded={otwarte && lista.length > 0}
        aria-controls={`${id}-lista`}
        autoComplete="off"
        placeholder="np. Grochowska 200"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOtwarte(true);
          onWybor(undefined);
        }}
      />
      {otwarte && lista.length > 0 && (
        <ul className="podpowiedzi" id={`${id}-lista`} role="listbox">
          {lista.map((a) => (
            <li
              key={a.id}
              role="option"
              aria-selected={false}
              onClick={() => {
                onWybor(a);
                setQ(`${a.ulica} ${a.numer}`);
                setOtwarte(false);
              }}
            >
              {a.ulica} {a.numer}, {a.dzielnica}
            </li>
          ))}
        </ul>
      )}
      {wartosc && <div className="wybrany">Wybrano: {wartosc.ulica} {wartosc.numer}, {wartosc.dzielnica}</div>}
    </div>
  );
}

export function Onboarding({ poczatkowe, onGotowe }: { poczatkowe: MiejsceUzytkownika[]; onGotowe: () => void }) {
  const [wybor, setWybor] = useState<Partial<Record<RolaMiejsca, Adres>>>(
    Object.fromEntries(poczatkowe.map((m) => [m.rola, m.adres])),
  );

  const zapisz = async () => {
    const miejsca = ROLE.flatMap(({ rola, etykieta }) => {
      const adres = wybor[rola];
      return adres ? [{ rola, etykieta, adres }] : [];
    });
    await zapiszMiejsca(miejsca);
    onGotowe();
  };

  return (
    <div className="onboarding">
      <h1>Twoje miejsca</h1>
      <p>Adresy zostają tylko w tej przeglądarce. Wystarczy dom, resztę możesz dodać później.</p>
      {ROLE.map(({ rola, etykieta }) => (
        <PoleAdresu
          key={rola}
          etykieta={etykieta}
          wartosc={wybor[rola]}
          onWybor={(a) => setWybor((w) => ({ ...w, [rola]: a }))}
        />
      ))}
      <button className="przycisk" disabled={!wybor.dom} onClick={zapisz}>
        Zapisz
      </button>
      {/* O1-B1 podłącza tu pobieranie paczki offline */}
      <button className="przycisk drugi" disabled>
        Pobierz paczkę offline
      </button>
    </div>
  );
}
