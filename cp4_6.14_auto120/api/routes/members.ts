import { Router, type Request, type Response } from 'express'
import {
  getMembers,
  setMembers,
  getMemberById,
  computeStatus,
  MEMBERSHIP_DAYS,
  addDays,
  formatDate,
  type Member,
} from '../store.js'

const router = Router()

const STATUS_ORDER: Record<string, number> = {
  '已过期': 0,
  '即将到期': 1,
  '有效': 2,
}

router.get('/', (req: Request, res: Response): void => {
  const members = getMembers()
  const result = members
    .map(m => ({ ...m, status: computeStatus(m.expiryDate) }))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
  res.json({ success: true, data: result })
})

router.post('/', (req: Request, res: Response): void => {
  const { name, membershipType } = req.body as { name: string; membershipType: string }

  if (!name || !/^[\u4e00-\u9fa5]{2,10}$/.test(name)) {
    res.status(400).json({ success: false, error: '姓名必须为2-10个中文字符' })
    return
  }

  if (!MEMBERSHIP_DAYS[membershipType]) {
    res.status(400).json({ success: false, error: '会员类型无效，可选：月卡、季卡、年卡' })
    return
  }

  const expiryDate = formatDate(addDays(new Date(), MEMBERSHIP_DAYS[membershipType]))

  const member: Member = {
    id: crypto.randomUUID(),
    name,
    membershipType: membershipType as Member['membershipType'],
    expiryDate,
  }

  const members = getMembers()
  members.push(member)
  setMembers(members)

  res.status(201).json({ success: true, data: { ...member, status: computeStatus(member.expiryDate) } })
})

router.put('/:id/renew', (req: Request, res: Response): void => {
  const { id } = req.params
  const { membershipType } = req.body as { membershipType: string }

  if (!MEMBERSHIP_DAYS[membershipType]) {
    res.status(400).json({ success: false, error: '会员类型无效，可选：月卡、季卡、年卡' })
    return
  }

  const members = getMembers()
  const member = members.find(m => m.id === id)

  if (!member) {
    res.status(404).json({ success: false, error: '会员不存在' })
    return
  }

  member.membershipType = membershipType as Member['membershipType']
  member.expiryDate = formatDate(addDays(new Date(), MEMBERSHIP_DAYS[membershipType]))
  setMembers(members)

  res.json({ success: true, data: { ...member, status: computeStatus(member.expiryDate) } })
})

export default router
