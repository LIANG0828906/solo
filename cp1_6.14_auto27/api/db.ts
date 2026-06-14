import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import type { DatabaseSchema, Project, Chapter, WritingLog } from '../../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'db.json');

const defaultData: DatabaseSchema = {
  projects: [],
  chapters: [],
  writingLogs: [],
};

const adapter = new JSONFile<DatabaseSchema>(dbPath);
const db = new Low<DatabaseSchema>(adapter, defaultData);

await db.read();

export function getProjects(): Project[] {
  return [...db.data.projects].sort((a, b) => a.order - b.order);
}

export function getProject(id: string): Project | undefined {
  return db.data.projects.find(p => p.id === id);
}

export function createProject(project: Project): Project {
  const maxOrder = db.data.projects.reduce((m, p) => Math.max(m, p.order), -1);
  project.order = maxOrder + 1;
  db.data.projects.push(project);
  db.write();
  return project;
}

export function updateProject(id: string, patch: Partial<Project>): Project | undefined {
  const idx = db.data.projects.findIndex(p => p.id === id);
  if (idx === -1) return undefined;
  db.data.projects[idx] = { ...db.data.projects[idx], ...patch, updatedAt: new Date().toISOString() };
  db.write();
  return db.data.projects[idx];
}

export function deleteProject(id: string): boolean {
  const idx = db.data.projects.findIndex(p => p.id === id);
  if (idx === -1) return false;
  db.data.projects.splice(idx, 1);
  db.data.chapters = db.data.chapters.filter(c => c.projectId !== id);
  db.data.writingLogs = db.data.writingLogs.filter(l => l.projectId !== id);
  db.write();
  return true;
}

export function duplicateProject(id: string): Project | undefined {
  const p = getProject(id);
  if (!p) return undefined;
  const chapters = getChapters(id);
  const newId = crypto.randomUUID();
  const newProject: Project = {
    ...p,
    id: newId,
    title: `${p.title} (副本)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  createProject(newProject);
  const now = new Date().toISOString();
  for (const ch of chapters) {
    createChapter({
      id: crypto.randomUUID(),
      projectId: newId,
      title: ch.title,
      content: ch.content,
      order: ch.order,
      createdAt: now,
      updatedAt: now,
    });
  }
  return newProject;
}

export function reorderProjects(ids: string[]): Project[] {
  const map = new Map(ids.map((id, i) => [id, i]));
  for (const p of db.data.projects) {
    if (map.has(p.id)) p.order = map.get(p.id)!;
  }
  db.write();
  return getProjects();
}

export function getChapters(projectId: string): Chapter[] {
  return db.data.chapters.filter(c => c.projectId === projectId).sort((a, b) => a.order - b.order);
}

export function createChapter(chapter: Chapter): Chapter {
  if (chapter.order === undefined) {
    const maxOrder = db.data.chapters
      .filter(c => c.projectId === chapter.projectId)
      .reduce((m, c) => Math.max(m, c.order), -1);
    chapter.order = maxOrder + 1;
  }
  db.data.chapters.push(chapter);
  db.write();
  return chapter;
}

export function updateChapter(id: string, patch: Partial<Chapter>): Chapter | undefined {
  const idx = db.data.chapters.findIndex(c => c.id === id);
  if (idx === -1) return undefined;
  db.data.chapters[idx] = { ...db.data.chapters[idx], ...patch, updatedAt: new Date().toISOString() };
  db.write();
  return db.data.chapters[idx];
}

export function deleteChapter(id: string): boolean {
  const idx = db.data.chapters.findIndex(c => c.id === id);
  if (idx === -1) return false;
  db.data.chapters.splice(idx, 1);
  db.write();
  return true;
}

export function reorderChapters(projectId: string, chapterIds: string[]): Chapter[] {
  const map = new Map(chapterIds.map((id, i) => [id, i]));
  for (const c of db.data.chapters) {
    if (c.projectId === projectId && map.has(c.id)) c.order = map.get(c.id)!;
  }
  db.write();
  return getChapters(projectId);
}

export function createWritingLog(log: WritingLog): WritingLog {
  db.data.writingLogs.push(log);
  db.write();
  return log;
}

export function getDailyWritingLogs(projectId: string, days: number): WritingLog[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return db.data.writingLogs.filter(l => l.projectId === projectId && l.date >= cutoffStr);
}

export function getWritingLogByDate(projectId: string, date: string): WritingLog | undefined {
  return db.data.writingLogs.find(l => l.projectId === projectId && l.date === date);
}
