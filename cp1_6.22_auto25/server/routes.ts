import type * as Types from '../shared/types'
import type { User, Review, Comment, Notification, Activity, ApiResponse, ReviewStatus } from '../shared/types'
import express, { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

const stores = {
  users: new Map<string, User>(),
  reviews: new Map<string, Review>(),
  comments: new Map<string, Comment>(),
  notifications: new Map<string, Notification>(),
  activities: new Map<string, Activity>(),
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const randomDelay = () => delay(Math.random() * 200 + 100)

function successResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data }
}

function errorResponse(error: string): ApiResponse<null> {
  return { success: false, error }
}

function createActivity(
  type: Activity['type'],
  user: User,
  reviewId: string,
  reviewTitle: string,
  description: string
): Activity {
  const activity: Activity = {
    id: uuidv4(),
    type,
    user,
    reviewId,
    reviewTitle,
    timestamp: new Date().toISOString(),
    description,
  }
  stores.activities.set(activity.id, activity)
  return activity
}

function createNotification(
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  reviewId: string
): Notification {
  const notification: Notification = {
    id: uuidv4(),
    userId,
    type,
    title,
    message,
    reviewId,
    read: false,
    createdAt: new Date().toISOString(),
  }
  stores.notifications.set(notification.id, notification)
  return notification
}

function initMockData() {
  const users: User[] = [
    { id: 'u1', name: '张三', avatar: '👨‍💻', color: '#ff6b6b' },
    { id: 'u2', name: '李四', avatar: '👩‍💻', color: '#4ec9b0' },
    { id: 'u3', name: '王五', avatar: '🧑‍💻', color: '#007acc' },
    { id: 'u4', name: '赵六', avatar: '👨‍🎨', color: '#ffa502' },
  ]
  users.forEach(u => stores.users.set(u.id, u))

  const codeDiff1 = {
    filename: 'auth.ts',
    language: 'typescript',
    oldCode: [
      'function verifyToken(token: string): boolean {',
      '  try {',
      '    const decoded = jwt.decode(token)',
      '    return decoded !== null',
      '  } catch (e) {',
      '    return false',
      '  }',
      '}',
    ],
    newCode: [
      'function verifyToken(token: string): User | null {',
      '  try {',
      '    const decoded = jwt.verify(token, SECRET_KEY) as User',
      '    if (!decoded || !decoded.id) return null',
      '    return decoded',
      '  } catch (e) {',
      '    return null',
      '  }',
      '}',
    ],
  }

  const review1: Review = {
    id: 'r1',
    title: '用户认证模块重构',
    description: '重构JWT验证逻辑，支持多设备登录管理，返回用户信息而非布尔值',
    creator: users[0],
    reviewers: [users[1], users[2]],
    codeSnippet: codeDiff1,
    status: 'pending',
    deadline: '2026-06-30T00:00:00Z',
    createdAt: '2026-06-20T10:30:00Z',
    updatedAt: '2026-06-20T10:30:00Z',
  }

  const codeDiff2 = {
    filename: 'userController.ts',
    language: 'typescript',
    oldCode: [
      'async function getUsers(req: Request, res: Response) {',
      '  const users = await UserModel.find()',
      '  res.json(users)',
      '}',
    ],
    newCode: [
      'async function getUsers(req: Request, res: Response) {',
      '  const { page = 1, limit = 10 } = req.query',
      '  const users = await UserModel.find()',
      '    .skip((page - 1) * limit)',
      '    .limit(limit)',
      '  const total = await UserModel.countDocuments()',
      '  res.json({ data: users, total, page, limit })',
      '}',
    ],
  }

  const review2: Review = {
    id: 'r2',
    title: '用户列表分页功能',
    description: '添加分页查询支持，优化大数据量下的接口性能',
    creator: users[1],
    reviewers: [users[0], users[3]],
    codeSnippet: codeDiff2,
    status: 'changes_required',
    deadline: '2026-06-28T00:00:00Z',
    createdAt: '2026-06-18T14:20:00Z',
    updatedAt: '2026-06-19T09:15:00Z',
  }

  stores.reviews.set(review1.id, review1)
  stores.reviews.set(review2.id, review2)

  const comment1: Comment = {
    id: 'c1',
    reviewId: 'r1',
    lineNumber: 3,
    author: users[1],
    content: '建议添加token过期时间检查',
    createdAt: '2026-06-20T11:00:00Z',
  }

  const comment2: Comment = {
    id: 'c2',
    reviewId: 'r2',
    lineNumber: 3,
    author: users[0],
    content: '需要对page和limit参数做类型校验和范围限制',
    createdAt: '2026-06-18T16:30:00Z',
    proposedChange: {
      oldLine: "  const { page = 1, limit = 10 } = req.query",
      newLine: "  const page = Math.max(1, parseInt(req.query.page as string) || 1)\n  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10))",
    },
  }

  const comment3: Comment = {
    id: 'c3',
    reviewId: 'c2',
    lineNumber: 0,
    author: users[1],
    content: '好的，我来添加参数校验',
    createdAt: '2026-06-19T09:15:00Z',
  }

  stores.comments.set(comment1.id, comment1)
  stores.comments.set(comment2.id, { ...comment2, replies: [comment3] })
  stores.comments.set(comment3.id, comment3)

  createActivity('review_created', users[0], 'r1', '用户认证模块重构', '创建了审查请求')
  createActivity('comment', users[1], 'r1', '用户认证模块重构', '添加了评论')
  createActivity('review_created', users[1], 'r2', '用户列表分页功能', '创建了审查请求')
  createActivity('proposal', users[0], 'r2', '用户列表分页功能', '提交了代码修改提案')
  createActivity('comment', users[1], 'r2', '用户列表分页功能', '回复了评论')
  createActivity('status_change', users[0], 'r2', '用户列表分页功能', '更新状态为需修改')

  createNotification('u2', 'new_review', '新的审查请求', '张三邀请您审查「用户认证模块重构」', 'r1')
  createNotification('u3', 'new_review', '新的审查请求', '张三邀请您审查「用户认证模块重构」', 'r1')
  createNotification('u1', 'new_comment', '新评论', '李四在「用户认证模块重构」中添加了评论', 'r1')
  createNotification('u0', 'new_review', '新的审查请求', '李四邀请您审查「用户列表分页功能」', 'r2')
  createNotification('u3', 'new_review', '新的审查请求', '李四邀请您审查「用户列表分页功能」', 'r2')
  createNotification('u1', 'proposal', '修改提案', '张三在「用户列表分页功能」中提交了代码修改提案', 'r2')
}

router.get('/users', async (req: Request, res: Response) => {
  await randomDelay()
  const users = Array.from(stores.users.values())
  res.json(successResponse(users))
})

router.get('/reviews', async (req: Request, res: Response) => {
  await randomDelay()
  const reviews = Array.from(stores.reviews.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  res.json(successResponse(reviews))
})

router.get('/reviews/:id', async (req: Request, res: Response) => {
  await randomDelay()
  const { id } = req.params
  const review = stores.reviews.get(id)
  if (!review) {
    res.status(404).json(errorResponse('审查请求不存在'))
    return
  }
  res.json(successResponse(review))
})

router.post('/reviews', async (req: Request, res: Response) => {
  await randomDelay()
  const { title, reviewerIds, code, description, deadline, creatorId } = req.body

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    res.status(400).json(errorResponse('标题不能为空'))
    return
  }
  if (!reviewerIds || !Array.isArray(reviewerIds) || reviewerIds.length === 0) {
    res.status(400).json(errorResponse('请至少选择一位审查者'))
    return
  }
  if (!code || typeof code !== 'object') {
    res.status(400).json(errorResponse('请提供代码内容'))
    return
  }
  if (!code.filename || !code.oldCode || !code.newCode || !code.language) {
    res.status(400).json(errorResponse('代码信息不完整'))
    return
  }

  const creator = stores.users.get(creatorId || 'u1')
  if (!creator) {
    res.status(400).json(errorResponse('创建者不存在'))
    return
  }

  const reviewers = reviewerIds
    .map((id: string) => stores.users.get(id))
    .filter(Boolean) as User[]

  if (reviewers.length === 0) {
    res.status(400).json(errorResponse('未找到有效的审查者'))
    return
  }

  const now = new Date().toISOString()
  const review: Review = {
    id: uuidv4(),
    title: title.trim(),
    description: description || '',
    creator,
    reviewers,
    codeSnippet: {
      filename: code.filename,
      oldCode: Array.isArray(code.oldCode) ? code.oldCode : code.oldCode.split('\n'),
      newCode: Array.isArray(code.newCode) ? code.newCode : code.newCode.split('\n'),
      language: code.language,
    },
    status: 'pending',
    deadline: deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: now,
    updatedAt: now,
  }

  stores.reviews.set(review.id, review)
  createActivity('review_created', creator, review.id, review.title, '创建了审查请求')
  reviewers.forEach(r => {
    createNotification(r.id, 'new_review', '新的审查请求', `${creator.name}邀请您审查「${review.title}」`, review.id)
  })

  res.status(201).json(successResponse(review))
})

router.put('/reviews/:id/status', async (req: Request, res: Response) => {
  await randomDelay()
  const { id } = req.params
  const { status, userId } = req.body

  const validStatuses: ReviewStatus[] = ['pending', 'approved', 'changes_required']
  if (!status || !validStatuses.includes(status as ReviewStatus)) {
    res.status(400).json(errorResponse('无效的状态值'))
    return
  }

  const review = stores.reviews.get(id)
  if (!review) {
    res.status(404).json(errorResponse('审查请求不存在'))
    return
  }

  const operator = stores.users.get(userId || 'u1')
  if (!operator) {
    res.status(400).json(errorResponse('操作用户不存在'))
    return
  }

  review.status = status as ReviewStatus
  review.updatedAt = new Date().toISOString()
  stores.reviews.set(review.id, review)

  const statusText = status === 'pending' ? '待处理' : status === 'approved' ? '已通过' : '需修改'
  createActivity('status_change', operator, review.id, review.title, `更新状态为${statusText}`)

  const allParticipants = [review.creator, ...review.reviewers]
  const uniqueParticipants = Array.from(new Map(allParticipants.map(p => [p.id, p])).values())
  uniqueParticipants.forEach(p => {
    if (p.id !== operator.id) {
      createNotification(p.id, 'status_change', '状态更新', `${operator.name}将「${review.title}」状态更新为${statusText}`, review.id)
    }
  })

  res.json(successResponse(review))
})

router.get('/reviews/:id/comments', async (req: Request, res: Response) => {
  await randomDelay()
  const { id } = req.params

  const review = stores.reviews.get(id)
  if (!review) {
    res.status(404).json(errorResponse('审查请求不存在'))
    return
  }

  const comments = Array.from(stores.comments.values())
    .filter(c => c.reviewId === id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  res.json(successResponse(comments))
})

router.post('/reviews/:id/comments', async (req: Request, res: Response) => {
  await randomDelay()
  const { id } = req.params
  const { content, lineNumber, authorId, proposedChange } = req.body

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    res.status(400).json(errorResponse('评论内容不能为空'))
    return
  }
  if (typeof lineNumber !== 'number' || lineNumber < 0) {
    res.status(400).json(errorResponse('无效的行号'))
    return
  }

  const review = stores.reviews.get(id)
  if (!review) {
    res.status(404).json(errorResponse('审查请求不存在'))
    return
  }

  const author = stores.users.get(authorId || 'u1')
  if (!author) {
    res.status(400).json(errorResponse('评论作者不存在'))
    return
  }

  const comment: Comment = {
    id: uuidv4(),
    reviewId: id,
    lineNumber,
    author,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    proposedChange: proposedChange || undefined,
  }

  stores.comments.set(comment.id, comment)

  const activityType = proposedChange ? 'proposal' : 'comment'
  const activityDesc = proposedChange ? '提交了代码修改提案' : '添加了评论'
  createActivity(activityType, author, review.id, review.title, activityDesc)

  const allParticipants = [review.creator, ...review.reviewers]
  const uniqueParticipants = Array.from(new Map(allParticipants.map(p => [p.id, p])).values())
  uniqueParticipants.forEach(p => {
    if (p.id !== author.id) {
      createNotification(p.id, proposedChange ? 'proposal' as const : 'new_comment' as const, proposedChange ? '修改提案' : '新评论', `${author.name}在「${review.title}」中${activityDesc}`, review.id)
    }
  })

  res.status(201).json(successResponse(comment))
})

router.post('/comments/:id/reply', async (req: Request, res: Response) => {
  await randomDelay()
  const { id } = req.params
  const { content, authorId } = req.body

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    res.status(400).json(errorResponse('回复内容不能为空'))
    return
  }

  const parentComment = stores.comments.get(id)
  if (!parentComment) {
    res.status(404).json(errorResponse('评论不存在'))
    return
  }

  const author = stores.users.get(authorId || 'u1')
  if (!author) {
    res.status(400).json(errorResponse('回复作者不存在'))
    return
  }

  const reply: Comment = {
    id: uuidv4(),
    reviewId: parentComment.reviewId,
    lineNumber: 0,
    author,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  }

  stores.comments.set(reply.id, reply)

  if (!parentComment.replies) {
    parentComment.replies = []
  }
  parentComment.replies.push(reply)
  stores.comments.set(parentComment.id, parentComment)

  const review = stores.reviews.get(parentComment.reviewId)
  if (review) {
    createActivity('comment', author, review.id, review.title, '回复了评论')

    const notifyUsers = [parentComment.author]
    const uniqueNotify = Array.from(new Map(notifyUsers.map(p => [p.id, p])).values())
    uniqueNotify.forEach(p => {
      if (p.id !== author.id) {
        createNotification(p.id, 'reply', '新回复', `${author.name}回复了您在「${review.title}」中的评论`, review.id)
      }
    })
  }

  res.status(201).json(successResponse(reply))
})

router.get('/notifications/:userId', async (req: Request, res: Response) => {
  await randomDelay()
  const { userId } = req.params

  const notifications = Array.from(stores.notifications.values())
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  res.json(successResponse(notifications))
})

router.get('/activities', async (req: Request, res: Response) => {
  await randomDelay()
  const activities = Array.from(stores.activities.values())
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 50)

  res.json(successResponse(activities))
})

router.get('/stats/comments/:userId', async (req: Request, res: Response) => {
  await randomDelay()
  const { userId } = req.params

  const user = stores.users.get(userId)
  if (!user) {
    res.status(404).json(errorResponse('用户不存在'))
    return
  }

  const userComments = Array.from(stores.comments.values())
    .filter(c => c.author.id === userId)

  const stats: { project: string; count: number }[] = []
  const reviewMap = new Map<string, number>()

  userComments.forEach(comment => {
    const review = stores.reviews.get(comment.reviewId)
    if (review) {
      const current = reviewMap.get(review.title) || 0
      reviewMap.set(review.title, current + 1)
    }
  })

  reviewMap.forEach((count, project) => {
    stats.push({ project, count })
  })

  stats.sort((a, b) => b.count - a.count)

  res.json(successResponse(stats))
})

initMockData()

export { router, stores }
