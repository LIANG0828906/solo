import { Router, type Request, type Response } from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 } from 'uuid'
import { broadcastUpdate } from '../socketService.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dataPath = path.resolve(__dirname, 'server/data.json')

function readData() {
  const raw = fs.readFileSync(dataPath, 'utf-8')
  return JSON.parse(raw)
}

function writeData(data: any) {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8')
}

const router = Router()

router.get('/boards', (_req: Request, res: Response): void => {
  const data = readData()
  res.json({ success: true, data: data.boards })
})

router.get('/board/:id', (req: Request, res: Response): void => {
  const data = readData()
  const board = data.boards.find((b: any) => b.id === req.params.id)
  if (!board) {
    res.status(404).json({ success: false, error: 'Board not found' })
    return
  }
  res.json({ success: true, data: board })
})

router.put('/task/:id', (req: Request, res: Response): void => {
  const { task, columnId, boardId, sourceColumnId } = req.body
  const data = readData()
  const board = data.boards.find((b: any) => b.id === boardId)
  if (!board) {
    res.status(404).json({ success: false, error: 'Board not found' })
    return
  }

  if (sourceColumnId && sourceColumnId !== columnId) {
    const sourceCol = board.columns.find((c: any) => c.id === sourceColumnId)
    if (sourceCol) {
      sourceCol.tasks = sourceCol.tasks.filter((t: any) => t.id !== req.params.id)
    }

    const targetCol = board.columns.find((c: any) => c.id === columnId)
    if (targetCol) {
      const existingIndex = targetCol.tasks.findIndex((t: any) => t.id === req.params.id)
      if (existingIndex >= 0) {
        targetCol.tasks[existingIndex] = task
      } else {
        targetCol.tasks.push(task)
      }
    }
  } else {
    const col = board.columns.find((c: any) => c.id === columnId)
    if (col) {
      const index = col.tasks.findIndex((t: any) => t.id === req.params.id)
      if (index >= 0) {
        col.tasks[index] = task
      }
    }
  }

  writeData(data)
  broadcastUpdate(boardId, 'update', task)
  res.json({ success: true, data: task })
})

router.post('/task', (req: Request, res: Response): void => {
  const { task, columnId, boardId } = req.body
  const data = readData()
  const board = data.boards.find((b: any) => b.id === boardId)
  if (!board) {
    res.status(404).json({ success: false, error: 'Board not found' })
    return
  }

  const col = board.columns.find((c: any) => c.id === columnId)
  if (!col) {
    res.status(404).json({ success: false, error: 'Column not found' })
    return
  }

  const newTask = { ...task, id: v4() }
  col.tasks.push(newTask)
  writeData(data)
  broadcastUpdate(boardId, 'create', newTask)
  res.json({ success: true, data: newTask })
})

router.delete('/task/:id', (req: Request, res: Response): void => {
  const { columnId, boardId } = req.body
  const data = readData()
  const board = data.boards.find((b: any) => b.id === boardId)
  if (!board) {
    res.status(404).json({ success: false, error: 'Board not found' })
    return
  }

  const col = board.columns.find((c: any) => c.id === columnId)
  if (!col) {
    res.status(404).json({ success: false, error: 'Column not found' })
    return
  }

  const taskIndex = col.tasks.findIndex((t: any) => t.id === req.params.id)
  if (taskIndex < 0) {
    res.status(404).json({ success: false, error: 'Task not found' })
    return
  }

  const removed = col.tasks.splice(taskIndex, 1)[0]
  writeData(data)
  broadcastUpdate(boardId, 'delete', removed)
  res.json({ success: true, data: removed })
})

export default router
