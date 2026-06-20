const fs = require('fs');

function readCRLF(p) {
  return fs.readFileSync(p, 'utf8');
}

function writeCRLF(p, c) {
  fs.writeFileSync(p, c, 'utf8');
}

function applyPatches(code, patches) {
  let result = code;
  for (const { regex, replacement, name } of patches) {
    if (regex.test(result)) {
      result = result.replace(regex, replacement);
      console.log('PATCHED:', name);
    } else {
      console.log('FAILED:', name);
    }
  }
  return result;
}

// ==================== snapshotManager.ts ====================
const snapPath = 'c:/Users/Administrator/Desktop/P/tasks/auto34/src/server/snapshotManager.ts';
let snapCode = readCRLF(snapPath);

const snapPatches = [
  {
    name: 'restoreSnapshot - rebuild versions',
    regex: /(room\.nodes = JSON\.parse\(JSON\.stringify\(snapshot\.nodes\)\);\s*\r?\n\s*room\.edges = JSON\.parse\(JSON\.stringify\(snapshot\.edges\)\);)(\s*\r?\n\s*logger\.info\(`Snapshot \$\{snapshotId\} restored successfully)/,
    replacement: (m, p1, p2) => {
      return p1 + `\r
\r
      if (!room.nodeVersions) room.nodeVersions = new Map();\r
      else room.nodeVersions.clear();\r
      if (!room.edgeVersions) room.edgeVersions = new Map();\r
      else room.edgeVersions.clear();\r
      let maxVersion = 0;\r
      for (const n of room.nodes) {\r
        if (typeof n.version !== 'number') n.version = 0;\r
        room.nodeVersions.set(n.id, n.version);\r
        if (n.version > maxVersion) maxVersion = n.version;\r
      }\r
      for (const e of room.edges) {\r
        if (typeof e.version !== 'number') e.version = 0;\r
        room.edgeVersions.set(e.id, e.version);\r
        if (e.version > maxVersion) maxVersion = e.version;\r
      }\r
      if (typeof room.version !== 'number') room.version = 0;\r
      room.version = Math.max(room.version, maxVersion);` + p2;
    }
  }
];

snapCode = applyPatches(snapCode, snapPatches);
writeCRLF(snapPath, snapCode);
console.log('--- snapshotManager.ts done ---');

// ==================== roomManager.ts ====================
const rmPath = 'c:/Users/Administrator/Desktop/P/tasks/auto34/src/server/roomManager.ts';
let rmCode = readCRLF(rmPath);

const rmPatches = [
  // 1. Room interface - add version fields
  {
    name: 'Room interface',
    regex: /(interface Room \{\s*\r?\n\s*id: string;\s*\r?\n\s*users: User\[\];\s*\r?\n\s*nodes: FlowNode\[\];\s*\r?\n\s*edges: FlowEdge\[\];\s*\r?\n\s*clients: Map<string, WebSocket>;\s*\r?\n\})/,
    replacement: `interface Room {\r
  id: string;\r
  users: User[];\r
  nodes: FlowNode[];\r
  edges: FlowEdge[];\r
  clients: Map<string, WebSocket>;\r
  version: number;\r
  nodeVersions: Map<string, number>;\r
  edgeVersions: Map<string, number>;\r
}`
  },

  // 2. Add MAX_PROCESSED_OP_IDS constant before logger, and processedOpIds field
  {
    name: 'MAX_PROCESSED_OP_IDS + processedOpIds field',
    regex: /(const logger = new Logger\('RoomManager'\);\s*\r?\n\s*\r?\n\s*export class RoomManager \{\s*\r?\n\s*private rooms: Map<string, Room> = new Map\(\);\s*\r?\n\s*private debounceTimers: Map<string, NodeJS\.Timeout> = new Map\(\);)/,
    replacement: `const MAX_PROCESSED_OP_IDS = 500;\r
\r
const logger = new Logger('RoomManager');\r
\r
export class RoomManager {\r
  private rooms: Map<string, Room> = new Map();\r
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();\r
  private processedOpIds: Map<string, Set<string>> = new Map();`
  },

  // 3. Constructor - expose processedOpIds and add helper methods
  {
    name: 'Constructor + helper methods (ensureProcessedOpIds, cleanupProcessedOpIds)',
    regex: /(constructor\(\) \{\s*\r?\n\s*\(globalThis as any\)\.rooms = this\.rooms;\s*\r?\n\s*\}\s*\r?\n\s*\r?\n\s*private getRoomFilePath)/,
    replacement: `constructor() {\r
    (globalThis as any).rooms = this.rooms;\r
    (globalThis as any).processedOpIds = this.processedOpIds;\r
  }\r
\r
  private ensureProcessedOpIds(roomId: string): Set<string> {\r
    let set = this.processedOpIds.get(roomId);\r
    if (!set) {\r
      set = new Set();\r
      this.processedOpIds.set(roomId, set);\r
    }\r
    return set;\r
  }\r
\r
  private cleanupProcessedOpIds(roomId: string, set: Set<string>): void {\r
    if (set.size > MAX_PROCESSED_OP_IDS) {\r
      const toRemove = set.size - MAX_PROCESSED_OP_IDS;\r
      const iterator = set[Symbol.iterator]();\r
      for (let i = 0; i < toRemove; i++) {\r
        const result = iterator.next();\r
        if (!result.done) {\r
          set.delete(result.value);\r
        }\r
      }\r
    }\r
  }\r
\r
  private getRoomFilePath`
  },

  // 4. loadRoom - rebuild versions
  {
    name: 'loadRoom - rebuild versions maps',
    regex: /(const room: Room = \{\s*\r?\n\s*id: data\.id,\s*\r?\n\s*users: data\.users \|\| \[\],\s*\r?\n\s*nodes: data\.nodes \|\| \[\],\s*\r?\n\s*edges: data\.edges \|\| \[\],\s*\r?\n\s*clients: new Map\(\),\s*\r?\n\s*\};)/,
    replacement: `      const nodes: FlowNode[] = (data.nodes || []).map((n: any) => ({\r
        ...n,\r
        version: typeof n.version === 'number' ? n.version : 0,\r
      }));\r
      const edges: FlowEdge[] = (data.edges || []).map((e: any) => ({\r
        ...e,\r
        version: typeof e.version === 'number' ? e.version : 0,\r
      }));\r
      const nodeVersions = new Map<string, number>();\r
      const edgeVersions = new Map<string, number>();\r
      let maxVersion = 0;\r
      for (const n of nodes) {\r
        nodeVersions.set(n.id, n.version);\r
        if (n.version > maxVersion) maxVersion = n.version;\r
      }\r
      for (const e of edges) {\r
        edgeVersions.set(e.id, e.version);\r
        if (e.version > maxVersion) maxVersion = e.version;\r
      }\r
\r
      const room: Room = {\r
        id: data.id,\r
        users: data.users || [],\r
        nodes,\r
        edges,\r
        clients: new Map(),\r
        version: typeof data.version === 'number' ? Math.max(data.version, maxVersion) : maxVersion,\r
        nodeVersions,\r
        edgeVersions,\r
      };`
  },

  // 5. joinRoom - create new room with version fields
  {
    name: 'joinRoom - create room with version fields',
    regex: /(room = \{\s*\r?\n\s*id: roomId,\s*\r?\n\s*users: \[\],\s*\r?\n\s*nodes: \[\],\s*\r?\n\s*edges: \[\],\s*\r?\n\s*clients: new Map\(\),\s*\r?\n\s*\};\s*\r?\n\s*this\.rooms\.set\(roomId, room\);\s*\r?\n\s*logger\.info\(`Created new room \$\{roomId\}`\))/,
    replacement: `room = {\r
          id: roomId,\r
          users: [],\r
          nodes: [],\r
          edges: [],\r
          clients: new Map(),\r
          version: 0,\r
          nodeVersions: new Map(),\r
          edgeVersions: new Map(),\r
        };\r
        this.rooms.set(roomId, room);\r
        this.ensureProcessedOpIds(roomId);\r
        logger.info(\`Created new room \${roomId}\`)`
  },

  // 6. leaveRoom - cleanup processedOpIds when deleting empty room
  {
    name: 'leaveRoom - cleanup processedOpIds',
    regex: /(this\.persistRoom\(roomId\)\.then\(\(\) => \{\s*\r?\n\s*this\.rooms\.delete\(roomId\);\s*\r?\n\s*logger\.info\(`Deleted empty room \$\{roomId\}`)/,
    replacement: `this.persistRoom(roomId).then(() => {\r
                this.rooms.delete(roomId);\r
                this.processedOpIds.delete(roomId);\r
                logger.info(\`Deleted empty room \${roomId}\`)`
  },

  // 7. persistRoom - persist version field
  {
    name: 'persistRoom - include version',
    regex: /(const dataToPersist = \{\s*\r?\n\s*id: room\.id,\s*\r?\n\s*users: room\.users,\s*\r?\n\s*nodes: room\.nodes,\s*\r?\n\s*edges: room\.edges,\s*\r?\n\s*\};)/,
    replacement: `      const dataToPersist = {\r
        id: room.id,\r
        users: room.users,\r
        nodes: room.nodes,\r
        edges: room.edges,\r
        version: room.version,\r
      };`
  },

  // 8. Replace entire applyOperation method
  {
    name: 'applyOperation - replace entire method',
    regex: /(\s*applyOperation\(roomId: string, op: ClientMessage, userId: string\): void \{[\s\S]*?\n  \}\s*\n\s*\n\s*sendInitState)/,
    replacement: (m, p1) => {
      const newApply = `  applyOperation(roomId: string, op: ClientMessage, userId: string): void {
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
          console.error(\`[Room:\${roomId}] [Op:\${op.type}] lockEditing error:\`, lockError);
        }
      }

      let changed = false;
      let broadcastExcludeSelf = false;

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
            if (hasEditOperation) {
              setTimeout(() => {
                try { snapshotManager.unlockEditing(roomId, userId); } catch (_) { /* ignore */ }
              }, 500);
            }
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
            if (hasEditOperation) {
              setTimeout(() => {
                try { snapshotManager.unlockEditing(roomId, userId); } catch (_) { /* ignore */ }
              }, 500);
            }
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
        if (hasEditOperation) {
          setTimeout(() => {
            try { snapshotManager.unlockEditing(roomId, userId); } catch (_) { /* ignore */ }
          }, 500);
        }
        return;
      }

      if (broadcastExcludeSelf) {
        this.broadcast(roomId, op as any, userId);
      } else {
        this.broadcast(roomId, op as any);
        if (hasEditOperation) this.schedulePersist(roomId);
      }

      if (hasEditOperation) {
        setTimeout(() => {
          try {
            snapshotManager.unlockEditing(roomId, userId);
          } catch (error) {
            console.error(\`[Room:\${roomId}] [Op:\${op.type}] unlockEditing error:\`, error);
          }
        }, 500);
      }
    } catch (e) {
      logger.error(\`Error in applyOperation for room \${roomId}, user \${userId}, op \${(op as any).type}\`, e);
      console.error(\`[Room:\${roomId}] [Op:\${(op as any).type}] applyOperation failed:\`, e);
    }
  }

  sendInitState`;
      // Preserve the original line endings by converting back to CRLF
      return '\r\n' + newApply.split('\n').join('\r\n') + '\r';
    }
  }
];

rmCode = applyPatches(rmCode, rmPatches);
writeCRLF(rmPath, rmCode);
console.log('--- roomManager.ts done ---');
