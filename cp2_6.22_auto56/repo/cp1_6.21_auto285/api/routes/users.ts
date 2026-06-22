import { Router, type Request, type Response } from 'express'
import { getUsers, getUserById, rateUser } from '../data/store.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const users = getUsers()
    res.status(200).json(users)
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const user = getUserById(id)
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      })
      return
    }
    res.status(200).json(user)
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    })
  }
})

router.post('/:id/rate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { rating } = req.body
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      })
      return
    }
    const updatedUser = rateUser(id, rating)
    if (!updatedUser) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      })
      return
    }
    res.status(200).json(updatedUser)
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to rate user'
    })
  }
})

export default router
