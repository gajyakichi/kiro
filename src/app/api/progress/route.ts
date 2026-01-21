import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    // This is the artifact directory path provided in the conversation
    const artifactDir = "/Users/satoshiyamaguchi/.gemini/antigravity/brain/8f0e638e-1b68-416b-a5f5-b9e5d648bf14";
    
    const taskPath = path.join(artifactDir, "task.md");
    const walkthroughPath = path.join(artifactDir, "walkthrough.md");

    let taskContent = "";
    let walkthroughContent = "";

    try {
      taskContent = await fs.readFile(taskPath, "utf-8");
    } catch (e) {
      taskContent = "task.md not found";
    }

    try {
      walkthroughContent = await fs.readFile(walkthroughPath, "utf-8");
    } catch (e) {
      walkthroughContent = "walkthrough.md not found";
    }

    return NextResponse.json({
      task: taskContent,
      walkthrough: walkthroughContent
    });
  } catch (error) {
    console.error("Progress API Error:", error);
    return NextResponse.json({ error: "Failed to fetch progress metadata" }, { status: 500 });
  }
}
