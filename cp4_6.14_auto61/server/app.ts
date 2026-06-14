/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { store } from './store.js'
import type {
  CreateDebateRequest,
  UpdateTimerRequest,
  SubmitArgumentRequest,
  Speaker,
} from '../src/types/index.js'

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * health
 */
app.get(
  '/api/health',
  (req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * GET /api/debates - get all debates
 */
app.get('/api/debates', (req: Request, res: Response): void => {
  try {
    const debates = store.getAllDebates()
    res.status(200).json({
      success: true,
      data: debates,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch debates',
    })
  }
})

/**
 * GET /api/debates/:id - get single debate
 */
app.get('/api/debates/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const debate = store.getDebate(id)

    if (!debate) {
      res.status(404).json({
        success: false,
        error: 'Debate not found',
      })
      return
    }

    res.status(200).json({
      success: true,
      data: debate,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch debate',
    })
  }
})

/**
 * POST /api/debates - create new debate (validate duration 1-20 minutes)
 */
app.post('/api/debates', (req: Request, res: Response): void => {
  try {
    const { name, proSpeaker, conSpeaker, proDuration, conDuration } =
      req.body as CreateDebateRequest

    if (!name || !proSpeaker || !conSpeaker || proDuration === undefined || conDuration === undefined) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: name, proSpeaker, conSpeaker, proDuration, conDuration',
      })
      return
    }

    if (
      typeof proDuration !== 'number' ||
      typeof conDuration !== 'number' ||
      proDuration < 1 ||
      proDuration > 20 ||
      conDuration < 1 ||
      conDuration > 20
    ) {
      res.status(400).json({
        success: false,
        error: 'Duration must be between 1 and 20 minutes',
      })
      return
    }

    const debate = store.createDebate({
      name,
      proSpeaker,
      conSpeaker,
      proDuration,
      conDuration,
    })

    res.status(201).json({
      success: true,
      data: debate,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      error: 'Failed to create debate',
    })
  }
})

/**
 * PUT /api/debates/:id/timer - update timer state
 */
app.put('/api/debates/:id/timer', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { isRunning, remainingTime, currentSpeaker } = req.body as UpdateTimerRequest

    if (isRunning === undefined || remainingTime === undefined) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: isRunning, remainingTime',
      })
      return
    }

    if (typeof isRunning !== 'boolean' || typeof remainingTime !== 'number') {
      res.status(400).json({
        success: false,
        error: 'Invalid field types: isRunning must be boolean, remainingTime must be number',
      })
      return
    }

    if (currentSpeaker !== undefined && currentSpeaker !== 'pro' && currentSpeaker !== 'con') {
      res.status(400).json({
        success: false,
        error: 'currentSpeaker must be "pro" or "con"',
      })
      return
    }

    const debate = store.getDebate(id)
    if (!debate) {
      res.status(404).json({
        success: false,
        error: 'Debate not found',
      })
      return
    }

    const updated = store.updateTimer(id, isRunning, remainingTime, currentSpeaker)

    res.status(200).json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      error: 'Failed to update timer',
    })
  }
})

/**
 * POST /api/debates/:id/switch - switch speaker
 */
app.post('/api/debates/:id/switch', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const debate = store.getDebate(id)
    if (!debate) {
      res.status(404).json({
        success: false,
        error: 'Debate not found',
      })
      return
    }

    const updated = store.switchSpeaker(id)

    res.status(200).json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      error: 'Failed to switch speaker',
    })
  }
})

/**
 * POST /api/debates/:id/reset - reset timer
 */
app.post('/api/debates/:id/reset', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const debate = store.getDebate(id)
    if (!debate) {
      res.status(404).json({
        success: false,
        error: 'Debate not found',
      })
      return
    }

    const updated = store.resetTimer(id)

    res.status(200).json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      error: 'Failed to reset timer',
    })
  }
})

/**
 * GET /api/debates/:id/arguments - get arguments list
 */
app.get('/api/debates/:id/arguments', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const debate = store.getDebate(id)
    if (!debate) {
      res.status(404).json({
        success: false,
        error: 'Debate not found',
      })
      return
    }

    const args = store.getArguments(id)

    res.status(200).json({
      success: true,
      data: args,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch arguments',
    })
  }
})

/**
 * POST /api/debates/:id/arguments - submit argument (max 150 chars)
 */
app.post('/api/debates/:id/arguments', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { author, speaker, content } = req.body as SubmitArgumentRequest

    if (!author || !speaker || !content) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: author, speaker, content',
      })
      return
    }

    if (speaker !== 'pro' && speaker !== 'con') {
      res.status(400).json({
        success: false,
        error: 'speaker must be "pro" or "con"',
      })
      return
    }

    if (typeof content !== 'string' || content.length > 150) {
      res.status(400).json({
        success: false,
        error: 'Content must be a string with maximum 150 characters',
      })
      return
    }

    const debate = store.getDebate(id)
    if (!debate) {
      res.status(404).json({
        success: false,
        error: 'Debate not found',
      })
      return
    }

    const argument = store.addArgument(id, {
      author,
      speaker: speaker as Speaker,
      content,
    })

    res.status(201).json({
      success: true,
      data: argument,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      error: 'Failed to submit argument',
    })
  }
})

/**
 * GET /api/debates/:id/records - get debate records
 */
app.get('/api/debates/:id/records', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const debate = store.getDebate(id)
    if (!debate) {
      res.status(404).json({
        success: false,
        error: 'Debate not found',
      })
      return
    }

    const records = store.getRecords(id)

    res.status(200).json({
      success: true,
      data: records,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch records',
    })
  }
})

/**
 * POST /api/debates/:id/timeup - mark time up
 */
app.post('/api/debates/:id/timeup', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const debate = store.getDebate(id)
    if (!debate) {
      res.status(404).json({
        success: false,
        error: 'Debate not found',
      })
      return
    }

    store.markTimeUp(id)

    res.status(200).json({
      success: true,
      message: 'Time up recorded',
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      error: 'Failed to mark time up',
    })
  }
})

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: