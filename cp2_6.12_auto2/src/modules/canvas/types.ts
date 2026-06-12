export type ElementType = 'text' | 'rect' | 'circle';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  color: string;
  fontFamily: string;
  width: number;
  height: number;
}

export interface ShapeElement extends BaseElement {
  type: 'rect' | 'circle';
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  borderRadius: number;
}

export type CanvasElement = TextElement | ShapeElement;

export type ActionType =
  | 'SELECT_ELEMENT'
  | 'DESELECT_ALL'
  | 'UPDATE_ELEMENT'
  | 'START_DRAG'
  | 'DRAG_ELEMENT'
  | 'END_DRAG'
  | 'START_RESIZE'
  | 'RESIZE_ELEMENT'
  | 'END_RESIZE'
  | 'START_PAN'
  | 'PAN'
  | 'END_PAN'
  | 'ZOOM'
  | 'DOUBLE_CLICK_TEXT'
  | 'UPDATE_TEXT_EDIT'
  | 'BLUR_TEXT_EDIT'
  | 'DELETE_ELEMENT'
  | 'REORDER_LAYERS';

export interface CanvasAction<T = any> {
  type: ActionType;
  payload?: T;
}

export type StateEventType =
  | 'ELEMENTS_CHANGED'
  | 'SELECTION_CHANGED'
  | 'VIEW_CHANGED'
  | 'EXPORT_READY';

export interface CanvasStateEvent<T = any> {
  type: StateEventType;
  payload?: T;
}

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export interface DragPayload {
  id: string;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
}

export interface ResizePayload {
  id: string;
  handle: ResizeHandle;
  startX: number;
  startY: number;
  originWidth: number;
  originHeight: number;
  originX: number;
  originY: number;
}
