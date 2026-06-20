import express from 'express';
import cors from 'cors';
import session from 'express-session';
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  saveProject,
  deleteProject,
  copyProject
} from './store';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(session({
  secret: 'moodboard-secret-key',
  resave: false,
  saveUninitialized: true
}));

app.get('/api/projects', async (req, res) => {
  try {
    const projects = await getProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await getProject(req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get project' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }
    const project = await createProject(name);
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const project = await updateProject(req.params.id, req.body);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.post('/api/projects/:id/save', async (req, res) => {
  try {
    const { elements, colorPalette, thumbnail } = req.body;
    if (!elements || !colorPalette) {
      res.status(400).json({ error: 'elements and colorPalette are required' });
      return;
    }
    const project = await saveProject(req.params.id, elements, colorPalette, thumbnail);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save project' });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const success = await deleteProject(req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

app.post('/api/projects/:id/copy', async (req, res) => {
  try {
    const { name } = req.body;
    const project = await copyProject(req.params.id, name || '未命名副本');
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to copy project' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
