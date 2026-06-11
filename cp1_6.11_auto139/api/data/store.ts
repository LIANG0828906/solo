import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_FILE = path.join(__dirname, 'decisions.json')

const AVATAR_COLORS = ['#E53935','#8E24AA','#3949AB','#00897B','#43A047','#FDD835','#FB8C00','#6D4C41','#546E7A','#D81B60']

function getAuthorInitial(author: string): string {
  return author.charAt(0)
}

function getAvatarColor(author: string): string {
  let hash = 0
  for (let i = 0; i < author.length; i++) {
    hash = author.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0)
  return d.toISOString()
}

export interface Attachment {
  id: string
  filename: string
  type: 'image' | 'pdf'
  url: string
}

export interface Comment {
  id: string
  author: string
  authorInitial: string
  avatarColor: string
  content: string
  timestamp: string
}

export interface ActivityEntry {
  id: string
  type: 'create' | 'edit' | 'comment' | 'attachment'
  author: string
  description: string
  timestamp: string
}

export interface Decision {
  id: string
  title: string
  description: string
  type: 'technical' | 'design' | 'management'
  author: string
  authorInitial: string
  avatarColor: string
  timestamp: string
  pinned: boolean
  attachments: Attachment[]
  comments: Comment[]
  activityLog: ActivityEntry[]
  displayOrder: number
}

function createSampleData(): Decision[] {
  const data: Decision[] = [
    {
      id: uuidv4(),
      title: '前端框架迁移至 React 19',
      description: '经过团队评估，决定将项目前端框架从 React 18 升级至 React 19，以利用新的并发特性、自动批处理改进和性能优化。迁移计划分三个阶段进行，预计两周完成。',
      type: 'technical',
      author: '张伟',
      authorInitial: '张',
      avatarColor: getAvatarColor('张伟'),
      timestamp: daysAgo(6),
      pinned: true,
      attachments: [],
      comments: [
        {
          id: uuidv4(),
          author: '李明',
          authorInitial: '李',
          avatarColor: getAvatarColor('李明'),
          content: '需要确认所有第三方库的兼容性，特别是状态管理部分。',
          timestamp: daysAgo(5),
        },
      ],
      activityLog: [
        { id: uuidv4(), type: 'create', author: '张伟', description: '创建了决策', timestamp: daysAgo(6) },
      ],
      displayOrder: 1,
    },
    {
      id: uuidv4(),
      title: '采用全新设计系统 V3',
      description: '为统一产品视觉语言，决定全面采用设计系统 V3，包含新的色彩体系、间距规范、组件库和交互模式。设计团队已完成组件规范文档，前端团队需在下一迭代完成组件库更新。',
      type: 'design',
      author: '王芳',
      authorInitial: '王',
      avatarColor: getAvatarColor('王芳'),
      timestamp: daysAgo(5),
      pinned: false,
      attachments: [],
      comments: [
        {
          id: uuidv4(),
          author: '赵磊',
          authorInitial: '赵',
          avatarColor: getAvatarColor('赵磊'),
          content: '建议先做一个小范围试点页面，确认视觉效果后再全面推广。',
          timestamp: daysAgo(4),
        },
      ],
      activityLog: [
        { id: uuidv4(), type: 'create', author: '王芳', description: '创建了决策', timestamp: daysAgo(5) },
      ],
      displayOrder: 2,
    },
    {
      id: uuidv4(),
      title: '项目迭代周期调整为双周',
      description: '为提高交付节奏和团队响应速度，决定将项目迭代周期从三周调整为双周。每个迭代包含5天开发和2天测试，预留1天用于回顾和规划。',
      type: 'management',
      author: '陈静',
      authorInitial: '陈',
      avatarColor: getAvatarColor('陈静'),
      timestamp: daysAgo(5),
      pinned: false,
      attachments: [],
      comments: [
        {
          id: uuidv4(),
          author: '刘洋',
          authorInitial: '刘',
          avatarColor: getAvatarColor('刘洋'),
          content: '双周迭代对测试时间压力较大，需要考虑自动化测试覆盖率的提升。',
          timestamp: daysAgo(4),
        },
        {
          id: uuidv4(),
          author: '杨帆',
          authorInitial: '杨',
          avatarColor: getAvatarColor('杨帆'),
          content: '同意，建议同步增加CI/CD流水线的自动化程度。',
          timestamp: daysAgo(3),
        },
      ],
      activityLog: [
        { id: uuidv4(), type: 'create', author: '陈静', description: '创建了决策', timestamp: daysAgo(5) },
      ],
      displayOrder: 3,
    },
    {
      id: uuidv4(),
      title: '数据库从MySQL迁移至PostgreSQL',
      description: '基于对JSON查询、全文搜索和扩展性的需求评估，决定将主数据库从MySQL迁移至PostgreSQL。迁移将采用双写策略，确保数据一致性，预计需要三个迭代完成。',
      type: 'technical',
      author: '赵磊',
      authorInitial: '赵',
      avatarColor: getAvatarColor('赵磊'),
      timestamp: daysAgo(4),
      pinned: false,
      attachments: [],
      comments: [
        {
          id: uuidv4(),
          author: '张伟',
          authorInitial: '张',
          avatarColor: getAvatarColor('张伟'),
          content: '双写期间需要监控数据一致性，建议增加对账脚本。',
          timestamp: daysAgo(3),
        },
      ],
      activityLog: [
        { id: uuidv4(), type: 'create', author: '赵磊', description: '创建了决策', timestamp: daysAgo(4) },
      ],
      displayOrder: 4,
    },
    {
      id: uuidv4(),
      title: '移动端采用响应式设计方案',
      description: '经过市场调研和成本评估，决定移动端不开发独立APP，而是采用响应式设计方案适配移动端。优先保证核心功能在移动端的可用性，复杂功能引导用户使用桌面端。',
      type: 'design',
      author: '刘洋',
      authorInitial: '刘',
      avatarColor: getAvatarColor('刘洋'),
      timestamp: daysAgo(3),
      pinned: true,
      attachments: [],
      comments: [
        {
          id: uuidv4(),
          author: '王芳',
          authorInitial: '王',
          avatarColor: getAvatarColor('王芳'),
          content: '交互体验需要仔细打磨，特别是表单填写和手势操作。',
          timestamp: daysAgo(2),
        },
      ],
      activityLog: [
        { id: uuidv4(), type: 'create', author: '刘洋', description: '创建了决策', timestamp: daysAgo(3) },
      ],
      displayOrder: 5,
    },
    {
      id: uuidv4(),
      title: '引入代码审查制度',
      description: '为提升代码质量和团队知识共享，决定强制引入代码审查制度。所有代码合并必须至少获得一位非作者的团队成员审核通过。审查重点包括代码规范、逻辑正确性和安全风险。',
      type: 'management',
      author: '杨帆',
      authorInitial: '杨',
      avatarColor: getAvatarColor('杨帆'),
      timestamp: daysAgo(3),
      pinned: false,
      attachments: [],
      comments: [
        {
          id: uuidv4(),
          author: '陈静',
          authorInitial: '陈',
          avatarColor: getAvatarColor('陈静'),
          content: '建议制定审查checklist，避免审查流于形式。',
          timestamp: daysAgo(2),
        },
        {
          id: uuidv4(),
          author: '黄磊',
          authorInitial: '黄',
          avatarColor: getAvatarColor('黄磊'),
          content: '可以配合lint工具减少低级问题的审查负担。',
          timestamp: daysAgo(1),
        },
      ],
      activityLog: [
        { id: uuidv4(), type: 'create', author: '杨帆', description: '创建了决策', timestamp: daysAgo(3) },
      ],
      displayOrder: 6,
    },
    {
      id: uuidv4(),
      title: '采用微服务架构重构后端',
      description: '随着业务复杂度增长，单体架构已难以满足独立部署和横向扩展的需求。决定将后端按业务域拆分为用户服务、订单服务、通知服务等微服务，使用gRPC进行服务间通信。',
      type: 'technical',
      author: '黄磊',
      authorInitial: '黄',
      avatarColor: getAvatarColor('黄磊'),
      timestamp: daysAgo(2),
      pinned: false,
      attachments: [],
      comments: [
        {
          id: uuidv4(),
          author: '赵磊',
          authorInitial: '赵',
          avatarColor: getAvatarColor('赵磊'),
          content: '服务拆分粒度需要仔细评估，避免过度拆分带来运维成本上升。',
          timestamp: daysAgo(1),
        },
      ],
      activityLog: [
        { id: uuidv4(), type: 'create', author: '黄磊', description: '创建了决策', timestamp: daysAgo(2) },
      ],
      displayOrder: 7,
    },
    {
      id: uuidv4(),
      title: '统一色彩规范与品牌升级',
      description: '配合公司品牌升级战略，产品视觉语言需要同步更新。新色彩体系采用更加现代化的配色方案，主色调从深蓝调整为科技蓝，辅助色增加活力橙和清新绿，提升品牌辨识度。',
      type: 'design',
      author: '周涛',
      authorInitial: '周',
      avatarColor: getAvatarColor('周涛'),
      timestamp: daysAgo(1),
      pinned: false,
      attachments: [],
      comments: [
        {
          id: uuidv4(),
          author: '王芳',
          authorInitial: '王',
          avatarColor: getAvatarColor('王芳'),
          content: '需要确保新色彩在不同显示器上的一致性，建议增加色彩校准文档。',
          timestamp: daysAgo(0),
        },
      ],
      activityLog: [
        { id: uuidv4(), type: 'create', author: '周涛', description: '创建了决策', timestamp: daysAgo(1) },
      ],
      displayOrder: 8,
    },
    {
      id: uuidv4(),
      title: '团队扩招与分工调整',
      description: '随着项目规模扩大，计划在下一季度扩招2名前端工程师和1名后端工程师。同时调整团队分工，设立前端组、后端组和基础设施组，各组设置技术负责人。',
      type: 'management',
      author: '吴婷',
      authorInitial: '吴',
      avatarColor: getAvatarColor('吴婷'),
      timestamp: daysAgo(1),
      pinned: false,
      attachments: [],
      comments: [
        {
          id: uuidv4(),
          author: '陈静',
          authorInitial: '陈',
          avatarColor: getAvatarColor('陈静'),
          content: '新人入职后的培训计划也需要同步规划，确保快速融入团队。',
          timestamp: daysAgo(0),
        },
      ],
      activityLog: [
        { id: uuidv4(), type: 'create', author: '吴婷', description: '创建了决策', timestamp: daysAgo(1) },
      ],
      displayOrder: 9,
    },
    {
      id: uuidv4(),
      title: '引入Redis缓存层提升性能',
      description: '针对当前系统在高并发场景下的响应延迟问题，决定引入Redis作为缓存层。优先对热点数据（用户会话、配置信息、排行榜）进行缓存，目标将平均响应时间降低60%以上。',
      type: 'technical',
      author: '李明',
      authorInitial: '李',
      avatarColor: getAvatarColor('李明'),
      timestamp: daysAgo(0),
      pinned: false,
      attachments: [],
      comments: [
        {
          id: uuidv4(),
          author: '黄磊',
          authorInitial: '黄',
          avatarColor: getAvatarColor('黄磊'),
          content: '缓存一致性策略需要提前确定，建议采用主动失效加延迟双删的方案。',
          timestamp: daysAgo(0),
        },
      ],
      activityLog: [
        { id: uuidv4(), type: 'create', author: '李明', description: '创建了决策', timestamp: daysAgo(0) },
      ],
      displayOrder: 10,
    },
  ]

  return data
}

function loadFromFile(): Decision[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8')
      return JSON.parse(raw)
    }
  } catch {
    // ignore
  }
  return []
}

function saveToFile(data: Decision[]): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch {
    // ignore
  }
}

let decisions: Decision[] = loadFromFile()

if (decisions.length === 0) {
  decisions = createSampleData()
  saveToFile(decisions)
}

export function getAllDecisions(): Decision[] {
  return decisions
}

export function getDecisionById(id: string): Decision | undefined {
  return decisions.find((d) => d.id === id)
}

export function createDecision(input: {
  title: string
  description: string
  type: 'technical' | 'design' | 'management'
  author: string
}): Decision {
  const decision: Decision = {
    id: uuidv4(),
    title: input.title,
    description: input.description,
    type: input.type,
    author: input.author,
    authorInitial: getAuthorInitial(input.author),
    avatarColor: getAvatarColor(input.author),
    timestamp: new Date().toISOString(),
    pinned: false,
    attachments: [],
    comments: [],
    activityLog: [
      {
        id: uuidv4(),
        type: 'create',
        author: input.author,
        description: '创建了决策',
        timestamp: new Date().toISOString(),
      },
    ],
    displayOrder: decisions.length + 1,
  }
  decisions.unshift(decision)
  saveToFile(decisions)
  return decision
}

export function updateDecision(
  id: string,
  input: { title?: string; description?: string; type?: 'technical' | 'design' | 'management' },
): Decision | null {
  const idx = decisions.findIndex((d) => d.id === id)
  if (idx === -1) return null
  const existing = decisions[idx]
  const updated: Decision = {
    ...existing,
    ...input,
    activityLog: [
      ...existing.activityLog,
      {
        id: uuidv4(),
        type: 'edit' as const,
        author: existing.author,
        description: '编辑了决策',
        timestamp: new Date().toISOString(),
      },
    ],
  }
  decisions[idx] = updated
  saveToFile(decisions)
  return updated
}

export function deleteDecision(id: string): boolean {
  const idx = decisions.findIndex((d) => d.id === id)
  if (idx === -1) return false
  decisions.splice(idx, 1)
  saveToFile(decisions)
  return true
}

export function addComment(
  id: string,
  input: { author: string; content: string },
): Decision | null {
  const idx = decisions.findIndex((d) => d.id === id)
  if (idx === -1) return null
  const existing = decisions[idx]
  const comment: Comment = {
    id: uuidv4(),
    author: input.author,
    authorInitial: getAuthorInitial(input.author),
    avatarColor: getAvatarColor(input.author),
    content: input.content,
    timestamp: new Date().toISOString(),
  }
  existing.comments.push(comment)
  existing.activityLog.push({
    id: uuidv4(),
    type: 'comment',
    author: input.author,
    description: '添加了评论',
    timestamp: new Date().toISOString(),
  })
  decisions[idx] = existing
  saveToFile(decisions)
  return existing
}

export function togglePin(id: string): Decision | null {
  const idx = decisions.findIndex((d) => d.id === id)
  if (idx === -1) return null
  decisions[idx].pinned = !decisions[idx].pinned
  saveToFile(decisions)
  return decisions[idx]
}
