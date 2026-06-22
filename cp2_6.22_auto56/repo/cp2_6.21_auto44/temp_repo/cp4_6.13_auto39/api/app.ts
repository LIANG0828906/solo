import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import db from './db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#2E86AB', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1', '#F43F5E']

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.post('/api/workshops', (req: Request, res: Response): void => {
  const { name, description, maxParticipants } = req.body
  const id = uuidv4()
  const inviteCode = String(Math.floor(100000 + Math.random() * 900000))

  try {
    db.prepare(
      'INSERT INTO workshops (id, name, description, max_participants, invite_code) VALUES (?, ?, ?, ?, ?)'
    ).run(id, name, description || null, maxParticipants || 20, inviteCode)

    const workshop = db.prepare('SELECT * FROM workshops WHERE id = ?').get(id) as any
    res.status(201).json({
      success: true,
      data: {
        ...workshop,
        shareLink: inviteCode,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create workshop' })
  }
})

app.get('/api/workshops', (req: Request, res: Response): void => {
  const workshops = db.prepare('SELECT * FROM workshops ORDER BY created_at DESC').all()
  res.json({ success: true, data: workshops })
})

app.post('/api/workshops/join', (req: Request, res: Response): void => {
  const { inviteCode, name } = req.body
  const workshop = db.prepare('SELECT * FROM workshops WHERE invite_code = ?').get(inviteCode) as any

  if (!workshop) {
    res.status(404).json({ success: false, error: 'Invalid invite code' })
    return
  }

  const participantCount = db.prepare('SELECT COUNT(*) as count FROM participants WHERE workshop_id = ?').get(workshop.id) as { count: number }
  if (participantCount.count >= workshop.max_participants) {
    res.status(400).json({ success: false, error: 'Workshop is full' })
    return
  }

  const id = uuidv4()
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]
  const participantName = name || `创意达人${Math.floor(Math.random() * 10000)}`

  try {
    db.prepare(
      'INSERT INTO participants (id, workshop_id, name, color) VALUES (?, ?, ?, ?)'
    ).run(id, workshop.id, participantName, color)

    const participant = db.prepare('SELECT * FROM participants WHERE id = ?').get(id)
    res.status(201).json({
      success: true,
      data: {
        participant,
        workshop,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to join workshop' })
  }
})

app.get('/api/workshops/:id', (req: Request, res: Response): void => {
  const workshop = db.prepare('SELECT * FROM workshops WHERE id = ?').get(req.params.id) as any
  if (!workshop) {
    res.status(404).json({ success: false, error: 'Workshop not found' })
    return
  }
  const participantCount = db.prepare('SELECT COUNT(*) as count FROM participants WHERE workshop_id = ?').get(req.params.id) as { count: number }
  const participants = db.prepare('SELECT * FROM participants WHERE workshop_id = ?').all(req.params.id)
  res.json({
    success: true,
    data: {
      ...workshop,
      participantCount: participantCount.count,
      participants,
    },
  })
})

app.post('/api/workshops/:id/ideas', (req: Request, res: Response): void => {
  const { participantId, title, description, category } = req.body
  const id = uuidv4()

  try {
    db.prepare(
      'INSERT INTO ideas (id, workshop_id, participant_id, title, description, category) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, req.params.id, participantId, title, description || null, category || 'other')

    const idea = db.prepare('SELECT * FROM ideas WHERE id = ?').get(id)
    res.status(201).json({ success: true, data: idea })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to submit idea' })
  }
})

app.get('/api/workshops/:id/ideas', (req: Request, res: Response): void => {
  const ideas = db.prepare('SELECT * FROM ideas WHERE workshop_id = ? ORDER BY created_at DESC').all(req.params.id)
  res.json({ success: true, data: ideas })
})

app.post('/api/ideas/:id/like', (req: Request, res: Response): void => {
  const { participantId } = req.body
  const idea = db.prepare('SELECT * FROM ideas WHERE id = ?').get(req.params.id) as any

  if (!idea) {
    res.status(404).json({ success: false, error: 'Idea not found' })
    return
  }

  const existingLikes = db.prepare(
    'SELECT COUNT(*) as count FROM likes WHERE participant_id = ? AND idea_id IN (SELECT id FROM ideas WHERE workshop_id = ?)'
  ).get(participantId, idea.workshop_id) as { count: number }

  if (existingLikes.count >= 3) {
    res.status(400).json({ success: false, error: 'Maximum 3 likes per participant per workshop' })
    return
  }

  const existingLike = db.prepare('SELECT * FROM likes WHERE idea_id = ? AND participant_id = ?').get(req.params.id, participantId)
  if (existingLike) {
    res.status(400).json({ success: false, error: 'Already liked this idea' })
    return
  }

  try {
    const likeId = uuidv4()
    db.prepare('INSERT INTO likes (id, idea_id, participant_id) VALUES (?, ?, ?)').run(likeId, req.params.id, participantId)
    db.prepare('UPDATE ideas SET likes = likes + 1 WHERE id = ?').run(req.params.id)

    const updatedIdea = db.prepare('SELECT * FROM ideas WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updatedIdea })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to like idea' })
  }
})

app.post('/api/workshops/:id/start-vote', (req: Request, res: Response): void => {
  try {
    db.prepare("UPDATE workshops SET status = 'voting' WHERE id = ?").run(req.params.id)
    const workshop = db.prepare('SELECT * FROM workshops WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: workshop })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to start voting' })
  }
})

app.post('/api/workshops/:id/vote', (req: Request, res: Response): void => {
  const { participantId, votes } = req.body

  try {
    const insertVote = db.prepare(
      'INSERT INTO votes (id, workshop_id, participant_id, idea_id, vote_type) VALUES (?, ?, ?, ?, ?)'
    )

    const insertMany = db.transaction((voteList: Array<{ ideaId: string; vote: string }>) => {
      for (const v of voteList) {
        insertVote.run(uuidv4(), req.params.id, participantId, v.ideaId, v.vote)
      }
    })

    insertMany(votes)
    res.status(201).json({ success: true, data: { message: 'Votes submitted' } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to submit votes' })
  }
})

app.get('/api/workshops/:id/vote-results', (req: Request, res: Response): void => {
  const ideas = db.prepare('SELECT * FROM ideas WHERE workshop_id = ?').all(req.params.id) as any[]

  const results = ideas.map(idea => {
    const approveCount = (db.prepare("SELECT COUNT(*) as count FROM votes WHERE idea_id = ? AND vote_type = 'approve'").get(idea.id) as { count: number }).count
    const rejectCount = (db.prepare("SELECT COUNT(*) as count FROM votes WHERE idea_id = ? AND vote_type = 'reject'").get(idea.id) as { count: number }).count
    const score = approveCount * 1.5 - rejectCount * 0.5
    return {
      ...idea,
      approveCount,
      rejectCount,
      score,
    }
  })

  results.sort((a, b) => b.score - a.score)
  res.json({ success: true, data: results })
})

app.post('/api/workshops/:id/generate-tasks', (req: Request, res: Response): void => {
  const { topN } = req.body
  const n = topN || 5
  const workshop = db.prepare('SELECT * FROM workshops WHERE id = ?').get(req.params.id) as any

  if (!workshop) {
    res.status(404).json({ success: false, error: 'Workshop not found' })
    return
  }

  const ideas = db.prepare('SELECT * FROM ideas WHERE workshop_id = ?').all(req.params.id) as any[]
  const participants = db.prepare('SELECT * FROM participants WHERE workshop_id = ?').all(req.params.id) as any[]

  if (participants.length === 0) {
    res.status(400).json({ success: false, error: 'No participants in workshop' })
    return
  }

  const ranked = ideas.map(idea => {
    const approveCount = (db.prepare("SELECT COUNT(*) as count FROM votes WHERE idea_id = ? AND vote_type = 'approve'").get(idea.id) as { count: number }).count
    const rejectCount = (db.prepare("SELECT COUNT(*) as count FROM votes WHERE idea_id = ? AND vote_type = 'reject'").get(idea.id) as { count: number }).count
    return {
      ...idea,
      score: approveCount * 1.5 - rejectCount * 0.5,
    }
  })

  ranked.sort((a, b) => b.score - a.score)
  const topIdeas = ranked.slice(0, n)
  const priorities = ['P0', 'P1', 'P2', 'P3']

  try {
    const insertTask = db.prepare(
      'INSERT INTO tasks (id, workshop_id, idea_id, assignee_id, title, description, priority) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )

    const tasks: any[] = []
    const insertMany = db.transaction((topIdeasList: any[]) => {
      for (let i = 0; i < topIdeasList.length; i++) {
        const idea = topIdeasList[i]
        const taskId = uuidv4()
        const assignee = participants[i % participants.length]
        const priority = priorities[Math.min(i, priorities.length - 1)]
        insertTask.run(taskId, req.params.id, idea.id, assignee.id, idea.title, idea.description, priority)
        const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId)
        tasks.push(task)
      }

      db.prepare("UPDATE workshops SET status = 'task' WHERE id = ?").run(req.params.id)
    })

    insertMany(topIdeas)

    res.status(201).json({ success: true, data: tasks })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate tasks' })
  }
})

app.get('/api/workshops/:id/tasks', (req: Request, res: Response): void => {
  const tasks = db.prepare('SELECT * FROM tasks WHERE workshop_id = ? ORDER BY created_at').all(req.params.id) as any[]

  const tasksWithSubtasks = tasks.map(task => {
    const subtasks = db.prepare('SELECT * FROM subtasks WHERE task_id = ?').all(task.id)
    return { ...task, subtasks }
  })

  res.json({ success: true, data: tasksWithSubtasks })
})

app.patch('/api/tasks/:id', (req: Request, res: Response): void => {
  const { status, dueDate, subtasks } = req.body

  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as any
    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' })
      return
    }

    if (status !== undefined) {
      db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(status, req.params.id)
    }
    if (dueDate !== undefined) {
      db.prepare('UPDATE tasks SET due_date = ? WHERE id = ?').run(dueDate, req.params.id)
    }

    if (subtasks && Array.isArray(subtasks)) {
      for (const st of subtasks) {
        if (st.id && st.completed !== undefined) {
          db.prepare('UPDATE subtasks SET completed = ? WHERE id = ?').run(st.completed ? 1 : 0, st.id)
        }
      }
    }

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id)
    const taskSubtasks = db.prepare('SELECT * FROM subtasks WHERE task_id = ?').all(req.params.id)
    res.json({ success: true, data: { ...updatedTask, subtasks: taskSubtasks } })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update task' })
  }
})

app.post('/api/tasks/:id/subtasks', (req: Request, res: Response): void => {
  const { title } = req.body
  const id = uuidv4()

  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id) as any
    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' })
      return
    }

    db.prepare('INSERT INTO subtasks (id, task_id, title) VALUES (?, ?, ?)').run(id, req.params.id, title)
    const subtask = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id)
    res.status(201).json({ success: true, data: subtask })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add subtask' })
  }
})

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
