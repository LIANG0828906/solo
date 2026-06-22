export interface Project {
  id: string;
  title: string;
  description: string;
  likes: number;
  created_at: string;
  notes_count?: number;
}

export interface Note {
  id: string;
  project_id: string;
  excerpt: string;
  reflection: string;
  tags: string[];
  created_at: string;
}

export interface MindMapNode {
  id: string;
  noteId: string;
  x: number;
  y: number;
}

export interface MindMapEdge {
  id: string;
  from: string;
  to: string;
}

export interface MindMapData {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

export interface Comment {
  id: string;
  project_id: string;
  nickname: string;
  avatar_color: string;
  content: string;
  created_at: string;
}
