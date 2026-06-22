import express, { Request, Response } from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'

const app = express()
const port = 3001

app.use(cors())
app.use(express.json())

interface Resolution {
  id: string
  content: string
  assignee: string
  deadline: string
  status: 'in_progress' | 'completed'
}

interface Todo {
  id: string
  description: string
  assignee: string
  priority: 'high' | 'medium' | 'low'
  deadline: string
  completed: boolean
}

interface Meeting {
  id: string
  title: string
  content: string
  createdAt: string
  resolutions: Resolution[]
  todos: Todo[]
}

const meetings: Map<string, Meeting> = new Map()

const parseChineseDate = (text: string): string => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const nextFridayMatch = text.match(/下周五/)
  if (nextFridayMatch) {
    const result = new Date(today)
    const dayOfWeek = today.getDay()
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7
    result.setDate(today.getDate() + daysUntilFriday + 7)
    return result.toISOString().split('T')[0]
  }

  const threeDaysLaterMatch = text.match(/三天后/)
  if (threeDaysLaterMatch) {
    const result = new Date(today)
    result.setDate(today.getDate() + 3)
    return result.toISOString().split('T')[0]
  }

  const specificDateMatch = text.match(/(\d{1,2})月(\d{1,2})日/)
  if (specificDateMatch) {
    const month = parseInt(specificDateMatch[1]) - 1
    const day = parseInt(specificDateMatch[2])
    const result = new Date(today.getFullYear(), month, day)
    return result.toISOString().split('T')[0]
  }

  const tomorrowMatch = text.match(/明天/)
  if (tomorrowMatch) {
    const result = new Date(today)
    result.setDate(today.getDate() + 1)
    return result.toISOString().split('T')[0]
  }

  const nextWeekMatch = text.match(/下周/)
  if (nextWeekMatch) {
    const result = new Date(today)
    result.setDate(today.getDate() + 7)
    return result.toISOString().split('T')[0]
  }

  return today.toISOString().split('T')[0]
}

const extractAssignee = (text: string): string => {
  const nameMatch = text.match(/(?:由|请|让)([^\s、，。]{2,4})(?:负责|处理|跟进|完成)/)
  if (nameMatch) return nameMatch[1]
  
  const shortMatch = text.match(/([张王李赵刘陈杨黄周吴][^\s、，。]{1,3})/)
  if (shortMatch) return shortMatch[1]
  
  return '未指定'
}

const determinePriority = (text: string): 'high' | 'medium' | 'low' => {
  if (/紧急|立刻|马上|重要|ASAP/.test(text)) return 'high'
  if (/尽快|本周|近期|优先/.test(text)) return 'medium'
  return 'low'
}

const extractTitle = (text: string, userTitle?: string): string => {
  if (userTitle && userTitle.trim()) return userTitle.trim()
  const firstLine = text.split(/[。！？\n]/)[0].trim()
  return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine
}

const parseMeetingContent = (content: string, title?: string) => {
  const sentences = content.split(/[。！？；\n]/).filter(s => s.trim().length > 10)
  
  const resolutions: Resolution[] = []
  const todos: Todo[] = []
  
  const resolutionKeywords = /(决定|确定|决议|通过|同意|计划|将|要|需要|应该)/
  const todoKeywords = /(负责|处理|跟进|完成|提交|汇报|准备|安排)/

  sentences.forEach((sentence, index) => {
    const trimmed = sentence.trim()
    
    if (resolutionKeywords.test(trimmed) || index < 3) {
      const deadline = parseChineseDate(trimmed)
      const assignee = extractAssignee(trimmed)
      
      resolutions.push({
        id: uuidv4(),
        content: trimmed,
        assignee,
        deadline,
        status: 'in_progress'
      })
    }
    
    if (todoKeywords.test(trimmed) || index >= 2) {
      const deadline = parseChineseDate(trimmed)
      const assignee = extractAssignee(trimmed)
      const priority = determinePriority(trimmed)
      
      todos.push({
        id: uuidv4(),
        description: trimmed,
        assignee,
        priority,
        deadline,
        completed: false
      })
    }
  })

  if (resolutions.length === 0 && sentences.length > 0) {
    resolutions.push({
      id: uuidv4(),
      content: sentences[0].trim(),
      assignee: extractAssignee(sentences[0]),
      deadline: parseChineseDate(content),
      status: 'in_progress'
    })
  }

  if (todos.length === 0 && sentences.length > 0) {
    const idx = Math.min(1, sentences.length - 1)
    todos.push({
      id: uuidv4(),
      description: sentences[idx].trim(),
      assignee: extractAssignee(sentences[idx]),
      priority: determinePriority(sentences[idx]),
      deadline: parseChineseDate(content),
      completed: false
    })
  }

  return {
    title: extractTitle(content, title),
    resolutions,
    todos
  }
}

app.post('/api/meetings', (req: Request, res: Response) => {
  try {
    const { content, title } = req.body
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: '会议内容不能为空' })
    }

    const parsed = parseMeetingContent(content, title)
    
    const meeting: Meeting = {
      id: uuidv4(),
      title: parsed.title,
      content,
      createdAt: new Date().toISOString(),
      resolutions: parsed.resolutions,
      todos: parsed.todos
    }

    meetings.set(meeting.id, meeting)
    
    setTimeout(() => {
      res.json(meeting)
    }, 150)
  } catch (error) {
    console.error('Error creating meeting:', error)
    res.status(500).json({ error: '创建会议失败' })
  }
})

app.get('/api/meetings', (req: Request, res: Response) => {
  try {
    const { search } = req.query
    let result = Array.from(meetings.values())
    
    if (search && typeof search === 'string') {
      const keyword = search.toLowerCase()
      result = result.filter(m => m.title.toLowerCase().includes(keyword))
    }
    
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    res.json(result)
  } catch (error) {
    console.error('Error fetching meetings:', error)
    res.status(500).json({ error: '获取会议列表失败' })
  }
})

app.get('/api/meetings/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const meeting = meetings.get(id)
    
    if (!meeting) {
      return res.status(404).json({ error: '会议不存在' })
    }
    
    res.json(meeting)
  } catch (error) {
    console.error('Error fetching meeting:', error)
    res.status(500).json({ error: '获取会议详情失败' })
  }
})

app.patch('/api/todos/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updates = req.body
    
    for (const meeting of meetings.values()) {
      const todoIndex = meeting.todos.findIndex(t => t.id === id)
      if (todoIndex !== -1) {
        meeting.todos[todoIndex] = { ...meeting.todos[todoIndex], ...updates }
        return res.json(meeting.todos[todoIndex])
      }
      
      const resolutionIndex = meeting.resolutions.findIndex(r => r.id === id)
      if (resolutionIndex !== -1) {
        meeting.resolutions[resolutionIndex] = { ...meeting.resolutions[resolutionIndex], ...updates }
        return res.json(meeting.resolutions[resolutionIndex])
      }
    }
    
    res.status(404).json({ error: '待办事项不存在' })
  } catch (error) {
    console.error('Error updating todo:', error)
    res.status(500).json({ error: '更新待办事项失败' })
  }
})

app.delete('/api/todos/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params
    
    for (const meeting of meetings.values()) {
      const todoIndex = meeting.todos.findIndex(t => t.id === id)
      if (todoIndex !== -1) {
        meeting.todos.splice(todoIndex, 1)
        return res.json({ success: true })
      }
    }
    
    res.status(404).json({ error: '待办事项不存在' })
  } catch (error) {
    console.error('Error deleting todo:', error)
    res.status(500).json({ error: '删除待办事项失败' })
  }
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
