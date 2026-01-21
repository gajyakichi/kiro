import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export async function GET() {
  try {
    // Fetch last 20 commits with format: hash | date | author | message
    // Note: In this specific context, the project itself is the target
    const { stdout } = await execPromise(
      'git log -n 20 --pretty=format:"%h|%ad|%an|%s" --date=iso',
    );

    const logs = stdout.split("\n").map((line) => {
      const [hash, date, author, message] = line.split("|");
      return { hash, date, author, message };
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Git Log API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch git logs" },
      { status: 500 },
    );
  }
}
