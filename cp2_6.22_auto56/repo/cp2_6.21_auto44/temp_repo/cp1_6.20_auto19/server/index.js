import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

const dbPath = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());

const readData = () => {
  const data = fs.readFileSync(dbPath, 'utf-8');
  return JSON.parse(data);
};

const writeData = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
};

app.get('/api/profile', (req, res) => {
  const data = readData();
  res.json({
    profile: data.profile,
    skills: data.skills,
    projects: data.projects
  });
});

app.put('/api/profile', (req, res) => {
  const data = readData();
  const { avatar, name, bio, website } = req.body;
  data.profile = {
    ...data.profile,
    avatar,
    name,
    bio,
    website
  };
  writeData(data);
  res.json({ success: true, profile: data.profile });
});

app.put('/api/skills', (req, res) => {
  const data = readData();
  data.skills = req.body;
  writeData(data);
  res.json({ success: true, skills: data.skills });
});

app.get('/api/projects', (req, res) => {
  const data = readData();
  res.json(data.projects);
});

app.post('/api/projects', (req, res) => {
  const data = readData();
  const newProject = {
    id: uuidv4(),
    ...req.body
  };
  data.projects.push(newProject);
  writeData(data);
  res.json({ success: true, project: newProject });
});

app.put('/api/projects/:id', (req, res) => {
  const data = readData();
  const { id } = req.params;
  const index = data.projects.findIndex(p => p.id === id);
  if (index !== -1) {
    data.projects[index] = {
      ...data.projects[index],
      ...req.body
    };
    writeData(data);
    res.json({ success: true, project: data.projects[index] });
  } else {
    res.status(404).json({ success: false, message: '项目不存在' });
  }
});

app.delete('/api/projects/:id', (req, res) => {
  const data = readData();
  const { id } = req.params;
  data.projects = data.projects.filter(p => p.id !== id);
  writeData(data);
  res.json({ success: true });
});

app.get('/api/public/:id', (req, res) => {
  const data = readData();
  res.json({
    profile: data.profile,
    skills: data.skills,
    projects: data.projects
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
