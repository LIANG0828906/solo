import express, { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer, IncomingMessage } from 'http';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type {
  Sample,
  Project,
  ClientMessage,
  ServerMessage,
  JoinMessage,
  OperationMessage,
  UserJoinedMessage,
  UserLeftMessage,
  OperationBroadcastMessage,
  Collaborator,
} from '../types';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ noServer: true });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

interface ProjectState {
  project: Project;
  connections: Map<string, WebSocket>;
  users: Map<string, Collaborator>;
}

const projects = new Map<string, ProjectState>();

const COLLAB_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

const TRACK_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

const getOrCreateProject = (projectId: string): ProjectState => {
  let state = projects.get(projectId);
  if (!state) {
    const tracks = Array.from({ length: 4 }, (_, i) => ({
      id: uuidv4(),
      name: `音轨 ${i + 1}`,
      color: TRACK_COLORS[i % TRACK_COLORS.length],
      volume: 0.8,
      muted: false,
      solo: false,
    }));

    const project: Project = {
      id: projectId,
      name: '协作项目',
      tracks,
      clips: [],
      samples: [],
      collaborators: [],
    };

    state = {
      project,
      connections: new Map(),
      users: new Map(),
    };
    projects.set(projectId, state);
  }
  return state;
};

const samples: Sample[] = [
  {
    id: 'demo-kick-1',
    name: '底鼓 Kick 1',
    duration: 0.5,
    url: '',
    color: '#EF4444',
    category: 'drum',
  },
  {
    id: 'demo-snare-1',
    name: '军鼓 Snare 1',
    duration: 0.3,
    url: '',
    color: '#F59E0B',
    category: 'drum',
  },
  {
    id: 'demo-hihat-1',
    name: '踩镲 HiHat 1',
    duration: 0.15,
    url: '',
    color: '#10B981',
    category: 'drum',
  },
  {
    id: 'demo-vocal-1',
    name: '人声切片 Vocal 1',
    duration: 1.2,
    url: '',
    color: '#8B5CF6',
    category: 'vocal',
  },
  {
    id: 'demo-effect-1',
    name: '上升音效 Rise',
    duration: 1.5,
    url: '',
    color: '#06B6D4',
    category: 'effect',
  },
];

app.get('/api/samples', (req: Request, res: Response) => {
  res.json({ samples });
});

app.post('/api/samples', (req: Request, res: Response) => {
  const newSample: Sample = {
    id: uuidv4(),
    name: req.body.name || '未命名样本',
    duration: req.body.duration || 1,
    url: req.body.url || '',
    color: COLLAB_COLORS[Math.floor(Math.random() * COLLAB_COLORS.length)],
    category: req.body.category || 'other',
  };
  samples.push(newSample);
  res.json({ sample: newSample });
});

app.get('/api/projects/:id', (req: Request, res: Response) => {
  const projectId = req.params.id;
  const state = getOrCreateProject(projectId);
  res.json({ project: state.project });
});

app.put('/api/projects/:id', (req: Request, res: Response) => {
  const projectId = req.params.id;
  const state = getOrCreateProject(projectId);
  state.project = req.body.project;
  res.json({ success: true });
});

server.on('upgrade', (request: IncomingMessage, socket: any, head: Buffer) => {
  const url = request.url || '';
  const match = url.match(/\/ws\/project\/([^/]+)/);

  if (!match) {
    socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
    socket.destroy();
    return;
  }

  const projectId = match[1];
  const state = getOrCreateProject(projectId);

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request, state);
  });
});

wss.on('connection', (ws: WebSocket, request: IncomingMessage, state: ProjectState) => {
  let userId: string | null = null;

  ws.on('message', (data: WebSocket.Data) => {
    try {
      const message: ClientMessage = JSON.parse(data.toString());

      if (message.type === 'join') {
        const joinMsg = message as JoinMessage;
        userId = joinMsg.userId;

        if (state.users.size >= 3) {
          ws.send(JSON.stringify({
            type: 'error',
            message: '项目协作者已达上限（最多3人）',
          }));
          ws.close();
          return;
        }

        const user: Collaborator = {
          id: joinMsg.userId,
          name: joinMsg.userName,
          color: COLLAB_COLORS[state.users.size % COLLAB_COLORS.length],
          cursor: null,
        };

        state.users.set(userId, user);
        state.connections.set(userId, ws);

        state.project.collaborators = Array.from(state.users.values());

        state.connections.forEach((conn, id) => {
          if (id !== userId && conn.readyState === WebSocket.OPEN) {
            const userJoined: UserJoinedMessage = {
              type: 'user-joined',
              user,
            };
            conn.send(JSON.stringify(userJoined));
          }
        });

        console.log(`[WS] User ${user.name} joined project ${state.project.id}`);
      } else if (message.type === 'operation') {
        if (!userId) return;

        const opMsg = message as OperationMessage;
        const broadcast: OperationBroadcastMessage = {
          type: 'operation-broadcast',
          operation: opMsg.operation,
          excludeUserId: userId,
        };

        state.connections.forEach((conn, id) => {
          if (id !== userId && conn.readyState === WebSocket.OPEN) {
            conn.send(JSON.stringify(broadcast));
          }
        });
      }
    } catch (e) {
      console.error('[WS] Error parsing message:', e);
    }
  });

  ws.on('close', () => {
    if (!userId) return;

    const user = state.users.get(userId);
    if (user) {
      state.users.delete(userId);
      state.connections.delete(userId);
      state.project.collaborators = Array.from(state.users.values());

      state.connections.forEach((conn, id) => {
        if (conn.readyState === WebSocket.OPEN) {
          const userLeft: UserLeftMessage = {
            type: 'user-left',
            userId: userId!,
          };
          conn.send(JSON.stringify(userLeft));
        }
      });

      console.log(`[WS] User ${user.name} left project ${state.project.id}`);
    }
  });
});

const PORT = 3001;

server.listen(PORT, () => {
  console.log(`[Server] HTTP server running on port ${PORT}`);
  console.log(`[Server] WebSocket endpoint: ws://localhost:${PORT}/ws/project/:id`);
});

export default app;
