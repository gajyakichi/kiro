import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const ENV_FILE = path.join(process.cwd(), ".env");

export async function GET() {
  try {
    const currentSettings: Record<string, string> = {
      STORAGE_MODE: "local",
      DATABASE_URL: "file:./prisma.db",
      OPENAI_API_KEY: "",
      AI_MODEL: "gpt-4o-mini",
      AI_PROVIDER: "openai",
      OLLAMA_BASE_URL: "http://localhost:11434",
      VAULT_PATH: "",
      APP_LANG: "en",
      APP_ICON_SET: "lucide",
    };

    try {
      const envContent = await fs.readFile(ENV_FILE, "utf-8");
      const lines = envContent.split("\n");
      for (const line of lines) {
        if (!line || line.startsWith("#")) continue;
        const [key, ...rest] = line.split("=");
        if (key && rest.length > 0) {
          let value = rest.join("=").trim();
          // Remove wrapping quotes if present
          if (value.startsWith('"') && value.endsWith('"')) value = value.substring(1, value.length - 1);
          if (value.startsWith("'") && value.endsWith("'")) value = value.substring(1, value.length - 1);
          currentSettings[key.trim()] = value;
        }
      }
    } catch {
      // Use defaults if file missing
    }

    return NextResponse.json(currentSettings);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { STORAGE_MODE, DATABASE_URL, OPENAI_API_KEY, AI_MODEL, VAULT_PATH, AI_PROVIDER, OLLAMA_BASE_URL, APP_LANG, APP_ICON_SET } = await request.json();
    
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
      } else if (line.startsWith("APP_ICON_SET=")) {
        newLines.push(`APP_ICON_SET="${APP_ICON_SET}"`);
        keysHandled.add("APP_ICON_SET");
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
    if (!keysHandled.has("APP_ICON_SET")) {
      newLines.push(`APP_ICON_SET="${APP_ICON_SET}"`);
    }

    await fs.writeFile(ENV_FILE, newLines.join("\n"));

    return NextResponse.json({ success: true, message: "Settings saved. Restart the application for changes to take effect." });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
