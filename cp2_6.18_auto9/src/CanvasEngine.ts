import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type Point = { x: number; y: number };

export type ToolType = 'pen' | 'eraser' | 'select' | 'pan';

export type ElementType = 'stroke' | 'sticky' | 'rectangle';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  zIndex: number;
}

export interface StrokeElement extends BaseElement {
  type: 'stroke';
  points: Point[];
  color: string;
  lineWidth: number;
}

export interface StickyElement extends BaseElement {
  type: 'sticky';
  width: number;
  height: number;
  content: string;
  bgColor: string;
}

export interface RectangleElement extends BaseElement {
  type: 'rectangle';
  width: number;
  height: number;
  borderColor: string;
  borderWidth: number;
  fillColor: string;
}

export type CanvasElement = StrokeElement | StickyElement | RectangleElement;

export interface ViewportState {
  offsetX: number;
  offsetY: number;
  zoom: number;
}

interface CanvasState {
  elements: CanvasElement[];
  selectedId: string | null;
  currentTool: ToolType;
  penColor: string;
  penWidth: number;
  eraserRadius: number;
  viewport: ViewportState;
  isSpacePressed: boolean;
  isPanning: boolean;
  lastPanPoint: Point | null;
  panVelocity: Point;
  lastPanTime: number;
  isInertiaPanning: boolean;
  zIndexCounter: number;

  setCurrentTool: (tool: ToolType) => void;
  setPenColor: (color: string) => void;
  setPenWidth: (width: number) => void;
  setSpacePressed: (pressed: boolean) => void;

  addStroke: (points: Point[], color: string, lineWidth: number) => string;
  appendStrokePoint: (id: string, point: Point) => void;
  addSticky: (x: number, y: number, content?: string) => string;
  addRectangle: (x: number, y: number) => string;

  selectElement: (id: string | null) => void;
  moveElement: (id: string, dx: number, dy: number) => void;
  updateStickyContent: (id: string, content: string) => void;
  resizeRectangle: (id: string, width: number, height: number) => void;
  deleteElement: (id: string) => void;
  deleteSelected: () => void;
  clearAll: () => void;

  setViewportOffset: (x: number, y: number) => void;
  adjustViewportOffset: (dx: number, dy: number) => void;
  setZoom: (zoom: number) => void;
  startPanning: (point: Point) => void;
  updatePanning: (point: Point) => void;
  stopPanning: () => void;
  stopInertia: () => void;

  hitTest: (worldX: number, worldY: number) => string | null;
  getElementAt: (worldX: number, worldY: number) => CanvasElement | null;

  loadState: (elements: CanvasElement[]) => void;
  getSerializableState: () => { elements: CanvasElement[]; viewport: ViewportState };
}

const INITIAL_VIEWPORT: ViewportState = {
  offsetX: 0,
  offsetY: 0,
  zoom: 1
};

function isPointInRect(px: number, py: number, rx: number, ry: number, rw: number, rh: number): boolean {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function hitTestStroke(stroke: StrokeElement, worldX: number, worldY: number, threshold = 6): boolean {
  const points = stroke.points;
  if (points.length === 0) return false;
  if (points.length === 1) {
    return Math.hypot(worldX - points[0].x, worldY - points[0].y) <= threshold;
  }
  for (let i = 0; i < points.length - 1; i++) {
    if (distanceToSegment({ x: worldX, y: worldY }, points[i], points[i + 1]) <= threshold) {
      return true;
    }
  }
  return false;
}

function eraserHitTestStroke(stroke: StrokeElement, worldX: number, worldY: number, radius: number): boolean {
  return hitTestStroke(stroke, worldX, worldY, radius);
}

let inertiaAnimationId: number | null = null;

function clearInertiaAnimation(): void {
  if (inertiaAnimationId !== null) {
    cancelAnimationFrame(inertiaAnimationId);
    inertiaAnimationId = null;
  }
}

const FRICTION = 0.94;
const MIN_SPEED = 0.3;

function startInertiaAnimation(): void {
  let lastTime = performance.now();

  function step(currentTime: number) {
    const dt = currentTime - lastTime;
    lastTime = currentTime;

    const state = useCanvasStore.getState();
    if (!state.isInertiaPanning) {
      clearInertiaAnimation();
      return;
    }

    const velocity = state.panVelocity;
    const speed = Math.hypot(velocity.x, velocity.y);

    if (speed < MIN_SPEED) {
      clearInertiaAnimation();
      useCanvasStore.setState({
        isInertiaPanning: false,
        panVelocity: { x: 0, y: 0 }
      });
      return;
    }

    const timeScale = Math.min(dt / 16.67, 2);
    const decay = Math.pow(FRICTION, timeScale);

    const newVx = velocity.x * decay;
    const newVy = velocity.y * decay;

    const dx = newVx * timeScale;
    const dy = newVy * timeScale;

    useCanvasStore.setState((s) => ({
      panVelocity: { x: newVx, y: newVy },
      viewport: {
        ...s.viewport,
        offsetX: s.viewport.offsetX + dx,
        offsetY: s.viewport.offsetY + dy
      }
    }));

    inertiaAnimationId = requestAnimationFrame(step);
  }

  inertiaAnimationId = requestAnimationFrame(step);
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  elements: [],
  selectedId: null,
  currentTool: 'pen',
  penColor: '#FF6B6B',
  penWidth: 3,
  eraserRadius: 10,
  viewport: INITIAL_VIEWPORT,
  isSpacePressed: false,
  isPanning: false,
  lastPanPoint: null,
  panVelocity: { x: 0, y: 0 },
  lastPanTime: 0,
  isInertiaPanning: false,
  zIndexCounter: 0,

  setCurrentTool: (tool) => {
    get().stopInertia();
    set({ currentTool: tool, selectedId: null });
  },
  setPenColor: (color) => set({ penColor: color }),
  setPenWidth: (width) => set({ penWidth: width }),
  setSpacePressed: (pressed) => {
    if (!pressed && get().isInertiaPanning) {
    }
    set({ isSpacePressed: pressed });
  },

  addStroke: (points, color, lineWidth) => {
    const id = uuidv4();
    const { zIndexCounter } = get();
    const element: StrokeElement = {
      id,
      type: 'stroke',
      x: 0,
      y: 0,
      zIndex: zIndexCounter + 1,
      points: [...points],
      color,
      lineWidth
    };
    set((state) => ({
      elements: [...state.elements, element],
      zIndexCounter: zIndexCounter + 1
    }));
    return id;
  },

  appendStrokePoint: (id, point) => {
    set((state) => ({
      elements: state.elements.map((el) => {
        if (el.id === id && el.type === 'stroke') {
          return { ...el, points: [...el.points, point] };
        }
        return el;
      })
    }));
  },

  addSticky: (x, y, content = '') => {
    const id = uuidv4();
    const { zIndexCounter } = get();
    const element: StickyElement = {
      id,
      type: 'sticky',
      x,
      y,
      zIndex: zIndexCounter + 1,
      width: 200,
      height: 200,
      content,
      bgColor: '#FFF59D'
    };
    set((state) => ({
      elements: [...state.elements, element],
      zIndexCounter: zIndexCounter + 1,
      selectedId: id
    }));
    return id;
  },

  addRectangle: (x, y) => {
    const id = uuidv4();
    const { zIndexCounter } = get();
    const element: RectangleElement = {
      id,
      type: 'rectangle',
      x,
      y,
      zIndex: zIndexCounter + 1,
      width: 100,
      height: 80,
      borderColor: '#4A90D9',
      borderWidth: 2,
      fillColor: 'transparent'
    };
    set((state) => ({
      elements: [...state.elements, element],
      zIndexCounter: zIndexCounter + 1,
      selectedId: id
    }));
    return id;
  },

  selectElement: (id) => {
    if (id) {
      const { zIndexCounter } = get();
      set((state) => ({
        selectedId: id,
        zIndexCounter: zIndexCounter + 1,
        elements: state.elements.map((el) =>
          el.id === id ? { ...el, zIndex: zIndexCounter + 1 } : el
        )
      }));
    } else {
      set({ selectedId: null });
    }
  },

  moveElement: (id, dx, dy) => {
    set((state) => ({
      elements: state.elements.map((el) => {
        if (el.id !== id) return el;
        if (el.type === 'stroke') {
          return {
            ...el,
            points: el.points.map((p) => ({ x: p.x + dx, y: p.y + dy }))
          };
        }
        return { ...el, x: el.x + dx, y: el.y + dy };
      })
    }));
  },

  updateStickyContent: (id, content) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id && el.type === 'sticky' ? { ...el, content } : el
      )
    }));
  },

  resizeRectangle: (id, width, height) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id && el.type === 'rectangle'
          ? { ...el, width: Math.max(20, width), height: Math.max(20, height) }
          : el
      )
    }));
  },

  deleteElement: (id) => {
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId
    }));
  },

  deleteSelected: () => {
    const { selectedId } = get();
    if (selectedId) get().deleteElement(selectedId);
  },

  clearAll: () => {
    set({ elements: [], selectedId: null, zIndexCounter: 0 });
  },

  setViewportOffset: (x, y) => {
    set((state) => ({ viewport: { ...state.viewport, offsetX: x, offsetY: y } }));
  },

  adjustViewportOffset: (dx, dy) => {
    set((state) => ({
      viewport: {
        ...state.viewport,
        offsetX: state.viewport.offsetX + dx,
        offsetY: state.viewport.offsetY + dy
      }
    }));
  },

  setZoom: (zoom) => {
    set((state) => ({ viewport: { ...state.viewport, zoom: Math.max(0.2, Math.min(5, zoom)) } }));
  },

  startPanning: (point) => {
    clearInertiaAnimation();
    set({
      isPanning: true,
      isInertiaPanning: false,
      lastPanPoint: point,
      lastPanTime: performance.now(),
      panVelocity: { x: 0, y: 0 }
    });
  },

  updatePanning: (point) => {
    const { lastPanPoint, isPanning, lastPanTime } = get();
    if (!isPanning || !lastPanPoint) return;
    const dx = point.x - lastPanPoint.x;
    const dy = point.y - lastPanPoint.y;
    const now = performance.now();
    const dt = now - lastPanTime;

    let vx = 0, vy = 0;
    if (dt > 0) {
      vx = dx / dt * 16.67;
      vy = dy / dt * 16.67;
    }

    const prevVel = get().panVelocity;
    const smoothVx = prevVel.x * 0.6 + vx * 0.4;
    const smoothVy = prevVel.y * 0.6 + vy * 0.4;

    set((state) => ({
      lastPanPoint: point,
      lastPanTime: now,
      panVelocity: { x: smoothVx, y: smoothVy },
      viewport: {
        ...state.viewport,
        offsetX: state.viewport.offsetX + dx,
        offsetY: state.viewport.offsetY + dy
      }
    }));
  },

  stopPanning: () => {
    const { panVelocity } = get();
    const speed = Math.hypot(panVelocity.x, panVelocity.y);

    if (speed > 1.5) {
      set({ isPanning: false, lastPanPoint: null, isInertiaPanning: true });
      startInertiaAnimation();
    } else {
      clearInertiaAnimation();
      set({
        isPanning: false,
        isInertiaPanning: false,
        lastPanPoint: null,
        panVelocity: { x: 0, y: 0 }
      });
    }
  },

  stopInertia: () => {
    clearInertiaAnimation();
    if (get().isInertiaPanning) {
      set({ isInertiaPanning: false, panVelocity: { x: 0, y: 0 } });
    }
  },

  hitTest: (worldX, worldY) => {
    const { elements } = get();
    const sorted = [...elements].sort((a, b) => b.zIndex - a.zIndex);
    for (const el of sorted) {
      if (el.type === 'stroke') {
        if (hitTestStroke(el, worldX, worldY)) return el.id;
      } else if (el.type === 'sticky') {
        if (isPointInRect(worldX, worldY, el.x, el.y, el.width, el.height)) return el.id;
      } else if (el.type === 'rectangle') {
        if (isPointInRect(worldX, worldY, el.x, el.y, el.width, el.height)) return el.id;
      }
    }
    return null;
  },

  getElementAt: (worldX, worldY) => {
    const id = get().hitTest(worldX, worldY);
    return id ? get().elements.find((e) => e.id === id) || null : null;
  },

  loadState: (elements) => {
    const maxZ = elements.reduce((max, el) => Math.max(max, el.zIndex), 0);
    set({ elements, zIndexCounter: maxZ });
  },

  getSerializableState: () => {
    const { elements, viewport } = get();
    return { elements, viewport };
  }
}));

export function useEraserAtPoint(worldX: number, worldY: number): void {
  const state = useCanvasStore.getState();
  const radius = state.eraserRadius;
  const toDelete: string[] = [];
  for (const el of state.elements) {
    if (el.type === 'stroke') {
      if (eraserHitTestStroke(el, worldX, worldY, radius)) {
        toDelete.push(el.id);
      }
    } else if (el.type === 'sticky') {
      if (isPointInRect(worldX, worldY, el.x - radius, el.y - radius, el.width + radius * 2, el.height + radius * 2)) {
        toDelete.push(el.id);
      }
    } else if (el.type === 'rectangle') {
      if (isPointInRect(worldX, worldY, el.x - radius, el.y - radius, el.width + radius * 2, el.height + radius * 2)) {
        toDelete.push(el.id);
      }
    }
  }
  if (toDelete.length > 0) {
    useCanvasStore.setState((s) => ({
      elements: s.elements.filter((e) => !toDelete.includes(e.id)),
      selectedId: s.selectedId && toDelete.includes(s.selectedId) ? null : s.selectedId
    }));
  }
}
