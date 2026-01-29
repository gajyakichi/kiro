import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch today's daily note for the specific project
    const todayNote = await db.dailyNote.findFirst({
      where: {
        project_id: parseInt(projectId),
        date: today
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    if (todayNote) {
      return NextResponse.json({
        task: todayNote.content,
        walkthrough: "" // TODO: Restore walkthrough functionality
      });
    }

    // Fallback: if no daily note exists for today, return a default message
    return NextResponse.json({
      task: "本日の要約はまだありません。「文脈を解析」ボタンをクリックして生成してください。",
      walkthrough: ""
    });
  } catch (error) {
    console.error("Progress API Error:", error);
    return NextResponse.json({ error: "Failed to fetch progress metadata" }, { status: 500 });
  }
}
