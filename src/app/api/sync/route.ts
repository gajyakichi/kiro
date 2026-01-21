import { NextResponse } from "next/server";
import db from "@/lib/db";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import { GitLog, Project } from "@/lib/types";
import path from "path";

const execPromise = promisify(exec);

export async function POST(request: Request) {
  try {
    const { projectId } = await request.json();
    
    // Fetch project details
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as Project | undefined;
    if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    console.log(`Syncing project: ${project.name} (${project.git_path})`);
    
    const gitPath = project.git_path;
    const artifactDir = project.artifact_path;

    // 1. Harvest Git Logs
    let gitLogs: GitLog[] = [];
    if (gitPath && gitPath !== "/tmp") { // Basic validation
      try {
        const { stdout } = await execPromise(`git -C "${gitPath}" log -n 10 --pretty=format:"%h|%ad|%an|%s" --date=iso`);
        gitLogs = stdout.split("\n").filter(l => l.trim()).map((line) => {
          const [hash, date, author, message] = line.split("|");
          return { hash, date, author, message };
        });
      } catch (gitError) {
        const error = gitError as Error;
        console.error(`Git Harvest Error for ${gitPath}:`, error.message);
      }
    }

    const insertLog = db.prepare('INSERT OR IGNORE INTO logs (project_id, type, content, metadata, timestamp) VALUES (?, ?, ?, ?, ?)');
    
    if (gitLogs.length > 0) {
      db.transaction(() => {
        for (const log of gitLogs) {
          const metadata = JSON.stringify({ hash: log.hash, author: log.author });
          const exists = db.prepare('SELECT id FROM logs WHERE project_id = ? AND type = "git" AND metadata LIKE ?').get(projectId, `%${log.hash}%`);
          if (!exists) {
            insertLog.run(projectId, 'git', log.message, metadata, new Date(log.date).toISOString());
          }
        }
      })();
    }

    // 2. Harvest Task Progress
    const taskPath = path.join(artifactDir, "task.md");
    
    try {
      const taskContent = await fs.readFile(taskPath, "utf-8");
      const lastTaskLog = db.prepare('SELECT content FROM logs WHERE project_id = ? AND type = "task" ORDER BY timestamp DESC LIMIT 1').get(projectId) as { content: string } | undefined;
      if (!lastTaskLog || lastTaskLog.content !== taskContent) {
        db.prepare('INSERT INTO logs (project_id, type, content) VALUES (?, ?, ?)').run(projectId, 'task', taskContent);
      }
    } catch (e) {
      console.error("Task Harvest Error:", e);
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

        const logs = db.prepare('SELECT * FROM logs WHERE project_id = ? ORDER BY timestamp DESC').all(projectId);
        return NextResponse.json(logs);
    } catch {
        return NextResponse.json([]);
    }
}
