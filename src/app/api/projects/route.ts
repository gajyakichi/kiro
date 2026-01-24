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

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("Adding Project Request Data:", data);
    const { name, git_path, artifact_path, icon } = data;
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
  } catch (error) {
    console.error("Project Create Error Detail:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
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
