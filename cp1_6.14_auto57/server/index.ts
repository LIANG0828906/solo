import express, { type Request, type Response } from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { v4 as uuidv4 } from 'uuid'
import {
  initDb,
  getProjectById,
  getProjectByShareCode,
  createProject as dbCreateProject,
  updateProjectSections,
  addCollaborator as dbAddCollaborator,
  updateSection as dbUpdateSection,
  generateShareCode,
  type Project,
  type Section,
  type Collaborator,
} from './db.js'

const PORT = process.env.PORT || 3001
const COLLAB_COLORS = ['#e94560', '#4da6ff', '#4dff88', '#ffd84d', '#d64dff', '#ff8c4d', '#4dffe6', '#ff4da6']
const EMOJI_LIST = ['🎵', '🎸', '🎹', '🥁', '🎺', '🎷', '🎻', '🎤', '🎧', '⭐', '🌈', '🐱', '🐶', '🦊', '🐼', '🦁']

const app = express()
app.use(cors())
app.use(express.json())

type WsConn = WebSocket & { userId?: string; projectId?: string; collaborator?: Collaborator }

interface WsMessage {
  type: 'cursor' | 'edit' | 'select_section' | 'join' | 'leave' | 'save' | 'reorder'
  projectId: string
  userId: string
  payload: any
}

const projectConnections = new Map<string, Set<WsConn>>()

function broadcast(projectId: string, message: WsMessage, excludeUserId?: string) {
  const conns = projectConnections.get(projectId)
  if (!conns) return
  const data = JSON.stringify(message)
  for (const c of conns) {
    if (excludeUserId && c.userId === excludeUserId) continue
    if (c.readyState === WebSocket.OPEN) c.send(data)
  }
}

app.post('/api/projects', async (req: Request, res: Response) => {
  try {
    const { title, key, bpm, timeSignature } = req.body
    const shareCode = generateShareCode()
    const defaultSections: Section[] = [
      { id: uuidv4(), type: 'intro', name: '前奏', order: 0, beats: 4, chords: '[C] [G] [Am] [F]', lyrics: '在晨光中醒来 思绪如潮水涌来', lastEditedBy: null, lastEditedAt: null },
      { id: uuidv4(), type: 'verse', name: '主歌1', order: 1, beats: 8, chords: '[F] [C] [G] [Am]', lyrics: '把每个音符写下 汇成这首情歌', lastEditedBy: null, lastEditedAt: null },
      { id: uuidv4(), type: 'chorus', name: '副歌', order: 2, beats: 8, chords: '[C] [G] [Am] [F] [C] [G] [F] [C]', lyrics: '这是我们的歌 唱到天明也不疲倦', lastEditedBy: null, lastEditedAt: null },
      { id: uuidv4(), type: 'bridge', name: '桥段', order: 3, beats: 4, chords: '[Em] [F] [C] [G]', lyrics: '旋律在心中流淌 永不停止', lastEditedBy: null, lastEditedAt: null },
      { id: uuidv4(), type: 'outro', name: '尾奏', order: 4, beats: 4, chords: '[C] [G] [Am] [F]', lyrics: '余音绕梁 化作星光', lastEditedBy: null, lastEditedAt: null },
    ]
    const project: Project = {
      id: uuidv4(),
      title: title || '未命名歌曲',
      key: key || 'C大调',
      bpm: Number(bpm) || 120,
      timeSignature: timeSignature || '4/4',
      shareCode,
      sections: defaultSections,
      collaborators: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await dbCreateProject(project)
    res.json({ project, shareCode })
  } catch (err) {
    res.status(500).json({ error: '创建项目失败' })
  }
})

app.get('/api/projects/:id', (req: Request, res: Response) => {
  const project = getProjectById(req.params.id)
  if (!project) return res.status(404).json({ error: '项目不存在' })
  res.json({ project })
})

app.get('/api/projects/share/:code', (req: Request, res: Response) => {
  const project = getProjectByShareCode(req.params.code.toUpperCase())
  if (!project) return res.status(404).json({ error: '分享码无效' })
  res.json({ project })
})

app.put('/api/projects/:id/sections', async (req: Request, res: Response) => {
  try {
    const { sections } = req.body
    const project = await updateProjectSections(req.params.id, sections)
    if (!project) return res.status(404).json({ error: '项目不存在' })
    res.json({ project })
  } catch (err) {
    res.status(500).json({ error: '更新失败' })
  }
})

app.post('/api/projects/:id/collaborators', async (req: Request, res: Response) => {
  try {
    const project = getProjectById(req.params.id)
    if (!project) return res.status(404).json({ error: '项目不存在' })
    const collab: Collaborator = {
      id: uuidv4(),
      name: req.body.name || `音乐人${project.collaborators.length + 1}`,
      emoji: req.body.emoji || EMOJI_LIST[Math.floor(Math.random() * EMOJI_LIST.length)],
      color: COLLAB_COLORS[project.collaborators.length % COLLAB_COLORS.length],
    }
    const updated = await dbAddCollaborator(req.params.id, collab)
    res.json({ collaborator: collab, project: updated })
  } catch (err) {
    res.status(500).json({ error: '添加协作者失败' })
  }
})

app.put('/api/projects/:id/sections/:sectionId', async (req: Request, res: Response) => {
  try {
    const { chords, lyrics, lastEditedBy } = req.body
    const updates: Partial<Section> = {
      lastEditedBy,
      lastEditedAt: new Date().toISOString(),
    }
    if (chords !== undefined) updates.chords = chords
    if (lyrics !== undefined) updates.lyrics = lyrics
    const project = await dbUpdateSection(req.params.id, req.params.sectionId, updates)
    if (!project) return res.status(404).json({ error: '项目不存在' })
    res.json({ project })
  } catch (err) {
    res.status(500).json({ error: '保存失败' })
  }
})

app.put('/api/projects/:id/section/:sectionId/beats', async (req: Request, res: Response) => {
  try {
    const { beats } = req.body
    const project = await dbUpdateSection(req.params.id, req.params.sectionId, { beats: Number(beats) })
    if (!project) return res.status(404).json({ error: '项目不存在' })
    res.json({ project })
  } catch (err) {
    res.status(500).json({ error: '保存失败' })
  }
})

async function start() {
  await initDb()
  const server = createServer(app)
  const wss = new WebSocketServer({ server })

  wss.on('connection', (ws: WsConn, req) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`)
    const projectId = url.searchParams.get('projectId')
    if (!projectId) { ws.close(); return }

    if (!projectConnections.has(projectId)) projectConnections.set(projectId, new Set())
    projectConnections.get(projectId)!.add(ws)

    ws.on('message', async (raw) => {
      try {
        const msg: WsMessage = JSON.parse(raw.toString())
        const { type, userId, payload } = msg
        if (type === 'join') {
          ws.userId = userId
          ws.projectId = projectId
          ws.collaborator = payload.collaborator
          broadcast(projectId, { type: 'join', projectId, userId, payload: { collaborator: payload.collaborator } }, userId)
          const members: Collaborator[] = []
          for (const c of projectConnections.get(projectId) || []) {
            if (c.collaborator) members.push(c.collaborator)
          }
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'members', projectId, userId: 'server', payload: { members } } as WsMessage))
          }
        } else if (type === 'cursor' || type === 'edit' || type === 'select_section' || type === 'reorder') {
          broadcast(projectId, { type, projectId, userId, payload }, userId)
        } else if (type === 'save') {
          broadcast(projectId, { type: 'save', projectId, userId, payload }, userId)
        }
      } catch (e) {}
    })

    ws.on('close', () => {
      const uid = ws.userId
      const set = projectConnections.get(projectId)
      if (set) {
        set.delete(ws)
        if (set.size === 0) projectConnections.delete(projectId)
      }
      if (uid) broadcast(projectId, { type: 'leave', projectId, userId: uid, payload: { userId: uid } } as WsMessage)
    })
  })

  server.listen(PORT, () => {
    console.log(`🎵 Server running on port ${PORT}`)
  })
}

start().catch(console.error)
