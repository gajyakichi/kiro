import { NextResponse } from "next/server";
import db from "@/lib/db";
import fs from "fs/promises";
import path from "path";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }
    
    // Get project path from database
    const project = await db.project.findUnique({
      where: { id: parseInt(projectId) }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Read walkthrough.md for overall project status
    const walkthroughPath = path.join(project.git_path || '', 'docs', 'walkthrough.md');
    let walkthroughContent = "";
    
    try {
      walkthroughContent = await fs.readFile(walkthroughPath, 'utf-8');
    } catch {
      console.log('No walkthrough.md found, using default message');
      walkthroughContent = "プロジェクトの概要はまだありません。「文脈を解析」ボタンをクリックして生成してください。";
    }

    return NextResponse.json({
      task: walkthroughContent,
      walkthrough: walkthroughContent
    });
  } catch (error) {
    console.error("Progress API Error:", error);
    return NextResponse.json({ error: "Failed to fetch progress metadata" }, { status: 500 });
  }
}
