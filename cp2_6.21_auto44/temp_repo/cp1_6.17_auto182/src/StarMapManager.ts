export interface StarPoint {
  id: string;
  position: { x: number; y: number; z: number };
  color: string;
  locked: boolean;
}

export interface StarConnection {
  id: string;
  startId: string;
  endId: string;
}

interface HistorySnapshot {
  stars: StarPoint[];
  connections: StarConnection[];
}

type Listener = () => void;

const MAX_HISTORY = 20;

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function cloneStars(stars: StarPoint[]): StarPoint[] {
  return stars.map(s => ({ ...s, position: { ...s.position } }));
}

function cloneConnections(connections: StarConnection[]): StarConnection[] {
  return connections.map(c => ({ ...c }));
}

export class StarMapManager {
  private stars: StarPoint[] = [];
  private connections: StarConnection[] = [];
  private selectedStarId: string | null = null;
  private firstConnectionId: string | null = null;
  private history: HistorySnapshot[] = [{ stars: [], connections: [] }];
  private historyIndex = 0;
  private listeners: Set<Listener> = new Set();
  private dirty = false;

  getStars(): StarPoint[] {
    return this.stars;
  }

  getConnections(): StarConnection[] {
    return this.connections;
  }

  getStarById(id: string): StarPoint | undefined {
    return this.stars.find(s => s.id === id);
  }

  getSelectedStarId(): string | null {
    return this.selectedStarId;
  }

  getFirstConnectionId(): string | null {
    return this.firstConnectionId;
  }

  getStarCount(): number {
    return this.stars.length;
  }

  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(): void {
    this.listeners.forEach(l => l());
  }

  private pushHistory(): void {
    if (this.dirty) {
      this.dirty = false;
      return;
    }
    const snapshot: HistorySnapshot = {
      stars: cloneStars(this.stars),
      connections: cloneConnections(this.connections),
    };
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(snapshot);
    if (this.history.length > MAX_HISTORY) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  placeStar(position: { x: number; y: number; z: number }, color = '#FFFFFF'): StarPoint {
    this.pushHistory();
    const star: StarPoint = {
      id: uid(),
      position: { ...position },
      color,
      locked: false,
    };
    this.stars.push(star);
    this.emit();
    return star;
  }

  selectStar(id: string | null): void {
    this.selectedStarId = id;
    this.emit();
  }

  toggleConnectionSelect(id: string): boolean {
    if (this.firstConnectionId === null) {
      this.firstConnectionId = id;
      this.emit();
      return false;
    }
    if (this.firstConnectionId === id) {
      this.firstConnectionId = null;
      this.emit();
      return false;
    }
    const startId = this.firstConnectionId;
    const endId = id;
    this.firstConnectionId = null;
    this.addConnection(startId, endId);
    return true;
  }

  cancelConnectionSelect(): void {
    if (this.firstConnectionId !== null) {
      this.firstConnectionId = null;
      this.emit();
    }
  }

  addConnection(startId: string, endId: string): StarConnection | null {
    const exists = this.connections.some(
      c =>
        (c.startId === startId && c.endId === endId) ||
        (c.startId === endId && c.endId === startId),
    );
    if (exists) return null;
    if (!this.getStarById(startId) || !this.getStarById(endId)) return null;
    this.pushHistory();
    const connection: StarConnection = {
      id: uid(),
      startId,
      endId,
    };
    this.connections.push(connection);
    this.emit();
    return connection;
  }

  moveStar(id: string, position: { x: number; y: number; z: number }): void {
    const star = this.getStarById(id);
    if (!star || star.locked) return;
    star.position = { ...position };
    this.dirty = true;
    this.emit();
  }

  commitMove(): void {
    this.dirty = false;
  }

  deleteStar(id: string): void {
    const star = this.getStarById(id);
    if (!star) return;
    this.pushHistory();
    this.stars = this.stars.filter(s => s.id !== id);
    this.connections = this.connections.filter(c => c.startId !== id && c.endId !== id);
    if (this.selectedStarId === id) this.selectedStarId = null;
    if (this.firstConnectionId === id) this.firstConnectionId = null;
    this.emit();
  }

  setStarColor(id: string, color: string): void {
    const star = this.getStarById(id);
    if (!star) return;
    this.pushHistory();
    star.color = color;
    this.emit();
  }

  toggleStarLock(id: string): void {
    const star = this.getStarById(id);
    if (!star) return;
    this.pushHistory();
    star.locked = !star.locked;
    this.emit();
  }

  deleteConnection(id: string): void {
    const conn = this.connections.find(c => c.id === id);
    if (!conn) return;
    this.pushHistory();
    this.connections = this.connections.filter(c => c.id !== id);
    this.emit();
  }

  undo(): void {
    if (!this.canUndo()) return;
    this.historyIndex--;
    const snapshot = this.history[this.historyIndex];
    this.stars = cloneStars(snapshot.stars);
    this.connections = cloneConnections(snapshot.connections);
    this.selectedStarId = null;
    this.firstConnectionId = null;
    this.dirty = false;
    this.emit();
  }

  clear(): void {
    this.pushHistory();
    this.stars = [];
    this.connections = [];
    this.selectedStarId = null;
    this.firstConnectionId = null;
    this.emit();
  }
}
