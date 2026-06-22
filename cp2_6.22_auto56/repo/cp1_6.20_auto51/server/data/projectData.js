import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../../data/projects.json');

function readProjects() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writeProjects(projects) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 2), 'utf8');
}

export function getAllProjects() {
  return readProjects();
}

export function getProjectById(id) {
  const projects = readProjects();
  return projects.find(p => p.id === id);
}

export function createProject(projectData, ownerEmail) {
  const projects = readProjects();
  const now = new Date().toISOString();
  const newProject = {
    id: uuidv4(),
    name: projectData.name,
    description: projectData.description || '',
    members: [{
      id: uuidv4(),
      email: ownerEmail,
      role: 'owner',
      joinedAt: now
    }],
    palettes: [],
    comments: [],
    createdAt: now
  };
  projects.unshift(newProject);
  writeProjects(projects);
  return newProject;
}

export function inviteMember(projectId, email, role = 'editor') {
  const projects = readProjects();
  const project = projects.find(p => p.id === projectId);
  if (!project) return null;
  
  const existingMember = project.members.find(m => m.email === email);
  if (existingMember) return { alreadyMember: true, member: existingMember };
  
  const newMember = {
    id: uuidv4(),
    email,
    role,
    joinedAt: new Date().toISOString()
  };
  project.members.push(newMember);
  writeProjects(projects);
  return { alreadyMember: false, member: newMember };
}

export function addPaletteToProject(projectId, paletteId) {
  const projects = readProjects();
  const project = projects.find(p => p.id === projectId);
  if (!project) return null;
  
  if (!project.palettes.includes(paletteId)) {
    project.palettes.push(paletteId);
    writeProjects(projects);
  }
  return project;
}

export function addComment(projectId, commentData) {
  const projects = readProjects();
  const project = projects.find(p => p.id === projectId);
  if (!project) return null;
  
  const newComment = {
    id: uuidv4(),
    userId: uuidv4(),
    userEmail: commentData.userEmail,
    paletteId: commentData.paletteId,
    colorIndex: commentData.colorIndex,
    content: commentData.content,
    createdAt: new Date().toISOString()
  };
  project.comments.push(newComment);
  writeProjects(projects);
  return newComment;
}
