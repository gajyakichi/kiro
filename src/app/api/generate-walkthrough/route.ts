import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getChatCompletion } from '@/lib/ai';
import fs from 'fs';
import path from 'path';

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

    // 2. Collect all Daily Notes
    const dailyNotes = await db.dailyNote.findMany({
      where: { project_id: Number(projectId) },
      orderBy: { date: 'asc' }
    });

    // 3. Collect all Conversation Logs
    const conversations = await db.conversationLog.findMany({
      where: { project_id: Number(projectId) },
      orderBy: { timestamp: 'asc' }
    });

    // 4. Build comprehensive context
    const dailyNotesContext = dailyNotes.map(note => 
      `## ${note.date}\n${note.content}`
    ).join('\n\n');

    const conversationsContext = conversations.map(conv =>
      `### [${conv.agent}] ${new Date(conv.timestamp).toISOString().split('T')[0]}\n${conv.summary}${conv.full_text ? '\n' + conv.full_text : ''}`
    ).join('\n\n');

    const context = `
# Project: ${project.name}

## Daily Notes
${dailyNotesContext || 'No daily notes available yet.'}

## AI Agent Conversations
${conversationsContext || 'No conversations recorded yet.'}
    `.trim();

    // 5. Generate walkthrough with AI
    const walkthroughContent = await getChatCompletion([
      {
        role: "system",
        content: `You are a technical documentation writer. Generate a comprehensive project walkthrough document based on the provided daily notes and conversation logs.

The walkthrough should:
1. Start with a clear project overview
2. Describe the architecture and key components
3. Document the development journey chronologically
4. Highlight important decisions and discussions
5. Include next steps or future considerations

Format the output as a well-structured Markdown document suitable for a README or documentation file.`
      },
      {
        role: "user",
        content: context
      }
    ]);

    if (!walkthroughContent) {
      throw new Error("Failed to generate walkthrough content");
    }

    // 6. Save walkthrough to project directory
    const projectRoot = project.git_path || process.cwd();
    const docsDir = path.join(projectRoot, 'docs');
    const walkthroughPath = path.join(docsDir, 'walkthrough.md');

    // Ensure docs directory exists
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    // Write walkthrough file
    fs.writeFileSync(walkthroughPath, walkthroughContent, 'utf8');

    console.log(`✅ Walkthrough generated: ${walkthroughPath}`);

    return NextResponse.json({
      success: true,
      path: walkthroughPath,
      content: walkthroughContent
    });

  } catch (error: unknown) {
    console.error('Generate Walkthrough Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
