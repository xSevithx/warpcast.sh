import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import {
  ERC1155_ABI,
  commify,
  shortenNumber,
  toNumber,
} from 'mint.club-v2-sdk';
import { createPublicClient, erc20Abi, http } from 'viem';
import { NEYNAR_API_KEY } from '../../../env/server-env';
import { getViemChain } from '../../../utils/chain';

const client = new NeynarAPIClient(NEYNAR_API_KEY);

export async function getTokenSymbol(params: {
  chainId: number;
  contractAddress: string;
}) {
  const { chainId, contractAddress } = params;
  const chain = getViemChain(Number(chainId));
  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });
  let tokenSymbol = await publicClient.readContract({
    abi: erc20Abi,
    address: contractAddress as `0x${string}`,
    functionName: 'symbol',
  });

  if (!tokenSymbol) {
    tokenSymbol = await publicClient.readContract({
      abi: ERC1155_ABI,
      address: contractAddress as `0x${string}`,
      functionName: 'name',
    });
  }

  return tokenSymbol;
}

export async function getBalance(params: {
  addresses: string[];
  chainId: number;
  contractAddress: string;
}) {
  const { addresses, chainId, contractAddress } = params;

  let total = 0n;

  const chain = getViemChain(Number(chainId));
  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  const decimals = await publicClient.readContract({
    abi: erc20Abi,
    address: contractAddress as `0x${string}`,
    functionName: 'decimals',
  });

  const symbol = await publicClient.readContract({
    abi: erc20Abi,
    address: contractAddress as `0x${string}`,
    functionName: 'symbol',
  });

  for (const address of addresses) {
    const balance = await publicClient.readContract({
      abi: erc20Abi,
      address: contractAddress as `0x${string}`,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });

    total += BigInt(balance);
  }

  const number = toNumber(total, Number(decimals));

  if (number > 100_000) {
    return { balance: commify(shortenNumber(number)), symbol };
  }

  return { balance: number, symbol };
}
