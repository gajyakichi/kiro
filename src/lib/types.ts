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
  type: string;
  metadata?: string;
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
  iconSet?: string;
  active: boolean;
}

export interface Progress {
  task: string;
  walkthrough: string;
}

export interface DailyNote {
  id: number;
  project_id: number;
  date: string;
  content: string;
  timestamp: string;
}

export interface SuggestedTask {
  id: number;
  project_id: number;
  task: string;
  status: 'proposed' | 'added' | 'dismissed';
  timestamp: string;
}

export interface Vault {
  id: string;
  name: string;
  path: string;
  active: boolean;
}
