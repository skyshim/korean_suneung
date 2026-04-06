import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.wordEntry.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Word deleted successfully' });
  } catch (error) {
    console.error("Error deleting word:", error);
    return NextResponse.json({ error: 'Failed to delete word' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await context.params;
    const { id } = resolvedParams;
    const { word, pos, definition, examples } = await request.json();

    if (!id || !word || !pos || !definition) {
      return NextResponse.json({ error: 'ID, word, pos, and definition are required' }, { status: 400 });
    }

    const updatedWord = await prisma.wordEntry.update({
      where: { id },
      data: { word, pos, definition, examples },
    });

    return NextResponse.json(updatedWord);
  } catch (error) {
    console.error("Error updating word:", error);
    return NextResponse.json({ error: 'Failed to update word' }, { status: 500 });
  }
}
