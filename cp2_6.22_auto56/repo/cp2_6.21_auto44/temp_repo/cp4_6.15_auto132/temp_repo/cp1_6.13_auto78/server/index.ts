import express, { type Request, type Response } from 'express'
import cors from 'cors'
import bcrypt from 'bcrypt'
import { v4 as uuidv4 } from 'uuid'

interface Skill {
  id: string
  userId: string
  name: string
  level: number
  availableHours: number
  availability: string
}

interface User {
  id: string
  nickname: string
  avatarUrl: string
  bio: string
  passwordHash: string
  skills: Skill[]
  createdAt: Date
}

interface Task {
  id: string
  publisherId: string
  title: string
  description: string
  requiredSkill: string
  estimatedMinutes: number
  status: 'open' | 'applied' | 'completed'
  createdAt: Date
}

interface Exchange {
  id: string
  taskId: string
  applicantId: string
  publisherId: string
  applicantSkillId: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  createdAt: Date
}

interface Notification {
  id: string
  userId: string
  exchangeId: string
  type: string
  content: string
  isRead: boolean
  createdAt: Date
}

const users: Map<string, User> = new Map()
const tasks: Map<string, Task> = new Map()
const exchanges: Map<string, Exchange> = new Map()
const notifications: Map<string, Notification> = new Map()

const app = express()
const PORT = 5000

app.use(cors())
app.use(express.json())

function calculateMatchScore(skills: Skill[], requiredSkillName: string): number {
  const matchedSkills = skills.filter(
    (s) => s.name.toLowerCase() === requiredSkillName.toLowerCase()
  )
  if (matchedSkills.length === 0) return 0

  const totalScore = matchedSkills.reduce((sum, skill) => {
    return sum + skill.level * (skill.availableHours / 40)
  }, 0)

  const avgScore = totalScore / matchedSkills.length
  return Math.min(100, (avgScore / 5) * 100)
}

function initMockData() {
  const user1Id = uuidv4()
  const user2Id = uuidv4()

  const user1Skills: Skill[] = [
    {
      id: uuidv4(),
      userId: user1Id,
      name: 'JavaScript',
      level: 4,
      availableHours: 20,
      availability: '周末',
    },
    {
      id: uuidv4(),
      userId: user1Id,
      name: 'React',
      level: 3,
      availableHours: 15,
      availability: '工作日晚上',
    },
    {
      id: uuidv4(),
      userId: user1Id,
      name: 'Python',
      level: 5,
      availableHours: 10,
      availability: '灵活',
    },
  ]

  const user2Skills: Skill[] = [
    {
      id: uuidv4(),
      userId: user2Id,
      name: 'UI设计',
      level: 5,
      availableHours: 25,
      availability: '周末',
    },
    {
      id: uuidv4(),
      userId: user2Id,
      name: 'JavaScript',
      level: 2,
      availableHours: 8,
      availability: '工作日晚上',
    },
    {
      id: uuidv4(),
      userId: user2Id,
      name: '产品设计',
      level: 4,
      availableHours: 15,
      availability: '灵活',
    },
  ]

  const user1: User = {
    id: user1Id,
    nickname: '技术小哥',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tech',
    bio: '全栈开发工程师，热爱编程和分享',
    passwordHash: bcrypt.hashSync('123456', 10),
    skills: user1Skills,
    createdAt: new Date(),
  }

  const user2: User = {
    id: user2Id,
    nickname: '设计达人',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=design',
    bio: 'UI/UX设计师，追求极致用户体验',
    passwordHash: bcrypt.hashSync('123456', 10),
    skills: user2Skills,
    createdAt: new Date(),
  }

  users.set(user1Id, user1)
  users.set(user2Id, user2)

  const taskData = [
    {
      publisherId: user2Id,
      title: '官网前端开发',
      description: '需要一位有经验的前端开发者帮我完成公司官网的开发，使用React框架',
      requiredSkill: 'React',
      estimatedMinutes: 1200,
    },
    {
      publisherId: user1Id,
      title: '移动应用UI设计',
      description: '需要一位优秀的UI设计师为我的移动应用设计界面',
      requiredSkill: 'UI设计',
      estimatedMinutes: 600,
    },
    {
      publisherId: user2Id,
      title: 'Python数据分析',
      description: '需要用Python做一些数据分析和可视化的工作',
      requiredSkill: 'Python',
      estimatedMinutes: 300,
    },
    {
      publisherId: user1Id,
      title: '产品原型设计',
      description: '需要产品设计师帮忙设计产品原型和交互流程',
      requiredSkill: '产品设计',
      estimatedMinutes: 480,
    },
    {
      publisherId: user2Id,
      title: 'JavaScript脚本开发',
      description: '需要开发一些自动化脚本，提高工作效率',
      requiredSkill: 'JavaScript',
      estimatedMinutes: 240,
    },
  ]

  taskData.forEach((task) => {
    const taskId = uuidv4()
    tasks.set(taskId, {
      id: taskId,
      ...task,
      status: 'open',
      createdAt: new Date(),
    })
  })

  console.log('Mock data initialized')
  console.log(`Users: ${users.size}, Tasks: ${tasks.size}`)
}

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { nickname, avatarUrl, bio, password, skills } = req.body

    if (!nickname || !password) {
      res.status(400).json({ error: '昵称和密码不能为空' })
      return
    }

    const existingUser = Array.from(users.values()).find(
      (u) => u.nickname === nickname
    )
    if (existingUser) {
      res.status(400).json({ error: '昵称已存在' })
      return
    }

    const userId = uuidv4()
    const passwordHash = await bcrypt.hash(password, 10)

    const userSkills: Skill[] = (skills || []).map((skill: any) => ({
      id: uuidv4(),
      userId,
      name: skill.name,
      level: skill.level || 1,
      availableHours: skill.availableHours || 10,
      availability: skill.availability || '灵活',
    }))

    const user: User = {
      id: userId,
      nickname,
      avatarUrl: avatarUrl || '',
      bio: bio || '',
      passwordHash,
      skills: userSkills,
      createdAt: new Date(),
    }

    users.set(userId, user)

    const { passwordHash: _, ...userWithoutPassword } = user
    res.status(201).json(userWithoutPassword)
  } catch (error) {
    res.status(500).json({ error: '注册失败' })
  }
})

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { nickname, password } = req.body

    if (!nickname || !password) {
      res.status(400).json({ error: '昵称和密码不能为空' })
      return
    }

    const user = Array.from(users.values()).find((u) => u.nickname === nickname)
    if (!user) {
      res.status(401).json({ error: '用户不存在' })
      return
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      res.status(401).json({ error: '密码错误' })
      return
    }

    const { passwordHash: _, ...userWithoutPassword } = user
    res.json(userWithoutPassword)
  } catch (error) {
    res.status(500).json({ error: '登录失败' })
  }
})

app.get('/api/users/:id', (req: Request, res: Response) => {
  try {
    const user = users.get(req.params.id)
    if (!user) {
      res.status(404).json({ error: '用户不存在' })
      return
    }

    const { passwordHash: _, ...userWithoutPassword } = user
    res.json(userWithoutPassword)
  } catch (error) {
    res.status(500).json({ error: '获取用户信息失败' })
  }
})

app.post('/api/users/:id/skills', (req: Request, res: Response) => {
  try {
    const user = users.get(req.params.id)
    if (!user) {
      res.status(404).json({ error: '用户不存在' })
      return
    }

    const { name, level, availableHours, availability } = req.body

    if (!name) {
      res.status(400).json({ error: '技能名称不能为空' })
      return
    }

    const newSkill: Skill = {
      id: uuidv4(),
      userId: user.id,
      name,
      level: level || 1,
      availableHours: availableHours || 10,
      availability: availability || '灵活',
    }

    user.skills.push(newSkill)
    res.status(201).json(newSkill)
  } catch (error) {
    res.status(500).json({ error: '添加技能失败' })
  }
})

app.get('/api/tasks', (req: Request, res: Response) => {
  try {
    const allTasks = Array.from(tasks.values())
    res.json(allTasks)
  } catch (error) {
    res.status(500).json({ error: '获取任务列表失败' })
  }
})

app.post('/api/tasks', (req: Request, res: Response) => {
  try {
    const { publisherId, title, description, requiredSkill, estimatedMinutes } =
      req.body

    if (!publisherId || !title || !requiredSkill) {
      res.status(400).json({ error: '发布者ID、标题和所需技能不能为空' })
      return
    }

    const taskId = uuidv4()
    const task: Task = {
      id: taskId,
      publisherId,
      title,
      description: description || '',
      requiredSkill,
      estimatedMinutes: estimatedMinutes || 60,
      status: 'open',
      createdAt: new Date(),
    }

    tasks.set(taskId, task)
    res.status(201).json(task)
  } catch (error) {
    res.status(500).json({ error: '创建任务失败' })
  }
})

app.get('/api/tasks/match/:taskId/:userId', (req: Request, res: Response) => {
  try {
    const task = tasks.get(req.params.taskId)
    if (!task) {
      res.status(404).json({ error: '任务不存在' })
      return
    }

    const user = users.get(req.params.userId)
    if (!user) {
      res.status(404).json({ error: '用户不存在' })
      return
    }

    const matchedSkills = user.skills
      .map((skill) => ({
        skill,
        matchScore: calculateMatchScore([skill], task.requiredSkill),
      }))
      .filter((item) => item.matchScore > 50)
      .sort((a, b) => b.matchScore - a.matchScore)

    res.json({
      taskId: task.id,
      requiredSkill: task.requiredSkill,
      matchedSkills: matchedSkills.map((item) => ({
        ...item.skill,
        matchScore: Math.round(item.matchScore),
      })),
    })
  } catch (error) {
    res.status(500).json({ error: '计算匹配度失败' })
  }
})

app.post('/api/tasks/:id/apply', (req: Request, res: Response) => {
  try {
    const task = tasks.get(req.params.id)
    if (!task) {
      res.status(404).json({ error: '任务不存在' })
      return
    }

    const { applicantId, applicantSkillId } = req.body

    if (!applicantId || !applicantSkillId) {
      res.status(400).json({ error: '申请者ID和技能ID不能为空' })
      return
    }

    const applicant = users.get(applicantId)
    if (!applicant) {
      res.status(404).json({ error: '申请者不存在' })
      return
    }

    const skill = applicant.skills.find((s) => s.id === applicantSkillId)
    if (!skill) {
      res.status(404).json({ error: '技能不存在' })
      return
    }

    const exchangeId = uuidv4()
    const exchange: Exchange = {
      id: exchangeId,
      taskId: task.id,
      applicantId,
      publisherId: task.publisherId,
      applicantSkillId,
      status: 'pending',
      createdAt: new Date(),
    }

    exchanges.set(exchangeId, exchange)

    const notificationId = uuidv4()
    const notification: Notification = {
      id: notificationId,
      userId: task.publisherId,
      exchangeId,
      type: 'new_application',
      content: `${applicant.nickname} 申请了你的任务「${task.title}」`,
      isRead: false,
      createdAt: new Date(),
    }

    notifications.set(notificationId, notification)

    if (task.status === 'open') {
      task.status = 'applied'
    }

    res.status(201).json({ exchange, notification })
  } catch (error) {
    res.status(500).json({ error: '申请任务失败' })
  }
})

app.get('/api/exchanges/:id', (req: Request, res: Response) => {
  try {
    const exchange = exchanges.get(req.params.id)
    if (!exchange) {
      res.status(404).json({ error: '交换不存在' })
      return
    }

    const task = tasks.get(exchange.taskId)
    const applicant = users.get(exchange.applicantId)
    const publisher = users.get(exchange.publisherId)
    const skill = applicant?.skills.find(
      (s) => s.id === exchange.applicantSkillId
    )

    res.json({
      ...exchange,
      task,
      applicant: applicant
        ? {
            id: applicant.id,
            nickname: applicant.nickname,
            avatarUrl: applicant.avatarUrl,
          }
        : null,
      publisher: publisher
        ? {
            id: publisher.id,
            nickname: publisher.nickname,
            avatarUrl: publisher.avatarUrl,
          }
        : null,
      skill,
    })
  } catch (error) {
    res.status(500).json({ error: '获取交换详情失败' })
  }
})

app.post('/api/exchanges/:id/accept', (req: Request, res: Response) => {
  try {
    const exchange = exchanges.get(req.params.id)
    if (!exchange) {
      res.status(404).json({ error: '交换不存在' })
      return
    }

    if (exchange.status !== 'pending') {
      res.status(400).json({ error: '当前状态无法接受' })
      return
    }

    exchange.status = 'accepted'

    const task = tasks.get(exchange.taskId)
    if (task) {
      task.status = 'applied'
    }

    const notificationId = uuidv4()
    const notification: Notification = {
      id: notificationId,
      userId: exchange.applicantId,
      exchangeId: exchange.id,
      type: 'exchange_accepted',
      content: `你的任务申请已被接受`,
      isRead: false,
      createdAt: new Date(),
    }

    notifications.set(notificationId, notification)

    res.json({ exchange, notification })
  } catch (error) {
    res.status(500).json({ error: '接受交换失败' })
  }
})

app.post('/api/exchanges/:id/reject', (req: Request, res: Response) => {
  try {
    const exchange = exchanges.get(req.params.id)
    if (!exchange) {
      res.status(404).json({ error: '交换不存在' })
      return
    }

    if (exchange.status !== 'pending') {
      res.status(400).json({ error: '当前状态无法拒绝' })
      return
    }

    exchange.status = 'rejected'

    const notificationId = uuidv4()
    const notification: Notification = {
      id: notificationId,
      userId: exchange.applicantId,
      exchangeId: exchange.id,
      type: 'exchange_rejected',
      content: `你的任务申请被拒绝了`,
      isRead: false,
      createdAt: new Date(),
    }

    notifications.set(notificationId, notification)

    res.json({ exchange, notification })
  } catch (error) {
    res.status(500).json({ error: '拒绝交换失败' })
  }
})

app.get('/api/notifications/:userId', (req: Request, res: Response) => {
  try {
    const userNotifications = Array.from(notifications.values())
      .filter((n) => n.userId === req.params.userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    res.json(userNotifications)
  } catch (error) {
    res.status(500).json({ error: '获取通知列表失败' })
  }
})

app.post('/api/notifications/:id/read', (req: Request, res: Response) => {
  try {
    const notification = notifications.get(req.params.id)
    if (!notification) {
      res.status(404).json({ error: '通知不存在' })
      return
    }

    notification.isRead = true
    res.json(notification)
  } catch (error) {
    res.status(500).json({ error: '标记已读失败' })
  }
})

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

initMockData()

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)
})

export default app
