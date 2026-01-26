import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getProjectContext } from '@/lib/git';
import { generateDailySummary, suggestTasks, checkTaskCompletion } from '@/lib/ai';
import { Prisma } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // 1. Fetch project details
    const project = await db.project.findUnique({
      where: { id: Number(projectId) }
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // 2. Extract context
    const contextData = getProjectContext(project.git_path || '', project.artifact_path || '');

    // Persist Git Logs to DB for Timeline/Calendar
    if (contextData.recentLogs.length > 0) {
      // Find existing logs to avoid duplicates
      const existingLogs = await db.log.findMany({
         where: { project_id: Number(projectId), type: 'git' },
         select: { metadata: true }
      });
      const seenHashes = new Set<string>();
      existingLogs.forEach((l: { metadata: string | null }) => {
         if (l.metadata) {
             try {
                 const m = JSON.parse(l.metadata);
                 if (m.hash) seenHashes.add(m.hash);
             } catch {}
         }
      });
      
      const newLogs = contextData.recentLogs.filter(l => !seenHashes.has(l.hash));
      
      if (newLogs.length > 0) {
           // Use createMany for efficiency
           await db.log.createMany({
               data: newLogs.map(log => ({
                   project_id: Number(projectId),
                   type: 'git',
                   content: log.message,
                   timestamp: new Date(log.date).toISOString(),
                   metadata: JSON.stringify({ hash: log.hash, author: log.author })
               }))
           });
      }
    }

    const contextString = `
GIT LOGS:
${contextData.recentLogs.map(l => `${l.date} [${l.hash}] ${l.message} (${l.author})`).join('\n')}

WALKTHROUGH:
${contextData.walkthrough || 'No walkthrough available.'}
    `;

    // 2.5 Fetch Active & Proposed Tasks for Completion Check
    // We treat 'added' and 'proposed' as candidates for completion.
    const candidates = await db.suggestedTask.findMany({
      where: {
        project_id: Number(projectId),
        status: { in: ['added', 'proposed'] }
      }
    });
    // 3. AI Analysis
    // Now running 3 AI jobs in parallel
    const [summaryObj, tasks, completedTaskIds] = await Promise.all([
      generateDailySummary(contextString),
      suggestTasks(contextString, process.env.APP_LANG || 'en'),
      checkTaskCompletion(contextString, candidates.map(t => ({ id: t.id, task: t.task })))
    ]);

    const { en: summaryEn, ja: summaryJa } = summaryObj;
    // Default content to English or APP_LANG preference
    const defaultContent = process.env.APP_LANG === 'ja' ? summaryJa : summaryEn;

    const date = new Date().toISOString().split('T')[0];

    // 4. Persistence
    await db.$transaction(async (tx: Prisma.TransactionClient) => {
      // Save Daily Note (upsert)
      await tx.dailyNote.upsert({
        where: {
          project_id_date: {
            project_id: Number(projectId),
            date: date
          }
        },
        update: { 
          content: defaultContent
        },
        create: {
          project_id: Number(projectId),
          date: date,
          content: defaultContent
        }
      });

      // Save Suggested Tasks (New ones)
      // Check if newly suggested task is actually one of the ones detected as completed (unlikely but possible)
      for (const task of tasks) {
        // If the AI suggests a task that it simultaneously says is completed, avoid proposing it or mark completed immediately?
        // Usually suggestion logic shouldn't suggest completed things.
        // We'll stick to standard saving.
        
        const exists = await tx.suggestedTask.findFirst({
          where: {
            project_id: Number(projectId),
            task: task
          }
        });
        
        if (!exists) {
            // Check if this new suggestion is coincidentally in the completed list (rare edge case - hard to check by ID since it's new)
            // Ideally we check by string here if needed, but 'completedTaskIds' are IDs.
            // Since it's new, it has no ID, so it can't be in completedTaskIds.
            await tx.suggestedTask.create({
                data: {
                project_id: Number(projectId),
                task: task,
                status: 'proposed'
                }
            });
        }
      }

      // Mark Completed Tasks (from existing DB candidates)
      if (completedTaskIds.length > 0) {
        await tx.suggestedTask.updateMany({
            where: {
                id: { in: completedTaskIds }
            },
            data: { status: 'completed' }
        });
      }
    });

    return NextResponse.json({ 
      success: true, 
      summary: defaultContent,
      summary_en: summaryEn,
      summary_ja: summaryJa,
      tasks,
      completedTaskIds: completedTaskIds
    });

  } catch (error: unknown) {
    console.error('Absorption Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
