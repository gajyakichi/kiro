
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { PluginDef } from '@/lib/plugins';

const PLUGINS_FILE = path.join(process.cwd(), 'plugins.json');

export async function GET() {
  try {
    let plugins: PluginDef[] = [];
    try {
      const data = await fs.readFile(PLUGINS_FILE, 'utf-8');
      plugins = JSON.parse(data);
    } catch {
      // Return empty if file doesn't exist
    }
    return NextResponse.json(plugins);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const newPlugin: PluginDef = await req.json();
    
    // Validate
    if (!newPlugin.id || !newPlugin.name) {
        return NextResponse.json({ error: 'Invalid plugin definition' }, { status: 400 });
    }

    let plugins: PluginDef[] = [];
    try {
      const data = await fs.readFile(PLUGINS_FILE, 'utf-8');
      plugins = JSON.parse(data);
    } catch {
      // ignore
    }

    // Check duplicate
    const exists = plugins.find(p => p.id === newPlugin.id);
    if (exists) {
        return NextResponse.json({ error: 'Plugin with this ID already exists' }, { status: 409 });
    }

    plugins.push(newPlugin);
    await fs.writeFile(PLUGINS_FILE, JSON.stringify(plugins, null, 2));

    return NextResponse.json({ success: true, plugins });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        let plugins: PluginDef[] = [];
        try {
            const data = await fs.readFile(PLUGINS_FILE, 'utf-8');
            plugins = JSON.parse(data);
        } catch {
            return NextResponse.json({ success: true });
        }

        const newPlugins = plugins.filter(p => p.id !== id);
        await fs.writeFile(PLUGINS_FILE, JSON.stringify(newPlugins, null, 2));

        return NextResponse.json({ success: true, plugins: newPlugins });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
