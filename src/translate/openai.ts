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
            'You are an expert translator that can translate any language to english. 1. you MUST return a JSON object with a single "translated" key with value. value MUST BE string. You should ONLY return an object that looks like {"translated": "[output value]} and NOTHING ELSE.',
        },
        {
          role: 'user',
          content: `What did this person say? \n\ntext: ${text}`,
        },
      ],
      model: 'gpt-3.5-turbo',
      response_format: { type: 'json_object' },
    });

    console.log(completion.choices[0].message.content);
    const translated = JSON.parse(
      completion.choices[0].message.content as any,
    )?.translated;
    console.log(translated);

    if (!translated) {
      throw new Error('Failed to translate');
    }

    return translated;
  } catch (e: any) {
    Logger.error(e);
    Logger.error(e?.stack);
  }
}

// translate(`
// 【DEGENのやり方解説🔰】

// ✅条件

// ①3回以上投稿している
// ②登録から48時間以上経過している
// ③10,000 $DEGEN以上保有している

// ✅投げ方

// チップを投げるには、投稿の下に「金額 $DEGEN」とリプ📝

// 多くの方に知ってもらえると嬉しいです😊
// `);
