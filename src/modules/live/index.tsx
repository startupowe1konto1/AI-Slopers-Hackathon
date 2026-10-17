import type { Modul } from '../../contracts';

// Atrapa ze szkieletu. Właściciel modułu podmienia ją w swoim folderze.
export const modul: Modul = {
  id: 'live',
  nazwa: 'Na żywo',
  Panel: () => <p className="w-budowie">Moduł w budowie</p>,
};
