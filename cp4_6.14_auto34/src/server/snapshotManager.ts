import { v4 as uuidv4 } from 'uuid';
import type { Snapshot, FlowNode, FlowEdge } from '../types';

const SNAPSHOT_DELAY = 10000;

export class SnapshotManager {
  private snapshots: Map<string, Snapshot[]> = new Map();
  private activityTimers: Map<string, NodeJS.Timeout> = new Map();
  private lastActivityBy: Map<string, string> = new Map();

  recordActivity(roomId: string, userId: string): void {
    this.lastActivityBy.set(roomId, userId);
    
    const existingTimer = this.activityTimers.get(roomId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.triggerSnapshot(roomId);
    }, SNAPSHOT_DELAY);
    
    this.activityTimers.set(roomId, timer);
  }

  private triggerSnapshot(roomId: string): Snapshot | null {
    const room = globalThis.rooms?.get(roomId);
    if (!room) return null;

    const userId = this.lastActivityBy.get(roomId) || 'system';
    
    const snapshot: Snapshot = {
      id: uuidv4(),
      roomId,
      nodes: JSON.parse(JSON.stringify(room.nodes)),
      edges: JSON.parse(JSON.stringify(room.edges)),
      createdBy: userId,
      createdAt: Date.now(),
    };

    const roomSnapshots = this.snapshots.get(roomId) || [];
    roomSnapshots.unshift(snapshot);
    
    if (roomSnapshots.length > 50) {
      roomSnapshots.pop();
    }
    
    this.snapshots.set(roomId, roomSnapshots);

    const message = { type: 'snapshot-created', snapshot };
    room.clients.forEach((client: any) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(message));
      }
    });

    return snapshot;
  }

  createSnapshot(roomId: string, userId: string, nodes: FlowNode[], edges: FlowEdge[]): Snapshot {
    const snapshot: Snapshot = {
      id: uuidv4(),
      roomId,
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      createdBy: userId,
      createdAt: Date.now(),
    };

    const roomSnapshots = this.snapshots.get(roomId) || [];
    roomSnapshots.unshift(snapshot);
    
    if (roomSnapshots.length > 50) {
      roomSnapshots.pop();
    }
    
    this.snapshots.set(roomId, roomSnapshots);
    return snapshot;
  }

  getSnapshots(roomId: string): Snapshot[] {
    return this.snapshots.get(roomId) || [];
  }

  restoreSnapshot(roomId: string, snapshotId: string): Snapshot | null {
    const roomSnapshots = this.snapshots.get(roomId);
    if (!roomSnapshots) return null;

    const snapshot = roomSnapshots.find(s => s.id === snapshotId);
    if (!snapshot) return null;

    const room = globalThis.rooms?.get(roomId);
    if (!room) return null;

    room.nodes = JSON.parse(JSON.stringify(snapshot.nodes));
    room.edges = JSON.parse(JSON.stringify(snapshot.edges));

    return snapshot;
  }
}

export const snapshotManager = new SnapshotManager();
