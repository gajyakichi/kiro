import { NextResponse } from "next/server";
import db from "@/lib/db";
import { Comment } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
        return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const comments = db.prepare('SELECT * FROM comments WHERE project_id = ? ORDER BY timestamp ASC').all(projectId) as Comment[];
    return NextResponse.json(comments);
  } catch (error) {
    console.error("Comments API Error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const { text, projectId } = await request.json();
    if (!projectId) {
        return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const insert = db.prepare('INSERT INTO comments (project_id, text) VALUES (?, ?)');
    const info = insert.run(projectId, text);
    
    const comments = db.prepare('SELECT * FROM comments WHERE project_id = ? ORDER BY timestamp ASC').all(projectId) as Comment[];
    return NextResponse.json({ success: true, notes: comments, id: info.lastInsertRowid });
  } catch (error) {
    console.error("Comments Post API Error:", error);
    return NextResponse.json({ error: "Failed to save comment" }, { status: 500 });
  }
}
