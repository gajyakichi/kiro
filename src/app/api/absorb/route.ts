import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { Project } from '@/lib/types';
import { getProjectContext } from '@/lib/git';
import { generateDailySummary, suggestTasks } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // 1. Fetch project details
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as Project;
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 2. Extract context
    const contextData = getProjectContext(project.git_path, project.artifact_path);
    const contextString = `
GIT LOGS:
${contextData.recentLogs.map(l => `${l.date} [${l.hash}] ${l.message} (${l.author})`).join('\n')}

WALKTHROUGH:
${contextData.walkthrough || 'No walkthrough available.'}
    `;

    // 3. AI Analysis
    const [summary, tasks] = await Promise.all([
      generateDailySummary(contextString),
      suggestTasks(contextString)
    ]);

    const date = new Date().toISOString().split('T')[0];

    // 4. Persistence
    const transaction = db.transaction(() => {
      // Save Daily Note (overwrite for same day or keep multiple? Let's overwrite/update to keep it simple for now)
      db.prepare(`
        INSERT INTO daily_notes (project_id, date, content)
        VALUES (?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET content = excluded.content
      `).run(projectId, date, summary);
      // Wait, SQLite ON CONFLICT(id) works, but we don't have a unique constraint on (project_id, date).
      // Let's use a simpler approach: check if exists, then update or insert.
      
      const existingNote = db.prepare('SELECT id FROM daily_notes WHERE project_id = ? AND date = ?').get(projectId, date) as { id: number } | undefined;
      if (existingNote) {
        db.prepare('UPDATE daily_notes SET content = ? WHERE id = ?').run(summary, existingNote.id);
      } else {
        db.prepare('INSERT INTO daily_notes (project_id, date, content) VALUES (?, ?, ?)').run(projectId, date, summary);
      }

      // Save Suggested Tasks (avoid duplicates if possible)
      const insertTask = db.prepare('INSERT INTO suggested_tasks (project_id, task, status) VALUES (?, ?, ?)');
      for (const task of tasks) {
        // Simple duplicate check
        const exists = db.prepare('SELECT id FROM suggested_tasks WHERE project_id = ? AND task = ? AND status = "proposed"').get(projectId, task);
        if (!exists) {
          insertTask.run(projectId, task, 'proposed');
        }
      }
    });

    transaction();

    return NextResponse.json({ 
      success: true, 
      summary, 
      tasks 
    });

  } catch (error: unknown) {
    console.error('Absorption Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
