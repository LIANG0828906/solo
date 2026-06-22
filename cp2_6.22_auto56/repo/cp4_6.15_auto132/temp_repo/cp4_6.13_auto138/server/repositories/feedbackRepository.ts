import { v4 as uuidv4 } from 'uuid'
import db from '../db/connection.js'
import type { Feedback, Rating, SurveyStats, CreateFeedbackRequest } from '../types.js'

function rowToFeedback(row: any): Feedback {
  return {
    id: row.id,
    surveyId: row.survey_id,
    text: row.text || undefined,
    createdAt: row.created_at,
  }
}

function rowToRating(row: any): Rating {
  return {
    id: row.id,
    feedbackId: row.feedback_id,
    dimensionId: row.dimension_id,
    score: row.score,
  }
}

export function findById(id: string): Feedback | null {
  const stmt = db.prepare('SELECT * FROM feedbacks WHERE id = ?')
  const row = stmt.get(id)
  return row ? rowToFeedback(row) : null
}

export function findBySurveyId(surveyId: string, limit: number = 100): Feedback[] {
  const stmt = db.prepare(`
    SELECT * FROM feedbacks
    WHERE survey_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `)
  const rows = stmt.all(surveyId, limit)
  return rows.map(rowToFeedback)
}

export function getRatingsByFeedbackId(feedbackId: string): Rating[] {
  const stmt = db.prepare('SELECT * FROM ratings WHERE feedback_id = ?')
  const rows = stmt.all(feedbackId)
  return rows.map(rowToRating)
}

export function createFeedback(data: CreateFeedbackRequest): Feedback & { ratings: Rating[] } {
  const feedbackId = uuidv4()
  const createdAt = new Date().toISOString()

  const insertFeedback = db.prepare(`
    INSERT INTO feedbacks (id, survey_id, text, created_at)
    VALUES (?, ?, ?, ?)
  `)

  const insertRating = db.prepare(`
    INSERT INTO ratings (id, feedback_id, dimension_id, score)
    VALUES (?, ?, ?, ?)
  `)

  const createTransaction = db.transaction(() => {
    insertFeedback.run(feedbackId, data.surveyId, data.text || null, createdAt)

    const ratings: Rating[] = []
    for (const ratingData of data.ratings) {
      const ratingId = uuidv4()
      insertRating.run(ratingId, feedbackId, ratingData.dimensionId, ratingData.score)
      ratings.push({
        id: ratingId,
        feedbackId,
        dimensionId: ratingData.dimensionId,
        score: ratingData.score,
      })
    }

    return ratings
  })

  const ratings = createTransaction() as Rating[]

  return {
    id: feedbackId,
    surveyId: data.surveyId,
    text: data.text || undefined,
    createdAt,
    ratings,
  }
}

export function createRating(feedbackId: string, dimensionId: string, score: number): Rating {
  const id = uuidv4()

  const stmt = db.prepare(`
    INSERT INTO ratings (id, feedback_id, dimension_id, score)
    VALUES (?, ?, ?, ?)
  `)
  stmt.run(id, feedbackId, dimensionId, score)

  return {
    id,
    feedbackId,
    dimensionId,
    score,
  }
}

export function deleteById(id: string): boolean {
  const stmt = db.prepare('DELETE FROM feedbacks WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
}

export function deleteBySurveyId(surveyId: string): number {
  const stmt = db.prepare('DELETE FROM feedbacks WHERE survey_id = ?')
  const result = stmt.run(surveyId)
  return result.changes
}

export function countFeedbacksBySurveyId(surveyId: string): number {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM feedbacks WHERE survey_id = ?')
  const result = stmt.get(surveyId) as { count: number }
  return result.count
}

export function getAverageRatingBySurveyId(surveyId: string): number {
  const stmt = db.prepare(`
    SELECT AVG(score) as average
    FROM ratings r
    INNER JOIN feedbacks f ON r.feedback_id = f.id
    WHERE f.survey_id = ?
  `)
  const result = stmt.get(surveyId) as { average: number | null }
  return result.average ?? 0
}

export function getHourlyFeedbackCount(surveyId: string, hours: number): Array<{ hour: string; count: number }> {
  const buckets: Array<{ hour: string; count: number }> = []
  const now = new Date()

  for (let i = hours - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 60 * 60 * 1000)
    date.setMinutes(0, 0, 0)
    const hourStr = date.toISOString().replace('T', ' ').substring(0, 19)
    buckets.push({ hour: hourStr, count: 0 })
  }

  const stmt = db.prepare(`
    SELECT 
      strftime('%Y-%m-%d %H:00:00', created_at) as hour,
      COUNT(*) as count
    FROM feedbacks
    WHERE survey_id = ?
      AND created_at >= datetime('now', ?)
    GROUP BY strftime('%Y-%m-%d %H:00:00', created_at)
    ORDER BY hour ASC
  `)
  const rows = stmt.all(surveyId, `-${hours} hours`) as { hour: string; count: number }[]

  const countMap = new Map(rows.map(r => [r.hour, r.count]))
  for (const bucket of buckets) {
    const hourKey = bucket.hour.substring(0, 13) + ':00:00'
    if (countMap.has(hourKey)) {
      bucket.count = countMap.get(hourKey)!
    }
  }

  return buckets
}

export function getStats(surveyId: string): SurveyStats {
  const totalFeedbacks = countFeedbacksBySurveyId(surveyId)
  const averageRating = getAverageRatingBySurveyId(surveyId)
  const hourlyData = getHourlyFeedbackCount(surveyId, 24)

  return {
    totalFeedbacks,
    averageRating: Math.round(averageRating * 100) / 100,
    hourlyData,
  }
}

export function getRecentFeedbacks(
  surveyId: string,
  limit: number = 20
): Array<Feedback & { ratings: Array<Rating & { emoji?: string; label?: string }> }> {
  const feedbacks = findBySurveyId(surveyId, limit)

  if (feedbacks.length === 0) {
    return []
  }

  const feedbackIds = feedbacks.map(f => f.id)
  const placeholders = feedbackIds.map(() => '?').join(',')

  const ratingsStmt = db.prepare(`
    SELECT r.*, d.emoji, d.label
    FROM ratings r
    LEFT JOIN dimensions d ON r.dimension_id = d.id
    WHERE r.feedback_id IN (${placeholders})
  `)
  const allRatings = ratingsStmt.all(...feedbackIds) as Array<any>

  const ratingsByFeedback = new Map<string, Array<Rating & { emoji?: string; label?: string }>>()
  for (const row of allRatings) {
    const rating: Rating & { emoji?: string; label?: string } = {
      ...rowToRating(row),
      emoji: row.emoji,
      label: row.label,
    }
    if (!ratingsByFeedback.has(rating.feedbackId)) {
      ratingsByFeedback.set(rating.feedbackId, [])
    }
    ratingsByFeedback.get(rating.feedbackId)!.push(rating)
  }

  return feedbacks.map(feedback => ({
    ...feedback,
    ratings: ratingsByFeedback.get(feedback.id) || [],
  }))
}
