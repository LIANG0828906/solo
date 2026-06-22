import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const MAX_LINES = 14;

const roleColors = {
  poet: '#3498DB',
  critic: '#27AE60',
  editor: '#E67E22',
};

let projects = [];

const demoUser1 = {
  id: 'user-demo-1',
  name: '青莲居士',
  role: 'poet',
  contributionCount: 3,
  avatarColor: roleColors.poet,
};

const demoUser2 = {
  id: 'user-demo-2',
  name: '少陵野老',
  role: 'critic',
  contributionCount: 2,
  avatarColor: roleColors.critic,
};

const demoLines = [
  {
    id: 'line-1',
    content: '春江潮水连海平',
    authorId: 'user-demo-1',
    authorName: '青莲居士',
    role: 'poet',
    timestamp: Date.now() - 3600000,
  },
  {
    id: 'line-2',
    content: '海上明月共潮生',
    authorId: 'user-demo-2',
    authorName: '少陵野老',
    role: 'critic',
    timestamp: Date.now() - 3000000,
  },
  {
    id: 'line-3',
    content: '滟滟随波千万里',
    authorId: 'user-demo-1',
    authorName: '青莲居士',
    role: 'poet',
    timestamp: Date.now() - 2400000,
  },
  {
    id: 'line-4',
    content: '何处春江无月明',
    authorId: 'user-demo-2',
    authorName: '少陵野老',
    role: 'critic',
    timestamp: Date.now() - 1800000,
  },
  {
    id: 'line-5',
    content: '江流宛转绕芳甸',
    authorId: 'user-demo-1',
    authorName: '青莲居士',
    role: 'poet',
    timestamp: Date.now() - 1200000,
  },
];

projects.push({
  id: 'project-demo-1',
  title: '春江花月夜',
  participants: [demoUser1, demoUser2],
  lines: demoLines,
  maxLines: MAX_LINES,
  createdAt: Date.now() - 7200000,
  updatedAt: Date.now() - 1200000,
  isCompleted: false,
});

projects.push({
  id: 'project-demo-2',
  title: '山水之思',
  participants: [demoUser1],
  lines: [
    {
      id: 'line-s1',
      content: '青山横北郭',
      authorId: 'user-demo-1',
      authorName: '青莲居士',
      role: 'poet',
      timestamp: Date.now() - 600000,
    },
  ],
  maxLines: MAX_LINES,
  createdAt: Date.now() - 3600000,
  updatedAt: Date.now() - 600000,
  isCompleted: false,
});

app.get('/api/projects', (_req, res) => {
  const projectSummaries = projects.map((p) => ({
    id: p.id,
    title: p.title,
    participantCount: p.participants.length,
    lineCount: p.lines.length,
    maxLines: p.maxLines,
    updatedAt: p.updatedAt,
    isCompleted: p.isCompleted,
  }));
  res.json(projectSummaries);
});

app.get('/api/projects/:id', (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(project);
});

app.post('/api/projects', (req, res) => {
  const { title, userName, role } = req.body;
  if (!title || !userName || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!['poet', 'critic', 'editor'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const userId = uuidv4();
  const participant = {
    id: userId,
    name: userName,
    role,
    contributionCount: 0,
    avatarColor: roleColors[role],
  };

  const newProject = {
    id: uuidv4(),
    title,
    participants: [participant],
    lines: [],
    maxLines: MAX_LINES,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isCompleted: false,
  };

  projects.push(newProject);
  res.status(201).json({ project: new