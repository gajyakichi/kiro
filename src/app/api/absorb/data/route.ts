import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
  }

  try {
    const dailyNotes = db.prepare('SELECT * FROM daily_notes WHERE project_id = ? ORDER BY date DESC').all(projectId);
    const suggestedTasks = db.prepare('SELECT * FROM suggested_tasks WHERE project_id = ? AND status = "proposed" ORDER BY timestamp DESC').all(projectId);

    return NextResponse.json({
      dailyNotes,
      suggestedTasks
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
