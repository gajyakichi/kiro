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
    const candidateStrings = candidates.map(t => t.task);

    // 3. AI Analysis
    // Now running 3 AI jobs in parallel
    const [summaryObj, tasks, completedTaskStrings] = await Promise.all([
      generateDailySummary(contextString),
      suggestTasks(contextString, process.env.APP_LANG || 'en'),
      checkTaskCompletion(contextString, candidateStrings)
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
          content: defaultContent,
          content_en: summaryEn,
          content_ja: summaryJa
        },
        create: {
          project_id: Number(projectId),
          date: date,
          content: defaultContent,
          content_en: summaryEn,
          content_ja: summaryJa
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
            // Check if this new suggestion is coincidentally in the completed list (rare edge case)
            const isCompleted = completedTaskStrings.includes(task);
            await tx.suggestedTask.create({
                data: {
                project_id: Number(projectId),
                task: task,
                status: isCompleted ? 'completed' : 'proposed'
                }
            });
        }
      }

      // Mark Completed Tasks (from existing DB candidates)
      for (const t of candidates) {
        if (completedTaskStrings.includes(t.task)) {
          await tx.suggestedTask.update({
             where: { id: t.id },
             data: { status: 'completed' }
          });
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      summary: defaultContent,
      summary_en: summaryEn,
      summary_ja: summaryJa,
      tasks,
      completedTasks: completedTaskStrings
    });

  } catch (error: unknown) {
    console.error('Absorption Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
