type EventCallback = (...args: any[]) => void;

interface EventMap {
  'fragment:created': (fragment: StoryFragment) => void;
  'fragment:updated': (fragment: StoryFragment) => void;
  'fragment:deleted': (id: string) => void;
  'fragment:dropped': (fragmentId: string, x: number, y: number) => void;
  'graph:updated': (data: { nodes: GraphNode[]; links: GraphLink[] }) => void;
  'node:selected': (nodeId: string | null) => void;
  'link:deleted': (linkId: string) => void;
  'playback:start': () => void;
  'playback:stop': () => void;
}

type EventName = keyof EventMap;

class EventBus {
  private listeners: Map<EventName, Set<EventCallback>> = new Map();

  on<E extends EventName>(event: E, callback: EventMap[E]): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback);
    return () => this.off(event, callback);
  }

  off<E extends EventName>(event: E, callback: EventMap[E]): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback as EventCallback);
    }
  }

  emit<E extends EventName>(event: E, ...args: Parameters<EventMap[E]>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => cb(...args));
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();

export interface StoryFragment {
  id: string;
  type: 'character' | 'scene' | 'plot-twist';
  content: string;
  color: string;
  createdAt: number;
}

export interface GraphNode {
  id: string;
  fragmentId: string;
  x: number;
  y: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
}
