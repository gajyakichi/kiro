import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const ENV_FILE = path.join(process.cwd(), ".env");

export async function GET() {
  try {
    return NextResponse.json({
      STORAGE_MODE: process.env.STORAGE_MODE || "local",
      DATABASE_URL: process.env.DATABASE_URL || "file:./prisma.db",
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
      AI_MODEL: process.env.AI_MODEL || "gpt-4o-mini",
      AI_PROVIDER: process.env.AI_PROVIDER || "openai",
      OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
      VAULT_PATH: process.env.VAULT_PATH || "",
      APP_LANG: process.env.APP_LANG || "en",
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { STORAGE_MODE, DATABASE_URL, OPENAI_API_KEY, AI_MODEL, VAULT_PATH, AI_PROVIDER, OLLAMA_BASE_URL, APP_LANG } = await request.json();
    
    // Read current .env
    let envContent = "";
    try {
      envContent = await fs.readFile(ENV_FILE, "utf-8");
    } catch {
      // Create if doesn't exist
    }

    const lines = envContent.split("\n");
    const newLines: string[] = [];
    const keysHandled = new Set();

    for (const line of lines) {
      if (line.startsWith("STORAGE_MODE=")) {
        newLines.push(`STORAGE_MODE="${STORAGE_MODE}"`);
        keysHandled.add("STORAGE_MODE");
      } else if (line.startsWith("DATABASE_URL=")) {
        newLines.push(`DATABASE_URL="${DATABASE_URL}"`);
        keysHandled.add("DATABASE_URL");
      } else if (line.startsWith("OPENAI_API_KEY=")) {
        newLines.push(`OPENAI_API_KEY="${OPENAI_API_KEY}"`);
        keysHandled.add("OPENAI_API_KEY");
      } else if (line.startsWith("AI_MODEL=")) {
        newLines.push(`AI_MODEL="${AI_MODEL}"`);
        keysHandled.add("AI_MODEL");
      } else if (line.startsWith("VAULT_PATH=")) {
        newLines.push(`VAULT_PATH="${VAULT_PATH}"`);
        keysHandled.add("VAULT_PATH");
      } else if (line.startsWith("AI_PROVIDER=")) {
        newLines.push(`AI_PROVIDER="${AI_PROVIDER}"`);
        keysHandled.add("AI_PROVIDER");
      } else if (line.startsWith("OLLAMA_BASE_URL=")) {
        newLines.push(`OLLAMA_BASE_URL="${OLLAMA_BASE_URL}"`);
        keysHandled.add("OLLAMA_BASE_URL");
      } else if (line.startsWith("APP_LANG=")) {
        newLines.push(`APP_LANG="${APP_LANG}"`);
        keysHandled.add("APP_LANG");
      } else {
        newLines.push(line);
      }
    }

    if (!keysHandled.has("STORAGE_MODE")) {
      newLines.push(`STORAGE_MODE="${STORAGE_MODE}"`);
    }
    if (!keysHandled.has("DATABASE_URL")) {
      newLines.push(`DATABASE_URL="${DATABASE_URL}"`);
    }
    if (!keysHandled.has("OPENAI_API_KEY")) {
      newLines.push(`OPENAI_API_KEY="${OPENAI_API_KEY}"`);
    }
    if (!keysHandled.has("AI_MODEL")) {
      newLines.push(`AI_MODEL="${AI_MODEL}"`);
    }
    if (!keysHandled.has("VAULT_PATH")) {
      newLines.push(`VAULT_PATH="${VAULT_PATH}"`);
    }
    if (!keysHandled.has("AI_PROVIDER")) {
      newLines.push(`AI_PROVIDER="${AI_PROVIDER}"`);
    }
    if (!keysHandled.has("OLLAMA_BASE_URL")) {
      newLines.push(`OLLAMA_BASE_URL="${OLLAMA_BASE_URL}"`);
    }
    if (!keysHandled.has("APP_LANG")) {
      newLines.push(`APP_LANG="${APP_LANG}"`);
    }

    await fs.writeFile(ENV_FILE, newLines.join("\n"));

    return NextResponse.json({ success: true, message: "Settings saved. Restart the application for changes to take effect." });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
