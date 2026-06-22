import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { v4 as uuidv4 } from 'uuid'
import nodemailer from 'nodemailer'

dotenv.config()

type EmailCategory = 'work' | 'social' | 'promo' | 'spam'
type EmailStatus = 'pending' | 'processing' | 'done'

interface Email {
  id: string
  from: string
  subject: string
  body: string
  timestamp: string
  category: EmailCategory
  status: EmailStatus
}

interface DailyStats {
  date: string
  count: number
}

interface CategoryStats {
  category: EmailCategory
  count: number
}

const CATEGORIES: EmailCategory[] = ['work', 'social', 'promo', 'spam']

const SENDERS = [
  '张伟', '李娜', '王芳', '刘洋', '陈静',
  '杨帆', '赵磊', '黄丽', '周明', '吴刚',
  '徐婷', '孙强', '马超', '朱慧', '胡波',
  '郭敏', '林峰', '何雪', '罗浩', '梁燕',
  'GitHub', 'Slack', 'Jira', 'Figma', 'Notion',
  'LinkedIn', 'Twitter', 'Medium', 'Dribbble', 'ProductHunt',
  '淘宝', '京东', '美团', '拼多多', '抖音',
  '人力资源部', '财务部', '技术部', '市场部', '运营部',
]

const WORK_SUBJECTS = [
  '关于Q3项目进度汇报', '下周一团队会议安排', '需求评审文档已更新',
  '代码审查：用户模块重构', '生产环境部署通知', '新员工入职培训计划',
  '季度OKR回顾会议', '技术方案设计评审', '线上故障复盘报告',
  '微服务架构升级方案', '数据库迁移计划确认', '安全审计结果通知',
  '产品需求变更通知', 'Sprint回顾总结', '接口文档更新提醒',
  '服务器资源申请审批', '前端性能优化报告', '客户反馈汇总表',
  '项目里程碑达成通知', '周五下午茶活动安排',
]

const SOCIAL_SUBJECTS = [
  '周末聚会安排', '生日派对邀请', '同学聚会通知',
  '读书会本周推荐', '健身房团课预约', '志愿服务报名确认',
  '社区活动通知', '宠物领养日活动', '摄影展览邀请',
  '音乐节门票预售', '户外徒步活动报名', '电影之夜邀请',
  '桌游之夜通知', '烹饪课程报名', '邻里聚会邀请',
]

const PROMO_SUBJECTS = [
  '限时特惠：全场5折起', '会员专享优惠券已到账', '新品首发抢先看',
  '年中大促最后一天', '积分兑换即将过期', '专属折扣码：SAVE30',
  '免费试用高级会员', '爆款清单推荐', '满减活动火热进行中',
  '品牌日限时秒杀', '新用户专享礼包', '购物车商品降价提醒',
  '会员日双倍积分', '限量款预售开启', '节日特惠专场',
]

const SPAM_SUBJECTS = [
  '恭喜您中奖了！', '免费领取iPhone', '日入过万不是梦',
  '贷款秒批无需审核', '兼职刷单轻松赚钱', '投资回报率300%',
  '加微信领取红包', '限时免费课程', '代开发票联系方式',
  '超低价代购奢侈品', '减肥神药限时促销', '信用卡套现服务',
]

const SUBJECT_MAP: Record<EmailCategory, string[]> = {
  work: WORK_SUBJECTS,
  social: SOCIAL_SUBJECTS,
  promo: PROMO_SUBJECTS,
  spam: SPAM_SUBJECTS,
}

const BODIES_MAP: Record<EmailCategory, string[]> = {
  work: [
    '请查收附件中的项目进度报告，需要在周五前完成评审。',
    '会议时间已调整为下周三下午2点，请准时参加。',
    '本次代码审查重点关注性能优化部分，请提前熟悉代码。',
    '生产环境将于今晚10点进行部署，预计影响时间30分钟。',
    '请在本周内完成OKR自评，系统将于周五关闭。',
  ],
  social: [
    '这周六下午3点在老地方聚会，欢迎携带家属参加！',
    '本月读书会推荐《思考，快与慢》，欢迎参加讨论。',
    '社区志愿活动本周日开始，有兴趣请回复确认。',
    '摄影展在市美术馆举行，要不要一起去？',
    '下周二晚上的桌游局还缺一人，来吗？',
  ],
  promo: [
    '尊敬的会员，您有一张50元无门槛优惠券即将过期，请尽快使用！',
    '新品首发限时8折，前100名下单再减30元！',
    '年中大促最后6小时，错过再等半年！',
    '您的积分将于本月底过期，快来兑换心仪好物吧。',
    '会员专属福利：全场包邮+额外9折，仅限今日！',
  ],
  spam: [
    '恭喜！您已被随机抽中获得大奖，点击链接领取>>>',
    '无需任何门槛，轻松获得高额贷款，利率超低！',
    '兼职在家也能月入过万，详情请加微信了解。',
    '投资比特币日赚千元，零风险稳赚不赔！',
    '免费领取最新手机，仅剩最后5个名额！',
  ],
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateEmails(count: number): Email[] {
  const now = Date.now()
  const emails: Email[] = []
  for (let i = 0; i < count; i++) {
    const category = randomItem(CATEGORIES)
    const sender = randomItem(SENDERS)
    const subject = randomItem(SUBJECT_MAP[category])
    const body = randomItem(BODIES_MAP[category])
    const timestamp = new Date(now - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    emails.push({
      id: uuidv4(),
      from: sender,
      subject,
      body,
      timestamp,
      category,
      status: 'pending',
    })
  }
  return emails.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

const transporter = nodemailer.createTransport({ streamTransport: true })
void transporter

const emails: Email[] = generateEmails(50)

function simulateDelay(): Promise<void> {
  const delay = 100 + Math.random() * 200
  return new Promise(resolve => setTimeout(resolve, delay))
}

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.get('/api/emails', async (_req: Request, res: Response) => {
  await simulateDelay()
  const status = _req.query.status as EmailStatus | undefined
  const filtered = status ? emails.filter(e => e.status === status) : emails
  res.json(filtered)
})

app.put('/api/emails/:id', async (req: Request, res: Response) => {
  await simulateDelay()
  const { id } = req.params
  const { status } = req.body as { status: EmailStatus }
  const email = emails.find(e => e.id === id)
  if (!email) {
    res.status(404).json({ error: 'Email not found' })
    return
  }
  email.status = status
  res.json(email)
})

app.get('/api/stats', async (_req: Request, res: Response) => {
  await simulateDelay()
  const total = emails.length
  const done = emails.filter(e => e.status === 'done').length

  const now = new Date()
  const daily: DailyStats[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
    const dayEnd = dayStart + 24 * 60 * 60 * 1000
    const doneToday = emails.filter(
      e => e.status === 'done' && new Date(e.timestamp).getTime() >= dayStart && new Date(e.timestamp).getTime() < dayEnd
    ).length
    const simulated = Math.floor(Math.random() * 8) + 2
    daily.push({ date: dateStr, count: i === 0 ? done : simulated })
  }

  const byCategory: CategoryStats[] = CATEGORIES.map(category => ({
    category,
    count: emails.filter(e => e.category === category).length,
  }))

  res.json({ daily, byCategory, total, done })
})

app.use('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'ok' })
})

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ success: false, error: 'Server internal error' })
})

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'API not found' })
})

export default app
