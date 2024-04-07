import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import {
  ERC1155_ABI,
  commify,
  shortenNumber,
  toNumber,
} from 'mint.club-v2-sdk';
import { createPublicClient, erc20Abi, erc721Abi, http } from 'viem';
import { NEYNAR_API_KEY } from '../../env/server-env';
import { getViemChain } from '../../utils/chain';

const client = new NeynarAPIClient(NEYNAR_API_KEY);

export async function getTokenInfo(params: {
  chainId: number;
  contractAddress: string;
}) {
  const { chainId, contractAddress } = params;
  const chain = getViemChain(Number(chainId));
  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  const decimals = await publicClient
    .readContract({
      abi: erc20Abi,
      address: contractAddress as `0x${string}`,
      functionName: 'decimals',
    })
    .catch(() => 0);

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

  return { decimals, tokenSymbol };
}

export async function getBalance(params: {
  addresses: string[];
  chainId: number;
  contractAddress: string;
  tokenId?: string;
}) {
  const { addresses, chainId, tokenId, contractAddress } = params;

  let total = 0n;

  const chain = getViemChain(Number(chainId));
  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  const decimals = await publicClient
    .readContract({
      abi: erc20Abi,
      address: contractAddress as `0x${string}`,
      functionName: 'decimals',
    })
    .catch(() => 0);

  const symbol = await publicClient.readContract({
    abi: erc20Abi,
    address: contractAddress as `0x${string}`,
    functionName: 'symbol',
  });

  for (const address of addresses) {
    if (tokenId !== undefined) {
      const balance = await publicClient
        .readContract({
          abi: erc20Abi,
          address: contractAddress as `0x${string}`,
          functionName: 'balanceOf',
          args: [address as `0x${string}`],
        })
        .catch(async () => {
          return await publicClient.readContract({
            abi: ERC1155_ABI,
            address: contractAddress as `0x${string}`,
            functionName: 'balanceOf',
            args: [address as `0x${string}`, BigInt(tokenId)],
          });
        });

      total += BigInt(balance);
    } else {
      const balance = await publicClient.readContract({
        abi: erc20Abi,
        address: contractAddress as `0x${string}`,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      });

      total += BigInt(balance);
    }
  }

  const number = toNumber(total, Number(decimals));

  if (number > 100_000) {
    return { balance: commify(shortenNumber(number)), symbol };
  }

  return { balance: number, symbol };
}

export async function isERC721(params: {
  chainId: number;
  contractAddress: string;
}) {
  const { chainId, contractAddress } = params;
  const chain = getViemChain(Number(chainId));
  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  try {
    const result = await publicClient.readContract({
      abi: erc721Abi,
      address: contractAddress as `0x${string}`,
      functionName: 'ownerOf',
      args: [0n],
    });

    return !!result;
  } catch (e) {
    return false;
  }
}
