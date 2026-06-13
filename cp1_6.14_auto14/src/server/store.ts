import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import { Project } from '../shared/types';
import path from 'path';
import fs from 'fs';

interface Database {
  projects: Project[];
}

const dbDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbFile = path.join(dbDir, 'db.json');
const adapter = new JSONFile<Database>(dbFile);
const db = new Low<Database>(adapter, { projects: [] });

export async function getProjects(): Promise<Project[]> {
  await db.read();
  return db.data.projects.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getProject(id: string): Promise<Project | undefined> {
  await db.read();
  return db.data.projects.find(p => p.id === id);
}

export async function createProject(name: string): Promise<Project> {
  await db.read();
  const now = Date.now();
  const project: Project = {
    id: uuidv4(),
    name,
    elements: [],
    colorPalette: [],
    createdAt: now,
    updatedAt: now
  };
  db.data.projects.push(project);
  await db.write();
  return project;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
  await db.read();
  const index = db.data.projects.findIndex(p => p.id === id);
  if (index === -1) return undefined;
  
  db.data.projects[index] = {
    ...db.data.projects[index],
    ...updates,
    updatedAt: Date.now()
  };
  await db.write();
  return db.data.projects[index];
}

export async function deleteProject(id: string): Promise<boolean> {
  await db.read();
  const index = db.data.projects.findIndex(p => p.id === id);
  if (index === -1) return false;
  
  db.data.projects.splice(index, 1);
  await db.write();
  return true;
}

export async function copyProject(id: string, newName: string): Promise<Project | undefined> {
  await db.read();
  const original = db.data.projects.find(p => p.id === id);
  if (!original) return undefined;
  
  const now = Date.now();
  const copied: Project = {
    ...original,
    id: uuidv4(),
    name: newName,
    createdAt: now,
    updatedAt: now
  };
  db.data.projects.push(copied);
  await db.write();
  return copied;
}
