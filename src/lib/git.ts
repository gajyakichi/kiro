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
 * Reads walkthrough content from multiple sources in priority order:
 * 1. Kiro-generated walkthrough.md (in project root or docs/)
 * 2. Antigravity KI overview.md
 * 3. Antigravity KI walkthrough.md (if exists)
 * 4. README.md as fallback
 */
export function getWalkthrough(artifactPath: string, projectRootPath?: string): string | null {
  try {
    // Priority 1: Kiro-generated walkthrough in project root or docs/
    if (projectRootPath) {
      const kiroWalkthroughPaths = [
        path.join(projectRootPath, 'walkthrough.md'),
        path.join(projectRootPath, 'docs', 'walkthrough.md')
      ];
      
      for (const walkthroughPath of kiroWalkthroughPaths) {
        if (fs.existsSync(walkthroughPath)) {
          console.log(`📖 Reading Kiro-generated walkthrough: ${walkthroughPath}`);
          return fs.readFileSync(walkthroughPath, 'utf8');
        }
      }
    }

    // Priority 2: Antigravity KI overview.md (most common)
    const targetPath = expandPath(artifactPath);
    const antigravityOverview = path.join(targetPath, 'overview.md');
    if (fs.existsSync(antigravityOverview)) {
      console.log(`📖 Reading Antigravity KI overview: ${antigravityOverview}`);
      return fs.readFileSync(antigravityOverview, 'utf8');
    }

    // Priority 3: Antigravity KI walkthrough.md (legacy)
    const antigravityWalkthrough = path.join(targetPath, 'walkthrough.md');
    if (fs.existsSync(antigravityWalkthrough)) {
      console.log(`📖 Reading Antigravity KI walkthrough: ${antigravityWalkthrough}`);
      return fs.readFileSync(antigravityWalkthrough, 'utf8');
    }

    // Priority 4: README.md as fallback
    if (projectRootPath) {
      const readmePath = path.join(projectRootPath, 'README.md');
      if (fs.existsSync(readmePath)) {
        console.log(`📖 Reading README.md as fallback: ${readmePath}`);
        return fs.readFileSync(readmePath, 'utf8');
      }
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
export function getProjectContext(repoPath: string, artifactPath: string, projectRootPath?: string) {
  const logs = getGitLog(repoPath, 20); // Last 20 commits
  const walkthrough = getWalkthrough(artifactPath, projectRootPath || repoPath);
  
  return {
    recentLogs: logs,
    walkthrough: walkthrough
  };
}
