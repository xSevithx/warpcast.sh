/** @jsxImportSource frog/jsx */
import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import { Button, Frog, TextInput } from 'frog';
import { CHAIN_MAP, SdkSupportedChainIds } from 'mint.club-v2-sdk';
import { length, object, parse, startsWith, string } from 'valibot';
import { NEYNAR_API_KEY } from '../../../env/server-env';
import { getViemChain } from '../../../utils/chain';
import { HandledErrorComponent } from '../../components/error';
import { colors } from '../../constants/colors';
import { ValidationError } from '../../constants/types';
import { getBalance, getTokenSymbol } from './verify-utils';
import { isAddress } from 'viem';
import { getOrigin } from '../../../utils/url';

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
      <div tw="flex h-full w-full flex-col items-center justify-center bg-black p-10 text-5xl text-white">
        <div tw="flex text-7xl">Enter token information</div>
        <div
          tw="mt-20 flex items-center text-center"
          style={{
            color: colors.warpcast,
          }}
        >
          chainId,tokenAddress
        </div>
        <div
          tw="mt-20 flex flex-col items-center text-center text-3xl text-gray-500"
          style={{
            fontFamily: 'Roboto',
          }}
        >
          <div>example</div>
          <div tw="mt-5">8453,0x1234...6789</div>
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

app.frame('/create/:chainId/:contractAddress', async (c) => {
  const { inputText } = c;
  const split = inputText?.split(',') || [];
  let chainId = c.req.param('chainId');
  let address = c.req.param('contractAddress');
  console.log('here', chainId, address, inputText, split);

  if ((chainId === '-1' || address === '-1') && inputText) {
    chainId = split[0]?.trim();
    address = split[1]?.trim();
  }

  try {
    const contractAddress = parse(
      string([
        length(42, 'Base token address should be 42 characters long'),
        startsWith('0x', 'Base token address should start with 0x'),
      ]),
      address,
    );

    if (!isAddress(address) === false) {
      throw new ValidationError('Invalid token address');
    }

    const chain = getViemChain(Number(chainId));

    if (!chain) {
      throw new ValidationError('Invalid chain id');
    }

    const { name, icon, color } = CHAIN_MAP[chain.id as SdkSupportedChainIds];
    const tokenSymbol = await getTokenSymbol({
      chainId: Number(chainId),
      contractAddress,
    });

    if (!tokenSymbol) {
      throw new ValidationError('Token not found');
    }

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
            on {name} chain <img tw="ml-2" src={icon} width={50} heigh={50} />
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
            to make warpcast a better place
          </div>
        </div>
      ),
      intents: [
        <Button action="/customize">Customize</Button>,
        <Button.Link
          href={encodeURIComponent(
            `https://warpcast.com/~/add-cast-action?actionType=post&name=${'Verify ' + tokenSymbol}&icon=shield-check&postUrl=https%3A%2F%2Fwarpcast.sh%2Fapi%2Fverify%2Fcheck%2F${chain.id}%2F${contractAddress}`,
          )}
        >
          Add action
        </Button.Link>,
      ],
    });
  } catch (error) {
    return c.res({
      image: HandledErrorComponent({ error }),
      intents: [<Button action="/customize">Back</Button>],
    });
  }
});

app.hono.get('/check/:chainId/:contractAddress', async (c) => {
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

  const { balance, symbol } = await getBalance({
    addresses: verified_addresses.eth_addresses.concat(custody_address),
    chainId: Number(c.req.param('chainId')),
    contractAddress: c.req.param('contractAddress'),
  });

  return c.json({
    status: 200,
    message: `@${username} - ${balance} ${symbol}`,
  });
});
