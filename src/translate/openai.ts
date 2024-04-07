import OpenAI from 'openai';
import { OPENAI_API_KEY } from '../../env/server-env';
import { Logger } from '../../utils/Logger';
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export async function translate(text: string) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are an expert translator that can translate any language to english',
        },
        {
          role: 'user',
          content: `What did this person say? return a JSON object with a single "translated" key.\n\ntext: ${text}`,
        },
      ],
      model: 'gpt-4-turbo-preview',
      response_format: { type: 'json_object' },
    });
    const translated = JSON.parse(
      completion.choices[0].message.content as any,
    )?.translated;

    if (!translated) {
      throw new Error('Failed to translate');
    }

    return translated;
  } catch (e: any) {
    Logger.error(e);
    Logger.error(e?.stack);
  }
}
