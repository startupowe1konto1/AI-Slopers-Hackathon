// Rejestr handlerów /api/live/<nazwa>. Właściciel: O4. Nowy handler = jedna linia tutaj.
// Każdy handler: (req: Request, env: Env) => Promise<Response>, plik server/live/<nazwa>.ts.
import { handler as pojazdy } from './pojazdy';
import { handler as wiatr } from './wiatr';

export type Env = { WARSAW_API_TOKEN?: string };
export type Handler = (req: Request, env: Env) => Promise<Response>;

export const handlery: Record<string, Handler> = {
  pojazdy,
  wiatr,
};
