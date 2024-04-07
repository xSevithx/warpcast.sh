/** @jsxImportSource frog/jsx */
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { Button, Frog, TextInput } from 'frog';
import { CHAIN_MAP, SdkSupportedChainIds } from 'mint.club-v2-sdk';
import queryString from 'query-string';
import { length, parse, startsWith, string } from 'valibot';
import { isAddress } from 'viem';
import { NEYNAR_API_KEY } from '../../../env/server-env';
import { Logger } from '../../../utils/Logger';
import { getViemChain } from '../../../utils/chain';
import { getOrigin } from '../../../utils/url';
import { HandledErrorComponent } from '../../components/error';
import { colors } from '../../constants/colors';
import { ValidationError } from '../../constants/types';
import { getBalance, getTokenInfo, isERC721 } from './verify-utils';
import { truncateString } from '../../../utils/strings';

export const app = new Frog<{
  State: {
    type: string;
    chainId: string;
    contractAddress: string;
  };
}>({
  origin: getOrigin(),
  initialState: {
    type: '',
    chainId: '',
    contractAddress: '',
  },
});

const client = new NeynarAPIClient(NEYNAR_API_KEY);

app.frame('/customize', async (c) => {
  return c.res({
    title: 'Warpcast.sh',
    action: '/create/-1/-1',
    image: (
      <div tw="flex h-full w-full flex-col items-center justify-center bg-black p-5 text-5xl text-white">
        <div tw="flex text-7xl">Enter token information</div>
        <div
          tw="mt-20 flex items-center text-center text-4xl"
          style={{
            color: colors.warpcast,
          }}
        >
          chainId,tokenAddress,tokenId(optional for erc1155)
        </div>
        <div
          tw="mt-20 flex flex-col items-center text-center text-3xl text-gray-500"
          style={{
            fontFamily: 'Roboto',
          }}
        >
          <div>example</div>
          <div tw="mt-5">8453,0x1234...6789,0(optional)</div>
        </div>
      </div>
    ),
    intents: [
      <TextInput placeholder="e.g. 8453,0x1234..." />,
      <Button.Reset>Back</Button.Reset>,
      <Button>Confirm</Button>,
    ],
  });
});

app.frame('/create/:chainId/:contractAddress/:tokenId?', async (c) => {
  const { inputText } = c;
  const split = inputText?.split(',') || [];
  let chainId = c.req.param('chainId');
  let address = c.req.param('contractAddress');
  let tokenId = c.req.param('tokenId');

  if (chainId === '-1' && address === '-1' && !!inputText) {
    chainId = split[0]?.trim();
    address = split[1]?.trim();
    tokenId = split[2]?.trim();
  }

  Logger.info(chainId + '/' + address);

  try {
    const contractAddress = parse(
      string('You need to provide a value', [
        length(42, 'Token address should be 42 characters long'),
        startsWith('0x', 'Token address should start with 0x'),
      ]),
      address,
    );

    if (!isAddress(contractAddress)) {
      throw new ValidationError('Invalid token address');
    }

    const chain = getViemChain(Number(chainId));

    if (!chain) {
      throw new ValidationError('Invalid chain id');
    }

    const { name, icon, color } = CHAIN_MAP[
      chain.id as SdkSupportedChainIds
    ] || {
      name: chain.name,
      icon: null,
      color: colors.warpcast,
    };
    const { tokenSymbol, decimals } = await getTokenInfo({
      chainId: Number(chainId),
      contractAddress,
    });

    if (!tokenSymbol) {
      throw new ValidationError('Token not found');
    }

    if (decimals === 0) {
      const erc721 = await isERC721({
        chainId: Number(chainId),
        contractAddress,
      });

      if (!erc721 && !tokenId) {
        throw new ValidationError('Token Id is required for ERC1155');
      }
    }

    const qs = queryString.stringify(
      {
        actionType: 'post',
        name: truncateString(
          `Check $${tokenSymbol}${tokenId ? `#${tokenId}` : ''}`,
          30,
        ),
        icon: 'search',
        postUrl: `${getOrigin()}/verify/check/${chainId}/${contractAddress}${tokenId ? `/${tokenId}` : ''}`,
      },
      {
        skipEmptyString: true,
        skipNull: true,
      },
    );
    const addActionLink = `https://warpcast.com/~/add-cast-action?${qs}`;

    const shareQs = queryString.stringify({
      text: `${tokenSymbol} balance check on ${name} chain`,
      'embeds[]': `https://warpcast.sh/verify/create/${chainId}/${contractAddress}${tokenId ? `/${tokenId}` : ''}`,
    });

    const warpcastRedirectLink = `https://warpcast.com/~/compose?${shareQs}`;

    return c.res({
      title: 'Warpcast.sh',
      image: (
        <div tw="flex h-full w-full flex-col items-center justify-center bg-black p-10 text-5xl text-white">
          <div tw="flex">This action will check the user's balance of</div>
          <div
            tw="mt-10 flex px-4 py-2 text-8xl"
            style={{
              background: color,
            }}
          >
            ${tokenSymbol}
          </div>
          <div tw="mt-5 flex items-center">
            on {name} chain{' '}
            {icon ? (
              <img tw="ml-2" src={icon} width={50} height={50} />
            ) : (
              <div tw="flex h-0 w-0" />
            )}
          </div>
          <div tw="mt-20 flex items-center text-center text-4xl text-gray-500">
            created by{' '}
            <span
              tw="mx-2"
              style={{
                color: colors.warpcast,
              }}
            >
              @undefined
            </span>{' '}
            with ❤️ for warpcast
          </div>
        </div>
      ),
      intents: [
        <Button action="/customize">Customize</Button>,
        <Button.Link href={warpcastRedirectLink}>Share</Button.Link>,
        <Button.Link href={addActionLink}>Add action</Button.Link>,
      ],
    });
  } catch (error: any) {
    Logger.error(error);
    Logger.error(error?.stack);
    return c.res({
      image: HandledErrorComponent({ error }),
      intents: [<Button action="/customize">Back</Button>],
    });
  }
});

app.hono.post('/check/:chainId/:contractAddress/:tokenId?', async (c) => {
  const body = await c.req.json();

  if (!body?.trustedData?.messageBytes) {
    return c.json({
      status: 400,
      message: 'Invalid Frame Action',
    });
  }

  const {
    valid,
    action: {
      cast: {
        author: { username, custody_address, verified_addresses },
      },
    },
  } = await client.validateFrameAction(body.trustedData.messageBytes);

  if (!valid) {
    return c.json({
      status: 400,
      message: `Invalid frame action`,
    });
  }

  const chainId = c.req.param('chainId');
  const contractAddress = c.req.param('contractAddress');
  if (!chainId) {
    return c.json({
      status: 400,
      message: `Invalid chainId or contractAddress`,
    });
  } else if (!contractAddress || !isAddress(contractAddress)) {
    return c.json({
      status: 400,
      message: `Invalid contractAddress`,
    });
  }

  const { balance, symbol } = await getBalance({
    addresses: verified_addresses.eth_addresses.concat(custody_address),
    chainId: Number(chainId),
    contractAddress: contractAddress,
    tokenId: c.req.param('tokenId'),
  });

  return c.json({
    status: 200,
    message: `@${username} - ${balance} ${symbol}`,
  });
});
