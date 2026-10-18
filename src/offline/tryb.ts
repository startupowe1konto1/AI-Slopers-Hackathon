// Wersja tylko online (Vercel, kod QR dla publiczności): telefon nie zapisuje niczego do pracy bez sieci.
// Bez service workera, paczki, mapy w OPFS, zapisanych tras i ostatnich danych na żywo.
// Włącza ją VITE_TYLKO_ONLINE=1 przy buildzie (vercel.json); Cloudflare i testy e2e działają z trybem offline.
export const tylkoOnline = (): boolean => import.meta.env.VITE_TYLKO_ONLINE === '1';
