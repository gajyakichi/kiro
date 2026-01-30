import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'kaihatsunote.db');

type Prompt = {
  id: number;
  name: string;
  description: string | null;
  system_prompt: string;
  is_active: number;
  is_default: number;
  created_at: string;
  updated_at: string;
};

// GET - Retrieve all prompts
export async function GET() {
  try {
    const db = new Database(DB_PATH);
    
    // Ensure table exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS prompts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        system_prompt TEXT NOT NULL,
        is_active INTEGER DEFAULT 0,
        is_default INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const prompts = db.prepare('SELECT * FROM prompts ORDER BY is_default DESC, name ASC').all() as Prompt[];
    db.close();
    
    return NextResponse.json(prompts);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 });
  }
}

// POST - Create a new prompt
export async function POST(req: Request) {
  try {
    const { name, description, system_prompt } = await req.json();
    
    if (!name || !system_prompt) {
      return NextResponse.json({ error: 'Name and system_prompt are required' }, { status: 400 });
    }
    
    const db = new Database(DB_PATH);
    const result = db.prepare(`
      INSERT INTO prompts (name, description, system_prompt, is_active, is_default)
      VALUES (?, ?, ?, 0, 0)
    `).run(name, description || null, system_prompt);
    
    const newPrompt = db.prepare('SELECT * FROM prompts WHERE id = ?').get(result.lastInsertRowid) as Prompt;
    db.close();
    
    return NextResponse.json(newPrompt);
  } catch (error) {
    console.error('Error creating prompt:', error);
    return NextResponse.json({ error: 'Failed to create prompt' }, { status: 500 });
  }
}

// PUT - Update a prompt
export async function PUT(req: Request) {
  try {
    const { id, name, description, system_prompt } = await req.json();
    
    if (!id || !name || !system_prompt) {
      return NextResponse.json({ error: 'ID, name, and system_prompt are required' }, { status: 400 });
    }
    
    const db = new Database(DB_PATH);
    
    // Check if it's a default prompt
    const existing = db.prepare('SELECT is_default FROM prompts WHERE id = ?').get(id) as { is_default: number } | undefined;
    if (existing?.is_default === 1) {
      db.close();
      return NextResponse.json({ error: 'Cannot edit default prompts' }, { status: 403 });
    }
    
    db.prepare(`
      UPDATE prompts 
      SET name = ?, description = ?, system_prompt = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, description || null, system_prompt, id);
    
    const updatedPrompt = db.prepare('SELECT * FROM prompts WHERE id = ?').get(id) as Prompt;
    db.close();
    
    return NextResponse.json(updatedPrompt);
  } catch (error) {
    console.error('Error updating prompt:', error);
    return NextResponse.json({ error: 'Failed to update prompt' }, { status: 500 });
  }
}

// DELETE - Delete a prompt
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    const db = new Database(DB_PATH);
    
    // Check if it's a default prompt or active
    const existing = db.prepare('SELECT is_default, is_active FROM prompts WHERE id = ?').get(id) as { is_default: number; is_active: number } | undefined;
    
    if (!existing) {
      db.close();
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }
    
    if (existing.is_default === 1) {
      db.close();
      return NextResponse.json({ error: 'Cannot delete default prompts' }, { status: 403 });
    }
    
    if (existing.is_active === 1) {
      db.close();
      return NextResponse.json({ error: 'Cannot delete active prompt. Activate another prompt first.' }, { status: 403 });
    }
    
    db.prepare('DELETE FROM prompts WHERE id = ?').run(id);
    db.close();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    return NextResponse.json({ error: 'Failed to delete prompt' }, { status: 500 });
  }
}
