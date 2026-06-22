import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'

const app = express()
const PORT = 3002

app.use(cors())
app.use(express.json())

const USERS = [
  { id: '1', name: '张明' },
  { id: '2', name: '李华' },
  { id: '3', name: '王芳' },
  { id: '4', name: '赵强' },
  { id: '5', name: '陈静' },
  { id: '6', name: '刘伟' },
  { id: '7', name: '周敏' },
  { id: '8', name: '孙磊' }
]

const ISSUES = [
  {
    id: 'issue-1',
    title: '下周团建活动选择',
    description: '下周五组织团建活动，请大家投票选择喜欢的活动类型。活动预算每人500元，时间为下午2点到晚上8点。',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    deadline: Date.now() + 1000 * 60 * 60 * 24 * 1,
    options: [
      { id: 'opt-1', name: '户外烧烤', emoji: '🍖', votes: ['1', '3', '5'] },
      { id: 'opt-2', name: '密室逃脱', emoji: '🔐', votes: ['2', '4'] },
      { id: 'opt-3', name: '桌游聚会', emoji: '🎲', votes: ['6', '7', '8'] },
      { id: 'opt-4', name: '爬山远足', emoji: '⛰️', votes: [] }
    ],
    comments: [
      { id: 'c1', userId: '1', content: '烧烤不错，天气也正好！', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1 },
      { id: 'c2', userId: '4', content: '密室逃脱很有挑战性，强烈推荐', createdAt: Date.now() - 1000 * 60 * 60 * 12 }
    ]
  },
  {
    id: 'issue-2',
    title: '新办公区茶水间配置',
    description: '新办公区茶水间需要采购基础设备，请选择你认为最重要的配置。',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    deadline: Date.now() - 1000 * 60 * 60 * 12,
    options: [
      { id: 'opt-5', name: '咖啡机', emoji: '☕', votes: ['1', '2', '3', '4', '5'] },
      { id: 'opt-6', name: '微波炉', emoji: '🍱', votes: ['6', '7'] },
      { id: 'opt-7', name: '冰箱', emoji: '🧊', votes: ['8'] }
    ],
    comments: [
      { id: 'c3', userId: '2', content: '没有咖啡真的不行...', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3 },
      { id: 'c4', userId: '6', content: '微波炉热饭很实用', createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2 }
    ]
  },
  {
    id: 'issue-3',
    title: '技术栈选型：新项目前端框架',
    description: '新项目需要选择前端框架，目前有三个候选方案。请结合团队技术储备和项目需求进行投票。',
    createdAt: Date.now() - 1000 * 60 * 30,
    deadline: Date.now() + 1000 * 60 * 60 * 48,
    options: [
      { id: 'opt-8', name: 'React', emoji: '⚛️', votes: ['1', '2'] },
      { id: 'opt-9', name: 'Vue', emoji: '💚', votes: ['3'] },
      { id: 'opt-10', name: 'Angular', emoji: '🅰️', votes: [] }
    ],
    comments: []
  }
]

app.get('/api/users', (req, res) => {
  res.json(USERS)
})

app.get('/api/issues', (req, res) => {
  const now = Date.now()
  const issues = ISSUES.map(issue => {
    const totalVotes = issue.options.reduce((sum, opt) => sum + opt.votes.length, 0)
    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      createdAt: issue.createdAt,
      deadline: issue.deadline,
      status: now > issue.deadline ? 'ended' : 'ongoing',
      totalVotes,
      optionCount: issue.options.length
    }
  })
  res.json(issues)
})

app.get('/api/issues/:id', (req, res) => {
  const issue = ISSUES.find(i => i.id === req.params.id)
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' })
  }
  const now = Date.now()
  const status = now > issue.deadline ? 'ended' : 'ongoing'
  const totalVotes = issue.options.reduce((sum, opt) => sum + opt.votes.length, 0)
  
  const commentsWithUser = issue.comments.map(c => ({
    ...c,
    user: USERS.find(u => u.id === c.userId)
  })).sort((a, b) => b.createdAt - a.createdAt)

  const voteRecords = []
  issue.options.forEach(opt => {
    opt.votes.forEach(userId => {
      voteRecords.push({
        optionId: opt.id,
        optionName: opt.name,
        user: USERS.find(u => u.id === userId)
      })
    })
  })

  const winningOptionId = status === 'ended' 
    ? issue.options.reduce((max, opt) => opt.votes.length > (max ? issue.options.find(o => o.id === max).votes.length : -1) ? opt.id : max, null)
    : null

  res.json({
    ...issue,
    status,
    totalVotes,
    comments: commentsWithUser,
    voteRecords,
    winningOptionId
  })
})

app.post('/api/issues', (req, res) => {
  const { title, description, options, deadline } = req.body
  const newIssue = {
    id: uuidv4(),
    title,
    description,
    createdAt: Date.now(),
    deadline,
    options: options.map(opt => ({ ...opt, id: uuidv4(), votes: [] })),
    comments: []
  }
  ISSUES.unshift(newIssue)
  res.status(201).json(newIssue)
})

app.post('/api/issues/:id/vote', (req, res) => {
  const { optionId, userId } = req.body
  const issue = ISSUES.find(i => i.id === req.params.id)
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' })
  }
  const now = Date.now()
  if (now > issue.deadline) {
    return res.status(400).json({ error: 'Voting has ended' })
  }
  const alreadyVoted = issue.options.some(opt => opt.votes.includes(userId))
  if (alreadyVoted) {
    return res.status(400).json({ error: 'Already voted' })
  }
  const option = issue.options.find(o => o.id === optionId)
  if (!option) {
    return res.status(404).json({ error: 'Option not found' })
  }
  option.votes.push(userId)
  res.json({ success: true })
})

app.post('/api/issues/:id/comments', (req, res) => {
  const { userId, content } = req.body
  const issue = ISSUES.find(i => i.id === req.params.id)
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' })
  }
  const newComment = {
    id: uuidv4(),
    userId,
    content,
    createdAt: Date.now()
  }
  issue.comments.unshift(newComment)
  const user = USERS.find(u => u.id === userId)
  res.status(201).json({ ...newComment, user })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
