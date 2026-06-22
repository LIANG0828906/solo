import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

interface Comment {
  id: string
  author: string
  content: string
  createdAt: string
}

interface Work {
  id: string
  title: string
  imageUrl: string
  shootDate: string
  cameraParams: string
  tags: string[]
  likes: number
  likedBy: string[]
  comments: Comment[]
  createdAt: string
}

const works: Work[] = []

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  let result = [...works]
  const tag = req.query.tag as string | undefined
  const sort = req.query.sort as string | undefined

  if (tag) {
    result = result.filter(w => w.tags.includes(tag))
  }

  if (sort === 'date') {
    result.sort((a, b) => new Date(b.shootDate).getTime() - new Date(a.shootDate).getTime())
  } else if (sort === 'date-asc') {
    result.sort((a, b) => new Date(a.shootDate).getTime() - new Date(b.shootDate).getTime())
  }

  res.json({ success: true, data: result })
})

router.get('/:id', (req: Request, res: Response): void => {
  const work = works.find(w => w.id === req.params.id)
  if (!work) {
    res.status(404).json({ success: false, error: 'Work not found' })
    return
  }
  res.json({ success: true, data: work })
})

router.post('/', (req: Request, res: Response): void => {
  const { title, imageUrl, shootDate, cameraParams, tags } = req.body

  if (!imageUrl) {
    res.status(400).json({ success: false, error: 'Image is required' })
    return
  }

  const work: Work = {
    id: uuidv4(),
    title: title || '未命名作品',
    imageUrl,
    shootDate: shootDate || new Date().toISOString().split('T')[0],
    cameraParams: cameraParams || '',
    tags: tags || [],
    likes: 0,
    likedBy: [],
    comments: [],
    createdAt: new Date().toISOString(),
  }

  works.push(work)
  res.status(201).json({ success: true, data: work })
})

router.put('/:id', (req: Request, res: Response): void => {
  const idx = works.findIndex(w => w.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Work not found' })
    return
  }

  const { title, shootDate, cameraParams, tags } = req.body
  if (title !== undefined) works[idx].title = title
  if (shootDate !== undefined) works[idx].shootDate = shootDate
  if (cameraParams !== undefined) works[idx].cameraParams = cameraParams
  if (tags !== undefined) works[idx].tags = tags

  res.json({ success: true, data: works[idx] })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const idx = works.findIndex(w => w.id === req.params.id)
  if (idx === -1) {
    res.status(404).json({ success: false, error: 'Work not found' })
    return
  }

  const deleted = works.splice(idx, 1)[0]
  res.json({ success: true, data: deleted })
})

router.post('/:id/like', (req: Request, res: Response): void => {
  const work = works.find(w => w.id === req.params.id)
  if (!work) {
    res.status(404).json({ success: false, error: 'Work not found' })
    return
  }

  const userId = req.body.userId || 'anonymous'
  const hasLiked = work.likedBy.includes(userId)

  if (hasLiked) {
    work.likedBy = work.likedBy.filter(id => id !== userId)
    work.likes = Math.max(0, work.likes - 1)
  } else {
    work.likedBy.push(userId)
    work.likes += 1
  }

  res.json({ success: true, data: { likes: work.likes, liked: !hasLiked } })
})

router.post('/:id/comments', (req: Request, res: Response): void => {
  const work = works.find(w => w.id === req.params.id)
  if (!work) {
    res.status(404).json({ success: false, error: 'Work not found' })
    return
  }

  const { author, content } = req.body
  if (!content || !content.trim()) {
    res.status(400).json({ success: false, error: 'Comment content is required' })
    return
  }

  const comment: Comment = {
    id: uuidv4(),
    author: author || '匿名用户',
    content: content.trim(),
    createdAt: new Date().toISOString(),
  }

  work.comments.push(comment)
  res.status(201).json({ success: true, data: comment })
})

export default router
