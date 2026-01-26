import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  try {
    const dailyNotes = await db.dailyNote.findMany({
      where: { project_id: Number(projectId) },
      orderBy: { date: 'desc' }
    });
    const suggestedTasks = await db.suggestedTask.findMany({
      where: { 
        project_id: Number(projectId)
      },
      orderBy: { timestamp: 'desc' }
    });

    return NextResponse.json({
      dailyNotes,
      suggestedTasks
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
