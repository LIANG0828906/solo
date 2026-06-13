import { v4 as uuidv4 } from 'uuid';
import type { Snapshot, FlowNode, FlowEdge } from '../types';
import fs from 'fs';
import path from 'path';
import { Logger } from './logger';

const SNAPSHOT_DELAY = 10000;

const DATA_DIR = path.join(process.cwd(), 'data');
const SNAPSHOTS_DIR = path.join(DATA_DIR, 'snapshots');

const logger = new Logger('SnapshotManager');

export class SnapshotManager {
  private snapshots: Map<string, Snapshot[]> = new Map();
  private activityTimers: Map<string, NodeJS.Timeout> = new Map();
  private lastActivityBy: Map<string, string> = new Map();
  private editingLocks: Map<string, Set<string>> = new Map();
  private pendingSnapshotTimers: Map<string, NodeJS.Timeout> = new Map();
  private pendingSnapshot: Map<string, boolean> = new Map();

  private getSnapshotFilePath(roomId: string): string {
    return path.join(SNAPSHOTS_DIR, `${roomId}.json`);
  }

  async persistSnapshots(roomId: string): Promise<void> {
    try {
      const roomSnapshots = this.snapshots.get(roomId);
      if (!roomSnapshots) return;

      await fs.promises.mkdir(SNAPSHOTS_DIR, { recursive: true });

      await fs.promises.writeFile(
        this.getSnapshotFilePath(roomId),
        JSON.stringify(roomSnapshots, null, 2),
        'utf-8'
      );
      logger.info(`Persisted ${roomSnapshots.length} snapshots for room ${roomId}`);
    } catch (e) {
      logger.error(`Failed to persist snapshots for room ${roomId}`, e);
    }
  }

  async loadSnapshots(roomId: string): Promise<boolean> {
    try {
      const filePath = this.getSnapshotFilePath(roomId);
      if (!fs.existsSync(filePath)) {
        return false;
      }

      const content = await fs.promises.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      if (Array.isArray(data)) {
        this.snapshots.set(roomId, data);
        logger.info(`Loaded ${data.length} snapshots for room ${roomId}`);
        return true;
      }
      return false;
    } catch (e) {
      logger.error(`Failed to load snapshots for room ${roomId}`, e);
      return false;
    }
  }

  async loadAllSnapshots(): Promise<void> {
    try {
      if (!fs.existsSync(SNAPSHOTS_DIR)) {
        logger.info('No snapshots directory found, skipping snapshot load');
        return;
      }

      const files = await fs.promises.readdir(SNAPSHOTS_DIR);
      const snapshotFiles = files.filter(f => f.endsWith('.json'));

      logger.info(`Found ${snapshotFiles.length} snapshot files to load`);

      for (const file of snapshotFiles) {
        const roomId = file.replace('.json', '');
        await this.loadSnapshots(roomId);
      }
    } catch (e) {
      logger.error('Failed to load all snapshots', e);
    }
  }

  lockEditing(roomId: string, userId: string): void {
    try {
      let locks = this.editingLocks.get(roomId);
      if (!locks) {
        locks = new Set();
        this.editingLocks.set(roomId, locks);
      }
      locks.add(userId);
    } catch (e) {
      logger.error(`Error in lockEditing for room ${roomId}, user ${userId}`, e);
    }
  }

  unlockEditing(roomId: string, userId: string): void {
    try {
      const locks = this.editingLocks.get(roomId);
      if (locks) {
        locks.delete(userId);
        if (locks.size === 0) {
          this.editingLocks.delete(roomId);
        }
      }

      if (!this.isRoomEditing(roomId) && this.pendingSnapshot.get(roomId)) {
        this.pendingSnapshot.delete(roomId);

        const existingTimer = this.activityTimers.get(roomId);
        if (existingTimer) {
          clearTimeout(existingTimer);
        }

        const timer = setTimeout(() => {
          try {
            this.triggerSnapshot(roomId);
          } catch (e) {
            logger.error(`Error in auto snapshot trigger for room ${roomId}`, e);
          }
        }, SNAPSHOT_DELAY);

        this.activityTimers.set(roomId, timer);
      }

      const pendingTimer = this.pendingSnapshotTimers.get(roomId);
      if (pendingTimer && !this.isRoomEditing(roomId)) {
        clearTimeout(pendingTimer);
        this.pendingSnapshotTimers.delete(roomId);
        this.triggerSnapshot(roomId);
      }
    } catch (e) {
      logger.error(`Error in unlockEditing for room ${roomId}, user ${userId}`, e);
    }
  }

  isRoomEditing(roomId: string): boolean {
    try {
      const locks = this.editingLocks.get(roomId);
      return locks !== undefined && locks.size > 0;
    } catch (e) {
      logger.error(`Error in isRoomEditing for room ${roomId}`, e);
      return false;
    }
  }

  recordActivity(roomId: string, userId: string): void {
    try {
      this.lastActivityBy.set(roomId, userId);

      const existingTimer = this.activityTimers.get(roomId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      if (this.isRoomEditing(roomId)) {
        this.pendingSnapshot.set(roomId, true);
        return;
      }

      const timer = setTimeout(() => {
        try {
          this.triggerSnapshot(roomId);
        } catch (e) {
          logger.error(`Error in auto snapshot trigger for room ${roomId}`, e);
        }
      }, SNAPSHOT_DELAY);

      this.activityTimers.set(roomId, timer);
    } catch (e) {
      logger.error(`Error in recordActivity for room ${roomId}, user ${userId}`, e);
    }
  }

  private triggerSnapshot(roomId: string): Snapshot | null {
    try {
      if (this.isRoomEditing(roomId)) {
        const existingPendingTimer = this.pendingSnapshotTimers.get(roomId);
        if (existingPendingTimer) {
          clearTimeout(existingPendingTimer);
        }
        const pendingTimer = setTimeout(() => {
          this.pendingSnapshotTimers.delete(roomId);
          this.triggerSnapshot(roomId);
        }, 100);
        this.pendingSnapshotTimers.set(roomId, pendingTimer);
        return null;
      }

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

      this.persistSnapshots(roomId);

      const message = { type: 'snapshot-created', snapshot };
      room.clients.forEach((client: any) => {
        if (client.readyState === 1) {
          try {
            client.send(JSON.stringify(message));
          } catch (e) {
            logger.error(`Failed to broadcast snapshot to client in room ${roomId}`, e);
          }
        }
      });

      logger.info(`Auto snapshot created for room ${roomId} by ${userId}`);
      return snapshot;
    } catch (e) {
      logger.error(`Error in triggerSnapshot for room ${roomId}`, e);
      return null;
    }
  }

  createSnapshot(roomId: string, userId: string, nodes: FlowNode[], edges: FlowEdge[]): Snapshot {
    try {
      logger.info(`Creating manual snapshot for room ${roomId} by ${userId}`);

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

      this.persistSnapshots(roomId);

      logger.info(`Manual snapshot created for room ${roomId}, id=${snapshot.id}`);
      return snapshot;
    } catch (e) {
      logger.error(`Error in createSnapshot for room ${roomId}, user ${userId}`, e);
      throw e;
    }
  }

  getSnapshots(roomId: string): Snapshot[] {
    try {
      return this.snapshots.get(roomId) || [];
    } catch (e) {
      logger.error(`Error in getSnapshots for room ${roomId}`, e);
      return [];
    }
  }

  restoreSnapshot(roomId: string, snapshotId: string): Snapshot | null {
    try {
      logger.info(`Restoring snapshot ${snapshotId} for room ${roomId}`);

      const roomSnapshots = this.snapshots.get(roomId);
      if (!roomSnapshots) return null;

      const snapshot = roomSnapshots.find(s => s.id === snapshotId);
      if (!snapshot) {
        logger.warn(`Snapshot ${snapshotId} not found in room ${roomId}`);
        return null;
      }

      const room = globalThis.rooms?.get(roomId);
      if (!room) {
        logger.warn(`Room ${roomId} not found when restoring snapshot`);
        return null;
      }

      room.nodes = JSON.parse(JSON.stringify(snapshot.nodes));
      room.edges = JSON.parse(JSON.stringify(snapshot.edges));

      if (!room.nodeVersions) room.nodeVersions = new Map();
      else room.nodeVersions.clear();
      if (!room.edgeVersions) room.edgeVersions = new Map();
      else room.edgeVersions.clear();
      let maxVersion = 0;
      for (const n of room.nodes) {
        if (typeof n.version !== 'number') n.version = 0;
        room.nodeVersions.set(n.id, n.version);
        if (n.version > maxVersion) maxVersion = n.version;
      }
      for (const e of room.edges) {
        if (typeof e.version !== 'number') e.version = 0;
        room.edgeVersions.set(e.id, e.version);
        if (e.version > maxVersion) maxVersion = e.version;
      }
      if (typeof room.version !== 'number') room.version = 0;
      room.version = Math.max(room.version, maxVersion);

      logger.info(`Snapshot ${snapshotId} restored successfully for room ${roomId}`);
      return snapshot;
    } catch (e) {
      logger.error(`Error in restoreSnapshot for room ${roomId}, snapshot ${snapshotId}`, e);
      return null;
    }
  }
}

export const snapshotManager = new SnapshotManager();
