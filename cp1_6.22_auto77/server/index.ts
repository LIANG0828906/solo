import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import {
  MindMapData,
  MindMapNode,
  Note,
  OnlineUser,
  ClientMessage,
  ServerMessage,
} from '../src/types';
import { getRandomAvatarColor } from '../src/utils/colors';

const PORT = 3001;

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

function createInitialData(): MindMapData {
  const rootId = 'root-' + uuidv4().slice(0, 8);
  return {
    rootId,
    nodes: {
      [rootId]: {
        id: rootId,
        parentId: null,
        text: '中心主题',
        colorTag: '#1e3a5f',
        level: 0,
        order: 0,
        collapsed: false,
        childrenIds: [],
      },
    },
    notes: {},
  };
}

let mindMap: MindMapData = createInitialData();
const users: Map<WebSocket, OnlineUser> = new Map();

function broadcast(msg: ServerMessage, exclude?: WebSocket) {
  const data = JSON.stringify(msg);
  wss.clients.forEach((client) => {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function collectDescendantIds(nodeId: string, result: string[] = []): string[] {
  const node = mindMap.nodes[nodeId];
  if (!node) return result;
  result.push(nodeId);
  for (const childId of node.childrenIds) {
    collectDescendantIds(childId, result);
  }
  return result;
}

function handleMessage(ws: WebSocket, raw: string) {
  let msg: ClientMessage;
  try {
    msg = JSON.parse(raw) as ClientMessage;
  } catch {
    return;
  }

  switch (msg.type) {
    case 'JOIN': {
      const user: OnlineUser = {
        userId: msg.userId,
        name: msg.userName || `用户${msg.userId.slice(0, 4)}`,
        avatarColor: getRandomAvatarColor(msg.userId),
      };
      users.set(ws, user);
      const initMsg: ServerMessage = {
        type: 'INIT',
        data: mindMap,
        users: Array.from(users.values()),
      };
      ws.send(JSON.stringify(initMsg));
      broadcast({ type: 'USER_JOIN', user }, ws);
      break;
    }

    case 'UPDATE_NODE': {
      const node = mindMap.nodes[msg.nodeId];
      if (node) {
        mindMap.nodes[msg.nodeId] = { ...node, ...msg.patch };
        broadcast(msg);
      }
      break;
    }

    case 'ADD_NODE': {
      const parent = mindMap.nodes[msg.parentId];
      if (parent) {
        const newNode: MindMapNode = {
          ...msg.newNode,
          level: parent.level + 1,
          order: parent.childrenIds.length,
        };
        mindMap.nodes[newNode.id] = newNode;
        parent.childrenIds.push(newNode.id);
        parent.collapsed = false;
        broadcast({
          type: 'ADD_NODE',
          parentId: msg.parentId,
          newNode,
        });
      }
      break;
    }

    case 'DELETE_NODE': {
      if (msg.nodeId === mindMap.rootId) break;
      const target = mindMap.nodes[msg.nodeId];
      if (!target || !target.parentId) break;
      const toDelete = collectDescendantIds(msg.nodeId);
      const parent = mindMap.nodes[target.parentId];
      if (parent) {
        parent.childrenIds = parent.childrenIds.filter((id) => id !== msg.nodeId);
      }
      for (const id of toDelete) {
        delete mindMap.nodes[id];
        delete mindMap.notes[id];
      }
      broadcast(msg);
      break;
    }

    case 'MOVE_NODE': {
      const node = mindMap.nodes[msg.nodeId];
      if (!node || !node.parentId || msg.nodeId === mindMap.rootId) break;
      if (msg.newParentId === node.parentId) {
        const parent = mindMap.nodes[node.parentId];
        if (!parent) break;
        const ids = [...parent.childrenIds];
        const fromIdx = ids.indexOf(msg.nodeId);
        if (fromIdx < 0) break;
        const [removed] = ids.splice(fromIdx, 1);
        const toIdx = Math.max(0, Math.min(msg.index, ids.length));
        ids.splice(toIdx, 0, removed);
        parent.childrenIds = ids;
      } else {
        const oldParent = mindMap.nodes[node.parentId];
        const newParent = mindMap.nodes[msg.newParentId];
        if (!oldParent || !newParent) break;
        const descendant = new Set(collectDescendantIds(msg.nodeId));
        if (descendant.has(msg.newParentId)) break;
        oldParent.childrenIds = oldParent.childrenIds.filter((id) => id !== msg.nodeId);
        const targetIdx = Math.max(0, Math.min(msg.index, newParent.childrenIds.length));
        newParent.childrenIds.splice(targetIdx, 0, msg.nodeId);
        node.parentId = msg.newParentId;
        const updateLevel = (id: string, level: number) => {
          const n = mindMap.nodes[id];
          if (!n) return;
          n.level = level;
          for (const cid of n.childrenIds) updateLevel(cid, level + 1);
        };
        updateLevel(msg.nodeId, newParent.level + 1);
      }
      broadcast(msg);
      break;
    }

    case 'ADD_NOTE': {
      const { nodeId, note } = msg;
      if (!mindMap.notes[nodeId]) mindMap.notes[nodeId] = [];
      mindMap.notes[nodeId].push({ ...note, order: mindMap.notes[nodeId].length });
      broadcast(msg);
      break;
    }

    case 'UPDATE_NOTE': {
      const list = mindMap.notes[msg.nodeId];
      if (list) {
        const note = list.find((n) => n.id === msg.noteId);
        if (note) note.content = msg.content;
      }
      broadcast(msg);
      break;
    }

    case 'DELETE_NOTE': {
      const list = mindMap.notes[msg.nodeId];
      if (list) {
        mindMap.notes[msg.nodeId] = list.filter((n) => n.id !== msg.noteId);
      }
      broadcast(msg);
      break;
    }

    case 'REORDER_NOTES': {
      const list = mindMap.notes[msg.nodeId];
      if (list) {
        const map = new Map(list.map((n) => [n.id, n]));
        const reordered = msg.noteIds.map((id, i) => {
          const note = map.get(id);
          if (note) note.order = i;
          return note;
        }).filter(Boolean) as Note[];
        mindMap.notes[msg.nodeId] = reordered;
      }
      broadcast(msg);
      break;
    }
  }
}

wss.on('connection', (ws) => {
  ws.on('message', (data) => handleMessage(ws, data.toString()));
  ws.on('close', () => {
    const user = users.get(ws);
    if (user) {
      users.delete(ws);
      broadcast({ type: 'USER_LEAVE', userId: user.userId });
    }
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', users: users.size });
});

server.listen(PORT, () => {
  console.log(`[server] HTTP+WS listening on http://localhost:${PORT}`);
});
