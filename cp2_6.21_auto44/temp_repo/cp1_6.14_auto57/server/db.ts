import { JSONFilePreset } from 'lowdb/node'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export interface Section {
  id: string
  type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro'
  name: string
  order: number
  beats: number
  chords: string
  lyrics: string
  lastEditedBy: string | null
  lastEditedAt: string | null
}

export interface Collaborator {
  id: string
  name: string
  emoji: string
  color: string
}

export interface Project {
  id: string
  title: string
  key: string
  bpm: number
  timeSignature: string
  shareCode: string
  sections: Section[]
  collaborators: Collaborator[]
  createdAt: string
  updatedAt: string
}

interface DbSchema {
  projects: Project[]
}

const defaultData: DbSchema = { projects: [] }

let db: Awaited<ReturnType<typeof JSONFilePreset<DbSchema>>>

export async function initDb() {
  const dbPath = path.join(__dirname, 'db.json')
  db = await JSONFilePreset<DbSchema>(dbPath, defaultData)
  await db.write()
}

export function getProjects(): Project[] {
  return db.data.projects
}

export function getProjectById(id: string): Project | undefined {
  return db.data.projects.find(p => p.id === id)
}

export function getProjectByShareCode(code: string): Project | undefined {
  return db.data.projects.find(p => p.shareCode === code)
}

export async function createProject(project: Project): Promise<Project> {
  db.data.projects.push(project)
  await db.write()
  return project
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
  const idx = db.data.projects.findIndex(p => p.id === id)
  if (idx === -1) return null
  db.data.projects[idx] = { ...db.data.projects[idx], ...updates, updatedAt: new Date().toISOString() }
  await db.write()
  return db.data.projects[idx]
}

export async function updateProjectSections(id: string, sections: Section[]): Promise<Project | null> {
  const idx = db.data.projects.findIndex(p => p.id === id)
  if (idx === -1) return null
  db.data.projects[idx].sections = sections
  db.data.projects[idx].updatedAt = new Date().toISOString()
  await db.write()
  return db.data.projects[idx]
}

export async function addCollaborator(projectId: string, collab: Collaborator): Promise<Project | null> {
  const project = db.data.projects.find(p => p.id === projectId)
  if (!project) return null
  project.collaborators.push(collab)
  project.updatedAt = new Date().toISOString()
  await db.write()
  return project
}

export async function updateSection(projectId: string, sectionId: string, updates: Partial<Section>): Promise<Project | null> {
  const project = db.data.projects.find(p => p.id === projectId)
  if (!project) return null
  const section = project.sections.find(s => s.id === sectionId)
  if (!section) return null
  Object.assign(section, updates)
  project.updatedAt = new Date().toISOString()
  await db.write()
  return project
}

export function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  const existing = db.data.projects.find(p => p.shareCode === code)
  if (existing) return generateShareCode()
  return code
}

export { uuidv4 }
