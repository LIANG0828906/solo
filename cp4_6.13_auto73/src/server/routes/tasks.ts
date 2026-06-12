import { Router, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db, {
  getTasks,
  getTaskById,
  insertTask,
  updateTaskStatus,
  updateTaskAcceptedUser,
  updateTaskRating,
  insertTaskApplication,
  getTaskApplicationsByTaskId,
  updateTaskApplicationStatus,
  updateUserPoints,
  updateUserReputation,
  insertTransaction,
  getUserById
} from '../db.js'
import { authMiddleware, type AuthRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tasks = getTasks.all()

    const formattedTasks = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      points: task.points,
      deadline: task.deadline,
      status: task.status,
      rating: task.rating,
      created_at: task.created_at,
      publisher: {
        id: task.publisher_id,
        username: task.publisher_username,
        avatar: task.publisher_avatar
      }
    }))

    res.json({
      success: true,
      data: formattedTasks
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取任务列表失败'
    })
  }
})

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, points, deadline } = req.body
    const userId = req.user!.id

    if (!title || !points || !deadline) {
      res.status(400).json({
        success: false,
        error: '任务名称、积分和截止时间不能为空'
      })
      return
    }

    if (points < 1) {
      res.status(400).json({
        success: false,
        error: '积分数值必须大于0'
      })
      return
    }

    const user = getUserById(userId)!
    if (user.points < points) {
      res.status(400).json({
        success: false,
        error: '积分不足，无法发布任务'
      })
      return
    }

    const taskId = uuidv4()

    const insertResult = insertTask.run(taskId, title, description, points, deadline, userId)
    if (insertResult.changes === 0) {
      res.status(500).json({
        success: false,
        error: '发布任务失败'
      })
      return
    }

    res.status(201).json({
      success: true,
      data: {
        taskId
      },
      message: '发布任务成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '发布任务失败'
    })
  }
})

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const task = getTaskById.get(id)

    if (!task) {
      res.status(404).json({
        success: false,
        error: '任务不存在'
      })
      return
    }

    const applications = getTaskApplicationsByTaskId.all(id)

    const formattedApplications = applications.map(app => ({
      id: app.id,
      task_id: app.task_id,
      message: app.message,
      status: app.status,
      created_at: app.created_at,
      user: {
        id: app.user_id,
        username: app.user_username,
        avatar: app.user_avatar
      }
    }))

    const formattedTask = {
      id: task.id,
      title: task.title,
      description: task.description,
      points: task.points,
      deadline: task.deadline,
      status: task.status,
      rating: task.rating,
      created_at: task.created_at,
      publisher: {
        id: task.publisher_id,
        username: task.publisher_username,
        avatar: task.publisher_avatar
      },
      accepted_user: task.accepted_user_id ? {
        id: task.accepted_user_id,
        username: task.accepted_username,
        avatar: task.accepted_avatar
      } : undefined,
      applications: formattedApplications
    }

    res.json({
      success: true,
      data: formattedTask
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取任务详情失败'
    })
  }
})

router.post('/:id/apply', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const { message } = req.body

    const task = getTaskById.get(id)
    if (!task) {
      res.status(404).json({
        success: false,
        error: '任务不存在'
      })
      return
    }

    if (task.status !== 'open') {
      res.status(400).json({
        success: false,
        error: '任务已关闭或已被接单'
      })
      return
    }

    if (task.publisher_id === userId) {
      res.status(400).json({
        success: false,
        error: '不能申请自己发布的任务'
      })
      return
    }

    const applicationId = uuidv4()

    try {
      insertTaskApplication.run(applicationId, id, userId, message)
    } catch (error) {
      res.status(400).json({
        success: false,
        error: '您已申请过此任务'
      })
      return
    }

    res.status(201).json({
      success: true,
      data: {
        applicationId
      },
      message: '申请成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '申请失败'
    })
  }
})

router.post('/:id/confirm', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const userId = req.user!.id
    const { applicationId } = req.body

    const task = getTaskById.get(id)
    if (!task) {
      res.status(404).json({
        success: false,
        error: '任务不存在'
      })
      return
    }

    if (task.publisher_id !== userId) {
      res.status(403).json({
        success: false,
        error: '只有任务发布者才能确认接单'
      })
      return
    }

    if (task.status !== 'open') {
      res.status(400).json({
        success: false,
        error: '任务已关闭或已被接单'
      })
      return
    }

    const applications = getTaskApplicationsByTaskId.all(id)
    const application = applications.find(app => app.id === applicationId)

    if (!application) {
      res.status(404).json({
        success: false,
        error: '申请不存在'
      })
      return
    }

    const updateResult = updateTaskAcceptedUser.run(application.user_id, 'accepted', id)
    if (updateResult.changes === 0) {
      res.status(500).json({
        success: false,
        error: '确认接单失败'
      })
      return
    }

    for (const app of applications) {
      if (app.id === applicationId) {
        updateTaskApplicationStatus.run('accepted', app.id)
      } else {
        updateTaskApplicationStatus.run('rejected', app.id)
      }
    }

    res.json({
      success: true,
      message: '确认接单成功'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '确认接单失败'
    })
  }
})

router.post('/:id/complete', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const transaction = db.transaction(() => {
    const { id } = req.params
    const userId = req.user!.id
    const { rating } = req.body

    const task = getTaskById.get(id)
    if (!task) {
      res.status(404).json({
        success: false,
        error: '任务不存在'
      })
      return
    }

    if (task.publisher_id !== userId) {
      res.status(403).json({
        success: false,
        error: '只有任务发布者才能完成任务'
      })
      return
    }

    if (task.status !== 'accepted') {
      res.status(400).json({
        success: false,
        error: '任务未被接单，无法完成'
      })
      return
    }

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({
        success: false,
        error: '评分必须在1-5之间'
      })
      return
    }

    updateTaskStatus.run('completed', id)
    updateTaskRating.run(rating, id)

    const publisher = getUserById(task.publisher_id)!
    const acceptedUser = getUserById(task.accepted_user_id!)!

    if (publisher.points >= task.points) {
      updateUserPoints.run(-task.points, task.publisher_id)
      updateUserPoints.run(task.points, task.accepted_user_id!)

      const transactionId1 = uuidv4()
      insertTransaction.run(
        transactionId1,
        'task_payment',
        task.publisher_id,
        id,
        -task.points,
        `支付任务：${task.title}`
      )

      const transactionId2 = uuidv4()
      insertTransaction.run(
        transactionId2,
        'task_income',
        task.accepted_user_id!,
        id,
        task.points,
        `完成任务：${task.title}`
      )
    }

    const reputationChange = rating >= 4 ? 5 : rating <= 2 ? -5 : 0
    if (reputationChange !== 0) {
      updateUserReputation.run(reputationChange, task.accepted_user_id!)
    }

    res.json({
      success: true,
      message: '任务完成，积分已结算'
    })
  })

  try {
    transaction()
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '完成任务失败'
    })
  }
})

export default router
