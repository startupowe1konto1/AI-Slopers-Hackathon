import { handlery } from '../../server/live';

// Vercel: /api/live/<nazwa> tymi samymi handlerami co Worker (worker/index.ts).
// Edge, bo pakuje importy bez rozszerzeń z server/live w jeden plik.
export const config = { runtime: 'edge' };

export default async function funkcja(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const nazwa = url.pathname.match(/^\/api\/live\/([a-z]+)$/)?.[1] ?? url.searchParams.get('nazwa');
  const handler = nazwa ? handlery[nazwa] : undefined;
  if (!handler) return Response.json({ blad: 'nie znaleziono' }, { status: 404 });
  return handler(request, { WARSAW_API_TOKEN: process.env.WARSAW_API_TOKEN });
}
