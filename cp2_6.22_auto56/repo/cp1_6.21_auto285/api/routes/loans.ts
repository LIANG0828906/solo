import { Router, type Request, type Response } from 'express'
import { getLoans, getLoansByUserId, addLoan, updateLoan } from '../data/store.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const loans = getLoans()
    res.status(200).json(loans)
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch loans'
    })
  }
})

router.get('/user/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params
    const loans = getLoansByUserId(userId)
    res.status(200).json(loans)
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user loans'
    })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookId, borrowerId, lenderId } = req.body
    if (!bookId || !borrowerId || !lenderId) {
      res.status(400).json({
        success: false,
        error: 'bookId, borrowerId, and lenderId are required'
      })
      return
    }
    const newLoan = addLoan({ bookId, borrowerId, lenderId })
    res.status(201).json(newLoan)
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create loan'
    })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { status, returnDate } = req.body
    const updates: Partial<typeof req.body> = {}
    if (status) updates.status = status
    if (returnDate) updates.returnDate = returnDate
    const updatedLoan = updateLoan(id, updates)
    if (!updatedLoan) {
      res.status(404).json({
        success: false,
        error: 'Loan not found'
      })
      return
    }
    res.status(200).json(updatedLoan)
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update loan'
    })
  }
})

router.post('/:id/rate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { rating, type } = req.body
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      })
      return
    }
    const updates = type === 'lender'
      ? { lenderRating: rating }
      : { borrowerRating: rating }
    const updatedLoan = updateLoan(id, updates)
    if (!updatedLoan) {
      res.status(404).json({
        success: false,
        error: 'Loan not found'
      })
      return
    }
    res.status(200).json(updatedLoan)
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: 'Failed to rate loan'
    })
  }
})

export default router
