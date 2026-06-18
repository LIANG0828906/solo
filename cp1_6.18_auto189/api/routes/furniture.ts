import { Router, type Request, type Response } from 'express'

const router = Router()

const items = [
  { id: 'sofa', name: '沙发', modelType: 'sofa' },
  { id: 'coffeeTable', name: '茶几', modelType: 'coffeeTable' },
  { id: 'floorLamp', name: '落地灯', modelType: 'floorLamp' },
  { id: 'tvStand', name: '电视柜', modelType: 'tvStand' },
  { id: 'bookshelf', name: '书架', modelType: 'bookshelf' },
  { id: 'armchair', name: '单人椅', modelType: 'armchair' },
]

router.get('/', (_req: Request, res: Response): void => {
  res.json({ items })
})

export default router
