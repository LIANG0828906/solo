import { Router, type Request, type Response } from 'express'
import { getAllUsers, addUser, deleteUser, getUser } from '../data/store.js'

const router = Router()

router.get('/', (_req: Request, res: Response): void => {
  const users = getAllUsers()
  res.json({ success: true, data: users })
})

router.post('/', (req: Request, res: Response): void => {
  const { name, city, timezone, utcOffset, workStart, workEnd } = req.body

  if (!name || !city || timezone === undefined || utcOffset === undefined || !workStart || !workEnd) {
    res.status(400).json({ success: false, error: 'Missing required fields: name, city, timezone, utcOffset, workStart, workEnd' })
    return
  }

  const user = addUser({ name, city, timezone, utcOffset, workStart, workEnd })
  res.status(201).json({ success: true, data: user })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const existing = getUser(id)
  if (!existing) {
    res.status(404).json({ success: false, error: 'User not found' })
    return
  }

  deleteUser(id)
  res.json({ success: true, data: { id } })
})

export default router
