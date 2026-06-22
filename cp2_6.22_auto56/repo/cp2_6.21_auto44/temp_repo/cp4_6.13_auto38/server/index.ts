import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import db from './database.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

interface Project {
  id: string;
  user_id: string;
  name: string;
  data: string;
  created_at: string;
  updated_at: string;
}

const DEMO_USER_ID = 'demo-user-001';

app.post('/api/projects', (req, res) => {
  try {
    const { name, data } = req.body;

    if (!name || !data) {
      return res.status(400).json({ error: 'name and data are required' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(
      'INSERT INTO projects (id, user_id, name, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    );
    stmt.run(id, DEMO_USER_ID, name, JSON.stringify(data), now, now);

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project;

    res.status(201).json({
      id: project.id,
      user_id: project.user_id,
      name: project.name,
      data: JSON.parse(project.data),
      created_at: project.created_at,
      updated_at: project.updated_at
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.get('/api/projects', (_req, res) => {
  try {
    const projects = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all() as Project[];

    const formattedProjects = projects.map((project) => ({
      id: project.id,
      user_id: project.user_id,
      name: project.name,
      data: JSON.parse(project.data),
      created_at: project.created_at,
      updated_at: project.updated_at
    }));

    res.json(formattedProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.put('/api/projects/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, data } = req.body;

    if (!name && !data) {
      return res.status(400).json({ error: 'name or data is required' });
    }

    const existingProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project | undefined;
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const now = new Date().toISOString();
    let updatedName = existingProject.name;
    let updatedData = existingProject.data;

    if (name !== undefined) {
      updatedName = name;
    }
    if (data !== undefined) {
      updatedData = JSON.stringify(data);
    }

    const stmt = db.prepare(
      'UPDATE projects SET name = ?, data = ?, updated_at = ? WHERE id = ?'
    );
    stmt.run(updatedName, updatedData, now, id);

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project;

    res.json({
      id: project.id,
      user_id: project.user_id,
      name: project.name,
      data: JSON.parse(project.data),
      created_at: project.created_at,
      updated_at: project.updated_at
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.delete('/api/projects/:id', (req, res) => {
  try {
    const { id } = req.params;

    const existingProject = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project | undefined;
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    db.prepare('DELETE FROM projects WHERE id = ?').run(id);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

app.post('/api/tracks', (req, res) => {
  try {
    const { tracks, bpm } = req.body;

    if (!tracks || !Array.isArray(tracks)) {
      return res.status(400).json({ error: 'tracks array is required' });
    }

    const mixedAudio = {
      success: true,
      trackCount: tracks.length,
      bpm: bpm || 120,
      duration: 8,
      format: 'wav',
      sampleRate: 44100,
      message: 'Tracks mixed successfully (MVP - placeholder response)'
    };

    res.json(mixedAudio);
  } catch (error) {
    console.error('Error mixing tracks:', error);
    res.status(500).json({ error: 'Failed to mix tracks' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
