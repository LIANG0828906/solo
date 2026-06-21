import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

interface Project {
  id: string
  name: string
  clientName: string
  budget: number
  deadline: string
  status: 'active' | 'completed' | 'overdue'
  createdAt: string
  updatedAt: string
}

interface TimeRecord {
  id: string
  projectId: string
  startTime: string
  endTime: string
  duration: number
  createdAt: string
}

const projects: Project[] = []
const timeRecords: TimeRecord[] = []

function getEffectiveStatus(project: Project): Project['status'] {
  if (project.status === 'completed') return 'completed'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadline = new Date(project.deadline)
  deadline.setHours(0, 0, 0, 0)
  if (deadline < today) return 'overdue'
  return project.status
}

function withEffectiveStatus(project: Project): Project {
  return { ...project, status: getEffectiveStatus(project) }
}

function seedData() {
  const now = new Date().toISOString()

  const seeds: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>[] = [
    { name: 'Website Redesign', clientName: 'Acme Corp', budget: 8000, deadline: '2026-08-15', status: 'active' },
    { name: 'Mobile App Development', clientName: 'TechStart Inc', budget: 24000, deadline: '2026-10-01', status: 'active' },
    { name: 'Brand Identity Design', clientName: 'Creative Solutions', budget: 4800, deadline: '2026-03-01', status: 'completed' },
    { name: 'E-commerce Platform', clientName: 'RetailMax', budget: 16000, deadline: '2026-05-30', status: 'active' },
    { name: 'Marketing Campaign', clientName: 'GrowthHub', budget: 6400, deadline: '2026-06-10', status: 'active' },
  ]

  for (const s of seeds) {
    projects.push({ ...s, id: uuidv4(), createdAt: now, updatedAt: now })
  }

  const recordSeeds: { projectId: string; startTime: string; endTime: string }[] = [
    { projectId: projects[0].id, startTime: '2026-06-02T09:00:00Z', endTime: '2026-06-02T13:00:00Z' },
    { projectId: projects[0].id, startTime: '2026-06-04T10:00:00Z', endTime: '2026-06-04T15:30:00Z' },
    { projectId: projects[0].id, startTime: '2026-06-09T08:00:00Z', endTime: '2026-06-09T12:00:00Z' },
    { projectId: projects[0].id, startTime: '2026-06-11T14:00:00Z', endTime: '2026-06-11T18:00:00Z' },
    { projectId: projects[1].id, startTime: '2026-06-01T09:00:00Z', endTime: '2026-06-01T17:00:00Z' },
    { projectId: projects[1].id, startTime: '2026-06-03T09:00:00Z', endTime: '2026-06-03T18:00:00Z' },
    { projectId: projects[1].id, startTime: '2026-06-05T09:00:00Z', endTime: '2026-06-05T14:00:00Z' },
    { projectId: projects[1].id, startTime: '2026-06-10T10:00:00Z', endTime: '2026-06-10T16:30:00Z' },
    { projectId: projects[2].id, startTime: '2026-02-10T09:00:00Z', endTime: '2026-02-10T17:00:00Z' },
    { projectId: projects[2].id, startTime: '2026-02-15T10:00:00Z', endTime: '2026-02-15T16:00:00Z' },
    { projectId: projects[2].id, startTime: '2026-02-20T09:00:00Z', endTime: '2026-02-20T13:00:00Z' },
    { projectId: projects[3].id, startTime: '2026-05-05T09:00:00Z', endTime: '2026-05-05T17:30:00Z' },
    { projectId: projects[3].id, startTime: '2026-05-12T08:00:00Z', endTime: '2026-05-12T16:00:00Z' },
    { projectId: projects[3].id, startTime: '2026-05-20T09:00:00Z', endTime: '2026-05-20T14:00:00Z' },
    { projectId: projects[4].id, startTime: '2026-06-03T10:00:00Z', endTime: '2026-06-03T15:00:00Z' },
    { projectId: projects[4].id, startTime: '2026-06-08T09:00:00Z', endTime: '2026-06-08T12:30:00Z' },
  ]

  for (const t of recordSeeds) {
    const start = new Date(t.startTime)
    const end = new Date(t.endTime)
    const duration = Number(((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(2))
    timeRecords.push({
      id: uuidv4(),
      projectId: t.projectId,
      startTime: t.startTime,
      endTime: t.endTime,
      duration,
      createdAt: now,
    })
  }
}

seedData()

export const projectRoutes = Router()

projectRoutes.get('/', (req: Request, res: Response) => {
  let result = projects.map(withEffectiveStatus)

  if (req.query.status) {
    result = result.filter(p => p.status === req.query.status)
  }

  if (req.query.search) {
    const search = String(req.query.search).toLowerCase()
    result = result.filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.clientName.toLowerCase().includes(search),
    )
  }

  if (req.query.sort) {
    const sort = String(req.query.sort)
    result.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'deadline') return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      if (sort === 'budget') return a.budget - b.budget
      if (sort === 'createdAt') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return 0
    })
  }

  res.json({ success: true, data: result })
})

projectRoutes.post('/', (req: Request, res: Response) => {
  const { name, clientName, budget, deadline, status } = req.body
  if (!name || !clientName || !budget || !deadline) {
    res.status(400).json({ success: false, error: 'Missing required fields' })
    return
  }

  const now = new Date().toISOString()
  const project: Project = {
    id: uuidv4(),
    name,
    clientName,
    budget: Number(budget),
    deadline,
    status: status || 'active',
    createdAt: now,
    updatedAt: now,
  }

  projects.push(project)
  res.status(201).json({ success: true, data: withEffectiveStatus(project) })
})

projectRoutes.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const index = projects.findIndex(p => p.id === id)
  if (index === -1) {
    res.status(404).json({ success: false, error: 'Project not found' })
    return
  }

  const project = projects[index]
  const { name, clientName, budget, deadline, status } = req.body

  if (name !== undefined) project.name = name
  if (clientName !== undefined) project.clientName = clientName
  if (budget !== undefined) project.budget = Number(budget)
  if (deadline !== undefined) project.deadline = deadline
  if (status !== undefined) project.status = status
  project.updatedAt = new Date().toISOString()

  res.json({ success: true, data: withEffectiveStatus(project) })
})

projectRoutes.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const index = projects.findIndex(p => p.id === id)
  if (index === -1) {
    res.status(404).json({ success: false, error: 'Project not found' })
    return
  }

  const [deleted] = projects.splice(index, 1)
  for (let i = timeRecords.length - 1; i >= 0; i--) {
    if (timeRecords[i].projectId === id) {
      timeRecords.splice(i, 1)
    }
  }

  res.json({ success: true, data: withEffectiveStatus(deleted) })
})

projectRoutes.get('/:id/time-records', (req: Request, res: Response) => {
  const { id } = req.params
  const project = projects.find(p => p.id === id)
  if (!project) {
    res.status(404).json({ success: false, error: 'Project not found' })
    return
  }

  const records = timeRecords.filter(t => t.projectId === id)
  res.json({ success: true, data: records })
})

export const timeRecordRoutes = Router()

timeRecordRoutes.post('/', (req: Request, res: Response) => {
  const { projectId, startTime, endTime } = req.body
  if (!projectId || !startTime || !endTime) {
    res.status(400).json({ success: false, error: 'Missing required fields' })
    return
  }

  const project = projects.find(p => p.id === projectId)
  if (!project) {
    res.status(404).json({ success: false, error: 'Project not found' })
    return
  }

  const start = new Date(startTime)
  const end = new Date(endTime)
  const duration = Number(((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(2))

  const record: TimeRecord = {
    id: uuidv4(),
    projectId,
    startTime,
    endTime,
    duration,
    createdAt: new Date().toISOString(),
  }

  timeRecords.push(record)
  res.status(201).json({ success: true, data: record })
})

export { projects, timeRecords, withEffectiveStatus }
export type { Project, TimeRecord }
