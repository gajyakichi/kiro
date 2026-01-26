import { NextResponse } from "next/server";
import db from "@/lib/db";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import { GitLog } from "@/lib/types";
import path from "path";
import os from "os";

import { Prisma } from "@prisma/client";

export const dynamic = 'force-dynamic';

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
    
    const expandPath = (p: string | null) => {
        if (!p) return null;
        if (p.startsWith('~/') || p === '~') {
            return path.join(os.homedir(), p.slice(1));
        }
        return p;
    };
    
    const gitPath = expandPath(project.git_path);
    const artifactDir = expandPath(project.artifact_path);

    // 1. Harvest Git Logs
    let gitLogs: GitLog[] = [];
    if (gitPath && gitPath !== "/tmp") { 
      try {
        const { stdout } = await execPromise(`git -C "${gitPath}" log -n 20 --pretty=format:"%h|%ad|%an|%s" --date=iso-strict`);
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
          // Bulk fetch existing hashes to minimize DB queries and rely on JS for checking
          const existing = await tx.log.findMany({
            where: {
              project_id: Number(projectId),
              type: 'git'
            },
            select: { metadata: true }
          });
          
          const seenHashes = new Set<string>();
          existing.forEach((l: { metadata: string | null }) => {
            if (l.metadata) {
              try {
                const m = JSON.parse(l.metadata);
                if (m.hash) seenHashes.add(m.hash);
              } catch {}
            }
          });

          for (const log of gitLogs) {
             if (!seenHashes.has(log.hash)) {
                await tx.log.create({
                  data: {
                    project_id: Number(projectId),
                    type: 'git',
                    content: log.message,
                    metadata: JSON.stringify({ hash: log.hash, author: log.author }),
                    timestamp: new Date(log.date)
                  }
                });
                seenHashes.add(log.hash);
             }
          }
      });
    }

    // 2. Harvest Task & Walkthrough Progress
    if (artifactDir) {
      const filesToHarvest = [
        { name: "task.md", type: "task" as const },
        { name: "walkthrough.md", type: "walkthrough" as const }
      ];

      for (const { name, type } of filesToHarvest) {
        const filePath = path.join(artifactDir, name);
        try {
          const content = await fs.readFile(filePath, "utf-8");
          const lastLog = await db.log.findFirst({
            where: { project_id: Number(projectId), type: type as string },
            orderBy: { timestamp: 'desc' }
          });
          
          if (!lastLog || lastLog.content !== content) {
            await db.log.create({
              data: {
                project_id: Number(projectId),
                type: type as string,
                content: content
              }
            });
          }
        } catch (e: unknown) {
          // Only log error if not file not found
          if (e instanceof Error && (e as { code?: string }).code !== 'ENOENT') {
            console.error(`${name} Harvest Error:`, e);
          }
        }
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
