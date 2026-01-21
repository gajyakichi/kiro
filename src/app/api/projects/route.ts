import { NextResponse } from "next/server";
import db from "@/lib/db";
import { Project } from "@/lib/types";

export async function GET() {
  try {
    const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all() as Project[];
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Project Fetch Error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const { name, git_path, artifact_path, icon } = await request.json();
    const insert = db.prepare(`
      INSERT INTO projects (name, git_path, artifact_path, icon) 
      VALUES (?, ?, ?, ?)
    `);
    const info = insert.run(name, git_path, artifact_path, icon || null);
    return NextResponse.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    console.error("Project Create Error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    const { id, name, git_path, artifact_path, icon } = data;
    
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    console.log("Updating project:", { id, name, git_path, artifact_path, icon });

    const update = db.prepare(`
      UPDATE projects 
      SET name = ?, git_path = ?, artifact_path = ?, icon = ?
      WHERE id = ?
    `);
    
    // Use fallback to existing values or empty strings to avoid NOT NULL constraints if missing
    // Actually, it's better to just log what's missing.
    if (!name || !git_path || !artifact_path) {
        console.error("Missing required fields for update:", { name, git_path, artifact_path });
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    update.run(name, git_path, artifact_path, icon || null, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Project Update Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });
        
        db.prepare('DELETE FROM projects WHERE id = ?').run(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Project Delete Error:", error);
        return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
    }
}
