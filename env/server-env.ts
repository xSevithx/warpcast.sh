import dotenv from 'dotenv';
import { object, parse, string } from 'valibot';

dotenv.config();

const envSchema = object({
  SECRET: string('SECRET is required'),
  FARCASTER_DEVELOPER_FID: string('FARCASTER_DEVELOPER_FID is required'),
  FARCASTER_UUID: string('FARCASTER_UUID is required'),
  FARCASTER_PUBLIC_KEY: string('FARCASTER_PUBLIC_KEY is required'),
  FARCASTER_DEVELOPER_MNEMONIC: string(
    'FARCASTER_DEVELOPER_MNEMONIC is required',
  ),
  NEYNAR_API_KEY: string('NEYNAR_API_KEY is required'),
  OPENAI_API_KEY: string('OPENAI_API_KEY is required'),
  PINATA_API_JWT: string('PINATA_API_JWT is required'),
});

export const {
  SECRET,
  FARCASTER_PUBLIC_KEY,
  FARCASTER_UUID,
  FARCASTER_DEVELOPER_FID,
  FARCASTER_DEVELOPER_MNEMONIC,
  OPENAI_API_KEY,
  PINATA_API_JWT,
  NEYNAR_API_KEY,
} = parse(envSchema, process.env);
