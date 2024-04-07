import * as chains from 'viem/chains';

export function getViemChain(chainId: number) {
  const found = Object.values(chains).find((chain) => chain.id === chainId);
  if (!found) {
    throw new Error(`Chain with id ${chainId} not found`);
  }

  return found;
}
