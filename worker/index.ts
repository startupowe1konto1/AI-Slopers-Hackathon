import { handlery, type Env } from '../server/live';

// Wersja na Vercelu przekierowuje /api/live/* tutaj (portal miasta odpowiada tylko na polskie IP),
// więc przeglądarka czyta te odpowiedzi z innej domeny.
function zCors(r: Response): Response {
  const headers = new Headers(r.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  return new Response(r.body, { status: r.status, statusText: r.statusText, headers });
}

// Worker obsługuje tylko /api/* (run_worker_first w wrangler.jsonc); resztę serwują statyczne pliki z dist/.
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const m = new URL(request.url).pathname.match(/^\/api\/live\/([a-z]+)$/);
    const handler = m ? handlery[m[1]] : undefined;
    if (!handler) return zCors(Response.json({ blad: 'nie znaleziono' }, { status: 404 }));
    return zCors(await handler(request, env));
  },
};
