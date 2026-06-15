import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../../../server/data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const PROJECTS_DIR = path.join(DATA_DIR, 'projects');
const VERSIONS_DIR = (projectId: string) => path.join(PROJECTS_DIR, projectId, 'versions');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readJsonFile<T>(filePath: string, defaultValue: T): T {
  if (!fs.existsSync(filePath)) {
    return defaultValue;
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return defaultValue;
  }
}

function writeJsonFile(filePath: string, data: unknown) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function getAllProjects<T>(): T[] {
  return readJsonFile<T[]>(PROJECTS_FILE, []);
}

export function saveProjects<T>(projects: T[]) {
  writeJsonFile(PROJECTS_FILE, projects);
}

export function getProjectDetail<T>(projectId: string): T | null {
  const filePath = path.join(PROJECTS_DIR, `${projectId}.json`);
  return readJsonFile<T | null>(filePath, null);
}

export function saveProjectDetail(projectId: string, data: unknown) {
  const filePath = path.join(PROJECTS_DIR, `${projectId}.json`);
  writeJsonFile(filePath, data);
}

export function getVersions<T>(projectId: string): T[] {
  const dir = VERSIONS_DIR(projectId);
  ensureDir(dir);
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const versions: T[] = [];
  for (const file of files) {
    const version = readJsonFile<T>(path.join(dir, file), null as unknown as T);
    if (version) versions.push(version);
  }
  return versions.sort((a: any, b: any) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function saveVersion(projectId: string, versionId: string, data: unknown) {
  const dir = VERSIONS_DIR(projectId);
  ensureDir(dir);
  const filePath = path.join(dir, `${versionId}.json`);
  writeJsonFile(filePath, data);
}

export function getVersion<T>(projectId: string, versionId: string): T | null {
  const filePath = path.join(VERSIONS_DIR(projectId), `${versionId}.json`);
  return readJsonFile<T | null>(filePath, null);
}

export function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function formatVersionName(projectName: string, versionNum: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  return `${projectName}_v${versionNum}_${year}${month}${day}_${hour}${minute}`;
}
