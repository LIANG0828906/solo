const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const stageNames = ['素材整理', '粗剪', '精剪', '音效', '调色', '终审'];
const materialTypes = ['video', 'audio', 'image'];

const projects = [];
const materials = [];
const comments = [];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomStages() {
  return stageNames.map((name) => ({
    id: uuidv4(),
    name,
    percent: randomInt(0, 85),
  }));
}

function initMockData() {
  const projectData = [
    { name: '城市夜景微电影', description: '一部关于都市夜归人的微电影', cover: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=800' },
    { name: '旅行Vlog日本篇', description: '记录日本东京京都七日游', cover: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800' },
    { name: '科技公司宣传片', description: 'AI创新企业年度形象宣传片', cover: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800' },
  ];

  projectData.forEach((p) => {
    const projectId = uuidv4();
    const project = {
      id: projectId,
      name: p.name,
      description: p.description,
      cover: p.cover,
      stages: randomStages(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    projects.push(project);

    const materialCount = randomInt(8, 12);
    for (let i = 0; i < materialCount; i++) {
      const type = materialTypes[randomInt(0, 2)];
      const ext = type === 'video' ? '.mp4' : type === 'audio' ? '.mp3' : '.jpg';
      materials.push({
        id: uuidv4(),
        projectId,
        name: `素材_${i + 1}_${type}${ext}`,
        type,
        size: randomInt(1024 * 1024, 500 * 1024 * 1024),
        url: `/uploads/${projectId}/material_${i}${ext}`,
        thumbnail: `https://picsum.photos/seed/${projectId}${i}/320/180`,
        uploadedAt: new Date(Date.now() - randomInt(0, 7 * 24 * 3600 * 1000)).toISOString(),
      });
    }

    const commentCount = randomInt(3, 5);
    for (let i = 0; i < commentCount; i++) {
      const commentId = uuidv4();
      const hasReply = Math.random() > 0.5;
      comments.push({
        id: commentId,
        projectId,
        parentId: null,
        content: `这是第${i + 1}条评论，关于${p.name}的制作建议。`,
        author: `用户${randomInt(1, 100)}`,
        timestamp: randomInt(0, 300),
        createdAt: new Date(Date.now() - randomInt(0, 3 * 24 * 3600 * 1000)).toISOString(),
      });

      if (hasReply) {
        comments.push({
          id: uuidv4(),
          projectId,
          parentId: commentId,
          content: `回复：收到，我会尽快修改的。`,
          author: `剪辑师${randomInt(1, 10)}`,
          timestamp: null,
          createdAt: new Date(Date.now() - randomInt(0, 1 * 24 * 3600 * 1000)).toISOString(),
        });
      }
    }
  });
}

initMockData();

app.get('/api/projects', (req, res) => {
  res.json(projects);
});

app.post('/api/projects', (req, res) => {
  const { name, description, cover } = req.body || {};
  const newProject = {
    id: uuidv4(),
    name: name || '未命名项目',
    description: description || '',
    cover: cover || 'https://picsum.photos/seed/default/800/450',
    stages: stageNames.map((name) => ({
      id: uuidv4(),
      name,
      percent: 0,
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  projects.push(newProject);
  res.status(201).json(newProject);
});

app.get('/api/projects/:id', (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: '项目不存在' });
  res.json(project);
});

app.put('/api/projects/:id/stages', (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: '项目不存在' });
  const { stages } = req.body || {};
  if (!Array.isArray(stages)) return res.status(400).json({ error: 'stages 格式错误' });
  project.stages = stages;
  project.updatedAt = new Date().toISOString();
  res.json(project);
});

app.get('/api/projects/:id/materials', (req, res) => {
  const list = materials.filter((m) => m.projectId === req.params.id);
  res.json(list);
});

app.post('/api/projects/:id/materials', upload.single('file'), (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: '项目不存在' });

  const originalName = req.file ? req.file.originalname : `upload_${Date.now()}`;
  const size = req.file ? req.file.size : randomInt(1024 * 1024, 100 * 1024 * 1024);
  const ext = originalName.includes('.') ? originalName.substring(originalName.lastIndexOf('.')) : '';
  let type = 'image';
  if (['.mp4', '.mov', '.avi', '.mkv'].includes(ext.toLowerCase())) type = 'video';
  else if (['.mp3', '.wav', '.aac', '.flac'].includes(ext.toLowerCase())) type = 'audio';

  const newMaterial = {
    id: uuidv4(),
    projectId: req.params.id,
    name: originalName,
    type,
    size,
    url: `/uploads/${req.params.id}/${uuidv4()}${ext}`,
    thumbnail: `https://picsum.photos/seed/${uuidv4()}/320/180`,
    uploadedAt: new Date().toISOString(),
  };
  materials.push(newMaterial);
  res.status(201).json(newMaterial);
});

app.delete('/api/materials/:id', (req, res) => {
  const idx = materials.findIndex((m) => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '素材不存在' });
  const deleted = materials.splice(idx, 1)[0];
  res.json(deleted);
});

app.get('/api/projects/:id/comments', (req, res) => {
  const list = comments.filter((c) => c.projectId === req.params.id);
  res.json(list);
});

app.post('/api/projects/:id/comments', (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: '项目不存在' });
  const { content, author, timestamp, parentId } = req.body || {};
  const newComment = {
    id: uuidv4(),
    projectId: req.params.id,
    parentId: parentId || null,
    content: content || '',
    author: author || '匿名用户',
    timestamp: timestamp ?? null,
    createdAt: new Date().toISOString(),
  };
  comments.push(newComment);
  res.status(201).json(newComment);
});

app.delete('/api/comments/:id', (req, res) => {
  const idx = comments.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '评论不存在' });
  const deleted = comments.splice(idx, 1)[0];
  res.json(deleted);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
