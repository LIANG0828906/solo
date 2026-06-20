import type { FileNode } from '../../types';

export interface GraphEventCallbacks {
  onNodeClick?: (node: FileNode) => void;
  onNodeDoubleClick?: (node: FileNode) => void;
  onNodeDragStart?: (node: FileNode) => void;
  onNodeDragEnd?: (node: FileNode) => void;
  onZoom?: (transform: { k: number; x: number; y: number }) => void;
  onBackgroundClick?: () => void;
}

export class GraphEvents {
  private callbacks: GraphEventCallbacks;

  constructor(callbacks: GraphEventCallbacks = {}) {
    this.callbacks = callbacks;
  }

  setCallbacks(callbacks: GraphEventCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  emit<K extends keyof GraphEventCallbacks>(
    event: K,
    ...args: Parameters<NonNullable<GraphEventCallbacks[K]>>
  ) {
    const cb = this.callbacks[event];
    if (cb) (cb as (...a: unknown[]) => void)(...args);
  }
}
