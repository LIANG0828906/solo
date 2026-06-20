import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'

type ActionType = 'cut' | 'boil' | 'bake' | 'stew' | 'mix' | 'steam' | 'fry' | 'other'

interface ParsedStep {
  id: string
  stepNumber: number
  description: string
  ingredients: string[]
  tools: string[]
  duration: string
  actionType: ActionType
}

const ACTION_KEYWORDS: Record<ActionType, string[]> = {
  cut: ['切', '砍', '剁', '切丝', '切片', '切块', '丁', '末', '碎'],
  boil: ['煮', '焯', '焯水', '煮开', '烧开'],
  bake: ['烤', '烘', '烘烤', '烤箱'],
  stew: ['炖', '焖', '炖煮', '煲'],
  mix: ['调', '拌', '搅拌', '混合', '调味', '拌匀'],
  steam: ['蒸', '蒸煮'],
  fry: ['煎', '炒', '炸', '翻炒', '爆炒', '煎至'],
  other: [],
}

const INGREDIENT_KEYWORDS = [
  '鸡', '鸭', '鱼', '猪', '牛', '羊', '虾', '蟹', '豆腐', '蛋',
  '米', '面', '番茄', '土豆', '胡萝卜', '洋葱', '蒜', '姜', '葱', '辣椒',
  '盐', '糖', '酱油', '醋', '料酒', '油', '水', '面粉', '淀粉', '白菜',
  '香菇', '蘑菇', '木耳', '豆角', '茄子', '青椒', '西兰花', '菠菜', '生菜', '西红柿',
  '黄瓜', '南瓜', '玉米', '花生', '芝麻', '花椒', '八角', '桂皮', '香叶', '蚝油',
  '番茄酱', '豆瓣酱', '白胡椒', '黑胡椒', '奶油', '黄油', '芝士', '牛奶', '巧克力',
]

const TOOL_KEYWORDS = [
  '刀', '砧板', '锅', '炒锅', '平底锅', '汤锅', '蒸锅', '烤箱', '碗', '盘',
  '盆', '铲', '勺', '筷子', '滤网', '擀面杖', '搅拌器', '打蛋器', '量杯', '电子秤',
  '保鲜膜', '锡纸',
]

const TIME_PATTERN = /(\d+)\s*分钟|(\d+)\s*小时|(\d+)\s*秒|(\d+)\s*min|half an hour/gi

function extractDuration(text: string): string {
  const matches: string[] = []
  let match: RegExpExecArray | null
  TIME_PATTERN.lastIndex = 0
  while ((match = TIME_PATTERN.exec(text)) !== null) {
    if (match[1]) matches.push(`${match[1]}分钟`)
    else if (match[2]) matches.push(`${match[2]}小时`)
    else if (match[3]) matches.push(`${match[3]}秒`)
    else if (match[4]) matches.push(`${match[4]}min`)
    else if (match[0].toLowerCase() === 'half an hour') matches.push('30分钟')
  }
  return matches.join(', ')
}

function classifyAction(text: string): ActionType {
  const actionTypes: ActionType[] = ['cut', 'boil', 'bake', 'stew', 'mix', 'steam', 'fry']
  for (const action of actionTypes) {
    for (const keyword of ACTION_KEYWORDS[action]) {
      if (text.includes(keyword)) return action
    }
  }
  return 'other'
}

function extractIngredients(text: string): string[] {
  const found: string[] = []
  for (const keyword of INGREDIENT_KEYWORDS) {
    if (text.includes(keyword) && !found.includes(keyword)) {
      found.push(keyword)
    }
  }
  return found
}

function extractTools(text: string): string[] {
  const found: string[] = []
  for (const keyword of TOOL_KEYWORDS) {
    if (text.includes(keyword) && !found.includes(keyword)) {
      found.push(keyword)
    }
  }
  return found
}

function splitIntoSteps(text: string): string[] {
  const stepDelimiter = /(?:步骤\d+[:：]?|第\d+步[:：]?)/
  const numberedLine = /^\d+[\.、\)]\s*/

  if (stepDelimiter.test(text)) {
    return text
      .split(/(?:步骤\d+[:：]?|第\d+步[:：]?)/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
  }

  const lines = text.split(/\n/)
  const numberedSteps: string[] = []
  let hasNumberedLines = false

  for (const line of lines) {
    if (numberedLine.test(line)) {
      hasNumberedLines = true
      numberedSteps.push(line.replace(numberedLine, '').trim())
    }
  }

  if (hasNumberedLines) {
    return numberedSteps.filter(s => s.length > 0)
  }

  return text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
}

const app = express()

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.post('/api/parse', (req: Request, res: Response) => {
  const { text } = req.body as { text: string }

  if (!text || typeof text !== 'string') {
    res.status(400).json({ error: 'text is required and must be a string' })
    return
  }

  const rawSteps = splitIntoSteps(text)
  const allIngredients: string[] = []
  const steps: ParsedStep[] = rawSteps.map((desc, index) => {
    const ingredients = extractIngredients(desc)
    const tools = extractTools(desc)
    const duration = extractDuration(desc)
    const actionType = classifyAction(desc)

    for (const ing of ingredients) {
      if (!allIngredients.includes(ing)) {
        allIngredients.push(ing)
      }
    }

    return {
      id: uuidv4(),
      stepNumber: index + 1,
      description: desc,
      ingredients,
      tools,
      duration,
      actionType,
    }
  })

  res.json({ steps, ingredients: allIngredients })
})

app.use(
  '/api/health',
  (req: Request, res: Response, _next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

const PORT = process.env.PORT || 3001

const server = app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`)
}).on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = Number(PORT) + 1
    console.log(`Port ${PORT} in use, trying ${nextPort}`)
    app.listen(nextPort, () => {
      console.log(`Server ready on port ${nextPort}`)
    })
  }
})

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT signal received')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

export default app
