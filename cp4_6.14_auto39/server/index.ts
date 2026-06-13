import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { Project, CanvasComponent, Connection } from '../src/types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const projectsStore = new Map<string, Project>();

function createInitialProject(): Project {
  const now = Date.now();
  const sampleComponents: CanvasComponent[] = [
    {
      id: uuidv4(),
      type: 'rectangle',
      x: 200,
      y: 150,
      width: 240,
      height: 160,
      rotation: 0,
      style: {
        backgroundColor: '#ffffff',
        borderColor: '#1f2937',
        borderWidth: 2,
        borderRadius: 8
      },
      content: '',
      zIndex: 1,
      name: '登录卡片'
    },
    {
      id: uuidv4(),
      type: 'rectangle',
      x: 230,
      y: 180,
      width: 180,
      height: 36,
      rotation: 0,
      style: {
        backgroundColor: '#f3f4f6',
        borderColor: '#d1d5db',
        borderWidth: 1,
        borderRadius: 6
      },
      content: '',
      zIndex: 2,
      name: '用户名输入框'
    },
    {
      id: uuidv4(),
      type: 'text',
      x: 240,
      y: 186,
      width: 100,
      height: 24,
      rotation: 0,
      style: {
        color: '#6b7280',
        fontSize: 13,
        fontWeight: 400
      },
      content: '请输入用户名',
      zIndex: 3
    },
    {
      id: uuidv4(),
      type: 'rectangle',
      x: 230,
      y: 230,
      width: 180,
      height: 36,
      rotation: 0,
      style: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
        borderWidth: 1,
        borderRadius: 6
      },
      content: '',
      zIndex: 2,
      name: '登录按钮'
    },
    {
      id: uuidv4(),
      type: 'text',
      x: 290,
      y: 238,
      width: 60,
      height: 24,
      rotation: 0,
      style: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 600
      },
      content: '登 录',
      zIndex: 3
    },
    {
      id: uuidv4(),
      type: 'rectangle',
      x: 560,
      y: 150,
      width: 240,
      height: 200,
      rotation: 0,
      style: {
        backgroundColor: '#ffffff',
        borderColor: '#1f2937',
        borderWidth: 2,
        borderRadius: 8
      },
      content: '',
      zIndex: 1,
      name: '首页卡片'
    },
    {
      id: uuidv4(),
      type: 'text',
      x: 620,
      y: 170,
      width: 120,
      height: 28,
      rotation: 0,
      style: {
        color: '#1f2937',
        fontSize: 18,
        fontWeight: 700
      },
      content: '欢迎回来！',
      zIndex: 2
    }
  ];

  const loginBtn = sampleComponents.find(c => c.name === '登录按钮');
  const homeCard = sampleComponents.find(c => c.name === '首页卡片');

  const sampleConnections: Connection[] = loginBtn && homeCard ? [
    {
      id: uuidv4(),
      fromComponentId: loginBtn.id,
      toComponentId: homeCard.id,
      label: '点击登录'
    }
  ] : [];

  return {
    id: uuidv4(),
    name: '示例项目',
    components: sampleComponents,
    connections: sampleConnections,
    createdAt: now,
    updatedAt: now
  };
}

const initialProject = createInitialProject();
projectsStore.set(initialProject.id, initialProject);

app.get('/api/projects', (_req, res) => {
  const projects = Array.from(projectsStore.values()).map(p => ({
    id: p.id,
    name: p.name,
    updatedAt: p.updatedAt
  }));
  res.json({ projects });
});

app.get('/api/projects/:id', (req, res) => {
  const project = projectsStore.get(req.params.id);
  if (!project) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }
  res.json(project);
});

app.get('/api/project/default', (_req, res) => {
  const firstProject = projectsStore.values().next().value;
  if (firstProject) {
    res.json(firstProject);
  } else {
    const newProject = createInitialProject();
    projectsStore.set(newProject.id, newProject);
    res.json(newProject);
  }
});

app.post('/api/projects', (req, res) => {
  const { name, components, connections } = req.body as {
    name: string;
    components: CanvasComponent[];
    connections: Connection[];
  };

  if (!name || !components) {
    res.status(400).json({ error: '缺少必要参数' });
    return;
  }

  const now = Date.now();
  const id = uuidv4();
  const project: Project = {
    id,
    name,
    components,
    connections: connections || [],
    createdAt: now,
    updatedAt: now
  };

  projectsStore.set(id, project);
  res.json({
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  });
});

app.put('/api/projects/:id', (req, res) => {
  const existing = projectsStore.get(req.params.id);
  if (!existing) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }

  const { name, components, connections } = req.body as {
    name?: string;
    components?: CanvasComponent[];
    connections?: Connection[];
  };

  const updated: Project = {
    ...existing,
    name: name ?? existing.name,
    components: components ?? existing.components,
    connections: connections ?? existing.connections,
    updatedAt: Date.now()
  };

  projectsStore.set(req.params.id, updated);
  res.json({
    id: updated.id,
    name: updated.name,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt
  });
});

app.delete('/api/projects/:id', (req, res) => {
  const deleted = projectsStore.delete(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`[ProtoFlow Server] 后端服务已启动: http://localhost:${PORT}`);
  console.log(`[ProtoFlow Server] 已加载初始示例项目: ${initialProject.id}`);
});
