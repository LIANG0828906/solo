export interface Joint {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface Bone {
  from: string;
  to: string;
}

export interface Pose {
  joints: Joint[];
  bones: Bone[];
  color: string;
}

export interface Frame {
  joints: Joint[];
  isKeyFrame: boolean;
  keyFrameIndex?: number;
}

export const DEFAULT_JOINT_NAMES = ['头', '左肩', '右肩', '左肘', '右肘', '左腕', '右腕', '髋', '左膝', '右膝'];

export const COLORS = ['#000000', '#e94560', '#00d4ff', '#7bff7b', '#ffcc00'];

export const GRID_SIZE = 10;
export const JOINT_RADIUS = 8;
export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 800;
export const TRANSITION_FRAMES = 4;
export const MAX_UNDO = 30;
export const ANIMATION_FPS = 60;
export const GIF_FPS = 12;
