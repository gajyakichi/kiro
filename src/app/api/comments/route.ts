import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
        return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const comments = await db.comment.findMany({
      where: { project_id: Number(projectId) },
      orderBy: { timestamp: 'asc' }
    });
    return NextResponse.json(comments);
  } catch (error) {
    console.error("Comments API Error:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("POST /api/comments payload:", body);
    const { text, projectId, type, metadata } = body;
    if (!projectId) {
        return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const newComment = await db.comment.create({
      data: {
        project_id: Number(projectId),
        text,
        type: type || 'markdown',
        metadata: metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null
      }
    });
    
    const comments = await db.comment.findMany({
      where: { project_id: Number(projectId) },
      orderBy: { timestamp: 'asc' }
    });
    return NextResponse.json({ success: true, notes: comments, id: newComment.id });
  } catch (error) {
    console.error("Comments Post API Error:", error);
    return NextResponse.json({ error: "Failed to save comment", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await db.comment.delete({
      where: { id: Number(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Comments Delete API Error:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, text } = body;

    if (!id || text === undefined) {
        return NextResponse.json({ error: "Missing id or text" }, { status: 400 });
    }

    await db.comment.update({
      where: { id: Number(id) },
      data: { text }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Comments Update API Error:", error);
    return NextResponse.json({ error: "Failed to update comment" }, { status: 500 });
  }
}
