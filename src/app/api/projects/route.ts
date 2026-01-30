import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const projects = await db.project.findMany({
      orderBy: { id: 'desc' } // Prisma doesn't have created_at in the model I defined yet, using id as proxy for now
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Project Fetch Error:", error);
    return NextResponse.json([]);
  }
}

import fs from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

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

async function ensureTablesExist() {
    console.log("[ProjectAPI] Detecting missing tables. Auto-healing with DIRECT connection...");
    let prisma: PrismaClient | null = null;
    try {
        // 1. Find active vault path
        const vaultsData = await fs.readFile(path.join(process.cwd(), "vaults.json"), "utf-8");
        const vaults = JSON.parse(vaultsData);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const active = vaults.find((v: any) => v.active);

        if (!active || !active.path) {
            console.error("[ProjectAPI] No active vault found for healing.");
            return;
        }

        const dbPath = path.join(active.path, 'kiro.db');
        console.log(`[ProjectAPI] Healing Target DB: ${dbPath}`);

        // 2. Connect directly
        const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
        prisma = new PrismaClient({ adapter });

        // 3. Execute Queries
        for (const query of SCHEMA_QUERIES) {
            await prisma.$executeRawUnsafe(query);
        }
        console.log("[ProjectAPI] Tables created successfully via direct connection.");
    } catch (e) {
        console.error("[ProjectAPI] Failed to heal DB:", e);
    } finally {
        if (prisma) await prisma.$disconnect();
    }
}

export async function POST(request: Request) {
  let requestData;
  try {
    requestData = await request.json();
    console.log("Adding Project Request Data:", requestData);
    const { name, git_path, artifact_path, icon } = requestData;
    const project = await db.project.create({
      data: {
        name,
        git_path,
        artifact_path,
        icon: icon || null
      }
    });
    console.log("Project created successfully:", project.id);
    return NextResponse.json({ success: true, id: project.id });
  } catch (error: any) {
    console.error("Project Create Error Detail:", error);
    
    // Auto-Healing: Create tables if missing and retry
    if (error.message && (error.message.includes("no such table") || error.message.includes("does not exist"))) {
        await ensureTablesExist();
        try {
            const { name, git_path, artifact_path, icon } = requestData;
            const project = await db.project.create({
                data: {
                    name,
                    git_path,
                    artifact_path,
                    icon: icon || null
                }
            });
            console.log("Project created successfully after healing:", project.id);
            return NextResponse.json({ success: true, id: project.id });
        } catch (retryError) {
            console.error("Retry failed:", retryError);
        }
    }

    let message = "Failed to create project";
    if (error instanceof Error) {
        message = error.message.split('\n').filter(line => line.trim().length > 0).pop() || error.message; 
        if (message.includes("Unique constraint")) {
            message = "A project with this name or path already exists.";
        }
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    const { id, name, git_path, artifact_path, icon } = data;
    
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    if (!name || !git_path || !artifact_path) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await db.project.update({
      where: { id: Number(id) },
      data: {
        name,
        git_path,
        artifact_path,
        icon: icon || null
      }
    });
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
        
        await db.project.delete({
          where: { id: Number(id) }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Project Delete Error:", error);
        return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
    }
}
