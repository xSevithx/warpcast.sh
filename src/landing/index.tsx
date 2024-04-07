/** @jsxImportSource frog/jsx */
import { Frog, Button } from 'frog';
import { Logger } from '../../utils/Logger';
import { colors } from '../constants/colors';

export const app = new Frog({
  imageAspectRatio: '1:1',
  imageOptions: {
    width: 600,
    height: 600,
    fonts: [
      {
        name: 'Bebas Neue',
        source: 'google',
      },
      {
        name: 'Roboto',
        source: 'google',
      },
    ],
  },
  // Supply a Hub to enable frame verification.
  // hub: neynar({ apiKey: 'NEYNAR_FROG_FM' })
});

app.use(async (c, next) => {
  Logger.info(`[${c.req.method}] ${c.req.url}`);
  await next();
});

app.frame('/', async (c) => {
  return c.res({
    title: 'Warpcast.sh',
    image: (
      <div tw="flex h-full w-full flex-col items-center justify-center bg-black text-white">
        <div tw="text-5xl">Warpcast.sh</div>
        <div tw="mt-5 flex text-3xl">
          Made with ❤️ by{' '}
          <span
            tw="ml-1"
            style={{
              color: colors.warpcast,
            }}
          >
            @undefined
          </span>
        </div>
      </div>
    ),
    imageOptions: {
      ...app.imageOptions,
      width: 600,
      height: 600,
    },
    imageAspectRatio: '1:1',
    intents: [
      <Button.Link href="https://warpcast.com/warpcastbot">
        @warpcastbot
      </Button.Link>,
      <Button action="/frames">Frames</Button>,
      <Button action="/actions">Actions</Button>,
    ],
  });
});

app.frame('/actions', async (c) => {
  return c.res({
    title: 'Warpcast.sh',
    image: (
      <div tw="flex h-full w-full flex-col items-center justify-center bg-black text-3xl text-white">
        <div tw="text-5xl">Actions</div>
        <div
          tw="mt-10 flex flex-col"
          style={{
            gap: 20,
          }}
        >
          <div tw="flex flex-col items-center">
            <div
              tw="text-3xl"
              style={{
                color: colors.warpcast,
              }}
            >
              verify
            </div>
            <div tw="text-2xl">Get token balance of user</div>
          </div>
          <div tw="flex flex-col items-center">
            <div
              tw="text-3xl"
              style={{
                color: colors.warpcast,
              }}
            >
              translate
            </div>
            <div tw="text-2xl">Translate casts</div>
            <div tw="flex text-base text-gray-500">coming soon</div>
          </div>
        </div>
      </div>
    ),
    imageAspectRatio: '1:1',
    intents: [
      <Button action="/">Back</Button>,
      <Button action="/verify/customize">Verify</Button>,
    ],
  });
});

app.frame('/frames', async (c) => {
  return c.res({
    title: 'Warpcast.sh',
    image: (
      <div tw="flex h-full w-full flex-col items-center justify-center bg-black text-3xl text-white">
        <div tw="text-5xl">Frames</div>
        <div
          tw="mt-10 flex flex-col"
          style={{
            gap: 20,
          }}
        >
          <div tw="flex flex-col items-center">
            <div
              tw="text-3xl"
              style={{
                color: colors.warpcast,
              }}
            >
              coming soon
            </div>
          </div>
        </div>
      </div>
    ),
    imageAspectRatio: '1:1',
    intents: [<Button action="/">Back</Button>],
  });
});
