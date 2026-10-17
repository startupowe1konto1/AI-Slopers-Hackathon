import { useEffect, useId, useState, type KeyboardEvent } from 'react';
import type { Adres, MiejsceUzytkownika, RolaMiejsca } from '../contracts';
import { znajdzAdres } from '../modules/adresy';
import { zapiszMiejsca } from './miejsca';
import { BladLokalizacji, miejsceTutaj, zTutaj } from './lokalizacja';
import { pobierzPaczke, stanPaczki } from '../offline/paczka';

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
  // Podpowiedź zaznaczona strzałkami (-1: żadna). Fokus zostaje w polu (wzorzec combobox z aria-activedescendant).
  const [aktywna, setAktywna] = useState(-1);

  useEffect(() => {
    let aktualne = true;
    const t = setTimeout(() => {
      znajdzAdres(q, 8).then((w) => {
        if (!aktualne) return;
        setLista(w);
        setAktywna(-1);
      });
    }, 120);
    return () => {
      aktualne = false;
      clearTimeout(t);
    };
  }, [q]);

  const widoczna = otwarte && lista.length > 0;
  const idOpcji = (i: number) => `${id}-opcja-${i}`;
  const zamknij = () => {
    setOtwarte(false);
    setAktywna(-1);
  };
  const wybierz = (a: Adres) => {
    onWybor(a);
    setQ(`${a.ulica} ${a.numer}`);
    zamknij();
  };

  const klawisz = (e: KeyboardEvent<HTMLInputElement>) => {
    const n = lista.length;
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && n) {
      e.preventDefault();
      const dol = e.key === 'ArrowDown';
      setOtwarte(true);
      // Zamknięta lista otwiera się na pierwszej (strzałka w dół) albo ostatniej podpowiedzi; dalej w kółko.
      setAktywna((i) => (!widoczna || i < 0 ? (dol ? 0 : n - 1) : (i + (dol ? 1 : n - 1)) % n));
    } else if (e.key === 'Enter' && widoczna && aktywna >= 0) {
      e.preventDefault();
      wybierz(lista[aktywna]);
    } else if (e.key === 'Escape' && widoczna) {
      e.preventDefault();
      zamknij();
    }
  };

  return (
    <div className="pole">
      <label htmlFor={id}>{etykieta}</label>
      <input
        id={id}
        role="combobox"
        aria-expanded={widoczna}
        aria-controls={`${id}-lista`}
        aria-autocomplete="list"
        aria-activedescendant={widoczna && aktywna >= 0 ? idOpcji(aktywna) : undefined}
        autoComplete="off"
        placeholder="np. Grochowska 200"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOtwarte(true);
          onWybor(undefined);
        }}
        onKeyDown={klawisz}
        onBlur={zamknij}
      />
      {widoczna && (
        <ul className="podpowiedzi" id={`${id}-lista`} role="listbox">
          {lista.map((a, i) => (
            <li
              key={a.id}
              id={idOpcji(i)}
              role="option"
              aria-selected={i === aktywna}
              // Bez tego pole traci fokus przed kliknięciem i lista znika, zanim wybór dojdzie do skutku.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => wybierz(a)}
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

const USTALAM = 'Ustalam lokalizację…';

export function Onboarding({ poczatkowe, onGotowe }: { poczatkowe: MiejsceUzytkownika[]; onGotowe: () => void }) {
  const [wybor, setWybor] = useState<Partial<Record<RolaMiejsca, Adres>>>(
    Object.fromEntries(poczatkowe.map((m) => [m.rola, m.adres])),
  );

  const [lokalizacja, setLokalizacja] = useState<string | null>(null);

  const wpisane = ROLE.flatMap(({ rola, etykieta }) => {
    const adres = wybor[rola];
    return adres ? [{ rola, etykieta, adres }] : [];
  });

  const zapisz = async () => {
    const tutaj = poczatkowe.find((m) => m.rola === 'tutaj');
    await zapiszMiejsca(tutaj ? zTutaj(wpisane, tutaj) : wpisane);
    onGotowe();
  };

  const uzyjLokalizacji = async () => {
    setLokalizacja(USTALAM);
    try {
      await zapiszMiejsca(zTutaj(wpisane, await miejsceTutaj()));
      onGotowe();
    } catch (e) {
      setLokalizacja(
        e instanceof BladLokalizacji ? `${e.message} Wpisz adres poniżej.` : e instanceof Error ? e.message : 'Nie udało się ustalić lokalizacji. Wpisz adres poniżej.',
      );
    }
  };

  return (
    <div className="onboarding">
      <h1>Twoje miejsca</h1>
      <p>Adresy zostają tylko w tej przeglądarce. Wystarczy dom, resztę możesz dodać później.</p>
      <button className="przycisk" onClick={uzyjLokalizacji} disabled={lokalizacja === USTALAM}>
        Użyj mojej lokalizacji
      </button>
      {lokalizacja && <p role="status" className="onboarding-lokalizacja">{lokalizacja}</p>}
      <p className="onboarding-albo">albo wpisz adresy</p>
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
      <PaczkaOffline />
    </div>
  );
}

const formatDaty = (iso: string) =>
  new Date(iso).toLocaleString('pl-PL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

function PaczkaOffline() {
  const [stan, setStan] = useState<{ zbudowano: string } | null>(null);
  const [postep, setPostep] = useState<string | null>(null);
  const [blad, setBlad] = useState<string | null>(null);

  useEffect(() => {
    stanPaczki().then(setStan);
  }, []);

  const pobierz = async () => {
    setBlad(null);
    setPostep('Pobieranie…');
    try {
      await pobierzPaczke((z, w) => setPostep(`Pobieranie: ${z} z ${w}`));
      setStan(await stanPaczki());
    } catch (e) {
      setBlad(e instanceof Error ? e.message : 'Nie udało się pobrać paczki');
    } finally {
      setPostep(null);
    }
  };

  return (
    <div style={{ marginTop: 10 }}>
      <button className="przycisk drugi" onClick={pobierz} disabled={postep !== null}>
        {postep ?? (stan ? 'Odśwież paczkę offline' : 'Pobierz paczkę offline')}
      </button>
      <p role="status" style={{ fontSize: 13, marginTop: 6 }}>
        {blad
          ? `Błąd: ${blad}. Spróbuj ponownie, gdy będzie sieć.`
          : stan
            ? `Paczka offline z dnia ${formatDaty(stan.zbudowano)}. Aplikacja działa bez sieci.`
            : 'Pobierz paczkę (mapa i dane, ok. 15 MB), żeby aplikacja działała bez sieci.'}
      </p>
    </div>
  );
}
