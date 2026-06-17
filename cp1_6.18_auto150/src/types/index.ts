export type PartMaterial = 'wood' | 'fabric' | 'metal';

export interface PartTemplate {
  id: string;
  name: string;
  material: PartMaterial;
  width: number;
  height: number;
  price: number;
  color: string;
}

export interface PlacedPart {
  instanceId: string;
  templateId: string;
  x: number;
  y: number;
  rotation: number;
  isHighlighted: boolean;
  isBlinking?: boolean;
}

export interface OrderItem {
  templateId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  material: PartMaterial;
}

export interface OrderPreview {
  items: OrderItem[];
  totalPrice: number;
  address: string;
  receiver: string;
  phone: string;
  estimatedDelivery: string;
}

export interface DragState {
  isDragging: boolean;
  templateId: string | null;
  instanceId: string | null;
  mouseX: number;
  mouseY: number;
  source: 'panel' | 'workspace';
}

export const GRID_SIZE = 20;
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const MAX_PARTS = 30;
export const COLLISION_THRESHOLD = 0.2;
