import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'

// ==================== 类型定义 ====================

// 简历数据类型（与前端 ResumeData 对应）
interface PersonalInfo {
  name: string
  title: string
  email: string
  phone: string
  location: string
  summary: string
  avatar?: string
}

interface WorkExperience {
  id: string
  company: string
  position: string
  startDate: string
  endDate: string
  description: string
  achievements: string[]
}

interface Education {
  id: string
  school: string
  degree: string
  major: string
  startDate: string
  endDate: string
  description: string
}

interface Skill {
  id: string
  name: string
  level: number
  category: string
}

interface Project {
  id: string
  name: string
  role: string
  startDate: string
  endDate: string
  description: string
  technologies: string[]
  highlights: string[]
}

interface ResumeData {
  personal: PersonalInfo
  work: WorkExperience[]
  education: Education[]
  skills: Skill[]
  projects: Project[]
}

// 简历实体类型（存储在 Map 中）
interface ResumeEntity {
  id: string
  hash: string
  data: ResumeData
  theme: string
  moduleOrder: string[]
  createdAt: string
  updatedAt: string
}

// ==================== 数据存储 ====================

// 使用内存 Map 存储简历数据
// key: 简历 id
const resumesById = new Map<string, ResumeEntity>()

// key: 简历 hash
const resumesByHash = new Map<string, ResumeEntity>()

// ==================== Express 应用初始化 ====================

const app = express()
const PORT = 3001

// 使用 CORS 中间件（允许所有来源用于开发）
app.use(cors())

// 使用 express.json() 解析 JSON 请求体
app.use(express.json({ limit: '10mb' }))

// ==================== API 接口 ====================

/**
 * 健康检查接口
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

/**
 * 创建新简历
 * POST /api/resumes
 * 请求体：{ data: ResumeData, theme: string, moduleOrder: string[] }
 */
app.post('/api/resumes', (req: Request, res: Response) => {
  const { data, theme, moduleOrder } = req.body

  // 生成 id 和 hash
  const id = uuidv4()
  const hash = uuidv4().slice(0, 8)

  const now = new Date().toISOString()

  const resume: ResumeEntity = {
    id,
    hash,
    data,
    theme,
    moduleOrder,
    createdAt: now,
    updatedAt: now,
  }

  // 存储到两个 Map 中
  resumesById.set(id, resume)
  resumesByHash.set(hash, resume)

  res.status(201).json({
    id,
    hash,
    data,
    theme,
    moduleOrder,
    createdAt: now,
    updatedAt: now,
  })
})

/**
 * 根据 hash 获取简历
 * GET /api/resumes/:hash
 */
app.get('/api/resumes/:hash', (req: Request, res: Response) => {
  const { hash } = req.params
  const resume = resumesByHash.get(hash)

  if (!resume) {
    res.status(404).json({ error: '简历不存在' })
    return
  }

  res.json({
    id: resume.id,
    hash: resume.hash,
    data: resume.data,
    theme: resume.theme,
    moduleOrder: resume.moduleOrder,
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
  })
})

/**
 * 更新简历
 * PUT /api/resumes/:id
 * 请求体：{ data, theme, moduleOrder }
 */
app.put('/api/resumes/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const { data, theme, moduleOrder } = req.body

  const resume = resumesById.get(id)

  if (!resume) {
    res.status(404).json({ error: '简历不存在' })
    return
  }

  // 更新简历数据
  const updatedResume: ResumeEntity = {
    ...resume,
    data: data ?? resume.data,
    theme: theme ?? resume.theme,
    moduleOrder: moduleOrder ?? resume.moduleOrder,
    updatedAt: new Date().toISOString(),
  }

  resumesById.set(id, updatedResume)
  resumesByHash.set(resume.hash, updatedResume)

  res.json({
    id: updatedResume.id,
    hash: updatedResume.hash,
    data: updatedResume.data,
    theme: updatedResume.theme,
    moduleOrder: updatedResume.moduleOrder,
    createdAt: updatedResume.createdAt,
    updatedAt: updatedResume.updatedAt,
  })
})

/**
 * 删除简历
 * DELETE /api/resumes/:id
 */
app.delete('/api/resumes/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const resume = resumesById.get(id)

  if (!resume) {
    res.status(404).json({ error: '简历不存在' })
    return
  }

  // 从两个 Map 中删除
  resumesById.delete(id)
  resumesByHash.delete(resume.hash)

  res.json({ success: true, message: '删除成功' })
})

/**
 * 生成分享链接
 * POST /api/resumes/share
 * 请求体：{ resume: { data, theme, moduleOrder }, id?: string }
 * 如果已存在 id 则更新，否则创建
 */
app.post('/api/resumes/share', (req: Request, res: Response) => {
  const { resume: resumeData, id } = req.body
  const { data, theme, moduleOrder } = resumeData

  let resume: ResumeEntity

  if (id && resumesById.has(id)) {
    // 如果 id 存在，更新简历
    const existingResume = resumesById.get(id)!
    resume = {
      ...existingResume,
      data,
      theme,
      moduleOrder,
      updatedAt: new Date().toISOString(),
    }
    resumesById.set(id, resume)
    resumesByHash.set(resume.hash, resume)
  } else {
    // 否则创建新简历
    const newId = uuidv4()
    const hash = uuidv4().slice(0, 8)
    const now = new Date().toISOString()

    resume = {
      id: newId,
      hash,
      data,
      theme,
      moduleOrder,
      createdAt: now,
      updatedAt: now,
    }

    resumesById.set(newId, resume)
    resumesByHash.set(hash, resume)
  }

  res.json({
    success: true,
    shareUrl: `/share/${resume.hash}`,
  })
})

// ==================== 错误处理中间件 ====================

// 404 处理
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: '接口不存在' })
})

// 错误处理中间件
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('服务器错误:', err)
  res.status(500).json({ error: '服务器内部错误' })
})

// ==================== 启动服务器 ====================

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
