import { handlery, type Env } from '../server/live';

// Worker obsługuje tylko /api/* (run_worker_first w wrangler.jsonc); resztę serwują statyczne pliki z dist/.
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const m = new URL(request.url).pathname.match(/^\/api\/live\/([a-z]+)$/);
    const handler = m ? handlery[m[1]] : undefined;
    if (!handler) return Response.json({ blad: 'nie znaleziono' }, { status: 404 });
    return handler(request, env);
  },
};
