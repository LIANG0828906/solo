import { Request, Response } from 'express'
import * as surveyService from '../services/surveyService.js'

export function createSurvey(req: Request, res: Response): void {
  try {
    const { title, description, dimensions } = req.body

    if (!title || !dimensions || !Array.isArray(dimensions) || dimensions.length === 0) {
      res.status(400).json({ error: 'Invalid request data' })
      return
    }

    const survey = surveyService.createSurvey({ title, description, dimensions })
    res.status(201).json(survey)
  } catch (error) {
    console.error('Error creating survey:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export function getSurvey(req: Request, res: Response): void {
  try {
    const { id } = req.params
    const survey = surveyService.getSurvey(id)

    if (!survey) {
      res.status(404).json({ error: 'Survey not found' })
      return
    }

    res.json(survey)
  } catch (error) {
    console.error('Error getting survey:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export function getSurveyByCode(req: Request, res: Response): void {
  try {
    const { code } = req.params
    const survey = surveyService.getSurveyByCode(code.toUpperCase())

    if (!survey) {
      res.status(404).json({ error: 'Survey not found' })
      return
    }

    res.json(survey)
  } catch (error) {
    console.error('Error getting survey by code:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
