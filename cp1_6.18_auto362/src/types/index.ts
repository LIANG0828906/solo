export interface MindMapNode {
  id: string;
  text: string;
  level: number;
  children: MindMapNode[];
  parentId: string | null;
  isCollapsed?: boolean;
}

export type LayoutMode = 'mindmap' | 'orgchart' | 'fishbone';

export interface NodePosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BezierCurve {
  id: string;
  sourceId: string;
  targetId: string;
  path: string;
}
