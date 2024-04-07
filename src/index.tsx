/** @jsxImportSource frog/jsx */
import dotenv from 'dotenv';
import { Frog } from 'frog';
import { devtools } from 'frog/dev';
import { serveStatic } from 'frog/serve-static';
import { SECRET } from '../env/server-env';
import { Logger } from '../utils/Logger';
import { startProxy } from '../utils/proxy';
import { getOrigin } from '../utils/url';
import { app as landing } from './routes/landing';
import { app as translate } from './routes/translate';
import { app as verify } from './routes/verify';
dotenv.config();

declare global {
  var cloudflared: string | undefined;
}

if (process.env.PROXY === 'true' && !globalThis.cloudflared) {
  const cloudflared = await startProxy();
  globalThis.cloudflared = cloudflared;
}

const origin = getOrigin();
console.log({ origin });

export const app = new Frog({
  assetsPath: '/',
  basePath: '/',
  origin,
  secret: SECRET,
});

app.use(async (c, next) => {
  Logger.info(`[${c.req.method}] ${c.req.url}`);
  await next();
});

app.route('/', landing);
app.route('/verify', verify);
app.route('/translate', translate);

app.use('/*', serveStatic({ root: './public' }));
devtools(app, { serveStatic });

if (typeof Bun !== 'undefined') {
  const port = process.env.PORT || 3000;
  Bun.serve({
    fetch: app.fetch,
    port,
  });
  console.log(`Server is running on port ${port}`);
}
