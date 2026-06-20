export interface MindmapNode {
  id: string;
  title: string;
  description: string;
  position_x: number;
  position_y: number;
  parent_id: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  assignee: string | null;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  node_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface MindmapEdge {
  id: string;
  source: string;
  target: string;
}
