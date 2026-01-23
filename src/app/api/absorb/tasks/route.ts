import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PATCH(req: NextRequest) {
  try {
    const { taskId, status } = await req.json();

    if (!taskId || !status) {
      return NextResponse.json({ error: 'Task ID and status are required' }, { status: 400 });
    }

    await db.suggestedTask.update({
      where: { id: Number(taskId) },
      data: { status }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
