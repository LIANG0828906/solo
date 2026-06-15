import { v4 as uuidv4 } from 'uuid'
import db from '../db/connection.js'
import type { Dimension } from '../types.js'

function rowToDimension(row: any): Dimension {
  return {
    id: row.id,
    surveyId: row.survey_id,
    emoji: row.emoji,
    label: row.label,
    allowText: row.allow_text === 1,
    sortOrder: row.sort_order,
  }
}

export function findAllBySurveyId(surveyId: string): Dimension[] {
  const stmt = db.prepare(`
    SELECT * FROM dimensions
    WHERE survey_id = ?
    ORDER BY sort_order ASC, id ASC
  `)
  const rows = stmt.all(surveyId)
  return rows.map(rowToDimension)
}

export function findById(id: string): Dimension | null {
  const stmt = db.prepare('SELECT * FROM dimensions WHERE id = ?')
  const row = stmt.get(id)
  return row ? rowToDimension(row) : null
}

export function create(
  surveyId: string,
  emoji: string,
  label: string,
  allowText: boolean = false,
  sortOrder: number = 0
): Dimension {
  const id = uuidv4()

  const stmt = db.prepare(`
    INSERT INTO dimensions (id, survey_id, emoji, label, allow_text, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  stmt.run(id, surveyId, emoji, label, allowText ? 1 : 0, sortOrder)

  return {
    id,
    surveyId,
    emoji,
    label,
    allowText,
    sortOrder,
  }
}

export function createMany(
  surveyId: string,
  dimensions: Array<{ emoji: string; label: string; allowText?: boolean }>
): Dimension[] {
  const insertStmt = db.prepare(`
    INSERT INTO dimensions (id, survey_id, emoji, label, allow_text, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const transaction = db.transaction((items: typeof dimensions) => {
    const results: Dimension[] = []
    for (let i = 0; i < items.length; i++) {
      const dim = items[i]
      const id = uuidv4()
      const allowText = dim.allowText ? 1 : 0
      insertStmt.run(id, surveyId, dim.emoji, dim.label, allowText, i)
      results.push({
        id,
        surveyId,
        emoji: dim.emoji,
        label: dim.label,
        allowText: dim.allowText ?? false,
        sortOrder: i,
      })
    }
    return results
  })

  return transaction(dimensions) as Dimension[]
}

export function update(id: string, data: Partial<Omit<Dimension, 'id' | 'surveyId'>>): Dimension | null {
  const existing = findById(id)
  if (!existing) return null

  const emoji = data.emoji ?? existing.emoji
  const label = data.label ?? existing.label
  const allowText = data.allowText !== undefined ? (data.allowText ? 1 : 0) : (existing.allowText ? 1 : 0)
  const sortOrder = data.sortOrder ?? existing.sortOrder

  const stmt = db.prepare(`
    UPDATE dimensions
    SET emoji = ?, label = ?, allow_text = ?, sort_order = ?
    WHERE id = ?
  `)
  stmt.run(emoji, label, allowText, sortOrder, id)

  return findById(id)
}

export function remove(id: string): boolean {
  const stmt = db.prepare('DELETE FROM dimensions WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
}

export function deleteBySurveyId(surveyId: string): number {
  const stmt = db.prepare('DELETE FROM dimensions WHERE survey_id = ?')
  const result = stmt.run(surveyId)
  return result.changes
}
