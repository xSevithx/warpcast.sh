/** @jsxImportSource frog/jsx */
import { Button, Frog, getFrameMetadata } from 'frog';
import { colors } from '../../constants/colors';
import queryString from 'query-string';
import { getOrigin } from '../../../utils/url';
import ky from 'ky';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { NEYNAR_API_KEY } from '../../../env/server-env';
import { Logger } from '../../../utils/Logger';
import { cast } from '../../services/neynar-service';
import { translate } from './openai';
import { truncateString } from '../../../utils/strings';

const client = new NeynarAPIClient(NEYNAR_API_KEY);
export const app = new Frog();

app.hono.get('/frame', async (c) => {
  const html = await ky(`${getOrigin()}/translate`).text();
  return c.html(html);
});

app.hono.post('/cast', async (c) => {
  try {
    const body = await c.req.json();
    console.log({ body });

    if (!body?.trustedData?.messageBytes) {
      return c.json({
        status: 400,
        message: 'Invalid Frame Action',
      });
    }

    const { valid, action } = await client.validateFrameAction(
      body.trustedData.messageBytes,
    );

    // console.log({ valid, action });

    const {
      interactor: { fid: clickedFid, username: clickedUsername },
      cast: {
        author: { fid: castorFid, username: castorUsername },
        text,
        hash,
      },
    } = action;

    if (!valid) {
      return c.json({
        status: 400,
        message: 'Invalid Frame Action',
      });
    }

    // const undefinedId = 8152;
    // if (clickedFid !== undefinedId) {
    //   const {
    //     users: [{ viewer_context }],
    //   } = await client.fetchBulkUsers([undefinedId], { viewerFid: clickedFid });

    //   console.log({ clickedFid, viewer_context });

    //   if (!viewer_context?.following) {
    //     return NextResponse.json({
    //       message: `follow @undefined first 0-'`,
    //     });
    //   }
    // }

    const embed = `${getOrigin()}/translate`;
    Logger.info(
      `@${clickedUsername} used translate action on @${castorUsername}`,
    );
    const translation = await translate(text);
    if (!translation || typeof translation !== 'string') {
      throw new Error('Translation failed');
    }

    await cast(
      // `@${clickedUsername} mfered @${castorUsername} 0-'`,
      `@${clickedUsername} here is the translation:\n\n${translation}`,
      embed,
      hash,
    );

    return c.json({
      message: `translating cast`,
    });
  } catch (e: any) {
    Logger.error(e);
    Logger.error(e?.stack);
    return c.json({
      message: `failed. maybe out of funds :')`,
    });
  }
});

app.frame('/', async (c) => {
  const qs = queryString.stringify(
    {
      actionType: 'post',
      name: 'translate',
      icon: 'typography',
      postUrl: `${getOrigin()}/translate/cast`,
    },
    {
      skipEmptyString: true,
      skipNull: true,
    },
  );
  const addActionLink = `https://warpcast.com/~/add-cast-action?${qs}`;

  const shareQs = queryString.stringify({
    text: `Translate Action @warpcastbot`,
    'embeds[]': `https://warpcast.sh/translate`,
  });

  const warpcastShareLink = `https://warpcast.com/~/compose?${shareQs}`;

  return c.res({
    title: 'Warpcast.sh',
    image: (
      <div tw="flex h-full w-full flex-col items-center justify-center bg-black text-white">
        <div tw="mt-5 text-8xl">Add Translate Action</div>
        <div tw="mt-10 text-6xl text-gray-500">
          Translate any cast to english
        </div>
        <div tw="mt-20 flex text-5xl">
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
    intents: [
      <Button.Link href={`https://warpcast.com/undefined`}>
        @undefined
      </Button.Link>,
      <Button.Link href={warpcastShareLink}>Share</Button.Link>,
      <Button.Link href={addActionLink}>Add translate action</Button.Link>,
    ],
  });
});
