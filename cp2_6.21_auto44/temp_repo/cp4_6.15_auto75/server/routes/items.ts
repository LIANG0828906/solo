import { Router, type Request, type Response } from 'express'
import { getItems, addItem, getItemById, updateItem } from '../data/store.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  let items = getItems()

  const { location, dateFrom, dateTo } = req.query

  if (location && typeof location === 'string') {
    items = items.filter((item) =>
      item.location.toLowerCase().includes(location.toLowerCase()),
    )
  }

  if (dateFrom && typeof dateFrom === 'string') {
    const from = Number(dateFrom)
    if (!isNaN(from)) {
      items = items.filter((item) => item.createdAt >= from)
    }
  }

  if (dateTo && typeof dateTo === 'string') {
    const to = Number(dateTo)
    if (!isNaN(to)) {
      items = items.filter((item) => item.createdAt <= to)
    }
  }

  items.sort((a, b) => b.createdAt - a.createdAt)

  res.json({
    success: true,
    data: items,
  })
})

router.post('/', (req: Request, res: Response): void => {
  const { title, location, description, image } = req.body

  if (!title || typeof title !== 'string') {
    res.status(400).json({
      success: false,
      error: '标题是必填项',
    })
    return
  }

  if (!location || typeof location !== 'string') {
    res.status(400).json({
      success: false,
      error: '地点是必填项',
    })
    return
  }

  if (!description || typeof description !== 'string') {
    res.status(400).json({
      success: false,
      error: '描述是必填项',
    })
    return
  }

  const newItem = addItem({
    title: title.trim(),
    location: location.trim(),
    description: description.trim(),
    image: image || '',
  })

  res.status(201).json({
    success: true,
    data: newItem,
  })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params

  const item = getItemById(id)
  if (!item) {
    res.status(404).json({
      success: false,
      error: '物品不存在',
    })
    return
  }

  const updatedItem = updateItem(id, { isClaimed: true })

  res.json({
    success: true,
    data: updatedItem,
  })
})

export default router
