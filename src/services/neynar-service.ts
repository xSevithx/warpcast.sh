import { NeynarAPIClient } from '@neynar/nodejs-sdk';
import {
  FARCASTER_DEVELOPER_MNEMONIC,
  FARCASTER_UUID,
  NEYNAR_API_KEY,
} from '../../env/server-env';

const client = new NeynarAPIClient(NEYNAR_API_KEY);

export async function cast(text: string, url: string, parentHash: string) {
  console.log(text, {
    embeds: [
      {
        url,
      },
    ],
    replyTo: parentHash,
  });

  let lastHash = parentHash;

  const MAX_CHUNK_SIZE = 320;
  const chunks = [];

  for (let i = 0; i < text.length; i += MAX_CHUNK_SIZE) {
    chunks.push(text.substring(i, i + MAX_CHUNK_SIZE));
  }

  for (const chunk of chunks) {
    const { hash } = await client.publishCast(FARCASTER_UUID, chunk, {
      embeds: [
        {
          url,
        },
      ],
      replyTo: lastHash,
    });
    lastHash = hash;
  }
}

async function init() {
  const resp = await client.createSignerAndRegisterSignedKey(
    FARCASTER_DEVELOPER_MNEMONIC,
  );
  console.log(resp);
}
// only need to run this once, to create a signer and register the signed key
// save the signer uuid and public key in .env
// after you confirm the url given in the console,
// save the signer uuid and public key in .env
// init();
