import type { Env } from '../server/db';
import { PwaAssets } from '../server/pwa';

/** /manifest.webmanifest, built per user so the installed app can carry the icon chosen in Settings. */
export const onRequestGet: PagesFunction<Env> = ({ request, env }) => new PwaAssets(env).manifest(request);
