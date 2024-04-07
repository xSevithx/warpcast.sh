import { Frog } from 'frog';

export const app = new Frog();

app.hono.get('/', async (c) => {
  return c.html('Hello, World!');
});
