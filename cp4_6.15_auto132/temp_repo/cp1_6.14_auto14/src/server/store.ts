import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import { Project, Materials, CanvasElement, ImageElement, TextElement, DrawingElement } from '../shared/types';
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

function emptyMaterials(): Materials {
  return {
    images: [],
    texts: [],
    drawings: []
  };
}

function elementsToMaterials(elements: CanvasElement[]): Materials {
  const materials: Materials = {
    images: [],
    texts: [],
    drawings: []
  };

  for (const el of elements) {
    if (el.type === 'image') {
      const img = el as ImageElement;
      materials.images.push({
        id: img.id,
        src: img.src,
        x: img.x,
        y: img.y,
        width: img.width,
        height: img.height,
        rotation: img.rotation,
        name: img.name,
        note: img.note
      });
    } else if (el.type === 'text') {
      const txt = el as TextElement;
      materials.texts.push({
        id: txt.id,
        x: txt.x,
        y: txt.y,
        text: txt.text,
        fontSize: txt.fontSize,
        fontFamily: txt.fontFamily,
        color: txt.color,
        name: txt.name,
        note: txt.note
      });
    } else if (el.type === 'drawing') {
      const drw = el as DrawingElement;
      materials.drawings.push({
        id: drw.id,
        x: drw.x,
        y: drw.y,
        width: drw.width,
        height: drw.height,
        dataUrl: drw.dataUrl,
        paths: [],
        color: '#000000',
        size: 3,
        name: drw.name,
        note: drw.note
      });
    }
  }

  return materials;
}

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
    materials: emptyMaterials(),
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
  
  const existing = db.data.projects[index];
  
  const elements = updates.elements ?? existing.elements;
  const materials = updates.materials ?? elementsToMaterials(elements);
  
  db.data.projects[index] = {
    ...existing,
    ...updates,
    elements,
    materials,
    updatedAt: Date.now()
  };
  await db.write();
  return db.data.projects[index];
}

export async function saveProject(id: string, elements: CanvasElement[], colorPalette: Project['colorPalette'], thumbnail?: string): Promise<Project | undefined> {
  await db.read();
  const index = db.data.projects.findIndex(p => p.id === id);
  if (index === -1) return undefined;

  const materials = elementsToMaterials(elements);
  
  db.data.projects[index] = {
    ...db.data.projects[index],
    elements,
    materials,
    colorPalette,
    thumbnail,
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
    elements: JSON.parse(JSON.stringify(original.elements)),
    materials: JSON.parse(JSON.stringify(original.materials)),
    colorPalette: JSON.parse(JSON.stringify(original.colorPalette)),
    createdAt: now,
    updatedAt: now
  };
  db.data.projects.push(copied);
  await db.write();
  return copied;
}
