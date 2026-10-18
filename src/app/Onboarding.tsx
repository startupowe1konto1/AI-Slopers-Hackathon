import { useEffect, useId, useState } from 'react';
import type { Adres, MiejsceUzytkownika, RolaMiejsca } from '../contracts';
import { znajdzAdres } from '../modules/adresy';
import { zapiszMiejsca } from './miejsca';
import { miejsceTutaj, zTutaj } from './lokalizacja';
import { pobierzPaczke, stanPaczki } from '../offline/paczka';
import { tylkoOnline } from '../offline/tryb';

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
      setLokalizacja(e instanceof Error ? e.message : 'Nie udało się ustalić lokalizacji. Wpisz adres.');
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
      {!tylkoOnline() && <PaczkaOffline />}
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
        {postep ?? 'Pobierz paczkę offline'}
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
