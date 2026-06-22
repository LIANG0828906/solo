import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import type { Template, Project, Version, CanvasElement } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_DIR = join(__dirname, 'data');
const TEMPLATES_FILE = join(DATA_DIR, 'templates.json');
const PROJECTS_FILE = join(DATA_DIR, 'projects.json');

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

function readJSONFile<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

function writeJSONFile<T>(filePath: string, data: T): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

app.get('/api/templates', (req, res) => {
  try {
    const templates = readJSONFile<Template[]>(TEMPLATES_FILE);
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load templates' });
  }
});

app.get('/api/templates/:id', (req, res) => {
  try {
    const templates = readJSONFile<Template[]>(TEMPLATES_FILE);
    const template = templates.find(t => t.id === req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load template' });
  }
});

app.post('/api/projects', (req, res) => {
  try {
    const { templateId, elements, canvasWidth, canvasHeight, name } = req.body;
    const projects = readJSONFile<Project[]>(PROJECTS_FILE);

    const versionId = uuidv4();
    const version: Version = {
      id: versionId,
      name: '版本 1',
      createdAt: new Date().toISOString(),
      elements: elements as CanvasElement[],
      canvasWidth,
      canvasHeight,
    };

    const project: Project = {
      id: uuidv4(),
      name: name || '未命名项目',
      currentVersionId: versionId,
      versions: [version],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    projects.push(project);
    writeJSONFile(PROJECTS_FILE, projects);
    res.status(201).json(project);
  } catch (error) {
    console.error('Save project error:', error);
    res.status(500).json({ error: 'Failed to save project' });
  }
});

app.get('/api/projects/:id', (req, res) => {
  try {
    const projects = readJSONFile<Project[]>(PROJECTS_FILE);
    const project = projects.find(p => p.id === req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load project' });
  }
});

app.put('/api/projects/:id', (req, res) => {
  try {
    const projects = readJSONFile<Project[]>(PROJECTS_FILE);
    const index = projects.findIndex(p => p.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updatedProject = {
      ...projects[index],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    
    projects[index] = updatedProject;
    writeJSONFile(PROJECTS_FILE, projects);
    res.json(updatedProject);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

app.post('/api/projects/:id/versions', (req, res) => {
  try {
    const { elements, canvasWidth, canvasHeight, name } = req.body;
    const projects = readJSONFile<Project[]>(PROJECTS_FILE);
    const projectIndex = projects.findIndex(p => p.id === req.params.id);
    
    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projects[projectIndex];
    
    if (project.versions.length >= 10) {
      return res.status(400).json({ error: 'Maximum 10 versions allowed' });
    }

    const versionNumber = project.versions.length + 1;
    const newVersion: Version = {
      id: uuidv4(),
      name: name || `版本 ${versionNumber}`,
      createdAt: new Date().toISOString(),
      elements: elements as CanvasElement[],
      canvasWidth,
      canvasHeight,
    };

    project.versions.push(newVersion);
    project.currentVersionId = newVersion.id;
    project.updatedAt = new Date().toISOString();
    
    projects[projectIndex] = project;
    writeJSONFile(PROJECTS_FILE, projects);
    res.status(201).json(newVersion);
  } catch (error) {
    console.error('Add version error:', error);
    res.status(500).json({ error: 'Failed to add version' });
  }
});

app.get('/api/projects/:id/versions/:versionId', (req, res) => {
  try {
    const projects = readJSONFile<Project[]>(PROJECTS_FILE);
    const project = projects.find(p => p.id === req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const version = project.versions.find(v => v.id === req.params.versionId);
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    res.json(version);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load version' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
