import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import http from 'http';

interface Project {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  onlineUsers: User[];
}

interface User {
  id: string;
  name: string;
  color: string;
  cursor: { line: number; col: number } | null;
  selection: { start: number; end: number } | null;
  ws: WebSocket;
  projectId: string | null;
}

interface WSMessage {
  type: string;
  payload: any;
}

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const projects = new Map<string, Project>();
const users = new Map<string, User>();

const COLORS = [
  '#f38ba8', '#fab387', '#f9e2af', '#a6e3a1',
  '#94e2d5', '#89b4fa', '#cba6f7', '#f5c2e7',
];

const DEFAULT_ABC = `T:示例乐谱
C:传统
M:4/4
L:1/8
Q:120
K:C
C2 D2 E2 F2|G4 A4|B2 c2 d2 e2|c8|
D2 E2 F2 G2|A4 B4|c2 d2 e2 f2|g8|
`;

const getUserColor = (): string => {
  const usedColors = Array.from(users.values()).map(u => u.color);
  const available = COLORS.filter(c => !usedColors.includes(c));
  return available[0] || COLORS[Math.floor(Math.random() * COLORS.length)];
};

const getUserName = (id: string): string => {
  const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Evan', 'Fiona', 'George', 'Hannah'];
  const idx = Array.from(users.keys()).indexOf(id) % names.length;
  return names[idx] || `用户${id.slice(0, 4)}`;
};

app.get('/api/projects', (req, res) => {
  const list = Array.from(projects.values()).map(p => ({
    id: p.id,
    name: p.name,
    createdAt: p.createdAt,
    onlineCount: p.onlineUsers.length,
  }));
  res.json(list);
});

app.post('/api/projects', (req, res) => {
  const { name } = req.body;
  if (!name || name.length > 30) {
    return res.status(400).json({ error: '项目名称无效（最多30字符）' });
  }
  const id = uuidv4();
  const project: Project = {
    id,
    name,
    content: DEFAULT_ABC,
    createdAt: Date.now(),
    onlineUsers: [],
  };
  projects.set(id, project);
  res.json({ id, name, createdAt: project.createdAt, onlineCount: 0 });
});

app.get('/api/projects/:id', (req, res) => {
  const project = projects.get(req.params.id);
  if (!project) return res.status(404).json({ error: '项目不存在' });
  res.json({
    id: project.id,
    name: project.name,
    content: project.content,
    createdAt: project.createdAt,
    onlineCount: project.onlineUsers.length,
  });
});

app.delete('/api/projects/:id', (req, res) => {
  const deleted = projects.delete(req.params.id);
  if (!deleted) return res.status(404).json({ error: '项目不存在' });
  res.json({ success: true });
});

wss.on('connection', (ws: WebSocket) => {
  const userId = uuidv4();
  const user: User = {
    id: userId,
    name: getUserName(userId),
    color: getUserColor(),
    cursor: null,
    selection: null,
    ws,
    projectId: null,
  };
  users.set(userId, user);

  ws.send(JSON.stringify({
    type: 'init',
    payload: { userId, name: user.name, color: user.color },
  }));

  ws.on('message', (data) => {
    let msg: WSMessage;
    try {
      msg = JSON.parse(data.toString());
    } catch { return; }

    const { type, payload } = msg;
    const currentUser = users.get(userId);
    if (!currentUser) return;

    if (type === 'join-project') {
      const { projectId } = payload;
      const project = projects.get(projectId);
      if (!project) {
        ws.send(JSON.stringify({ type: 'error', payload: { message: '项目不存在' } }));
        return;
      }
      if (project.onlineUsers.length >= 8) {
        ws.send(JSON.stringify({ type: 'error', payload: { message: '协作人数已满（最多8人）' } }));
        return;
      }

      if (currentUser.projectId) {
        const oldProject = projects.get(currentUser.projectId);
        if (oldProject) {
          oldProject.onlineUsers = oldProject.onlineUsers.filter(u => u.id !== userId);
          broadcastProjectUsers(oldProject);
        }
      }

      currentUser.projectId = projectId;
      project.onlineUsers.push(currentUser);

      ws.send(JSON.stringify({
        type: 'project-joined',
        payload: {
          project: {
            id: project.id,
            name: project.name,
            content: project.content,
            createdAt: project.createdAt,
          },
          users: project.onlineUsers.map(u => ({
            id: u.id, name: u.name, color: u.color, cursor: u.cursor, selection: u.selection,
          })),
        },
      }));

      broadcastProjectUsers(project, userId);
      broadcastToProject(project, {
        type: 'user-joined',
        payload: { id: userId, name: currentUser.name, color: currentUser.color },
      }, userId);
    }

    if (type === 'leave-project') {
      if (currentUser.projectId) {
        const project = projects.get(currentUser.projectId);
        if (project) {
          project.onlineUsers = project.onlineUsers.filter(u => u.id !== userId);
          broadcastProjectUsers(project);
          broadcastToProject(project, {
            type: 'user-left',
            payload: { id: userId },
          });
        }
        currentUser.projectId = null;
      }
    }

    if (type === 'text-change') {
      if (!currentUser.projectId) return;
      const project = projects.get(currentUser.projectId);
      if (!project) return;
      project.content = payload.content;
      broadcastToProject(project, {
        type: 'text-change',
        payload: { userId, content: payload.content, timestamp: Date.now() },
      }, userId);
    }

    if (type === 'cursor-change') {
      if (!currentUser.projectId) return;
      currentUser.cursor = payload.cursor;
      currentUser.selection = payload.selection;
      const project = projects.get(currentUser.projectId);
      if (project) {
        broadcastToProject(project, {
          type: 'cursor-change',
          payload: { userId, cursor: payload.cursor, selection: payload.selection },
        }, userId);
      }
    }

    if (type === 'transpose') {
      if (!currentUser.projectId) return;
      const project = projects.get(currentUser.projectId);
      if (!project) return;
      project.content = payload.content;
      broadcastToProject(project, {
        type: 'text-change',
        payload: { userId, content: payload.content, timestamp: Date.now() },
      });
    }
  });

  ws.on('close', () => {
    const u = users.get(userId);
    if (u?.projectId) {
      const project = projects.get(u.projectId);
      if (project) {
        project.onlineUsers = project.onlineUsers.filter(x => x.id !== userId);
        broadcastProjectUsers(project);
        broadcastToProject(project, {
          type: 'user-left',
          payload: { id: userId },
        });
      }
    }
    users.delete(userId);
  });
});

function broadcastToProject(project: Project, message: WSMessage, excludeId?: string) {
  const data = JSON.stringify(message);
  project.onlineUsers.forEach(u => {
    if (excludeId && u.id === excludeId) return;
    if (u.ws.readyState === WebSocket.OPEN) u.ws.send(data);
  });
}

function broadcastProjectUsers(project: Project, excludeId?: string) {
  broadcastToProject(project, {
    type: 'users-update',
    payload: project.onlineUsers.map(u => ({
      id: u.id, name: u.name, color: u.color, cursor: u.cursor, selection: u.selection,
    })),
  }, excludeId);
}

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
