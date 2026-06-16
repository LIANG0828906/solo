export interface Position {
  x: number;
  y: number;
}

export interface MindMapNode {
  id: string;
  text: string;
  level: 1 | 2 | 3;
  children: MindMapNode[];
  collapsed: boolean;
  position: Position;
  initialPosition: Position;
  parentId?: string;
}

export interface NodeStyle {
  bgColor: string;
  textColor: string;
  borderColor?: string;
  lineWidth: number;
}

export interface NodeColors {
  [level: number]: {
    default: string;
    hover: string;
    text: string;
    hoverText: string;
    border: string;
  };
}

export interface AnimationState {
  nodeId: string;
  startTime: number;
  startPos: Position;
  endPos: Position;
  duration: number;
}

export interface TooltipState {
  visible: boolean;
  text: string;
  x: number;
  y: number;
}

export const NODE_COLORS: NodeColors = {
  1: {
    default: '#E8F4FD',
    hover: '#B3D9F2',
    text: '#333333',
    hoverText: '#000000',
    border: '#4A90D9',
  },
  2: {
    default: '#E8F4FD',
    hover: '#B3D9F2',
    text: '#333333',
    hoverText: '#000000',
    border: '#6BA9E5',
  },
  3: {
    default: '#E8F4FD',
    hover: '#B3D9F2',
    text: '#333333',
    hoverText: '#000000',
    border: '#8CC0EC',
  },
};

export const LAYOUT_CONFIG = {
  rootRadius: 0,
  level1Radius: 200,
  level2Radius: 350,
  angleSpread: Math.PI / 6,
  randomOffset: Math.PI / 18,
  nodeWidth: 120,
  nodeHeight: 40,
  rootWidth: 160,
  rootHeight: 50,
  maxTextLength: 15,
};

export const ANIMATION_CONFIG = {
  layoutDuration: 800,
  hoverTransition: 300,
  collapseTransition: 500,
  dragScale: 1.2,
  shadowBlur: 6,
  shadowRadius: 8,
  shadowColor: 'rgba(0, 0, 0, 0.125)',
};

export const LINE_CONFIG = {
  lineWidth: 1,
  draggingLineWidth: 2,
  controlPointOffset: 50,
  color: '#666666',
};
