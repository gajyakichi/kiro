import { NextResponse } from "next/server";
import db from "@/lib/db";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import { GitLog } from "@/lib/types";
import path from "path";

import { Prisma } from "@prisma/client";

const execPromise = promisify(exec);

export async function POST(request: Request) {
  try {
    const { projectId } = await request.json();
    
    // Fetch project details
    const project = await db.project.findUnique({
      where: { id: Number(projectId) }
    });
    
    if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    console.log(`Syncing project: ${project.name} (${project.git_path})`);
    
    const gitPath = project.git_path;
    const artifactDir = project.artifact_path;

    // 1. Harvest Git Logs
    let gitLogs: GitLog[] = [];
    if (gitPath && gitPath !== "/tmp") { 
      try {
        const { stdout } = await execPromise(`git -C "${gitPath}" log -n 10 --pretty=format:"%h|%ad|%an|%s" --date=iso`);
        gitLogs = stdout.split("\n").filter(l => l.trim()).map((line) => {
          const [hash, date, author, message] = line.split("|");
          return { hash, date, author, message };
        });
      } catch (gitError) {
        console.error(`Git Harvest Error for ${gitPath}:`, (gitError as Error).message);
      }
    }

    if (gitLogs.length > 0) {
      await db.$transaction(async (tx: Prisma.TransactionClient) => {
        for (const log of gitLogs) {
          const metadata = JSON.stringify({ hash: log.hash, author: log.author });
          const exists = await tx.log.findFirst({
            where: {
              project_id: Number(projectId),
              type: 'git',
              metadata: { contains: log.hash }
            }
          });
          if (!exists) {
            await tx.log.create({
              data: {
                project_id: Number(projectId),
                type: 'git',
                content: log.message,
                metadata: metadata,
                timestamp: new Date(log.date)
              }
            });
          }
        }
      });
    }

    // 2. Harvest Task Progress
    if (artifactDir) {
      const taskPath = path.join(artifactDir, "task.md");
      try {
        const taskContent = await fs.readFile(taskPath, "utf-8");
        const lastTaskLog = await db.log.findFirst({
          where: { project_id: Number(projectId), type: 'task' },
          orderBy: { timestamp: 'desc' }
        });
        
        if (!lastTaskLog || lastTaskLog.content !== taskContent) {
          await db.log.create({
            data: {
              project_id: Number(projectId),
              type: 'task',
              content: taskContent
            }
          });
        }
      } catch (e) {
        console.error("Task Harvest Error:", e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sync API Critical Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');
        
        if (!projectId) {
            return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
        }

        const logs = await db.log.findMany({
          where: { project_id: Number(projectId) },
          orderBy: { timestamp: 'desc' }
        });
        return NextResponse.json(logs);
    } catch {
        return NextResponse.json([]);
    }
}
