import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import path from 'path'
import { fileURLToPath } from 'url'

export type ExpenseCategory = 'food' | 'transport' | 'shopping' | 'entertainment' | 'other'

export interface ExpenseRecord {
  id: string
  amount: number
  category: ExpenseCategory
  note: string
  date: string
  createdAt: string
  updatedAt: string
}

export interface SavingsSuggestion {
  id: string
  title: string
  description: string
  estimatedSavings: number
  category: string
  status: 'pending' | 'adopted' | 'ignored'
  createdAt: string
}

export interface DailySummary {
  date: string
  totalAmount: number
  count: number
}

export interface Budgets {
  food: number
  transport: number
  shopping: number
  entertainment: number
  other: number
}

export interface DataSchema {
  records: ExpenseRecord[]
  suggestions: SavingsSuggestion[]
  dailySummaries: DailySummary[]
  budgets: Budgets
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const file = path.join(__dirname, '..', '..', 'db.json')

const defaultData: DataSchema = {
  records: [],
  suggestions: [],
  dailySummaries: [],
  budgets: {
    food: 2000,
    transport: 500,
    shopping: 1500,
    entertainment: 800,
    other: 500,
  },
}

const adapter = new JSONFile<DataSchema>(file)
export const db = new Low<DataSchema>(adapter, defaultData)

export async function initDb(): Promise<void> {
  await db.read()
  if (!db.data) {
    db.data = defaultData
  }
  if (!db.data.records) db.data.records = []
  if (!db.data.suggestions) db.data.suggestions = []
  if (!db.data.dailySummaries) db.data.dailySummaries = []
  if (!db.data.budgets) db.data.budgets = defaultData.budgets
  await db.write()
}
