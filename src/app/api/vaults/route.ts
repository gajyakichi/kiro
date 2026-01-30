import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { reconfigureDb } from "@/lib/db";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const VAULTS_FILE = path.join(process.cwd(), "vaults.json");
const ENV_FILE = path.join(process.cwd(), ".env");

interface Vault {
  id: string;
  name: string;
  path: string;
  active: boolean;
}

const SCHEMA_QUERIES = [
  `CREATE TABLE IF NOT EXISTS "Project" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL, "icon" TEXT, "git_path" TEXT, "artifact_path" TEXT)`,
  `CREATE TABLE IF NOT EXISTS "Log" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "project_id" INTEGER NOT NULL, "content" TEXT NOT NULL, "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Log_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS "SuggestedTask" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "project_id" INTEGER NOT NULL, "title" TEXT NOT NULL, "description" TEXT, "status" TEXT NOT NULL DEFAULT 'proposed', "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "SuggestedTask_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS "ConversationLog" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "project_id" INTEGER NOT NULL, "summary" TEXT NOT NULL, "detail" TEXT, "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ConversationLog_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS "DailyNote" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "project_id" INTEGER NOT NULL, "date" TEXT NOT NULL, "content" TEXT NOT NULL, "content_en" TEXT, "content_ja" TEXT, "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "DailyNote_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "DailyNote_project_id_date_key" ON "DailyNote"("project_id", "date")`,
  `CREATE TABLE IF NOT EXISTS "Comment" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "project_id" INTEGER NOT NULL, "file_path" TEXT NOT NULL, "line_number" INTEGER NOT NULL, "content" TEXT NOT NULL, "resolved" BOOLEAN NOT NULL DEFAULT 0, "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Comment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS "AbsorbCache" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "project_id" INTEGER NOT NULL, "file_path" TEXT NOT NULL, "file_hash" TEXT NOT NULL, "summary_content" TEXT NOT NULL, "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "AbsorbCache_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "AbsorbCache_project_id_file_path_key" ON "AbsorbCache"("project_id", "file_path")`,
  `CREATE TABLE IF NOT EXISTS "prompts" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL, "content" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)`
];

async function initVaultDb(vaultPath: string) {
    const dbPath = path.join(vaultPath, 'kiro.db');
    console.log(`[API] 🛠️ Initializing DB Tables at: ${dbPath}`);
    
    let prisma: PrismaClient | null = null;
    try {
        const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
        prisma = new PrismaClient({ adapter });

        for (const query of SCHEMA_QUERIES) {
            await prisma.$executeRawUnsafe(query);
        }
        console.log(`[API] ✅ DB Initialization Complete`);
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[API] ❌ DB Init Failed:`, msg);
    } finally {
        if (prisma) await prisma.$disconnect();
    }
}

async function readVaults(): Promise<Vault[]> {
  try {
    const data = await fs.readFile(VAULTS_FILE, "utf-8");
    return JSON.parse(data) as Vault[];
  } catch {
    return [];
  }
}

async function writeVaults(vaults: Vault[]) {
  await fs.writeFile(VAULTS_FILE, JSON.stringify(vaults, null, 2));
}

async function updateEnv(vaultPath: string) {
  try {
    const envContent = await fs.readFile(ENV_FILE, "utf-8");
    const lines = envContent.split("\n");
    const newLines = lines.map(line => {
      if (line.startsWith("VAULT_PATH=")) {
        return `VAULT_PATH="${vaultPath}"`;
      }
      return line;
    });

    if (!lines.some(l => l.startsWith("VAULT_PATH="))) {
      newLines.push(`VAULT_PATH="${vaultPath}"`);
    }

    await fs.writeFile(ENV_FILE, newLines.join("\n"));
  } catch (error) {
    console.error("Failed to update .env", error);
  }
}

export async function GET() {
  const vaults = await readVaults();
  return NextResponse.json(vaults);
}

export async function POST(request: Request) {
  try {
    const { name, path: vPath, type } = await request.json(); // type: 'internal' | 'external'
    const vaults = await readVaults();
    
    let finalPath = vPath;
    
    // Handle Internal Vault Creation
    if (type === 'internal') {
       const safeName = name.replace(/[^a-z0-9\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf]/gi, '_'); 
       const internalDir = path.join(process.cwd(), 'vaults', safeName + '_' + Math.random().toString(36).substring(2, 6));
       
       console.log(`[API] Creating internal vault at: ${internalDir}`);
       
       // Create directory
       try {
         await fs.mkdir(internalDir, { recursive: true });
         console.log(`[API] Directory created successfully`);
         finalPath = internalDir;
       } catch (e) {
         console.error(`[API] Failed to create directory: ${e}`);
         throw e;
       }
    }

    // Initialize DB tables for the new vault
    await initVaultDb(finalPath);

    const newVault = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      path: finalPath,
      active: false
    };

    vaults.push(newVault);
    await writeVaults(vaults);
    
    return NextResponse.json(newVault);
  } catch (error) {
    console.error("Vault creation failed:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, name, path: newPath } = await request.json();
    const vaults = await readVaults();
    
    const index = vaults.findIndex((v: Vault) => v.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "Vault not found" }, { status: 404 });
    }

    // Update Mode
    if (name || newPath) {
        if (name) vaults[index].name = name;
        if (newPath) {
            vaults[index].path = newPath;
            // If active vault's path changed, reconfigure
            if (vaults[index].active) {
                await updateEnv(newPath);
                await initVaultDb(newPath); // Ensure tables exist
                reconfigureDb({
                  STORAGE_MODE: "local",
                  VAULT_PATH: newPath
                });
            }
        }
    } 
    // Activate Mode (Default if no update fields)
    else {
        // Switch active status
        const targetVault = vaults[index];
        const updatedVaults = vaults.map((v: Vault) => ({
          ...v,
          active: v.id === id
        }));
        
        await writeVaults(updatedVaults);
        
        // Update .env for persistence
        await updateEnv(targetVault.path);

        // Ensure tables exist before switching
        await initVaultDb(targetVault.path);

        // Dynamic Database Reconfiguration
        reconfigureDb({
          STORAGE_MODE: "local",
          VAULT_PATH: targetVault.path
        });
        
        return NextResponse.json({ success: true, vault: targetVault });
    }

    await writeVaults(vaults);
    return NextResponse.json({ success: true, vault: vaults[index] });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const vaults = await readVaults();
    
    const newVaults = vaults.filter((v: Vault) => v.id !== id);
    await writeVaults(newVaults);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
