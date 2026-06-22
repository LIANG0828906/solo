import { Router, type Request, type Response } from 'express'
import { projects, timeRecords, withEffectiveStatus } from './projects.js'
import type { TimeRecord } from './projects.js'

interface BillingItem {
  projectId: string
  projectName: string
  clientName: string
  totalHours: number
  budget: number
  hourlyRate: number
  totalAmount: number
  records: TimeRecord[]
}

interface BillingSummary {
  month: string
  items: BillingItem[]
  grandTotal: number
}

const router = Router()

function filterByMonth(records: TimeRecord[], month?: string): TimeRecord[] {
  if (!month) return records
  return records.filter(r => {
    const d = new Date(r.startTime)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return key === month
  })
}

function buildBillingItems(month?: string): { items: BillingItem[]; grandTotal: number } {
  const filtered = filterByMonth(timeRecords, month)
  const items: BillingItem[] = []
  let grandTotal = 0

  for (const project of projects) {
    const ep = withEffectiveStatus(project)
    const projectRecords = filtered.filter(r => r.projectId === project.id)
    const totalHours = Number(projectRecords.reduce((sum, r) => sum + r.duration, 0).toFixed(2))
    const hourlyRate = Number((project.budget / 160).toFixed(2))
    const totalAmount = Number((totalHours * hourlyRate).toFixed(2))

    grandTotal += totalAmount

    items.push({
      projectId: project.id,
      projectName: ep.name,
      clientName: ep.clientName,
      totalHours,
      budget: project.budget,
      hourlyRate,
      totalAmount,
      records: projectRecords,
    })
  }

  return { items, grandTotal: Number(grandTotal.toFixed(2)) }
}

router.get('/export/csv', (req: Request, res: Response) => {
  const month = req.query.month as string | undefined
  const { items } = buildBillingItems(month)

  const header = 'Project,Client,Total Hours,Budget,Amount'
  const rows = items.map(i =>
    `"${i.projectName}","${i.clientName}",${i.totalHours},${i.budget},${i.totalAmount}`,
  )
  const csv = [header, ...rows].join('\n')

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename=billing${month ? `-${month}` : ''}.csv`)
  res.send(csv)
})

router.get('/:projectId', (req: Request, res: Response) => {
  const { projectId } = req.params
  const month = req.query.month as string | undefined

  const project = projects.find(p => p.id === projectId)
  if (!project) {
    res.status(404).json({ success: false, error: 'Project not found' })
    return
  }

  const ep = withEffectiveStatus(project)
  const projectRecords = filterByMonth(
    timeRecords.filter(r => r.projectId === projectId),
    month,
  )
  const totalHours = Number(projectRecords.reduce((sum, r) => sum + r.duration, 0).toFixed(2))
  const hourlyRate = Number((project.budget / 160).toFixed(2))
  const totalAmount = Number((totalHours * hourlyRate).toFixed(2))

  const item: BillingItem = {
    projectId: project.id,
    projectName: ep.name,
    clientName: ep.clientName,
    totalHours,
    budget: project.budget,
    hourlyRate,
    totalAmount,
    records: projectRecords,
  }

  res.json({ success: true, data: item })
})

router.get('/', (req: Request, res: Response) => {
  const month = req.query.month as string | undefined
  const { items, grandTotal } = buildBillingItems(month)

  const summary: BillingSummary = {
    month: month || 'all',
    items,
    grandTotal,
  }

  res.json({ success: true, data: summary })
})

export default router
