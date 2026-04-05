import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const words = await prisma.wordEntry.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(words);
  } catch (error) {
    console.error("Error fetching words:", error);
    return NextResponse.json({ error: 'Failed to fetch words' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { word, pos, definition, examples } = await request.json();

    if (!word || !pos || !definition) {
      return NextResponse.json({ error: 'Word, part of speech, and definition are required' }, { status: 400 });
    }

    const existingWord = await prisma.wordEntry.findUnique({
      where: { word: word },
    });

    if (existingWord) {
      return NextResponse.json({ error: 'Word already exists' }, { status: 409 });
    }

    const newWord = await prisma.wordEntry.create({
      data: {
        word,
        pos,
        definition,
        examples: examples || [],
      },
    });

    return NextResponse.json(newWord, { status: 201 });
  } catch (error) {
    console.error("Error adding word:", error);
    return NextResponse.json({ error: 'Failed to add word' }, { status: 500 });
  }
}
