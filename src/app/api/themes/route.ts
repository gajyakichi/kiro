import { NextResponse } from "next/server";
import db from "@/lib/db";
import { Theme } from "@/lib/types";

export async function GET() {
  try {
    const themes = db.prepare('SELECT * FROM themes ORDER BY created_at DESC').all() as any[];
    // Convert active INTEGER to boolean
    const formattedThemes = themes.map(t => ({
      ...t,
      active: !!t.active
    }));
    return NextResponse.json(formattedThemes);
  } catch (error) {
    console.error("Theme Fetch Error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const { name, css } = await request.json();
    const insert = db.prepare(`
      INSERT INTO themes (name, css, active) 
      VALUES (?, ?, 0)
    `);
    const info = insert.run(name, css);
    return NextResponse.json({ success: true, id: info.lastInsertRowid });
  } catch (error) {
    console.error("Theme Create Error:", error);
    return NextResponse.json({ error: "Failed to create theme" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, name, css, active } = await request.json();
    if (id === undefined) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    // Handle "Reset to Original" (Deactivate all)
    if (id === -1) {
      db.prepare('UPDATE themes SET active = 0').run();
      return NextResponse.json({ success: true });
    }

    // If setting a theme as active, deactivate others
    if (active) {
      db.prepare('UPDATE themes SET active = 0').run();
    }

    const update = db.prepare(`
      UPDATE themes 
      SET name = COALESCE(?, name), css = COALESCE(?, css), active = ?
      WHERE id = ?
    `);
    update.run(name || null, css || null, active ? 1 : 0, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Theme Update Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    
    db.prepare('DELETE FROM themes WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Theme Delete Error:", error);
    return NextResponse.json({ error: "Failed to delete theme" }, { status: 500 });
  }
}
