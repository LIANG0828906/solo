import { Router, Request, Response } from 'express'
import { register, login, getCurrentUser, authenticateToken, AuthRequest } from './auth'
import {
  getRecipes,
  getRecipeById,
  createRecipe,
  matchRecipesByIngredients,
  getComments,
  createComment,
  getFavorites,
  addFavorite,
  removeFavorite,
  isFavorited,
  getRelatedRecipes,
  getAllTags,
  Recipe,
} from './db'

const router = Router()

router.post('/auth/register', register)
router.post('/auth/login', login)
router.get('/auth/me', authenticateToken, getCurrentUser)

router.get('/recipes', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 12
    const tag = req.query.tag as string | undefined
    const search = req.query.search as string | undefined

    const result = getRecipes(page, limit, tag, search)

    const recipes = result.recipes.map((r: Recipe & { authorName?: string }) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      image: r.image,
      ingredients: JSON.parse(r.ingredients),
      steps: JSON.parse(r.steps),
      tags: JSON.parse(r.tags),
      authorId: r.author_id,
      authorName: r.authorName,
      rating: r.rating,
      ratingCount: r.rating_count,
      createdAt: r.created_at,
    }))

    res.json({
      recipes,
      total: result.total,
      hasMore: result.hasMore,
    })
  } catch (err) {
    console.error('获取食谱列表错误:', err)
    res.status(500).json({ error: '获取食谱列表失败' })
  }
})

router.get('/recipes/tags', (req: Request, res: Response) => {
  try {
    const tags = getAllTags()
    res.json({ tags })
  } catch (err) {
    console.error('获取标签错误:', err)
    res.status(500).json({ error: '获取标签失败' })
  }
})

router.get('/recipes/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id)
    const recipe = getRecipeById(id)

    if (!recipe) {
      return res.status(404).json({ error: '食谱不存在' })
    }

    res.json({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      image: recipe.image,
      ingredients: JSON.parse(recipe.ingredients),
      steps: JSON.parse(recipe.steps),
      tags: JSON.parse(recipe.tags),
      authorId: recipe.author_id,
      authorName: recipe.authorName,
      rating: recipe.rating,
      ratingCount: recipe.rating_count,
      createdAt: recipe.created_at,
    })
  } catch (err) {
    console.error('获取食谱详情错误:', err)
    res.status(500).json({ error: '获取食谱详情失败' })
  }
})

router.get('/recipes/:id/related', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id)
    const limit = parseInt(req.query.limit as string) || 6

    const recipes = getRelatedRecipes(id, limit)

    const result = recipes.map((r: Recipe & { authorName?: string }) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      image: r.image,
      ingredients: JSON.parse(r.ingredients),
      steps: JSON.parse(r.steps),
      tags: JSON.parse(r.tags),
      authorId: r.author_id,
      authorName: r.authorName,
      rating: r.rating,
      ratingCount: r.rating_count,
      createdAt: r.created_at,
    }))

    res.json({ recipes: result })
  } catch (err) {
    console.error('获取相关推荐错误:', err)
    res.status(500).json({ error: '获取相关推荐失败' })
  }
})

router.post('/recipes', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { title, description, image, ingredients, steps, tags } = req.body

    if (!title || !ingredients || !steps) {
      return res.status(400).json({ error: '标题、配料和步骤不能为空' })
    }

    const recipeId = createRecipe({
      title,
      description: description || '',
      image: image || '',
      ingredients: JSON.stringify(ingredients),
      steps: JSON.stringify(steps),
      tags: JSON.stringify(tags || []),
      authorId: req.userId!,
    })

    const recipe = getRecipeById(recipeId)

    if (!recipe) {
      return res.status(500).json({ error: '创建食谱失败' })
    }

    res.status(201).json({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      image: recipe.image,
      ingredients: JSON.parse(recipe.ingredients),
      steps: JSON.parse(recipe.steps),
      tags: JSON.parse(recipe.tags),
      authorId: recipe.author_id,
      authorName: recipe.authorName,
      rating: recipe.rating,
      ratingCount: recipe.rating_count,
      createdAt: recipe.created_at,
    })
  } catch (err) {
    console.error('创建食谱错误:', err)
    res.status(500).json({ error: '创建食谱失败' })
  }
})

router.post('/recipes/match', (req: Request, res: Response) => {
  try {
    const { ingredients } = req.body

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: '请输入至少一个食材' })
    }

    const matched = matchRecipesByIngredients(ingredients)

    const result = matched.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      image: r.image,
      ingredients: JSON.parse(r.ingredients),
      steps: JSON.parse(r.steps),
      tags: JSON.parse(r.tags),
      authorId: r.author_id,
      authorName: (r as any).authorName,
      rating: r.rating,
      ratingCount: r.rating_count,
      createdAt: r.created_at,
      matchScore: Math.round(r.matchScore * 100),
      matchedIngredients: r.matchedIngredients,
      missingIngredients: r.missingIngredients,
    }))

    res.json({ recipes: result })
  } catch (err) {
    console.error('食材匹配错误:', err)
    res.status(500).json({ error: '食材匹配失败' })
  }
})

router.get('/recipes/:id/comments', (req: Request, res: Response) => {
  try {
    const recipeId = parseInt(req.params.id)
    const comments = getComments(recipeId)

    const result = comments.map((c) => ({
      id: c.id,
      recipeId: c.recipe_id,
      userId: c.user_id,
      username: c.username,
      avatar: c.avatar,
      content: c.content,
      rating: c.rating,
      createdAt: c.created_at,
    }))

    res.json({ comments: result })
  } catch (err) {
    console.error('获取评论错误:', err)
    res.status(500).json({ error: '获取评论失败' })
  }
})

router.post('/recipes/:id/comments', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const recipeId = parseInt(req.params.id)
    const { content, rating } = req.body

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: '评论内容不能为空' })
    }

    const ratingNum = parseInt(rating as string) || 0

    const commentId = createComment(recipeId, req.userId!, content.trim(), ratingNum)

    const comments = getComments(recipeId)
    const newComment = comments.find((c) => c.id === commentId)

    if (!newComment) {
      return res.status(500).json({ error: '发布评论失败' })
    }

    res.status(201).json({
      comment: {
        id: newComment.id,
        recipeId: newComment.recipe_id,
        userId: newComment.user_id,
        username: newComment.username,
        avatar: newComment.avatar,
        content: newComment.content,
        rating: newComment.rating,
        createdAt: newComment.created_at,
      },
    })
  } catch (err) {
    console.error('发布评论错误:', err)
    res.status(500).json({ error: '发布评论失败' })
  }
})

router.get('/favorites', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const favorites = getFavorites(req.userId!)

    const result = favorites.map((r: Recipe & { authorName?: string }) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      image: r.image,
      ingredients: JSON.parse(r.ingredients),
      steps: JSON.parse(r.steps),
      tags: JSON.parse(r.tags),
      authorId: r.author_id,
      authorName: r.authorName,
      rating: r.rating,
      ratingCount: r.rating_count,
      createdAt: r.created_at,
    }))

    res.json({ recipes: result })
  } catch (err) {
    console.error('获取收藏错误:', err)
    res.status(500).json({ error: '获取收藏失败' })
  }
})

router.post('/favorites/:recipeId', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const recipeId = parseInt(req.params.recipeId)
    const success = addFavorite(req.userId!, recipeId)

    if (!success) {
      return res.status(400).json({ error: '已经收藏过该食谱' })
    }

    res.json({ message: '收藏成功' })
  } catch (err) {
    console.error('收藏错误:', err)
    res.status(500).json({ error: '收藏失败' })
  }
})

router.delete('/favorites/:recipeId', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const recipeId = parseInt(req.params.recipeId)
    const success = removeFavorite(req.userId!, recipeId)

    if (!success) {
      return res.status(404).json({ error: '未收藏该食谱' })
    }

    res.json({ message: '取消收藏成功' })
  } catch (err) {
    console.error('取消收藏错误:', err)
    res.status(500).json({ error: '取消收藏失败' })
  }
})

router.get('/favorites/:recipeId/check', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const recipeId = parseInt(req.params.recipeId)
    const favorited = isFavorited(req.userId!, recipeId)

    res.json({ favorited })
  } catch (err) {
    console.error('检查收藏状态错误:', err)
    res.status(500).json({ error: '检查收藏状态失败' })
  }
})

export default router
