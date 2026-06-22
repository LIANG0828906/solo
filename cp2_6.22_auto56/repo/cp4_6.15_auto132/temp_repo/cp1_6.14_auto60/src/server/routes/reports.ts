import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import moment from 'moment'
import { db, ExpenseRecord, ExpenseCategory, SavingsSuggestion, Budgets } from '../db.js'

const router = Router()

interface CategoryStat {
  category: ExpenseCategory
  amount: number
  count: number
  percentage: number
}

interface DailyExpense {
  date: string
  amount: number
}

interface SummaryResponse {
  totalExpense: number
  categoryStats: CategoryStat[]
  dailyExpenses: DailyExpense[]
  healthScore: number
  period: {
    start: string
    end: string
  }
}

const categoryNames: Record<ExpenseCategory, string> = {
  food: '餐饮',
  transport: '交通',
  shopping: '购物',
  entertainment: '娱乐',
  other: '其他',
}

function getRecordsForLast30Days(records: ExpenseRecord[]): ExpenseRecord[] {
  const now = moment()
  const thirtyDaysAgo = now.clone().subtract(30, 'days')
  return records.filter((r) => {
    const recordDate = moment(r.date)
    return recordDate.isAfter(thirtyDaysAgo) && recordDate.isSameOrBefore(now)
  })
}

function calculateCategoryStats(records: ExpenseRecord[], totalExpense: number): CategoryStat[] {
  const categories: ExpenseCategory[] = ['food', 'transport', 'shopping', 'entertainment', 'other']
  return categories.map((category) => {
    const categoryRecords = records.filter((r) => r.category === category)
    const amount = categoryRecords.reduce((sum, r) => sum + r.amount, 0)
    return {
      category,
      amount,
      count: categoryRecords.length,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
    }
  })
}

function calculateDailyExpenses(records: ExpenseRecord[]): DailyExpense[] {
  const dailyMap = new Map<string, number>()

  records.forEach((r) => {
    const date = r.date
    const current = dailyMap.get(date) || 0
    dailyMap.set(date, current + r.amount)
  })

  const result: DailyExpense[] = []
  const now = moment()
  for (let i = 29; i >= 0; i--) {
    const date = now.clone().subtract(i, 'days').format('YYYY-MM-DD')
    result.push({
      date,
      amount: dailyMap.get(date) || 0,
    })
  }

  return result
}

function calculateHealthScore(categoryStats: CategoryStat[], budgets: Budgets): number {
  let score = 100
  const categories: ExpenseCategory[] = ['food', 'transport', 'shopping', 'entertainment', 'other']

  categories.forEach((category) => {
    const stat = categoryStats.find((s) => s.category === category)
    if (!stat) return

    const budget = budgets[category]
    if (budget > 0 && stat.amount > budget) {
      const overRatio = (stat.amount - budget) / budget
      const deduction = Math.min(Math.round(overRatio * 50), 25)
      score -= deduction
    }
  })

  return Math.max(0, Math.min(100, score))
}

function generateSuggestions(records: ExpenseRecord[], budgets: Budgets): SavingsSuggestion[] {
  const suggestions: SavingsSuggestion[] = []
  const now = moment().toISOString()

  const categoryStats = calculateCategoryStats(records, records.reduce((s, r) => s + r.amount, 0))

  const overBudgetCategories = categoryStats.filter((stat) => {
    const budget = budgets[stat.category]
    return budget > 0 && stat.amount > budget
  })

  if (overBudgetCategories.length > 0) {
    const worst = overBudgetCategories.reduce((a, b) =>
      (a.amount - budgets[a.category]) > (b.amount - budgets[b.category]) ? a : b
    )
    const overAmount = Math.round(worst.amount - budgets[worst.category])
    suggestions.push({
      id: uuidv4(),
      title: `${categoryNames[worst.category]}消费超预算`,
      description: `本月${categoryNames[worst.category]}支出 ${worst.amount} 元，超出预算 ${overAmount} 元。建议控制${categoryNames[worst.category]}消费频率，选择更实惠的替代方案。`,
      estimatedSavings: Math.round(overAmount * 0.6),
      category: worst.category,
      status: 'pending',
      createdAt: now,
    })
  }

  const foodRecords = records.filter((r) => r.category === 'food')
  if (foodRecords.length >= 15) {
    const foodTotal = foodRecords.reduce((s, r) => s + r.amount, 0)
    const avgPerMeal = foodTotal / foodRecords.length
    if (avgPerMeal > 35) {
      const savings = Math.round((avgPerMeal - 30) * foodRecords.length * 0.5)
      suggestions.push({
        id: uuidv4(),
        title: '餐饮消费偏高',
        description: `上月餐饮平均每笔消费约 ${Math.round(avgPerMeal)} 元，尝试自己做饭或选择性价比更高的餐厅，可有效节省开支。`,
        estimatedSavings: savings,
        category: 'food',
        status: 'pending',
        createdAt: now,
      })
    }
  }

  const entertainmentRecords = records.filter((r) => r.category === 'entertainment')
  if (entertainmentRecords.length >= 5) {
    const entertainmentTotal = entertainmentRecords.reduce((s, r) => s + r.amount, 0)
    const savings = Math.round(entertainmentTotal * 0.3)
    suggestions.push({
      id: uuidv4(),
      title: '娱乐支出可优化',
      description: `上月娱乐消费共 ${entertainmentTotal} 元，建议减少非必要娱乐消费，或选择免费/低成本的休闲活动。`,
      estimatedSavings: savings,
      category: 'entertainment',
      status: 'pending',
      createdAt: now,
    })
  }

  const shoppingRecords = records.filter((r) => r.category === 'shopping')
  if (shoppingRecords.length >= 3) {
    const shoppingTotal = shoppingRecords.reduce((s, r) => s + r.amount, 0)
    const bigTicketItems = shoppingRecords.filter((r) => r.amount >= 200)
    if (bigTicketItems.length >= 2) {
      const savings = Math.round(shoppingTotal * 0.25)
      suggestions.push({
        id: uuidv4(),
        title: '购物冲动消费提醒',
        description: `发现多笔大额购物支出，建议购物前等待24小时再决定，区分"想要"和"需要"，避免冲动消费。`,
        estimatedSavings: savings,
        category: 'shopping',
        status: 'pending',
        createdAt: now,
      })
    }
  }

  const transportRecords = records.filter((r) => r.category === 'transport')
  if (transportRecords.length >= 10) {
    const transportTotal = transportRecords.reduce((s, r) => s + r.amount, 0)
    const avgCost = transportTotal / transportRecords.length
    if (avgCost > 25) {
      const savings = Math.round(transportTotal * 0.2)
      suggestions.push({
        id: uuidv4(),
        title: '交通成本优化建议',
        description: `交通出行平均每次约 ${Math.round(avgCost)} 元，建议更多使用公共交通或拼车，能有效降低通勤成本。`,
        estimatedSavings: savings,
        category: 'transport',
        status: 'pending',
        createdAt: now,
      })
    }
  }

  return suggestions.slice(0, 3)
}

router.get('/summary', async (_req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    const records = getRecordsForLast30Days(db.data.records)
    const totalExpense = records.reduce((sum, r) => sum + r.amount, 0)
    const categoryStats = calculateCategoryStats(records, totalExpense)
    const dailyExpenses = calculateDailyExpenses(records)
    const healthScore = calculateHealthScore(categoryStats, db.data.budgets)

    const response: SummaryResponse = {
      totalExpense,
      categoryStats,
      dailyExpenses,
      healthScore,
      period: {
        start: moment().subtract(29, 'days').format('YYYY-MM-DD'),
        end: moment().format('YYYY-MM-DD'),
      },
    }

    res.json(response)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch summary' })
  }
})

router.get('/suggestions', async (_req: Request, res: Response): Promise<void> => {
  try {
    await db.read()

    let pendingSuggestions = db.data.suggestions.filter((s) => s.status === 'pending')

    if (pendingSuggestions.length === 0) {
      const records = getRecordsForLast30Days(db.data.records)
      const newSuggestions = generateSuggestions(records, db.data.budgets)
      db.data.suggestions.push(...newSuggestions)
      await db.write()
      pendingSuggestions = newSuggestions
    }

    res.json(pendingSuggestions)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch suggestions' })
  }
})

router.post('/suggestions/:id/adopt', async (req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    const suggestion = db.data.suggestions.find((s: SavingsSuggestion) => s.id === req.params.id)

    if (!suggestion) {
      res.status(404).json({ error: 'Suggestion not found' })
      return
    }

    suggestion.status = 'adopted'
    await db.write()

    const adoptedSuggestions = db.data.suggestions.filter((s) => s.status === 'adopted')
    const totalSavings = adoptedSuggestions.reduce((sum, s) => sum + s.estimatedSavings, 0)

    res.json({
      success: true,
      suggestion,
      totalSavings,
      adoptedCount: adoptedSuggestions.length,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to adopt suggestion' })
  }
})

router.post('/suggestions/:id/ignore', async (req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    const suggestion = db.data.suggestions.find((s: SavingsSuggestion) => s.id === req.params.id)

    if (!suggestion) {
      res.status(404).json({ error: 'Suggestion not found' })
      return
    }

    suggestion.status = 'ignored'
    await db.write()

    res.json({ success: true, suggestion })
  } catch (error) {
    res.status(500).json({ error: 'Failed to ignore suggestion' })
  }
})

router.get('/savings', async (_req: Request, res: Response): Promise<void> => {
  try {
    await db.read()
    const adoptedSuggestions = db.data.suggestions.filter((s: SavingsSuggestion) => s.status === 'adopted')
    const totalSavings = adoptedSuggestions.reduce((sum, s) => sum + s.estimatedSavings, 0)

    res.json({
      totalSavings,
      adoptedCount: adoptedSuggestions.length,
      suggestions: adoptedSuggestions,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch savings' })
  }
})

export default router
