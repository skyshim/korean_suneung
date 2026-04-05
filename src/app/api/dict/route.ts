import { NextResponse } from 'next/server';

// Helper function to fetch from Standard Korean Dictionary API
async function fetchFromStDict(word: string, apiKey: string) {
  const url = `https://stdict.korean.go.kr/api/search.do?key=${apiKey}&q=${encodeURIComponent(word)}&type_search=search&req_type=json`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`STDICT API error: ${response.statusText}`);
    }
    const data = await response.json();
    
    if (data.channel && data.channel.item && data.channel.item.length > 0) {
      const item = data.channel.item[0]; // Take the first result
      const definition = item.sense[0].definition;
      const pos = item.pos; // Part of speech
      const examples = item.sense[0].example ? item.sense[0].example.map((ex: any) => ex.text) : [];
      return { word, pos, definition, examples };
    }
    return null;
  } catch (error) {
    console.error("Error fetching from STDICT API:", error);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get('word');

  if (!word) {
    return NextResponse.json({ error: 'Word parameter is required' }, { status: 400 });
  }

  const stDictApiKey = process.env.STDICT_API_KEY;
  if (!stDictApiKey) {
    return NextResponse.json({ error: 'STDICT_API_KEY is not set' }, { status: 500 });
  }

  try {
    const result = await fetchFromStDict(word, stDictApiKey);
    if (result) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: 'No definition found for the word' }, { status: 404 });
    }
  } catch (error) {
    console.error("Error in /api/dict:", error);
    return NextResponse.json({ error: 'Failed to fetch dictionary data' }, { status: 500 });
  }
}
