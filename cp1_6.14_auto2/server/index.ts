import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { versionManager, Version } from './versionManager';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const AUTO_SAVE_INTERVAL = 30 * 1000;
const activeDocuments: Set<string> = new Set();

const autoSaveTimers: Map<string, NodeJS.Timeout> = new Map();

function startAutoSave(docId: string) {
  if (autoSaveTimers.has(docId)) return;

  const timer = setInterval(() => {
    const roomSockets = io.sockets.adapter.rooms.get(docId);
    if (!roomSockets || roomSockets.size === 0) {
      const timer = autoSaveTimers.get(docId);
      if (timer) {
        clearInterval(timer);
        autoSaveTimers.delete(docId);
      }
      activeDocuments.delete(docId);
      return;
    }

    const newVersion = versionManager.saveVersion(docId);
    if (newVersion) {
      io.to(docId).emit('version-created', newVersion);
      io.to(docId).emit('version-list', versionManager.getVersions(docId));
    }
  }, AUTO_SAVE_INTERVAL);

  autoSaveTimers.set(docId, timer);
  activeDocuments.add(docId);
}

app.get('/api/documents/:docId', (req, res) => {
  const { docId } = req.params;
  const content = versionManager.getCurrentContent(docId);
  const versions = versionManager.getVersions(docId);
  res.json({ docId, content, versions });
});

app.get('/api/documents/:docId/versions', (req, res) => {
  const { docId } = req.params;
  const versions = versionManager.getVersions(docId);
  res.json({ docId, versions });
});

app.get('/api/documents/:docId/versions/:versionId', (req, res) => {
  const { docId, versionId } = req.params;
  const version = versionManager.getVersion(docId, versionId);
  if (!version) {
    res.status(404).json({ error: 'Version not found' });
    return;
  }
  res.json({ version });
});

io.on('connection', (socket) => {
  let currentDocId: string | null = null;

  socket.on('join-document', (docId: string) => {
    if (currentDocId) {
      socket.leave(currentDocId);
    }

    currentDocId = docId;
    socket.join(docId);

    const content = versionManager.getCurrentContent(docId);
    const versions = versionManager.getVersions(docId);

    socket.emit('document-state', { docId, content, versions });

    startAutoSave(docId);

    const roomSockets = io.sockets.adapter.rooms.get(docId);
    const userCount = roomSockets ? roomSockets.size : 0;
    io.to(docId).emit('user-count', userCount);
  });

  socket.on('edit-document', (data: { docId: string; edits: string }) => {
    if (!data.docId || !currentDocId) return;

    const newContent = versionManager.applyEdits(data.docId, data.edits);

    socket.to(data.docId).emit('document-updated', {
      docId: data.docId,
      content: newContent,
      edits: data.edits,
      senderId: socket.id,
    });
  });

  socket.on('update-content', (data: { docId: string; content: string }) => {
    if (!data.docId || !currentDocId) return;

    const newContent = versionManager.setFullContent(data.docId, data.content);

    socket.to(data.docId).emit('document-updated', {
      docId: data.docId,
      content: newContent,
      senderId: socket.id,
    });
  });

  socket.on('save-version', (docId: string, callback?: (v: Version | null) => void) => {
    if (!docId) {
      if (callback) callback(null);
      return;
    }

    const newVersion = versionManager.saveVersion(docId);
    if (newVersion) {
      io.to(docId).emit('version-created', newVersion);
      io.to(docId).emit('version-list', versionManager.getVersions(docId));
    }
    if (callback) callback(newVersion);
  });

  socket.on('get-versions', (docId: string, callback?: (versions: Version[]) => void) => {
    const versions = versionManager.getVersions(docId);
    if (callback) callback(versions);
    socket.emit('version-list', versions);
  });

  socket.on('restore-version', (data: { docId: string; versionId: string }) => {
    if (!data.docId || !data.versionId) return;

    const restoredVersion = versionManager.restoreVersion(data.docId, data.versionId);
    if (restoredVersion) {
      const currentContent = versionManager.getCurrentContent(data.docId);
      io.to(data.docId).emit('restore-version', {
        docId: data.docId,
        versionId: data.versionId,
        content: currentContent,
        restoredVersion,
      });
      io.to(data.docId).emit('version-list', versionManager.getVersions(data.docId));
    }
  });

  socket.on('disconnect', () => {
    if (currentDocId) {
      const roomSockets = io.sockets.adapter.rooms.get(currentDocId);
      const userCount = roomSockets ? roomSockets.size - 1 : 0;
      if (userCount > 0) {
        io.to(currentDocId).emit('user-count', userCount);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
