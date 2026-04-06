import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  let word: string | undefined;
  let definition: string | undefined;
  try {
    ({ word, definition } = await request.json());

    if (!word || !definition) {
      return NextResponse.json({ error: 'Word and definition are required' }, { status: 400 });
    }

    const prompt = `단어 '${word}'(뜻: ${definition})가 자연스럽게 들어간 수능 스타일 문장 1개를 만들어라. 문장은 20~45자. JSON 형식: {"sentence": "예문"}`;

    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: '너는 수능 국어 선생님이다. 절대 JSON 외의 텍스트를 출력하지 마라.' },
        { role: 'user', content: prompt }
      ],
      model: 'gpt-4o-mini',
      response_format: { type: "json_object" },
      temperature: 0.7, // Adjust for creativity vs. consistency
    });

    const responseContent = chatCompletion.choices[0].message.content;
    if (!responseContent) {
      throw new Error("OpenAI did not return any content.");
    }

    const { sentence } = JSON.parse(responseContent);

    if (!sentence) {
      throw new Error("Generated sentence is not in the expected format.");
    }

    return NextResponse.json({ sentence });
  } catch (error) {
    console.error("Error generating quiz sentence:", error);
    return NextResponse.json(
      { sentence: `${word}을(를) 활용한 문장을 생성하지 못했습니다.` },
      { status: 500 }
    );
  }
}
