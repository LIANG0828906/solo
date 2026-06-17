import { useStore, GRID_SIZE, ComponentType, ComponentData } from '../store';

interface DragResult {
  id: string;
  type: ComponentType | 'CANVAS_COMPONENT';
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  parentId: string | null;
}

function calculateOverlap(a: ComponentData, b: ComponentData): number {
  const overlapX = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const overlapY = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return overlapX * overlapY;
}

function findBestParent(components: ComponentData[], draggedId: string, dropX: number, dropY: number): string | null {
  const dragged = components.find(c => c.id === draggedId);
  if (!dragged) return null;
  const dragArea = { ...dragged, x: dropX, y: dropY };
  const dragTotalArea = dragArea.width * dragArea.height;
  if (dragTotalArea === 0) return null;
  let bestParent: string | null = null;
  let bestOverlapRatio = 0.5;
  for (const comp of components) {
    if (comp.id === draggedId) continue;
    if (comp.type !== 'container') continue;
    if (comp.parentId === draggedId) continue;
    const descendants: string[] = [];
    const collect = (pid: string) => {
      const p = components.find(c => c.id === pid);
      if (p) for (const cid of p.childrenOrder) { descendants.push(cid); collect(cid); }
    };
    collect(draggedId);
    if (descendants.includes(comp.id)) continue;
    const overlap = calculateOverlap(dragArea, comp);
    const ratio = overlap / dragTotalArea;
    if (ratio > bestOverlapRatio) {
      bestOverlapRatio = ratio;
      bestParent = comp.id;
    }
  }
  return bestParent;
}

export function useDragAndDrop() {
  const addComponent = useStore(s => s.addComponent);
  const moveComponent = useStore(s => s.moveComponent);
  const updateNesting = useStore(s => s.updateNesting);
  const bringToFront = useStore(s => s.bringToFront);
  const setSelected = useStore(s => s.setSelected);
  const components = useStore(s => s.components);

  const handleNewComponentDrop = (type: ComponentType, canvasX: number, canvasY: number): string => {
    const id = addComponent(type, canvasX, canvasY);
    return id;
  };

  const handleCanvasComponentDrop = (componentId: string, canvasX: number, canvasY: number) => {
    moveComponent(componentId, canvasX, canvasY);
    bringToFront(componentId);
    const bestParent = findBestParent(components, componentId, canvasX, canvasY);
    updateNesting(componentId, bestParent);
    setSelected(componentId);
  };

  const handleDragStart = (id: string) => {
    setSelected(id);
    bringToFront(id);
  };

  return {
    handleNewComponentDrop,
    handleCanvasComponentDrop,
    handleDragStart,
  };
}

export function useNesting() {
  const updateNesting = useStore(s => s.updateNesting);
  const components = useStore(s => s.components);
  const reorderChildren = useStore(s => s.reorderChildren);

  const checkNesting = (childId: string, dropX: number, dropY: number): string | null => {
    return findBestParent(components, childId, dropX, dropY);
  };

  const moveChildToParent = (childId: string, parentId: string | null) => {
    updateNesting(childId, parentId);
  };

  const reorderSiblings = (parentId: string, fromIndex: number, toIndex: number) => {
    reorderChildren(parentId, fromIndex, toIndex);
  };

  const getNestingDepth = (componentId: string): number => {
    let depth = 0;
    let current = components.find(c => c.id === componentId);
    while (current?.parentId) {
      depth++;
      current = components.find(c => c.id === current!.parentId);
    }
    return depth;
  };

  return {
    checkNesting,
    moveChildToParent,
    reorderSiblings,
    getNestingDepth,
  };
}

export type { DragResult };
