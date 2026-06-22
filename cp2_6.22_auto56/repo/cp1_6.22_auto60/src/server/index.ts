import express from 'express';
import cors from 'cors';
import path from 'path';
import videoRouter from './routes/video';
import chapterRouter from './routes/chapter';
import { store } from './store';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/api/project/latest', (_req, res) => {
  const project = store.getLatestProject();
  if (!project) {
    const newProject = store.createProject();
    res.json(newProject);
    return;
  }
  res.json(project);
});

app.post('/api/project', (_req, res) => {
  const project = store.createProject();
  res.json(project);
});

app.get('/api/project/:id', (req, res) => {
  const project = store.getProject(req.params.id);
  if (!project) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }
  res.json(project);
});

app.post('/api/project/:id/video', (req, res) => {
  const { videoId } = req.body;
  const video = store.getVideo(videoId);
  if (!video) {
    res.status(404).json({ error: '视频不存在' });
    return;
  }
  const project = store.setProjectVideo(req.params.id, video);
  if (!project) {
    res.status(404).json({ error: '项目不存在' });
    return;
  }
  res.json({ success: true, project });
});

app.use('/api/video', videoRouter);
app.use('/api/project', chapterRouter);

app.listen(PORT, () => {
  console.log(`视频编辑服务运行在 http://localhost:${PORT}`);
});
