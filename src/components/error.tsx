/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/jsx-key */
/** @jsxImportSource frog/jsx */

import { ValiError } from 'valibot';
import { Logger } from '../../utils/Logger';
import { colors } from '../constants/colors';

type ErrorProps = {
  error: any;
};

export function HandledErrorComponent(params: ErrorProps) {
  const { error } = params;
  let errorMessage: string = error?.message || error?.toString();

  if (error instanceof ValiError) {
    errorMessage = error.issues
      .map((issue) => {
        return issue.message;
      })
      .join('\n');
  } else {
    Logger.error(error);
    Logger.error(error?.stack);
  }

  return (
    <div
      id="error-component"
      tw="relative flex h-full w-full flex-col items-start bg-black text-5xl"
    >
      <div tw="flex h-full w-full flex-col items-center justify-center p-5">
        <div tw="text-3xl text-gray-500">Uh-oh</div>
        <div
          tw="my-10 flex w-full flex-col items-center justify-center text-red-500"
          style={{
            gap: 10,
          }}
        >
          {errorMessage?.split('\n').map((msg) => (
            <div tw="flex flex-col flex-wrap items-center justify-center text-center">
              <div>{msg}</div>
            </div>
          )) || 'Unknown Error'}
        </div>
      </div>

      <div tw="absolute bottom-10 left-0 flex h-[6%] w-full items-center justify-center border-t px-5 text-3xl text-gray-600">
        <div tw="flex">DM</div>
        <div
          tw="mx-1 flex"
          style={{
            color: colors.warpcast,
          }}
        >
          @undefined
        </div>{' '}
        for help
      </div>
    </div>
  );
}
