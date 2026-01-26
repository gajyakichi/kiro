import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

function expandPath(p: string): string {
  if (p.startsWith('~/') || p === '~') {
    return path.join(os.homedir(), p.slice(1));
  }
  return p;
}

export interface GitCommit {
  hash: string;
  date: string;
  author: string;
  message: string;
}

/**
 * Extracts the git log for a given repository path.
 */
export function getGitLog(repoPath: string, limit: number = 50): GitCommit[] {
  const targetPath = expandPath(repoPath);
  try {
    const format = '%h|%ad|%an|%s';
    const output = execSync(
      `git -C "${targetPath}" log -n ${limit} --date=short --pretty=format:"${format}"`,
      { encoding: 'utf8' }
    );

    return output.split('\n').filter(Boolean).map(line => {
      const [hash, date, author, message] = line.split('|');
      return { hash, date, author, message };
    });
  } catch (error) {
    console.error(`Error fetching git log for ${repoPath}:`, error);
    return [];
  }
}

/**
 * Reads the walkthrough.md file from the Antigravity artifact directory.
 */
export function getWalkthrough(artifactPath: string): string | null {
  try {
    const targetPath = expandPath(artifactPath);
    const filePath = path.join(targetPath, 'walkthrough.md');
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
    return null;
  } catch (error) {
    console.error(`Error reading walkthrough at ${artifactPath}:`, error);
    return null;
  }
}

/**
 * Summarizes the project context for AI consumption.
 */
export function getProjectContext(repoPath: string, artifactPath: string) {
  const logs = getGitLog(repoPath, 20); // Last 20 commits
  const walkthrough = getWalkthrough(artifactPath);
  
  return {
    recentLogs: logs,
    walkthrough: walkthrough
  };
}
