import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getProjectContext } from '@/lib/git';
import { generateDailySummary, suggestTasks } from '@/lib/ai';
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

    // 3. AI Analysis
    const [summaryObj, tasks] = await Promise.all([
      generateDailySummary(contextString),
      suggestTasks(contextString, process.env.APP_LANG || 'en')
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

      // Save Suggested Tasks
      for (const task of tasks) {
        const exists = await tx.suggestedTask.findFirst({
          where: {
            project_id: Number(projectId),
            task: task,
            status: 'proposed'
          }
        });
        if (!exists) {
          await tx.suggestedTask.create({
            data: {
              project_id: Number(projectId),
              task: task,
              status: 'proposed'
            }
          });
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      summary: defaultContent,
      summary_en: summaryEn,
      summary_ja: summaryJa,
      tasks 
    });

  } catch (error: unknown) {
    console.error('Absorption Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
