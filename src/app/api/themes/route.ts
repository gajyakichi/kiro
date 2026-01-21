import { NextResponse } from "next/server";
import db from "@/lib/db";

interface ThemeRow {
  id: number;
  name: string;
  css: string;
  active: number;
}

export async function GET() {
  try {
    let themes = db.prepare('SELECT * FROM themes ORDER BY created_at DESC').all() as ThemeRow[];
    
    // Auto-seed if empty
    if (themes.length === 0) {
      const presets = [
        { name: 'Darcula', css: 'body { background: #2b2b2b !important; color: #a9b7c6 !important; } .notion-sidebar { background: #3c3f41 !important; } .notion-card { background: #313335 !important; border: 1px solid #4e5052 !important; } .notion-item:hover, .notion-item.active { background: #4e5254 !important; color: #cc7832 !important; }' },
        { name: 'Monokai', css: 'body { background: #272822 !important; color: #f8f8f2 !important; } .notion-sidebar { background: #1e1f1c !important; } .notion-card { background: #23241f !important; border: 1px solid #49483e !important; } .notion-item:hover, .notion-item.active { background: #3e3d32 !important; color: #f92672 !important; }' },
        { name: 'Nord', css: 'body { background: #2e3440 !important; color: #d8dee9 !important; } .notion-sidebar { background: #3b4252 !important; } .notion-card { background: #434c5e !important; border: 1px solid #4c566a !important; } .notion-item:hover, .notion-item.active { background: #4c566a !important; color: #88c0d0 !important; }' }
      ];
      const insert = db.prepare('INSERT INTO themes (name, css, active) VALUES (?, ?, 0)');
      presets.forEach(p => insert.run(p.name, p.css));
      themes = db.prepare('SELECT * FROM themes ORDER BY created_at DESC').all() as ThemeRow[];
    }

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
