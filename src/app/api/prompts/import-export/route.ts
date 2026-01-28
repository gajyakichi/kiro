import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'kaihatsunote.db');

type PromptExport = {
  name: string;
  description: string | null;
  system_prompt: string;
};

// GET - Export all custom prompts (excluding defaults)
export async function GET() {
  try {
    const db = new Database(DB_PATH);
    const prompts = db.prepare('SELECT name, description, system_prompt FROM prompts WHERE is_default = 0').all() as PromptExport[];
    db.close();
    
    const exportData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      prompts
    };
    
    return NextResponse.json(exportData);
  } catch (error) {
    console.error('Error exporting prompts:', error);
    return NextResponse.json({ error: 'Failed to export prompts' }, { status: 500 });
  }
}

// POST - Import prompts from file
export async function POST(req: Request) {
  try {
    const { prompts } = await req.json();
    
    if (!Array.isArray(prompts)) {
      return NextResponse.json({ error: 'Invalid import format. Expected array of prompts.' }, { status: 400 });
    }
    
    const db = new Database(DB_PATH);
    let imported = 0;
    let skipped = 0;
    
    for (const prompt of prompts) {
      if (!prompt.name || !prompt.system_prompt) {
        skipped++;
        continue;
      }
      
      try {
        // Check if prompt with same name exists
        const existing = db.prepare('SELECT id FROM prompts WHERE name = ?').get(prompt.name);
        
        if (existing) {
          skipped++;
          continue;
        }
        
        db.prepare(`
          INSERT INTO prompts (name, description, system_prompt, is_active, is_default)
          VALUES (?, ?, ?, 0, 0)
        `).run(prompt.name, prompt.description || null, prompt.system_prompt);
        
        imported++;
      } catch (e) {
        console.error(`Failed to import prompt: ${prompt.name}`, e);
        skipped++;
      }
    }
    
    db.close();
    
    return NextResponse.json({ 
      success: true, 
      imported, 
      skipped,
      message: `Imported ${imported} prompts, skipped ${skipped}`
    });
  } catch (error) {
    console.error('Error importing prompts:', error);
    return NextResponse.json({ error: 'Failed to import prompts' }, { status: 500 });
  }
}
