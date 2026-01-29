import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'kaihatsunote.db');

// POST - Set active prompt
export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    
    if (!id) {
      return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 });
    }
    
    const db = new Database(DB_PATH);
    
    // Deactivate all prompts
    db.prepare('UPDATE prompts SET is_active = 0').run();
    
    // Activate the selected prompt
    db.prepare('UPDATE prompts SET is_active = 1 WHERE id = ?').run(id);
    
    const activePrompt = db.prepare('SELECT * FROM prompts WHERE id = ?').get(id);
    db.close();
    
    return NextResponse.json(activePrompt);
  } catch (error) {
    console.error('Error setting active prompt:', error);
    return NextResponse.json({ error: 'Failed to set active prompt' }, { status: 500 });
  }
}

// GET - Get active prompt
export async function GET() {
  try {
    const db = new Database(DB_PATH);
    const activePrompt = db.prepare('SELECT * FROM prompts WHERE is_active = 1').get();
    db.close();
    
    if (!activePrompt) {
      return NextResponse.json({ error: 'No active prompt found' }, { status: 404 });
    }
    
    return NextResponse.json(activePrompt);
  } catch (error) {
    console.error('Error getting active prompt:', error);
    return NextResponse.json({ error: 'Failed to get active prompt' }, { status: 500 });
  }
}
