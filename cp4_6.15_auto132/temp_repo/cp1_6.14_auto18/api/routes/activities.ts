import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import type { Activity, Member, CheckIn, ReadingStatus } from '../../src/shared/types.js'
import {
  generateInviteCode,
  isDateInRange,
  generateReportData,
} from '../../src/core/activityLogic.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, '../../')
const DATA_FILE = path.join(PROJECT_ROOT, 'data', 'activities.json')
const UPLOAD_DIR = path.join(PROJECT_ROOT, 'uploads')

const router = Router()

const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5000

let fileLock = false
const writeQueue: Array<() => Promise<void>> = []

async function acquireLock(): Promise<void> {
  while (fileLock) {
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  fileLock = true
}

function releaseLock(): void {
  fileLock = false
  if (writeQueue.length > 0) {
    const next = writeQueue.shift()
    if (next) next()
  }
}

async function readActivities(): Promise<Activity[]> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8')
    const json = JSON.parse(data)
    return json.activities || []
  } catch {
    return []
  }
}

async function writeActivities(activities: Activity[]): Promise<void> {
  await acquireLock()
  try {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
    await fs.writeFile(DATA_FILE, JSON.stringify({ activities }, null, 2), 'utf-8')
  } finally {
    releaseLock()
  }
}

function getCacheKey(prefix: string, params: Record<string, any>): string {
  return `${prefix}:${JSON.stringify(params)}`
}

function getFromCache(key: string): any | null {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  cache.delete(key)
  return null
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() })
}

function clearCache(): void {
  cache.clear()
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${uuidv4()}${ext}`)
  },
})

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    if (extname && mimetype) {
      cb(null, true)
    } else {
      cb(new Error('只允许上传 JPG 或 PNG 格式的图片'))
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
})

async function ensureUploadDir(): Promise<void> {
  try {
    await fs.access(UPLOAD_DIR)
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
  }
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now()
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const userId = req.query.userId as string | undefined

    const cacheKey = getCacheKey('activities', { page, limit, userId })
    const cached = getFromCache(cacheKey)
    if (cached) {
      const elapsed = Date.now() - startTime
      console.log(`[API] ${req.method} ${req.originalUrl} - ${elapsed}ms (cache)`)
      res.status(200).json(cached)
      return
    }

    let activities = await readActivities()
    if (userId) {
      activities = activities.filter((a) => a.organizerId === userId || a.members.some((m) => m.id === userId))
    }

    const total = activities.length
    const start = (page - 1) * limit
    const paginated = activities.slice(start, start + limit)

    const result = {
      success: true,
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }

    setCache(cacheKey, result)
    const elapsed = Date.now() - startTime
    console.log(`[API] ${req.method} ${req.originalUrl} - ${elapsed}ms`)
    res.status(200).json(result)
  } catch (error) {
    const elapsed = Date.now() - startTime
    console.log(`[API] ${req.method} ${req.originalUrl} - ${elapsed}ms`)
    res.status(500).json({ success: false, error: '获取活动列表失败' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, bookTitle, bookAuthor, startDate, endDate, description, organizerId, coverImage } = req.body

    if (!title || !bookTitle || !bookAuthor || !startDate || !endDate || !organizerId) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const activities = await readActivities()
    const newActivity: Activity = {
      id: uuidv4(),
      title,
      bookTitle,
      bookAuthor,
      coverImage: coverImage || '',
      startDate,
      endDate,
      description: description || '',
      inviteCode: generateInviteCode(),
      organizerId,
      ended: false,
      members: [],
      checkIns: [],
      createdAt: new Date().toISOString(),
    }

    activities.push(newActivity)
    await writeActivities(activities)
    clearCache()

    res.status(201).json({ success: true, data: newActivity })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建活动失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const activities = await readActivities()
    const activity = activities.find((a) => a.id === id)

    if (!activity) {
      res.status(404).json({ success: false, error: '活动不存在' })
      return
    }

    res.status(200).json({ success: true, data: activity })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取活动详情失败' })
  }
})

router.post('/:id/join', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { inviteCode, memberName, memberId, memberAvatar } = req.body

    if (!inviteCode || !memberName || !memberId) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const activities = await readActivities()
    const activityIndex = activities.findIndex((a) => a.id === id)

    if (activityIndex === -1) {
      res.status(404).json({ success: false, error: '活动不存在' })
      return
    }

    const activity = activities[activityIndex]

    if (activity.inviteCode !== inviteCode) {
      res.status(400).json({ success: false, error: '邀请码错误' })
      return
    }

    if (activity.members.some((m) => m.id === memberId)) {
      res.status(400).json({ success: false, error: '已经加入该活动' })
      return
    }

    const newMember: Member = {
      id: memberId,
      name: memberName,
      avatar: memberAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${memberId}`,
      joinedAt: new Date().toISOString(),
    }

    activity.members.push(newMember)
    activities[activityIndex] = activity
    await writeActivities(activities)
    clearCache()

    res.status(200).json({ success: true, data: newMember })
  } catch (error) {
    res.status(500).json({ success: false, error: '加入活动失败' })
  }
})

router.post('/:id/checkin', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { memberId, date, pagesRead, status, note } = req.body

    if (!memberId || !date || pagesRead === undefined || !status) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const activities = await readActivities()
    const activityIndex = activities.findIndex((a) => a.id === id)

    if (activityIndex === -1) {
      res.status(404).json({ success: false, error: '活动不存在' })
      return
    }

    const activity = activities[activityIndex]

    if (!activity.members.some((m) => m.id === memberId)) {
      res.status(400).json({ success: false, error: '未加入该活动' })
      return
    }

    if (!isDateInRange(date, activity.startDate, activity.endDate)) {
      res.status(400).json({ success: false, error: '打卡日期不在活动周期内' })
      return
    }

    const existingIndex = activity.checkIns.findIndex((c) => c.memberId === memberId && c.date === date)
    if (existingIndex !== -1) {
      res.status(400).json({ success: false, error: '该日期已打卡' })
      return
    }

    const newCheckIn: CheckIn = {
      id: uuidv4(),
      memberId,
      date,
      pagesRead,
      status,
      note,
      createdAt: new Date().toISOString(),
    }

    activity.checkIns.push(newCheckIn)
    activities[activityIndex] = activity
    await writeActivities(activities)
    clearCache()

    res.status(201).json({ success: true, data: newCheckIn })
  } catch (error) {
    res.status(500).json({ success: false, error: '打卡失败' })
  }
})

router.get('/:id/checkins', async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now()
  try {
    const { id } = req.params
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const memberId = req.query.memberId as string | undefined

    const cacheKey = getCacheKey('checkins', { id, page, limit, memberId })
    const cached = getFromCache(cacheKey)
    if (cached) {
      const elapsed = Date.now() - startTime
      console.log(`[API] ${req.method} ${req.originalUrl} - ${elapsed}ms (cache)`)
      res.status(200).json(cached)
      return
    }

    const activities = await readActivities()
    const activity = activities.find((a) => a.id === id)

    if (!activity) {
      const elapsed = Date.now() - startTime
      console.log(`[API] ${req.method} ${req.originalUrl} - ${elapsed}ms`)
      res.status(404).json({ success: false, error: '活动不存在' })
      return
    }

    let checkIns = [...activity.checkIns]
    if (memberId) {
      checkIns = checkIns.filter((c) => c.memberId === memberId)
    }

    checkIns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const total = checkIns.length
    const start = (page - 1) * limit
    const paginated = checkIns.slice(start, start + limit)

    const result = {
      success: true,
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }

    setCache(cacheKey, result)
    const elapsed = Date.now() - startTime
    console.log(`[API] ${req.method} ${req.originalUrl} - ${elapsed}ms`)
    res.status(200).json(result)
  } catch (error) {
    const elapsed = Date.now() - startTime
    console.log(`[API] ${req.method} ${req.originalUrl} - ${elapsed}ms`)
    res.status(500).json({ success: false, error: '获取打卡列表失败' })
  }
})

router.post('/:id/cover', upload.single('cover'), async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureUploadDir()

    if (!req.file) {
      res.status(400).json({ success: false, error: '未上传文件' })
      return
    }

    const { id } = req.params
    const ext = path.extname(req.file.filename).toLowerCase()
    const outputFilename = `${uuidv4()}${ext}`
    const outputPath = path.join(UPLOAD_DIR, outputFilename)

    let sharpPipeline = sharp(req.file.path).resize(200, 300, { fit: 'cover' })

    if (ext === '.png') {
      sharpPipeline = sharpPipeline.png({ compressionLevel: 8 })
    } else {
      sharpPipeline = sharpPipeline.jpeg({ quality: 80 })
    }

    await sharpPipeline.toFile(outputPath)

    try {
      await fs.unlink(req.file.path)
    } catch {
      // ignore
    }

    const activities = await readActivities()
    const activityIndex = activities.findIndex((a) => a.id === id)

    if (activityIndex === -1) {
      res.status(404).json({ success: false, error: '活动不存在' })
      return
    }

    activities[activityIndex].coverImage = `/uploads/${outputFilename}`
    await writeActivities(activities)
    clearCache()

    res.status(200).json({ success: true, data: { coverImage: `/uploads/${outputFilename}` } })
  } catch (error: any) {
    if (req.file) {
      try {
        await fs.unlink(req.file.path)
      } catch {
        // ignore
      }
    }
    if (error.message && error.message.includes('只允许上传')) {
      res.status(400).json({ success: false, error: error.message })
    } else {
      res.status(500).json({ success: false, error: '上传封面失败' })
    }
  }
})

router.get('/:id/report', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const activities = await readActivities()
    const activity = activities.find((a) => a.id === id)

    if (!activity) {
      res.status(404).json({ success: false, error: '活动不存在' })
      return
    }

    const report = generateReportData(activity)
    res.status(200).json({ success: true, data: report })
  } catch (error) {
    res.status(500).json({ success: false, error: '生成报告失败' })
  }
})

router.get('/:id/report/export', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const activities = await readActivities()
    const activity = activities.find((a) => a.id === id)

    if (!activity) {
      res.status(404).json({ success: false, error: '活动不存在' })
      return
    }

    const report = generateReportData(activity)

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${activity.title} - 活动报告</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif; background: #f5f7fa; color: #333; padding: 40px 20px; }
    .container { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 40px; }
    .header h1 { font-size: 28px; margin-bottom: 12px; }
    .header .book-info { font-size: 16px; opacity: 0.9; margin-bottom: 8px; }
    .header .date-range { font-size: 14px; opacity: 0.8; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 40px; }
    .stat-card { background: #f8f9ff; border-radius: 12px; padding: 24px; text-align: center; }
    .stat-card .value { font-size: 36px; font-weight: 700; color: #667eea; }
    .stat-card .label { font-size: 14px; color: #666; margin-top: 8px; }
    .members-section { padding: 0 40px 40px; }
    .members-section h2 { font-size: 20px; margin-bottom: 20px; color: #333; }
    .member-row { display: flex; align-items: center; padding: 16px 20px; background: #f8f9ff; border-radius: 10px; margin-bottom: 12px; }
    .member-avatar { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 16px; margin-right: 16px; flex-shrink: 0; }
    .member-info { flex: 1; }
    .member-name { font-size: 16px; font-weight: 600; color: #333; margin-bottom: 6px; }
    .member-stats { display: flex; gap: 20px; font-size: 13px; color: #666; }
    .progress-bar { flex: 1; margin-left: 20px; background: #e9ecef; height: 8px; border-radius: 4px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); border-radius: 4px; }
    .progress-text { font-size: 14px; font-weight: 600; color: #667eea; margin-left: 12px; min-width: 50px; text-align: right; }
    .footer { text-align: center; padding: 24px; color: #999; font-size: 13px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${activity.title}</h1>
      <div class="book-info">《${activity.bookTitle}》 - ${activity.bookAuthor}</div>
      <div class="date-range">活动周期：${activity.startDate} 至 ${activity.endDate}</div>
    </div>
    <div class="stats">
      <div class="stat-card">
        <div class="value">${report.totalDays}</div>
        <div class="label">活动总天数</div>
      </div>
      <div class="stat-card">
        <div class="value">${report.totalPages}</div>
        <div class="label">累计阅读页数</div>
      </div>
      <div class="stat-card">
        <div class="value">${report.longestStreak}</div>
        <div class="label">最长连续打卡天数</div>
      </div>
    </div>
    <div class="members-section">
      <h2>成员完成情况</h2>
      ${report.memberCompletionRates.map((m) => `
        <div class="member-row">
          <div class="member-avatar">${m.memberName.charAt(0)}</div>
          <div class="member-info">
            <div class="member-name">${m.memberName}</div>
            <div class="member-stats">
              <span>累计阅读 ${m.totalPages} 页</span>
            </div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${m.completionRate}%"></div>
          </div>
          <div class="progress-text">${m.completionRate}%</div>
        </div>
      `).join('')}
    </div>
    <div class="footer">
      报告生成时间：${new Date().toLocaleString('zh-CN')}
    </div>
  </div>
</body>
</html>`

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="report-${id}.html"`)
    res.status(200).send(html)
  } catch (error) {
    res.status(500).json({ success: false, error: '导出报告失败' })
  }
})

export default router
