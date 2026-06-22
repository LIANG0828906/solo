import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { v4 as uuidv4 } from 'uuid'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface NoteDB {
  notes: Note[]
}

const dbFilePath = path.join(__dirname, '..', 'db.json')
const adapter = new JSONFile<NoteDB>(dbFilePath)
const defaultData: NoteDB = { notes: [] }
const db = new Low<NoteDB>(adapter, defaultData)

await db.read()

if (db.data.notes.length === 0) {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

  db.data.notes = [
    {
      id: uuidv4(),
      title: '欢迎使用个人知识库',
      content: '<p>这是一个强大的个人知识管理工具。您可以：</p><ul><li><b>创建和编辑笔记</b></li><li><i>使用标签分类整理</i></li><li>快速全文搜索</li><li>查看数据统计图表</li></ul>',
      tags: ['使用指南', '入门'],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    },
    {
      id: uuidv4(),
      title: 'React 核心概念笔记',
      content: '<p>React 是一个用于构建用户界面的 JavaScript 库。</p><p><b>核心概念：</b></p><ul><li>组件化开发</li><li>虚拟 DOM</li><li>单向数据流</li><li>Hooks</li></ul>',
      tags: ['技术', 'React', '前端'],
      createdAt: yesterday.toISOString(),
      updatedAt: yesterday.toISOString()
    },
    {
      id: uuidv4(),
      title: 'TypeScript 学习笔记',
      content: '<p>TypeScript 是 JavaScript 的超集，添加了静态类型检查。</p><ul><li>类型注解</li><li>接口 Interface</li><li>泛型 Generics</li><li>枚举 Enum</li></ul>',
      tags: ['技术', 'TypeScript', '前端'],
      createdAt: twoDaysAgo.toISOString(),
      updatedAt: twoDaysAgo.toISOString()
    },
    {
      id: uuidv4(),
      title: '每日读书计划',
      content: '<p>本周读书清单：</p><ol><li>《深入理解计算机系统》</li><li>《代码整洁之道》</li><li>《设计模式》</li></ol>',
      tags: ['读书', '计划'],
      createdAt: threeDaysAgo.toISOString(),
      updatedAt: threeDaysAgo.toISOString()
    }
  ]
  await db.write()
}

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.get('/api/health', (req: Request, res: Response): void => {
  res.status(200).json({ success: true, message: 'ok' })
})

app.get('/api/notes', async (req: Request, res: Response): Promise<void> => {
  await db.read()
  res.status(200).json({ success: true, data: db.data.notes })
})

app.get('/api/notes/:id', async (req: Request, res: Response): Promise<void> => {
  await db.read()
  const note = db.data.notes.find(n => n.id === req.params.id)
  if (note) {
    res.status(200).json({ success: true, data: note })
  } else {
    res.status(404).json({ success: false, error: 'Note not found' })
  }
})

app.post('/api/notes', async (req: Request, res: Response): Promise<void> => {
  await db.read()
  const { title, content, tags } = req.body
  const now = new Date().toISOString()
  const newNote: Note = {
    id: uuidv4(),
    title: title || '无标题笔记',
    content: content || '',
    tags: tags || [],
    createdAt: now,
    updatedAt: now
  }
  db.data.notes.unshift(newNote)
  await db.write()
  res.status(201).json({ success: true, data: newNote })
})

app.put('/api/notes/:id', async (req: Request, res: Response): Promise<void> => {
  await db.read()
  const index = db.data.notes.findIndex(n => n.id === req.params.id)
  if (index !== -1) {
    db.data.notes[index] = {
      ...db.data.notes[index],
      ...req.body,
      id: db.data.notes[index].id,
      createdAt: db.data.notes[index].createdAt,
      updatedAt: new Date().toISOString()
    }
    await db.write()
    res.status(200).json({ success: true, data: db.data.notes[index] })
  } else {
    res.status(404).json({ success: false, error: 'Note not found' })
  }
})

app.delete('/api/notes/:id', async (req: Request, res: Response): Promise<void> => {
  await db.read()
  const initialLength = db.data.notes.length
  db.data.notes = db.data.notes.filter(n => n.id !== req.params.id)
  if (db.data.notes.length !== initialLength) {
    await db.write()
    res.status(200).json({ success: true })
  } else {
    res.status(404).json({ success: false, error: 'Note not found' })
  }
})

app.get('/api/tags', async (req: Request, res: Response): Promise<void> => {
  await db.read()
  const tagSet = new Set<string>()
  db.data.notes.forEach(note => {
    note.tags.forEach(tag => tagSet.add(tag))
  })
  res.status(200).json({ success: true, data: Array.from(tagSet).sort() })
})

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(error)
  res.status(500).json({
    success: false,
    error: 'Server internal error'
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found'
  })
})

export default app
