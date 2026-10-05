import type { Env } from '../../server/db';
import { PwaAssets } from '../../server/pwa';

/** /pwa-icon/any and /pwa-icon/maskable: the installed-app icon stored in settings. */
export const onRequestGet: PagesFunction<Env> = ({ request, env, params }) => new PwaAssets(env).icon(request, String(params.kind));
