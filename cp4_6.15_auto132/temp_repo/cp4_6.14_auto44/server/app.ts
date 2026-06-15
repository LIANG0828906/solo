/**
 * 线框图生成器 API 服务器
 */

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
import type {
  UserStory,
  WireframePage,
  WireframeElement,
  PageType,
  ElementType,
  ParseStoryRequest,
  ParseStoryResponse,
  SaveLayoutRequest,
  SaveLayoutResponse,
} from '../src/types/index.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 内存存储
const layoutStore = new Map<string, WireframeElement[]>()

// 解析模式
const STORY_PATTERNS = [
  /作为[一|名|个](?<role>[^，,]+?)[，,]\s*我希望(?:能够|可以|想|要)(?<action>[^，,。.!！]+?)[，,。.!！]*(?:以(?:便|以|为了)(?<expected>[^。.!！]+)?/u,
  /As\s+an?\s+(?<role>[^,]+?),?\s*I\s+want\s+(?<action>[^.,!?]+?)[.,!?]*(?:so\s+that\s+(?<expected>[^.!?]+)?/i,
]

const FEATURE_KEYWORDS: Record<string, string[]> = {
  login: ['登录', 'login', 'signin', 'sign in', '登录系统', '访问系统'],
  home: ['首页', 'home', '仪表盘', 'dashboard', '概览', 'overview'],
  settings: ['设置', 'settings', 'profile', '个人资料', '修改资料', '用户权限'],
  list: ['列表', 'list', '记录', 'records', '历史', 'history', 'activity'],
  detail: ['详情', 'detail', '查看', 'view', '管理', 'manage'],
}

const PAGE_TITLES: Record<PageType, string> = {
  home: '首页',
  login: '登录页',
  settings: '设置页',
  list: '列表页',
  detail: '详情页',
}

function generateId(): string {
  return uuidv4()
}

function detectPageType(action: string, expected: string): PageType {
  const text = `${action} ${expected}`.toLowerCase()

  for (const [type, keywords] of Object.entries(FEATURE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return type as PageType
      }
    }
  }

  return 'home'
}

function extractFeaturePoints(action: string, expected: string): string[] {
  const points: string[] = []

  if (/登录|login|signin/i.test(action)) points.push('用户认证')
  if (/密码|password/i.test(action)) points.push('密码管理')
  if (/邮箱|email/i.test(action)) points.push('邮箱验证')
  if (/重置|reset/i.test(action)) points.push('密码重置')
  if (/仪表盘|dashboard|概览|overview/i.test(action)) points.push('数据展示')
  if (/记录|record|历史|history/i.test(action)) points.push('历史记录')
  if (/个人资料|profile/i.test(action)) points.push('个人信息')
  if (/权限|permission|role/i.test(action)) points.push('权限管理')
  if (/管理|manage/i.test(action)) points.push('管理功能')
  if (/查看|view|浏览|browse/i.test(action)) points.push('信息浏览')

  if (points.length === 0) {
    points.push('核心功能')
  }

  return points
}

function generatePageElements(
  type: PageType,
  featurePoints: string[]
): WireframeElement[] {
  const elements: WireframeElement[] = []

  elements.push({
    id: generateId(),
    type: 'nav',
    x: 0,
    y: 0,
    width: 100,
    height: 12,
    label: PAGE_TITLES[type],
  })

  elements.push({
    id: generateId(),
    type: 'title',
    x: 5,
    y: 16,
    width: 60,
    height: 10,
    label: PAGE_TITLES[type],
  })

  if (type === 'login') {
    elements.push(
      { id: generateId(), type: 'input', x: 20, y: 32, width: 60, height: 12, label: '邮箱输入' },
      { id: generateId(), type: 'input', x: 20, y: 47, width: 60, height: 12, label: '密码输入' },
      { id: generateId(), type: 'button', x: 20, y: 64, width: 60, height: 12, label: '登录按钮' },
      { id: generateId(), type: 'text', x: 20, y: 82, width: 60, height: 8, label: '忘记密码？' }
    )
  } else if (type === 'home') {
    elements.push(
      { id: generateId(), type: 'text', x: 5, y: 32, width: 42, height: 22, label: '统计卡片1' },
      { id: generateId(), type: 'text', x: 53, y: 32, width: 42, height: 22, label: '统计卡片2' },
      { id: generateId(), type: 'text', x: 5, y: 60, width: 90, height: 18, label: '活动列表' },
      { id: generateId(), type: 'button', x: 5, y: 82, width: 30, height: 12, label: '查看更多' }
    )
  } else if (type === 'settings') {
    elements.push(
      { id: generateId(), type: 'input', x: 20, y: 32, width: 60, height: 12, label: '用户名' },
      { id: generateId(), type: 'input', x: 20, y: 47, width: 60, height: 12, label: '邮箱' },
      { id: generateId(), type: 'button', x: 20, y: 64, width: 60, height: 12, label: '保存修改' },
      { id: generateId(), type: 'text', x: 20, y: 82, width: 60, height: 8, label: '通知设置' }
    )
  } else if (type === 'list') {
    elements.push(
      { id: generateId(), type: 'text', x: 5, y: 32, width: 90, height: 9, label: '列表项1' },
      { id: generateId(), type: 'text', x: 5, y: 44, width: 90, height: 9, label: '列表项2' },
      { id: generateId(), type: 'text', x: 5, y: 56, width: 90, height: 9, label: '列表项3' },
      { id: generateId(), type: 'button', x: 5, y: 74, width: 25, height: 12, label: '新建' }
    )
  } else {
    elements.push(
      { id: generateId(), type: 'text', x: 5, y: 32, width: 90, height: 28, label: '详情内容' },
      { id: generateId(), type: 'button', x: 5, y: 66, width: 25, height: 12, label: '编辑' },
      { id: generateId(), type: 'button', x: 35, y: 66, width: 25, height: 12, label: '返回' }
    )
  }

  return elements
}

/**
 * 解析用户故事 API
 */
app.post(
  '/api/parse-story',
  (req: Request, res: Response): void => {
    try {
      const { markdown } = req.body as ParseStoryRequest

      if (!markdown || typeof markdown !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Markdown content is required',
        })
        return
      }

      const stories: UserStory[] = []
      const pageMap = new Map<PageType, { points: string[]; stories: string[] }>()

      const lines = markdown.split('\n')

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine || trimmedLine.startsWith('#')) continue

        let match: RegExpMatchArray | null = null
        for (const pattern of STORY_PATTERNS) {
          match = trimmedLine.match(pattern)
          if (match) break
        }

        if (match && match.groups) {
          const { role = '', action = '', expected = '' } = match.groups

          const cleanRole = role.trim()
          const cleanAction = action.trim()
          const cleanExpected = expected.trim()

          const featurePoints = extractFeaturePoints(cleanAction, cleanExpected)
          const pageType = detectPageType(cleanAction, cleanExpected)

          const story: UserStory = {
            id: generateId(),
            role: cleanRole,
            action: cleanAction,
            expectedResult: cleanExpected,
            featurePoints,
          }

          stories.push(story)

          if (!pageMap.has(pageType)) {
            pageMap.set(pageType, { points: [], stories: [] })
          }

          const pageData = pageMap.get(pageType)!
          pageData.points.push(...featurePoints)
          pageData.stories.push(story.id)
        }
      }

      const pages: WireframePage[] = []
      for (const [type, data] of pageMap) {
        const uniquePoints = Array.from(new Set(data.points))
        const pageId = generateId()
        const elements = generatePageElements(type, uniquePoints)
        layoutStore.set(pageId, elements)
        pages.push({
          id: pageId,
          title: PAGE_TITLES[type],
          type,
          elements,
        })
      }

      const response: ParseStoryResponse = {
        stories,
        pages,
      }

      res.status(200).json(response)
    } catch (error) {
      console.error('Parse error:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to parse user stories',
      })
    }
  }
)

/**
 * 保存布局 API
 */
app.post(
  '/api/save-layout',
  (req: Request, res: Response): void => {
    try {
      const { pageId, elements } = req.body as SaveLayoutRequest

      if (!pageId || !elements) {
        res.status(400).json({
          success: false,
          message: 'pageId and elements are required',
        })
        return
      }

      layoutStore.set(pageId, elements)

      const response: SaveLayoutResponse = {
        success: true,
        message: 'Layout saved successfully',
      }

      res.status(200).json(response)
    } catch (error) {
      console.error('Save layout error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to save layout',
      })
    }
  }
)

/**
 * health check
 */
app.get(
  '/api/health',
  (req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  }
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', error)
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
