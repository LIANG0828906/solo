export type ElementType = 'text' | 'image' | 'shape';
export type ShapeType = 'rectangle' | 'circle' | 'triangle';

export type AnimationType =
  | 'fadeIn'
  | 'fadeOut'
  | 'flip'
  | 'zoom'
  | 'slideInLeft'
  | 'slideInRight'
  | 'slideInUp'
  | 'slideInDown';

export type AnimationPhase = 'entrance' | 'exit';

export interface AnimationConfig {
  id: string;
  type: AnimationType;
  phase: AnimationPhase;
  duration: number;
  delay: number;
}

export interface SlideElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  content?: string;
  shapeType?: ShapeType;
  animations: AnimationConfig[];
}

export interface Slide {
  id: string;
  elements: SlideElement[];
  backgroundColor: string;
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  selectedElementId: string | null;
}

export interface Presentation {
  id: string;
  slides: Slide[];
  currentSlideId: string;
}

export type WSMessageType =
  | 'join'
  | 'leave'
  | 'join-ack'
  | 'collaborator-join'
  | 'collaborator-leave'
  | 'addElement'
  | 'updateElement'
  | 'deleteElement'
  | 'selectElement'
  | 'addSlide'
  | 'updateSlide';

export interface WSMessage {
  type: WSMessageType;
  payload: any;
  senderId: string;
  timestamp: number;
}

export const COLLABORATOR_COLORS = [
  '#EF4444',
  '#3B82F6',
  '#22C55E',
  '#EAB308',
];
