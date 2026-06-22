import type { Request, Response } from 'express';
import type { Server } from 'socket.io';
import type { VersionSnapshot, Note, Track } from '../../../src/types';
import { getRoomState, setRoomState } from '../sync/SyncModule';

const generateId = () => Math.random().toString(36).substring(2, 15);

interface VersionStore {
  [roomId: string]: VersionSnapshot[];
}

const versionStore: VersionStore = {};

export function setupVersionRoutes(app: any, io: Server): void {
  app.get('/api/versions/:roomId', (req: Request, res: Response) => {
    const { roomId } = req.params;
    const versions = versionStore[roomId] || [];
    res.json({ versions: versions.slice(0, 10) });
  });

  app.post('/api/versions', (req: Request, res: Response) => {
    const { roomId, userId, userName, snapshot } = req.body as {
      roomId: string;
      userId: string;
      userName: string;
      snapshot: { notes: Note[]; tracks: Track[]; bpm: number };
    };

    if (!roomId || !userId || !snapshot) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const finalUserName = userName || '匿名用户';

    const version: VersionSnapshot = {
      id: generateId(),
      roomId,
      userId,
      userName: finalUserName,
      createdAt: Date.now(),
      snapshot,
    };

    if (!versionStore[roomId]) {
      versionStore[roomId] = [];
    }
    versionStore[roomId].unshift(version);
    if (versionStore[roomId].length > 10) {
      versionStore[roomId] = versionStore[roomId].slice(0, 10);
    }

    res.json({ version });
  });

  app.delete('/api/versions/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    let deleted = false;

    for (const roomId of Object.keys(versionStore)) {
      const index = versionStore[roomId].findIndex(v => v.id === id);
      if (index !== -1) {
        versionStore[roomId].splice(index, 1);
        deleted = true;
        break;
      }
    }

    res.json({ success: deleted });
  });

  app.post('/api/versions/:id/restore', (req: Request, res: Response) => {
    const { id } = req.params;
    const { roomId } = req.body as { roomId: string };

    let targetVersion: VersionSnapshot | null = null;
    for (const room of Object.keys(versionStore)) {
      const found = versionStore[room].find(v => v.id === id);
      if (found) {
        targetVersion = found;
        break;
      }
    }

    if (!targetVersion) {
      return res.status(404).json({ error: 'Version not found' });
    }

    setRoomState(roomId, targetVersion.snapshot, io);

    res.json({
      notes: targetVersion.snapshot.notes,
      tracks: targetVersion.snapshot.tracks,
      bpm: targetVersion.snapshot.bpm,
    });
  });
}
