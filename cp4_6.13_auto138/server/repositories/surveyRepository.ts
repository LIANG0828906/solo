import { v4 as uuidv4 } from 'uuid'
import db from '../db/connection.js'
import type { Survey, Dimension, CreateSurveyRequest } from '../types.js'

function rowToSurvey(row: any): Survey {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description || '',
    createdAt: row.created_at,
  }
}

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

export function findSurveyById(id: string): Survey | null {
  const stmt = db.prepare('SELECT * FROM surveys WHERE id = ?')
  const row = stmt.get(id)
  return row ? rowToSurvey(row) : null
}

export function findSurveyByCode(code: string): Survey | null {
  const stmt = db.prepare('SELECT * FROM surveys WHERE code = ?')
  const row = stmt.get(code.toUpperCase())
  return row ? rowToSurvey(row) : null
}

export function findSurveyWithDimensions(id: string): (Survey & { dimensions: Dimension[] }) | null {
  const survey = findSurveyById(id)
  if (!survey) return null

  const dimensions = getDimensionsBySurveyId(id)
  return { ...survey, dimensions }
}

export function findAllSurveys(): Survey[] {
  const stmt = db.prepare('SELECT * FROM surveys ORDER BY created_at DESC')
  const rows = stmt.all()
  return rows.map(rowToSurvey)
}

export function createSurvey(data: CreateSurveyRequest, code: string): Survey & { dimensions: Dimension[] } {
  const surveyId = uuidv4()
  const createdAt = new Date().toISOString()

  const insertSurvey = db.prepare(`
    INSERT INTO surveys (id, code, title, description, created_at)
    VALUES (?, ?, ?, ?, ?)
  `)

  const insertDimension = db.prepare(`
    INSERT INTO dimensions (id, survey_id, emoji, label, allow_text, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const createTransaction = db.transaction(() => {
    insertSurvey.run(surveyId, code.toUpperCase(), data.title, data.description || '', createdAt)

    const dimensions: Dimension[] = []
    for (let i = 0; i < data.dimensions.length; i++) {
      const dim = data.dimensions[i]
      const dimId = uuidv4()
      insertDimension.run(dimId, surveyId, dim.emoji, dim.label, dim.allowText ? 1 : 0, i)
      dimensions.push({
        id: dimId,
        surveyId,
        emoji: dim.emoji,
        label: dim.label,
        allowText: dim.allowText,
        sortOrder: i,
      })
    }

    return dimensions
  })

  const dimensions = createTransaction() as Dimension[]

  return {
    id: surveyId,
    code: code.toUpperCase(),
    title: data.title,
    description: data.description || '',
    createdAt,
    dimensions,
  }
}

export function updateSurvey(id: string, data: Partial<Omit<Survey, 'id' | 'createdAt'>>): Survey | null {
  const existing = findSurveyById(id)
  if (!existing) return null

  const title = data.title ?? existing.title
  const description = data.description ?? existing.description
  const code = data.code ? data.code.toUpperCase() : existing.code

  const stmt = db.prepare(`
    UPDATE surveys
    SET title = ?, description = ?, code = ?
    WHERE id = ?
  `)
  stmt.run(title, description, code, id)

  return findSurveyById(id)
}

export function deleteSurvey(id: string): boolean {
  const stmt = db.prepare('DELETE FROM surveys WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
}

export function getDimensionsBySurveyId(surveyId: string): Dimension[] {
  const stmt = db.prepare(`
    SELECT * FROM dimensions
    WHERE survey_id = ?
    ORDER BY sort_order ASC, id ASC
  `)
  const rows = stmt.all(surveyId)
  return rows.map(rowToDimension)
}

export function createDimension(
  surveyId: string,
  emoji: string,
  label: string,
  allowText: boolean,
  sortOrder: number
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
