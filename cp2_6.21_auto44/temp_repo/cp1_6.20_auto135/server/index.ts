import express from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { GeologyTemplate } from '../src/utils/geologyData';

const app = express();
const PORT = 3001;

const DATA_DIR = path.join(__dirname, '..', 'data');
const TEMPLATES_FILE = path.join(DATA_DIR, 'templates.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(TEMPLATES_FILE)) {
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify([]));
}

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

function readTemplates(): GeologyTemplate[] {
  try {
    const data = fs.readFileSync(TEMPLATES_FILE, 'utf-8');
    return JSON.parse(data) as GeologyTemplate[];
  } catch (error) {
    console.error('Error reading templates:', error);
    return [];
  }
}

function writeTemplates(templates: GeologyTemplate[]): void {
  try {
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing templates:', error);
    throw error;
  }
}

app.get('/api/templates', (req, res) => {
  try {
    const templates = readTemplates();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load templates' });
  }
});

app.get('/api/templates/:id', (req, res) => {
  try {
    const { id } = req.params;
    const templates = readTemplates();
    const template = templates.find((t) => t.id === id);

    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load template' });
  }
});

app.post('/api/templates', (req, res) => {
  try {
    const templateData = req.body as Partial<GeologyTemplate>;

    if (!templateData.strata || !templateData.faults) {
      res.status(400).json({ error: 'Invalid template data' });
      return;
    }

    const templates = readTemplates();

    const newTemplate: GeologyTemplate = {
      id: templateData.id && templateData.id.length > 0 ? templateData.id : uuidv4(),
      name: templateData.name || '未命名模板',
      strata: templateData.strata,
      faults: templateData.faults,
      modelSize: templateData.modelSize || { x: 200, y: 200, z: 180 },
      createdAt: templateData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const existingIndex = templates.findIndex((t) => t.id === newTemplate.id);
    if (existingIndex >= 0) {
      templates[existingIndex] = newTemplate;
    } else {
      templates.push(newTemplate);
    }

    writeTemplates(templates);
    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Error saving template:', error);
    res.status(500).json({ error: 'Failed to save template' });
  }
});

app.delete('/api/templates/:id', (req, res) => {
  try {
    const { id } = req.params;
    const templates = readTemplates();
    const filtered = templates.filter((t) => t.id !== id);

    if (filtered.length === templates.length) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    writeTemplates(filtered);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

app.listen(PORT, () => {
  console.log(`🌍 Geology 3D Visualizer API server running on http://localhost:${PORT}`);
  console.log(`📁 Data directory: ${DATA_DIR}`);
});
