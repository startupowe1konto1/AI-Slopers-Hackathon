import * as pojazdy from '../../../server/live/pojazdy';
import * as wiatr from '../../../server/live/wiatr';

// Każdy nowy handler z server/live/ dopisz tutaj.
const handlery: Record<string, Pick<typeof pojazdy, 'handler'>> = { pojazdy, wiatr };

export const onRequestGet = async (ctx: {
  request: Request;
  params: { nazwa: string };
  env: { WARSAW_API_TOKEN?: string };
}) => {
  const h = handlery[ctx.params.nazwa];
  return h ? h.handler(ctx.request, ctx.env) : new Response('nie znaleziono', { status: 404 });
};
