import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import type { MiejsceUzytkownika } from '../../contracts';
import { Tresc, wczytaj } from './Karta';

// Karta do wydruku jako akcja karty Syreny: render do <body>, druk, sprzątanie (style w syreny.css).
export async function drukujKarte(miejsca: MiejsceUzytkownika[]): Promise<void> {
  const dane = await Promise.all(miejsca.map(wczytaj));
  const el = document.createElement('div');
  el.className = 'karta-druk-portal';
  document.body.append(el);
  const root = createRoot(el);
  flushSync(() => root.render(<Tresc dane={dane} data={new Date().toLocaleDateString('pl-PL')} />));
  document.body.classList.add('druk-karty');
  window.addEventListener(
    'afterprint',
    () => {
      document.body.classList.remove('druk-karty');
      root.unmount();
      el.remove();
    },
    { once: true },
  );
  window.print();
}
