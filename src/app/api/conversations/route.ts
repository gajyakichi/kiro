import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }
    
    const conversations = await db.conversationLog.findMany({
      where: {
        project_id: parseInt(projectId)
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Conversations GET Error:", error);
    // Return empty array on error to prevent client crashes
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const { projectId, date, agent, summary, fullText } = await request.json();
    
    if (!projectId || !date || !agent || !summary) {
      return NextResponse.json({ 
        error: "Missing required fields: projectId, date, agent, summary" 
      }, { status: 400 });
    }
    
    const conversation = await db.conversationLog.create({
      data: {
        project_id: parseInt(projectId),
        date,
        agent,
        summary,
        full_text: fullText || null,
      }
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Conversations POST Error:", error);
    return NextResponse.json({ error: "Failed to create conversation log" }, { status: 500 });
  }
}
