import { v4 as uuidv4 } from 'uuid';
import { Shape, HistoryEntry, User } from './types';

type HistoryListener = (entry: HistoryEntry) => void;
type SnapshotListener = (shapes: Shape[]) => void;

class HistoryModuleClass {
  private entries: HistoryEntry[] = [];
  private listeners: Set<HistoryListener> = new Set();
  private snapshotListeners: Set<SnapshotListener> = new Set();
  private userMap: Map<string, User> = new Map();
  private lastSnapshot: Shape[] = [];
  private maxEntries = 50;

  setUsers(users: User[]) {
    users.forEach((u) => this.userMap.set(u.id, u));
  }

  addUser(user: User) {
    this.userMap.set(user.id, user);
  }

  getUser(userId: string): User {
    return (
      this.userMap.get(userId) || {
        id: userId,
        name: '未知用户',
        avatar: '👤',
        color: '#999',
      }
    );
  }

  recordAction(
    userId: string,
    action: HistoryEntry['action'],
    shapeId: string,
    currentShapes: Shape[]
  ) {
    const user = this.getUser(userId);
    const snapshot = JSON.parse(JSON.stringify(currentShapes)) as Shape[];

    const entry: HistoryEntry = {
      id: uuidv4(),
      userId,
      userName: user.name,
      userAvatar: user.avatar,
      action,
      shapeId,
      timestamp: Date.now(),
      snapshot,
    };

    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    this.lastSnapshot = snapshot;
    this.notifyListeners(entry);
  }

  getEntries(): HistoryEntry[] {
    return [...this.entries].reverse();
  }

  revertTo(entryId: string): boolean {
    const entry = this.entries.find((e) => e.id === entryId);
    if (!entry) return false;

    const index = this.entries.indexOf(entry);
    this.entries = this.entries.slice(0, index + 1);
    this.lastSnapshot = entry.snapshot;
    this.notifySnapshotListeners(entry.snapshot);
    return true;
  }

  undo(): Shape[] | null {
    if (this.entries.length <= 1) return null;
    this.entries.pop();
    const prev = this.entries[this.entries.length - 1];
    if (prev) {
      this.lastSnapshot = prev.snapshot;
      this.notifySnapshotListeners(prev.snapshot);
      return prev.snapshot;
    }
    return null;
  }

  getLastSnapshot(): Shape[] {
    return this.lastSnapshot;
  }

  subscribe(listener: HistoryListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeToSnapshots(listener: SnapshotListener) {
    this.snapshotListeners.add(listener);
    return () => this.snapshotListeners.delete(listener);
  }

  private notifyListeners(entry: HistoryEntry) {
    this.listeners.forEach((l) => l(entry));
  }

  private notifySnapshotListeners(shapes: Shape[]) {
    this.snapshotListeners.forEach((l) => l(shapes));
  }

  getActionLabel(action: HistoryEntry['action']): string {
    switch (action) {
      case 'add':
        return '添加';
      case 'move':
        return '移动';
      case 'modify':
        return '修改';
      case 'delete':
        return '删除';
    }
  }

  formatTime(timestamp: number): string {
    const d = new Date(timestamp);
    return `${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  }
}

export const HistoryModule = new HistoryModuleClass();
