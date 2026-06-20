import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  createDocument,
  getDocument,
  getAllDocuments,
  updateDocumentTitle,
  deleteDocument,
  applyOTAction,
  saveSnapshot,
  getVersions,
  restoreVersion,
  addOnlineUser,
  removeOnlineUser,
  getOnlineUsers,
  startAutoSave,
  stopAutoSave,
} from './documentModule.js';
import type { OTAction, CursorPosition, User } from '../shared/types';

const app = express();
app.use(express.json());

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = 3001;
const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
const userColors = new Map<string, string>();

function getColorForUser(userId: string): string {
  if (!userColors.has(userId)) {
    const colorIndex = userColors.size % colors.length;
    userColors.set(userId, colors[colorIndex]);
  }
  return userColors.get(userId)!;
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map(s => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const userNames = new Map<string, string>();

app.get('/api/documents', (req, res) => {
  const docs = getAllDocuments();
  res.json(docs);
});

app.post('/api/documents', (req, res) => {
  const { title, content } = req.body;
  const doc = createDocument(title || '未命名文档', content || '');
  res.json(doc);
});

app.put('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  const success = updateDocumentTitle(id, title);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: '文档不存在' });
  }
});

app.delete('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  const success = deleteDocument(id);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, error: '文档不存在' });
  }
});

app.get('/api/documents/:id/versions', (req, res) => {
  const { id } = req.params;
  const versions = getVersions(id);
  res.json(versions);
});

app.post('/api/documents/:id/versions/:versionId/restore', (req, res) => {
  const { id, versionId } = req.params;
  const content = restoreVersion(id, versionId);
  if (content !== null) {
    io.to(id).emit('doc:restored', { content, versionId });
    res.json({ success: true, content });
  } else {
    res.status(404).json({ success: false, error: '版本不存在' });
  }
});

io.on('connection', (socket) => {
  let currentDocId: string | null = null;
  let currentUserId: string | null = null;
  let currentUserName: string | null = null;

  socket.on('doc:join', ({ docId, userId, userName }) => {
    const doc = getDocument(docId);
    if (!doc) {
      socket.emit('doc:error', { error: '文档不存在' });
      return;
    }

    currentDocId = docId;
    currentUserId = userId;
    currentUserName = userName;
    userNames.set(userId, userName);

    const color = getColorForUser(userId);
    const user: User = {
      id: userId,
      name: userName,
      color,
      avatar: getInitials(userName),
    };

    socket.join(docId);
    addOnlineUser(docId, user);
    startAutoSave(docId, (snapshot) => {
      io.to(docId).emit('doc:new-version', snapshot);
    });

    socket.emit('doc:joined', {
      document: doc,
      currentUser: user,
    });

    const onlineUsers = getOnlineUsers(docId);
    io.to(docId).emit('doc:users-update', onlineUsers);

    socket.to(docId).emit('doc:user-joined', user);
  });

  socket.on('doc:action', (action: OTAction) => {
    if (!currentDocId) return;

    const result = applyOTAction(currentDocId, action);
    if (result.success) {
      socket.to(currentDocId).emit('doc:action', action);
    }
  });

  socket.on('doc:cursor', (cursor: CursorPosition) => {
    if (!currentDocId) return;
    socket.to(currentDocId).emit('doc:cursor', cursor);
  });

  socket.on('doc:save', ({ label }: { label?: string }) => {
    if (!currentDocId || !currentUserId || !currentUserName) return;

    const snapshot = saveSnapshot(currentDocId, currentUserId, currentUserName, label);
    if (snapshot) {
      io.to(currentDocId).emit('doc:new-version', snapshot);
      socket.emit('doc:saved', snapshot);
    }
  });

  socket.on('doc:restore-version', ({ versionId }: { versionId: string }) => {
    if (!currentDocId) return;

    const content = restoreVersion(currentDocId, versionId);
    if (content !== null) {
      io.to(currentDocId).emit('doc:restored', { content, versionId });
    }
  });

  socket.on('disconnect', () => {
    if (currentDocId && currentUserId) {
      removeOnlineUser(currentDocId, currentUserId);
      const onlineUsers = getOnlineUsers(currentDocId);
      io.to(currentDocId).emit('doc:users-update', onlineUsers);
      socket.to(currentDocId).emit('doc:user-left', { userId: currentUserId });

      if (onlineUsers.length === 0) {
        stopAutoSave(currentDocId);
      }
    }
  });
});

if (getAllDocuments().length === 0) {
  createDocument('欢迎文档', '欢迎使用协同写作平台！\n\n这是一个支持多人实时协作的文档编辑器。\n\n你可以：\n- 实时与他人协作编辑\n- 查看历史版本\n- 创建和管理多个文档\n\n开始你的写作之旅吧！');
}

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
  console.log(`Socket.IO: http://localhost:${PORT}`);
});
