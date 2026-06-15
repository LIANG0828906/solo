import { Router, Request } from 'express'
import multer from 'multer'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import {
  createItem,
  getItemById,
  getItems,
  getItemsByOwner,
  updateItem,
  deleteItem,
} from '../services/itemsService'
import { processImages } from '../services/imageService'
import { getUserById } from '../services/usersService'

const router = Router()

const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 3,
  },
})

router.get('/', async (req, res) => {
  try {
    const { keyword, category, page, limit } = req.query
    const result = await getItems({
      keyword: keyword as string,
      category: category as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    })

    const itemsWithOwner = await Promise.all(
      result.items.map(async (item) => {
        const owner = await getUserById(item.ownerId)
        return {
          ...item,
          owner: owner
            ? {
                id: owner.id,
                nickname: owner.nickname,
                creditScore: owner.creditScore,
                city: owner.city,
              }
            : null,
        }
      })
    )

    res.json({ items: itemsWithOwner, total: result.total })
  } catch (error) {
    console.error('Get items error:', error)
    res.status(500).json({ message: '获取物品列表失败' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const item = await getItemById(req.params.id)
    if (!item) {
      return res.status(404).json({ message: '物品不存在' })
    }

    const owner = await getUserById(item.ownerId)
    res.json({
      ...item,
      owner: owner
        ? {
            id: owner.id,
            nickname: owner.nickname,
            creditScore: owner.creditScore,
            city: owner.city,
          }
        : null,
    })
  } catch (error) {
    console.error('Get item error:', error)
    res.status(500).json({ message: '获取物品详情失败' })
  }
})

router.post(
  '/',
  authMiddleware,
  upload.array('images', 3),
  async (req: AuthRequest, res) => {
    try {
      const { title, description, category, condition } = req.body
      const userId = req.userId!

      if (!title || !category || !condition) {
        return res.status(400).json({ message: '请填写必填项' })
      }

      if (title.length > 20) {
        return res.status(400).json({ message: '标题不能超过20字' })
      }

      if (description && description.length > 500) {
        return res.status(400).json({ message: '描述不能超过500字' })
      }

      const files = req.files as Express.Multer.File[]
      if (!files || files.length === 0) {
        return res.status(400).json({ message: '请至少上传一张图片' })
      }

      const imagePaths = await processImages(files)

      const user = await getUserById(userId)
      if (!user) {
        return res.status(404).json({ message: '用户不存在' })
      }

      const item = await createItem({
        title,
        description: description || '',
        category,
        condition,
        images: imagePaths,
        ownerId: userId,
        city: user.city,
      })

      res.status(201).json(item)
    } catch (error) {
      console.error('Create item error:', error)
      res.status(500).json({ message: '发布物品失败' })
    }
  }
)

router.get('/owner/:ownerId', async (req, res) => {
  try {
    const items = await getItemsByOwner(req.params.ownerId)
    res.json(items)
  } catch (error) {
    console.error('Get user items error:', error)
    res.status(500).json({ message: '获取用户物品失败' })
  }
})

router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const item = await getItemById(req.params.id)
    if (!item) {
      return res.status(404).json({ message: '物品不存在' })
    }
    if (item.ownerId !== req.userId) {
      return res.status(403).json({ message: '无权限操作' })
    }

    const updated = await updateItem(req.params.id, req.body)
    res.json(updated)
  } catch (error) {
    console.error('Update item error:', error)
    res.status(500).json({ message: '更新物品失败' })
  }
})

router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const item = await getItemById(req.params.id)
    if (!item) {
      return res.status(404).json({ message: '物品不存在' })
    }
    if (item.ownerId !== req.userId) {
      return res.status(403).json({ message: '无权限操作' })
    }

    await deleteItem(req.params.id)
    res.json({ message: '删除成功' })
  } catch (error) {
    console.error('Delete item error:', error)
    res.status(500).json({ message: '删除物品失败' })
  }
})

export default router
