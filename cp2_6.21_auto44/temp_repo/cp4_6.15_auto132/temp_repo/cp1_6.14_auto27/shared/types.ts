export interface Project {
  id: string;
  title: string;
  targetWordCount: number;
  deadline: string;
  tags: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  projectId: string;
  title: string;
  content: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface WritingLog {
  id: string;
  projectId: string;
  date: string;
  wordsAdded: number;
  snippets: string[];
  createdAt: string;
}

export interface DatabaseSchema {
  projects: Project[];
  chapters: Chapter[];
  writingLogs: WritingLog[];
}
