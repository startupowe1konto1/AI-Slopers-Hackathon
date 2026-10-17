// Rejestr handlerów /api/live/<nazwa>. Właściciel: O4. Nowy handler = import + jedna linia w `handlery`.
// Czytają go Worker (worker/index.ts) i middleware w `npm run dev` (vite.config.ts).
import { handler as pojazdy } from './pojazdy';
import { handler as wiatr } from './wiatr';

export type Env = { WARSAW_API_TOKEN?: string };
export type Handler = (req: Request, env: Env) => Promise<Response>;

export const handlery: Record<string, Handler> = { pojazdy, wiatr };
