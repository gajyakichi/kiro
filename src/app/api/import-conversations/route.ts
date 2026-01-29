import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import db from '@/lib/db';

interface KnowledgeMetadata {
  summary: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
  conversation_id?: string;
}

interface ConversationCandidate {
  id: string;
  title: string;
  summary: string;
  date: string;
  knowledgePath: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Scan Antigravity Knowledge Items
    const knowledgeDir = path.join(os.homedir(), '.gemini', 'antigravity', 'knowledge');
    
    if (!fs.existsSync(knowledgeDir)) {
      return NextResponse.json({ candidates: [] });
    }

    const candidates: ConversationCandidate[] = [];
    const kiDirs = fs.readdirSync(knowledgeDir);

    for (const kiName of kiDirs) {
      const kiPath = path.join(knowledgeDir, kiName);
      const metadataPath = path.join(kiPath, 'metadata.json');
      
      if (!fs.existsSync(metadataPath)) continue;

      try {
        const metadata: KnowledgeMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        const date = new Date(metadata.created_at).toISOString().split('T')[0];

        // Check if already imported
        const existing = await db.conversationLog.findFirst({
          where: {
            project_id: parseInt(projectId),
            metadata: {
              contains: kiName // Use KI name as unique identifier
            }
          }
        });

        if (!existing) {
          candidates.push({
            id: kiName,
            title: kiName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            summary: metadata.summary || 'No summary available',
            date: date,
            knowledgePath: kiPath
          });
        }
      } catch (e) {
        console.error(`Failed to read metadata for ${kiName}:`, e);
      }
    }

    return NextResponse.json({ candidates });

  } catch (error: unknown) {
    console.error('Scan Antigravity Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { projectId, candidates } = await req.json();
    
    if (!projectId || !Array.isArray(candidates)) {
      return NextResponse.json({ 
        error: 'projectId and candidates array are required' 
      }, { status: 400 });
    }

    const imported = [];

    for (const candidate of candidates) {
      try {
        const conversation = await db.conversationLog.create({
          data: {
            project_id: parseInt(projectId),
            date: candidate.date,
            agent: 'Antigravity',
            summary: candidate.summary,
            full_text: null,
            metadata: JSON.stringify({ kiName: candidate.id, kiPath: candidate.knowledgePath })
          }
        });
        imported.push(conversation);
      } catch (e) {
        console.error(`Failed to import ${candidate.id}:`, e);
      }
    }

    return NextResponse.json({ 
      success: true, 
      imported: imported.length,
      conversations: imported
    });

  } catch (error: unknown) {
    console.error('Import Conversations Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
