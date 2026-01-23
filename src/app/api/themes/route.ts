import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    let themes = await db.theme.findMany({
      orderBy: { id: 'desc' }
    });
    
    // Auto-seed if empty
    if (themes.length === 0) {
      const presets = [
        { name: 'Darcula', css: 'body { background: #2b2b2b !important; color: #a9b7c6 !important; } .notion-sidebar { background: #3c3f41 !important; } .notion-card { background: #313335 !important; border: 1px solid #4e5052 !important; color: #a9b7c6 !important; } .notion-item:hover, .notion-item.active { background: #4e5254 !important; color: #cc7832 !important; } .notion-text-subtle { color: #808080 !important; } h1, h2, h3 { color: #cc7832 !important; } .accent-text { color: #cc7832 !important; }' },
        { name: 'Monokai', css: 'body { background: #272822 !important; color: #f8f8f2 !important; } .notion-sidebar { background: #1e1f1c !important; } .notion-card { background: #23241f !important; border: 1px solid #49483e !important; color: #f8f8f2 !important; } .notion-item:hover, .notion-item.active { background: #3e3d32 !important; color: #f92672 !important; } .notion-text-subtle { color: #88846f !important; } h1, h2, h3 { color: #ae81ff !important; } .accent-text { color: #a6e22e !important; }' },
        { name: 'Nord', css: 'body { background: #2e3440 !important; color: #d8dee9 !important; } .notion-sidebar { background: #3b4252 !important; } .notion-card { background: #434c5e !important; border: 1px solid #4c566a !important; color: #eceff4 !important; } .notion-item:hover, .notion-item.active { background: #4c566a !important; color: #88c0d0 !important; } .notion-text-subtle { color: #616e88 !important; } h1, h2, h3 { color: #81a1c1 !important; } .accent-text { color: #88c0d0 !important; }' }
      ];
      
      await db.theme.createMany({
        data: presets.map(p => ({ ...p, active: false }))
      });
      
      themes = await db.theme.findMany({
        orderBy: { id: 'desc' }
      });
    }

    return NextResponse.json(themes);
  } catch (error) {
    console.error("Theme Fetch Error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const { name, css } = await request.json();
    const theme = await db.theme.create({
      data: {
        name,
        css,
        active: false
      }
    });
    return NextResponse.json({ success: true, id: theme.id });
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
      await db.theme.updateMany({
        data: { active: false }
      });
      return NextResponse.json({ success: true });
    }

    // If setting a theme as active, deactivate others
    if (active) {
      await db.theme.updateMany({
        data: { active: false }
      });
    }

    await db.theme.update({
      where: { id: Number(id) },
      data: {
        name: name || undefined,
        css: css || undefined,
        active: active ?? undefined
      }
    });
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
    
    await db.theme.delete({
      where: { id: Number(id) }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Theme Delete Error:", error);
    return NextResponse.json({ error: "Failed to delete theme" }, { status: 500 });
  }
}
