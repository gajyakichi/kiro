import { NextResponse } from 'next/server';
import { getChatCompletion } from '@/lib/ai';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'kaihatsunote.db');

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    // Get active system prompt from database
    const db = new Database(DB_PATH);
    const activePrompt = db.prepare('SELECT system_prompt FROM prompts WHERE is_active = 1').get() as { system_prompt: string } | undefined;
    db.close();

    // Inject system prompt at the beginning if it doesn't exist
    const hasSystemMessage = messages.some((msg: { role: string }) => msg.role === 'system');
    
    let finalMessages = messages;
    if (!hasSystemMessage && activePrompt) {
      finalMessages = [
        { role: 'system', content: activePrompt.system_prompt },
        ...messages
      ];
    }

    const content = await getChatCompletion(finalMessages);
    
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
