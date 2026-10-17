import { useEffect, useState } from 'react';

// ?offline=1 wymusza tryb offline (drugi link w prezentacji).
export const wymuszonyOffline = (): boolean =>
  new URLSearchParams(location.search).get('offline') === '1';

export function useSiec(): { online: boolean; wymuszonyOffline: boolean } {
  const wym = wymuszonyOffline();
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    addEventListener('online', on);
    addEventListener('offline', off);
    return () => {
      removeEventListener('online', on);
      removeEventListener('offline', off);
    };
  }, []);
  return { online: online && !wym, wymuszonyOffline: wym };
}
