import { produce } from 'immer';
import type { BoardElement, Snapshot, DiffHighlight } from '../types';
import { v4 as uuidv4 } from 'uuid';

const MAX_SNAPSHOTS = 100;
const SAVE_DEBOUNCE_MS = 800;
const MIN_ELEMENTS_FOR_DENSITY = 5;
const MAX_ELEMENTS_FOR_DENSITY = 100;

type SnapshotListener = (snapshots: Snapshot[], currentIndex: number) => void;
type RestoreListener = (elements: BoardElement[], diff: DiffHighlight) => void;

export class SnapshotEngine {
  private snapshots: Snapshot[] = [];
  private currentIndex = -1;
  private saveTimer: number | null = null;
  private pendingElements: BoardElement[] | null = null;
  private listeners: SnapshotListener[] = [];
  private restoreListeners: RestoreListener[] = [];

  constructor() {}

  onSnapshotsChange(listener: SnapshotListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  onRestore(listener: RestoreListener) {
    this.restoreListeners.push(listener);
    return () => {
      this.restoreListeners = this.restoreListeners.filter(l => l !== listener);
    };
  }

  getSnapshots(): Snapshot[] {
    return [...this.snapshots];
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  getCurrentSnapshot(): Snapshot | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.snapshots.length) return null;
    return this.snapshots[this.currentIndex];
  }

  recordChange(elements: BoardElement[]) {
    this.pendingElements = produce(elements, () => {});
    if (this.saveTimer !== null) {
      window.clearTimeout(this.saveTimer);
    }
    this.saveTimer = window.setTimeout(() => {
      this.commitSnapshot();
    }, SAVE_DEBOUNCE_MS);
  }

  forceSnapshot(elements: BoardElement[]) {
    this.pendingElements = produce(elements, () => {});
    if (this.saveTimer !== null) {
      window.clearTimeout(this.saveTimer);
    }
    this.commitSnapshot();
  }

  private commitSnapshot() {
    if (!this.pendingElements) return;
    const snapshot: Snapshot = {
      id: uuidv4(),
      timestamp: Date.now(),
      elements: this.pendingElements,
      densityColor: this.calculateDensityColor(this.pendingElements),
    };

    if (this.currentIndex < this.snapshots.length - 1) {
      this.snapshots = this.snapshots.slice(0, this.currentIndex + 1);
    }
    this.snapshots.push(snapshot);
    if (this.snapshots.length > MAX_SNAPSHOTS) {
      this.snapshots = this.snapshots.slice(-MAX_SNAPSHOTS);
    }
    this.currentIndex = this.snapshots.length - 1;
    this.pendingElements = null;
    this.saveTimer = null;
    this.emit();
  }

  restoreToIndex(index: number): boolean {
    if (index < 0 || index >= this.snapshots.length) return false;
    const target = this.snapshots[index];
    const current = this.currentIndex >= 0 ? this.snapshots[this.currentIndex] : null;

    const diff = current ? this.computeDiff(current.elements, target.elements) : {
      addedIds: target.elements.map(e => e.id),
      removedIds: [],
    };

    this.currentIndex = index;
    this.restoreListeners.forEach(l => l(target.elements, diff));
    this.emit();
    return true;
  }

  restoreToId(snapshotId: string): boolean {
    const idx = this.snapshots.findIndex(s => s.id === snapshotId);
    return idx >= 0 ? this.restoreToIndex(idx) : false;
  }

  diffSnapshots(fromIndex: number, toIndex: number): DiffHighlight | null {
    if (fromIndex < 0 || fromIndex >= this.snapshots.length) return null;
    if (toIndex < 0 || toIndex >= this.snapshots.length) return null;
    const from = this.snapshots[fromIndex].elements;
    const to = this.snapshots[toIndex].elements;
    return this.computeDiff(from, to);
  }

  private computeDiff(from: BoardElement[], to: BoardElement[]): DiffHighlight {
    const fromIds = new Set(from.map(e => e.id));
    const toIds = new Set(to.map(e => e.id));
    const addedIds: string[] = [];
    const removedIds: string[] = [];
    toIds.forEach(id => {
      if (!fromIds.has(id)) addedIds.push(id);
    });
    fromIds.forEach(id => {
      if (!toIds.has(id)) removedIds.push(id);
    });
    return { addedIds, removedIds };
  }

  private calculateDensityColor(elements: BoardElement[]): string {
    const count = elements.length;
    const ratio = Math.max(0, Math.min(1, (count - MIN_ELEMENTS_FOR_DENSITY) / (MAX_ELEMENTS_FOR_DENSITY - MIN_ELEMENTS_FOR_DENSITY)));
    const fromR = 223, fromG = 230, fromB = 233;
    const toR = 255, toG = 107, toB = 107;
    const r = Math.round(fromR + (toR - fromR) * ratio);
    const g = Math.round(fromG + (toG - fromG) * ratio);
    const b = Math.round(fromB + (toB - fromB) * ratio);
    return `rgb(${r},${g},${b})`;
  }

  private emit() {
    this.listeners.forEach(l => l([...this.snapshots], this.currentIndex));
  }

  async loadFromServer(boardId: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/snapshots?boardId=${encodeURIComponent(boardId)}`);
      if (!res.ok) return false;
      const data = await res.json();
      if (Array.isArray(data.snapshots) && data.snapshots.length > 0) {
        this.snapshots = data.snapshots;
        this.currentIndex = this.snapshots.length - 1;
        this.emit();
        return true;
      }
      return false;
    } catch (e) {
      console.error('[SnapshotEngine] load failed', e);
      return false;
    }
  }

  async saveToServer(boardId: string, snapshot: Snapshot): Promise<boolean> {
    try {
      const res = await fetch('/api/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId, snapshot }),
      });
      return res.ok;
    } catch (e) {
      console.error('[SnapshotEngine] save failed', e);
      return false;
    }
  }
}

export const snapshotEngine = new SnapshotEngine();
