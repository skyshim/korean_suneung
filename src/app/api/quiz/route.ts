import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { passageContent } = await request.json();

    if (!passageContent) {
      return NextResponse.json({ error: 'Passage content is required' }, { status: 400 });
    }

    const prompt = `다음 지문을 읽고, 객관식 문제 1개를 생성해 주세요. 문제는 5개의 선택지를 포함해야 하며, 정답은 1개여야 합니다. JSON 형식으로 응답해 주세요.

지문:
${passageContent}

응답 형식:
{
  "question": "문제 내용",
  "options": [
    "선택지 1",
    "선택지 2",
    "선택지 3",
    "선택지 4",
    "선택지 5"
  ],
  "answer": 1 // 1부터 5까지의 숫자
}
`;

    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o-mini',
      response_format: { type: "json_object" },
    });

    const responseContent = chatCompletion.choices[0].message.content;
    if (!responseContent) {
      throw new Error("OpenAI did not return any content.");
    }

    const quizQuestion = JSON.parse(responseContent);

    // Basic validation of the generated quiz structure
    if (!quizQuestion.question || !Array.isArray(quizQuestion.options) || quizQuestion.options.length !== 5 || !quizQuestion.answer) {
      throw new Error("Generated quiz question is not in the expected format.");
    }

    return NextResponse.json(quizQuestion);
  } catch (error) {
    console.error("Error generating quiz:", error);
    return NextResponse.json({ error: 'Failed to generate quiz question', details: (error as Error).message }, { status: 500 });
  }
}
