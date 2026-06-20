import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MindMapDocument, MindMapNode, ThemeType } from '../types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PORT = 3001;
const DOCUMENTS_DIR = path.join(__dirname, '..', '..', 'documents');

if (!fs.existsSync(DOCUMENTS_DIR)) {
  fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());

interface ClientInfo {
  ws: WebSocket;
  docId: string;
  userId: string;
  userName: string;
  color: string;
}

const clients = new Map<string, Set<ClientInfo>>();
const docCache = new Map<string, MindMapDocument>();

const CURSOR_COLORS = [
  '#e53935',
  '#1e88e5',
  '#43a047',
  '#fb8c00',
  '#8e24aa',
  '#00acc1',
  '#f4511e',
  '#6d4c41',
];

function loadDocument(docId: string): MindMapDocument | null {
  if (docCache.has(docId)) {
    return docCache.get(docId)!;
  }

  const filePath = path.join(DOCUMENTS_DIR, `${docId}.json`);
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      const doc = JSON.parse(data) as MindMapDocument;
      docCache.set(docId, doc);
      return doc;
    } catch (e) {
      console.error('Failed to load document:', e);
      return null;
    }
  }
  return null;
}

function saveDocument(doc: MindMapDocument) {
  docCache.set(doc.id, doc);
  const filePath = path.join(DOCUMENTS_DIR, `${doc.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(doc, null, 2), 'utf-8');
}

function createDocument(theme: ThemeType, userName: string): MindMapDocument {
  const docId = uuidv4();
  const centerX = 400;
  const centerY = 300;

  const rootNode: MindMapNode = {
    id: uuidv4(),
    text: '中心主题',
    x: centerX,
    y: centerY,
    parentId: null,
  };

  const doc: MindMapDocument = {
    id: docId,
    title: '思维导图',
    theme,
    nodes: [rootNode],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  saveDocument(doc);
  return doc;
}

app.post('/api/documents', (req, res) => {
  try {
    const { theme, userName } = req.body;
    const doc = createDocument(theme || 'ocean', userName || 'User');
    res.json(doc);
  } catch (e) {
    console.error('Failed to create document:', e);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

app.get('/api/documents/:id', (req, res) => {
  try {
    const doc = loadDocument(req.params.id);
    if (doc) {
      res.json(doc);
    } else {
      res.status(404).json({ error: 'Document not found' });
    }
  } catch (e) {
    console.error('Failed to get document:', e);
    res.status(500).json({ error: 'Failed to get document' });
  }
});

function getDocClients(docId: string): Set<ClientInfo> {
  if (!clients.has(docId)) {
    clients.set(docId, new Set());
  }
  return clients.get(docId)!;
}

function broadcastToDoc(docId: string, message: any, excludeUserId?: string) {
  const docClients = getDocClients(docId);
  const data = JSON.stringify(message);

  docClients.forEach((client) => {
    if (client.userId !== excludeUserId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data);
    }
  });
}

function applyOperation(doc: MindMapDocument, operation: any): MindMapDocument {
  let newNodes = [...doc.nodes];

  switch (operation.type) {
    case 'add': {
      const existing = newNodes.find((n) => n.id === operation.nodeId);
      if (!existing) {
        newNodes.push(operation.payload.node);
      }
      break;
    }
    case 'delete': {
      newNodes = newNodes.filter((n) => n.id !== operation.nodeId);
      const children = newNodes.filter((n) => n.parentId === operation.nodeId);
      children.forEach((child) => {
        child.parentId = operation.payload.parentId;
      });
      break;
    }
    case 'move': {
      const node = newNodes.find((n) => n.id === operation.nodeId);
      if (node) {
        node.x = operation.payload.x;
        node.y = operation.payload.y;
      }
      break;
    }
    case 'edit': {
      if (operation.nodeId === '__history__') {
        newNodes = JSON.parse(JSON.stringify(operation.payload.nodes));
      } else {
        const node = newNodes.find((n) => n.id === operation.nodeId);
        if (node) {
          node.text = operation.payload.text;
        }
      }
      break;
    }
  }

  return {
    ...doc,
    nodes: newNodes,
    updatedAt: Date.now(),
  };
}

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '', 'http://localhost');
  const docId = url.searchParams.get('docId');
  const userId = url.searchParams.get('userId') || uuidv4();
  const userName = decodeURIComponent(url.searchParams.get('userName') || 'Anonymous');

  if (!docId) {
    ws.close();
    return;
  }

  const doc = loadDocument(docId);
  if (!doc) {
    ws.close();
    return;
  }

  const docClients = getDocClients(docId);
  const colorIndex = docClients.size % CURSOR_COLORS.length;
  const color = CURSOR_COLORS[colorIndex];

  const clientInfo: ClientInfo = {
    ws,
    docId,
    userId,
    userName,
    color,
  };

  docClients.add(clientInfo);

  ws.send(
    JSON.stringify({
      type: 'doc-state',
      document: doc,
    })
  );

  broadcastToDoc(
    docId,
    {
      type: 'user-join',
      userId,
      userName,
      color,
    },
    userId
  );

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'operation': {
          const currentDoc = loadDocument(docId);
          if (currentDoc) {
            const updatedDoc = applyOperation(currentDoc, message.operation);
            saveDocument(updatedDoc);

            broadcastToDoc(
              docId,
              {
                type: 'operation-broadcast',
                operation: message.operation,
                userId: message.userId,
                userName: message.userName,
              },
              message.userId
            );
          }
          break;
        }

        case 'cursor': {
          broadcastToDoc(
            docId,
            {
              type: 'cursor-broadcast',
              x: message.x,
              y: message.y,
              userId: message.userId,
              userName: message.userName,
              color: message.color,
            },
            message.userId
          );
          break;
        }
      }
    } catch (e) {
      console.error('Failed to process message:', e);
    }
  });

  ws.on('close', () => {
    docClients.delete(clientInfo);

    broadcastToDoc(docId, {
      type: 'user-leave',
      userId,
      userName,
    });

    if (docClients.size === 0) {
      docCache.delete(docId);
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Documents stored in: ${DOCUMENTS_DIR}`);
});
