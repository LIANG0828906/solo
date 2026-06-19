import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const PORT = 3001;
const DOC_ID = 'shared-doc-1';

const state = {
  content: '<h1>欢迎使用协作文档编辑器</h1><p>这是一个支持多人实时协作的文档编辑器。您可以：</p><ul><li>同时编辑文档内容</li><li>查看其他用户的光标位置</li><li>浏览版本历史并恢复</li></ul><p>开始编辑吧！</p>',
  versions: [],
  clients: new Map(),
  versionCounter: 0,
  lastSaveTimer: null,
  pendingVersion: null
};

app.use(express.json({ limit: '10mb' }));

app.get('/api/document/:id', (req, res) => {
  res.json({
    id: DOC_ID,
    content: state.content,
    versions: state.versions
  });
});

app.get('/api/document/:id/versions', (req, res) => {
  res.json(state.versions);
});

const broadcast = (message, excludeId = null) => {
  const data = JSON.stringify(message);
  state.clients.forEach((client, id) => {
    if (id !== excludeId && client.ws.readyState === 1) {
      client.ws.send(data);
    }
  });
};

const broadcastPresence = () => {
  const users = [];
  state.clients.forEach((client, id) => {
    users.push({
      id,
      name: client.name,
      color: client.color,
      cursor: client.cursor
    });
  });
  broadcast({ type: 'presence', users });
};

const generateColor = () => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8B500', '#00CED1', '#FF7F50', '#9370DB', '#3CB371'
  ];
  const usedColors = Array.from(state.clients.values()).map(c => c.color);
  const available = colors.filter(c => !usedColors.includes(c));
  return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : colors[Math.floor(Math.random() * colors.length)];
};

const generateName = () => {
  const adjectives = ['快乐的', '聪明的', '勇敢的', '温柔的', '活泼的', '认真的', '友善的', '机智的'];
  const nouns = ['小猫', '小狗', '小兔', '小熊', '小鹿', '小鸟', '小鱼', '小松鼠'];
  return adjectives[Math.floor(Math.random() * adjectives.length)] + nouns[Math.floor(Math.random() * nouns.length)];
};

const saveVersion = (userId, userName) => {
  if (state.pendingVersion && state.pendingVersion.content === state.content) {
    return;
  }
  
  const version = {
    id: uuidv4(),
    versionNumber: ++state.versionCounter,
    content: state.content,
    timestamp: Date.now(),
    userId,
    userName
  };
  
  state.versions.unshift(version);
  state.pendingVersion = version;
  
  broadcast({
    type: 'version-created',
    version
  });
};

const scheduleVersionSave = (userId, userName) => {
  if (state.lastSaveTimer) {
    clearTimeout(state.lastSaveTimer);
  }
  state.lastSaveTimer = setTimeout(() => {
    saveVersion(userId, userName);
    state.lastSaveTimer = null;
  }, 3000);
};

const applyOperation = (op) => {
  if (op.type === 'replace') {
    state.content = op.content;
    return true;
  }
  return false;
};

wss.on('connection', (ws) => {
  const clientId = uuidv4();
  const clientData = {
    ws,
    id: clientId,
    name: generateName(),
    color: generateColor(),
    cursor: null
  };
  
  state.clients.set(clientId, clientData);
  
  ws.send(JSON.stringify({
    type: 'init',
    clientId,
    name: clientData.name,
    color: clientData.color,
    content: state.content,
    versions: state.versions
  }));
  
  broadcastPresence();
  
  ws.on('message', (raw) => {
    try {
      const message = JSON.parse(raw.toString());
      const client = state.clients.get(clientId);
      if (!client) return;
      
      switch (message.type) {
        case 'operation': {
          const applied = applyOperation(message.operation);
          if (applied) {
            broadcast({
              type: 'operation',
              operation: message.operation,
              userId: clientId
            }, clientId);
            
            scheduleVersionSave(clientId, client.name);
          }
          break;
        }
        
        case 'cursor': {
          client.cursor = message.cursor;
          broadcast({
            type: 'cursor',
            userId: clientId,
            cursor: message.cursor
          }, clientId);
          break;
        }
        
        case 'restore-version': {
          const version = state.versions.find(v => v.id === message.versionId);
          if (version) {
            state.content = version.content;
            broadcast({
              type: 'operation',
              operation: { type: 'replace', content: version.content },
              userId: clientId,
              restored: true,
              versionId: version.id
            });
            
            const restoredVersion = {
              id: uuidv4(),
              versionNumber: ++state.versionCounter,
              content: version.content,
              timestamp: Date.now(),
              userId: clientId,
              userName: client.name,
              restoredFrom: version.id
            };
            state.versions.unshift(restoredVersion);
            broadcast({
              type: 'version-created',
              version: restoredVersion
            });
          }
          break;
        }
        
        case 'rename': {
          if (message.name && typeof message.name === 'string') {
            client.name = message.name.slice(0, 20);
            broadcastPresence();
          }
          break;
        }
      }
    } catch (e) {
      console.error('Message parse error:', e);
    }
  });
  
  ws.on('close', () => {
    state.clients.delete(clientId);
    broadcastPresence();
  });
  
  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

server.listen(PORT, () => {
  console.log(`Collab Doc Server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
});
