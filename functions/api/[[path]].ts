import { handleApi } from '../../server/api';
import type { Env } from '../../server/db';

/** Cloudflare Pages Function mounted at /api/*; all routing lives in server/api.ts. */
export const onRequest: PagesFunction<Env> = ({ request, env }) => handleApi(request, env);
