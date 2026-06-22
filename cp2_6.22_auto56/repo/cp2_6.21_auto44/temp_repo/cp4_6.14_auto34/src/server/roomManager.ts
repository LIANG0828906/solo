import { v4 as uuidv4 } from 'uuid';
import type { FlowNode, FlowEdge, User, ClientMessage, ServerMessage } from '../types';
import { USER_COLORS } from '../types';
import { snapshotManager } from './snapshotManager';
import type { WebSocket } from 'ws';
import fs from 'fs';
import path from 'path';
import { Logger } from './logger';

interface Room {
  id: string;
  users: User[];
  nodes: FlowNode[];
  edges: FlowEdge[];
  clients: Map<string, WebSocket>;
  version: number;
  nodeVersions: Map<string, number>;
  edgeVersions: Map<string, number>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const ROOMS_DIR = path.join(DATA_DIR, 'rooms');
const DEBOUNCE_MS = 5000;

const MAX_PROCESSED_OP_IDS = 500;

const logger = new Logger('RoomManager');

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private processedOpIds: Map<string, Set<string>> = new Map();

  constructor() {
    (globalThis as any).rooms = this.rooms;
    (globalThis as any).processedOpIds = this.processedOpIds;
  }

  private ensureProcessedOpIds(roomId: string): Set<string> {
    let set = this.processedOpIds.get(roomId);
    if (!set) {
      set = new Set();
      this.processedOpIds.set(roomId, set);
    }
    return set;
  }

  private cleanupProcessedOpIds(roomId: string, set: Set<string>): void {
    if (set.size > MAX_PROCESSED_OP_IDS) {
      const toRemove = set.size - MAX_PROCESSED_OP_IDS;
      const iterator = set[Symbol.iterator]();
      for (let i = 0; i < toRemove; i++) {
        const result = iterator.next();
        if (!result.done) {
          set.delete(result.value);
        }
      }
    }
  }

  private getRoomFilePath(roomId: string): string {
    return path.join(ROOMS_DIR, `${roomId}.json`);
  }

  private schedulePersist(roomId: string): void {
    try {
      const existingTimer = this.debounceTimers.get(roomId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        this.persistRoom(roomId);
        this.debounceTimers.delete(roomId);
      }, DEBOUNCE_MS);

      this.debounceTimers.set(roomId, timer);
    } catch (e) {
      logger.error(`Failed to schedule persist for room ${roomId}`, e);
    }
  }

  async persistRoom(roomId: string): Promise<void> {
    try {
      const room = this.rooms.get(roomId);
      if (!room) return;

      await fs.promises.mkdir(ROOMS_DIR, { recursive: true });

            const dataToPersist = {
        id: room.id,
        users: room.users,
        nodes: room.nodes,
        edges: room.edges,
        version: room.version,
      };

      await fs.promises.writeFile(
        this.getRoomFilePath(roomId),
        JSON.stringify(dataToPersist, null, 2),
        'utf-8'
      );
      logger.info(`Persisted room ${roomId} to file`);
    } catch (e) {
      logger.error(`Failed to persist room ${roomId}`, e);
    }
  }

  async loadRoom(roomId: string): Promise<boolean> {
    try {
      const filePath = this.getRoomFilePath(roomId);
      if (!fs.existsSync(filePath)) {
        return false;
      }

      const content = await fs.promises.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

            const nodes: FlowNode[] = (data.nodes || []).map((n: any) => ({
        ...n,
        version: typeof n.version === 'number' ? n.version : 0,
      }));
      const edges: FlowEdge[] = (data.edges || []).map((e: any) => ({
        ...e,
        version: typeof e.version === 'number' ? e.version : 0,
      }));
      const nodeVersions = new Map<string, number>();
      const edgeVersions = new Map<string, number>();
      let maxVersion = 0;
      for (const n of nodes) {
        nodeVersions.set(n.id, n.version);
        if (n.version > maxVersion) maxVersion = n.version;
      }
      for (const e of edges) {
        edgeVersions.set(e.id, e.version);
        if (e.version > maxVersion) maxVersion = e.version;
      }

      const room: Room = {
        id: data.id,
        users: data.users || [],
        nodes,
        edges,
        clients: new Map(),
        version: typeof data.version === 'number' ? Math.max(data.version, maxVersion) : maxVersion,
        nodeVersions,
        edgeVersions,
      };

      this.rooms.set(roomId, room);
      logger.info(`Loaded room ${roomId} from file`);
      return true;
    } catch (e) {
      logger.error(`Failed to load room ${roomId}`, e);
      return false;
    }
  }

  async loadAllRooms(): Promise<void> {
    try {
      if (!fs.existsSync(ROOMS_DIR)) {
        logger.info('No rooms directory found, skipping room load');
        return;
      }

      const files = await fs.promises.readdir(ROOMS_DIR);
      const roomFiles = files.filter(f => f.endsWith('.json'));

      logger.info(`Found ${roomFiles.length} room files to load`);

      for (const file of roomFiles) {
        const roomId = file.replace('.json', '');
        await this.loadRoom(roomId);
      }
    } catch (e) {
      logger.error('Failed to load all rooms', e);
    }
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  joinRoom(roomId: string, userId: string, userName: string, ws: WebSocket): { user: User; room: Room } {
    try {
      logger.info(`User ${userId} (${userName}) joining room ${roomId}`);

      let room = this.rooms.get(roomId);

      if (!room) {
        room = {
          id: roomId,
          users: [],
          nodes: [],
          edges: [],
          clients: new Map(),
          version: 0,
          nodeVersions: new Map(),
          edgeVersions: new Map(),
        };
        this.rooms.set(roomId, room);
        this.ensureProcessedOpIds(roomId);
        logger.info(`Created new room ${roomId}`);
      }

      let user = room.users.find(u => u.id === userId);
      if (!user) {
        const existingColors = room.users.map(u => u.color);
        const availableColor = USER_COLORS.find(c => !existingColors.includes(c)) || USER_COLORS[room.users.length % USER_COLORS.length];

        user = {
          id: userId,
          name: userName,
          color: availableColor,
          roomId,
        };
        room.users.push(user);
        logger.info(`Added new user ${userId} to room ${roomId}`);
      }

      room.clients.set(userId, ws);

      this.broadcast(roomId, {
        type: 'user-join',
        user,
      }, userId);

      return { user, room };
    } catch (e) {
      logger.error(`Error in joinRoom for room ${roomId}, user ${userId}`, e);
      throw e;
    }
  }

  leaveRoom(roomId: string, userId: string): void {
    try {
      logger.info(`User ${userId} leaving room ${roomId}`);

      const room = this.rooms.get(roomId);
      if (!room) return;

      room.clients.delete(userId);
      room.users = room.users.filter(u => u.id !== userId);

      this.broadcast(roomId, {
        type: 'user-leave',
        userId,
      });

      if (room.users.length === 0) {
        setTimeout(() => {
          try {
            const currentRoom = this.rooms.get(roomId);
            if (currentRoom && currentRoom.users.length === 0) {
              this.persistRoom(roomId).then(() => {
                this.rooms.delete(roomId);
                this.processedOpIds.delete(roomId);
                logger.info(`Deleted empty room ${roomId}`));
              });
            }
          } catch (e) {
            logger.error(`Error cleaning up empty room ${roomId}`, e);
          }
        }, 30000);
      }
    } catch (e) {
      logger.error(`Error in leaveRoom for room ${roomId}, user ${userId}`, e);
    }
  }

  broadcast(roomId: string, message: ServerMessage, excludeUserId?: string): void {
    try {
      const room = this.rooms.get(roomId);
      if (!room) return;

      const messageStr = JSON.stringify(message);

      room.clients.forEach((client, userId) => {
        if (userId !== excludeUserId && client.readyState === 1) {
          try {
            client.send(messageStr);
          } catch (e) {
            logger.error(`Failed to send message to user ${userId} in room ${roomId}`, e);
          }
        }
      });
    } catch (e) {
      logger.error(`Error in broadcast for room ${roomId}`, e);
    }
  }
  applyOperation(roomId: string, op: ClientMessage, userId: string): void {
    try {
      const room = this.rooms.get(roomId);
      if (!room) return;

      const opSet = this.ensureProcessedOpIds(roomId);
      if (op.opId && opSet.has(op.opId)) {
        return;
      }
      if (op.opId) {
        opSet.add(op.opId);
        this.cleanupProcessedOpIds(roomId, opSet);
      }

      const hasEditOperation = op.type !== 'cursor-move';
      if (hasEditOperation) {
        try {
          snapshotManager.lockEditing(roomId, userId);
        } catch (lockError) {
          logger.error(`lockEditing error in room ${roomId} user ${userId}`, lockError);
        }
      }

      let changed = false;
      let broadcastExcludeSelf = false;
      let unlockScheduled = false;

      const scheduleUnlock = () => {
        if (!hasEditOperation || unlockScheduled) return;
        unlockScheduled = true;
        setTimeout(() => {
          try {
            snapshotManager.unlockEditing(roomId, userId);
          } catch (error) {
            logger.error(`unlockEditing error in room ${roomId} user ${userId}`, error);
          }
        }, 500);
      };

      try {
      switch (op.type) {
        case 'node-add': {
          const newVersion = room.version + 1;
          room.version = newVersion;
          const node = { ...op.data, version: newVersion };
          room.nodes.push(node);
          room.nodeVersions.set(node.id, newVersion);
          changed = true;
          snapshotManager.recordActivity(roomId, userId);
          break;
        }
        case 'node-update': {
          const nodeId = op.data.id;
          const currentVersion = room.nodeVersions.get(nodeId) ?? 0;
          const opVersion = op.data.version ?? 0;
          if (opVersion < currentVersion) {
            scheduleUnlock();
            return;
          }
          const nodeIdx = room.nodes.findIndex(n => n.id === nodeId);
          if (nodeIdx !== -1) {
            const newVersion = room.version + 1;
            room.version = newVersion;
            const { version: _v, ...restUpdates } = op.data;
            void _v;
            room.nodes[nodeIdx] = { ...room.nodes[nodeIdx], ...restUpdates, version: newVersion };
            room.nodeVersions.set(nodeId, newVersion);
            changed = true;
            snapshotManager.recordActivity(roomId, userId);
          }
          break;
        }
        case 'node-delete': {
          const nodeId = op.id;
          room.nodes = room.nodes.filter(n => n.id !== nodeId);
          room.edges = room.edges.filter(e => e.sourceId !== nodeId && e.targetId !== nodeId);
          room.nodeVersions.delete(nodeId);
          for (const e of [...room.edgeVersions.keys()]) {
            const edge = room.edges.find(x => x.id === e);
            if (!edge) room.edgeVersions.delete(e);
          }
          const newVersion = room.version + 1;
          room.version = newVersion;
          changed = true;
          snapshotManager.recordActivity(roomId, userId);
          break;
        }
        case 'edge-add': {
          const newVersion = room.version + 1;
          room.version = newVersion;
          const edge = { ...op.data, version: newVersion };
          room.edges.push(edge);
          room.edgeVersions.set(edge.id, newVersion);
          changed = true;
          snapshotManager.recordActivity(roomId, userId);
          break;
        }
        case 'edge-update': {
          const edgeId = op.data.id;
          const currentVersion = room.edgeVersions.get(edgeId) ?? 0;
          const opVersion = op.data.version ?? 0;
          if (opVersion < currentVersion) {
            scheduleUnlock();
            return;
          }
          const edgeIdx = room.edges.findIndex(e => e.id === edgeId);
          if (edgeIdx !== -1) {
            const newVersion = room.version + 1;
            room.version = newVersion;
            const { version: _v, ...restUpdates } = op.data;
            void _v;
            room.edges[edgeIdx] = { ...room.edges[edgeIdx], ...restUpdates, version: newVersion };
            room.edgeVersions.set(edgeId, newVersion);
            changed = true;
            snapshotManager.recordActivity(roomId, userId);
          }
          break;
        }
        case 'edge-delete': {
          const edgeId = op.id;
          room.edges = room.edges.filter(e => e.id !== edgeId);
          room.edgeVersions.delete(edgeId);
          const newVersion = room.version + 1;
          room.version = newVersion;
          changed = true;
          snapshotManager.recordActivity(roomId, userId);
          break;
        }
        case 'cursor-move': {
          changed = true;
          broadcastExcludeSelf = true;
          break;
        }
      }

      if (!changed) {
        scheduleUnlock();
        return;
      }

      if (broadcastExcludeSelf) {
        this.broadcast(roomId, op as any, userId);
      } else {
        this.broadcast(roomId, op as any);
        if (hasEditOperation) this.schedulePersist(roomId);
      }

      scheduleUnlock();
      } finally {
        scheduleUnlock();
      }
    } catch (e) {
      logger.error(`Error in applyOperation for room ${roomId}, user ${userId}, op ${(op as any).type}`, e);
    }
  }

  sendInitState
(roomId: string, userId: string): void {
    try {
      const room = this.rooms.get(roomId);
      if (!room) return;

      const client = room.clients.get(userId);
      if (!client || client.readyState !== 1) return;

      const message: ServerMessage = {
        type: 'init-state',
        nodes: room.nodes,
        edges: room.edges,
        users: room.users,
      };

      client.send(JSON.stringify(message));
    } catch (e) {
      logger.error(`Error in sendInitState for room ${roomId}, user ${userId}`, e);
    }
  }
}

export const roomManager = new RoomManager();
