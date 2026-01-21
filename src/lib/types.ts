export interface GitLog {
  hash: string;
  date: string;
  author: string;
  message: string;
}

export interface Comment {
  id: number;
  project_id: number;
  text: string;
  timestamp: string;
}

export interface DbLog {
  id: number;
  project_id: number;
  type: 'git' | 'task' | 'tool';
  content: string;
  metadata?: string;
  timestamp: string;
}

export interface Project {
  id: number;
  name: string;
  git_path: string;
  artifact_path: string;
  icon?: string;
  metadata?: string;
}

export interface Theme {
  id: number;
  name: string;
  css: string;
  active: boolean;
}

export interface Progress {
  task: string;
  walkthrough: string;
}
