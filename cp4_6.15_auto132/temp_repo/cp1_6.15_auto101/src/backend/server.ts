import express from 'express'
import cors from 'cors'
import {
  getGames,
  getGameById,
  getReviewsByGameId,
  getAverageRating,
  addGame,
  addReview,
  getAllTags,
  searchGames,
  filterGamesByTag,
  AVAILABLE_TAGS,
  mockUsers,
} from './data'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.get('/api/games', (req, res) => {
  const { tag, search, sort } = req.query as {
    tag?: string
    search?: string
    sort?: string
  }

  let result = getGames()

  if (tag) {
    result = filterGamesByTag(tag)
  }

  if (search) {
    result = searchGames(search)
  }

  if (sort === 'rating') {
    result = [...result].sort(
      (a, b) => getAverageRating(b.id) - getAverageRating(a.id)
    )
  } else if (sort === 'newest') {
    result = [...result].sort((a, b) => b.createdAt - a.createdAt)
  }

  const gamesWithRating = result.map((game) => ({
    ...game,
    averageRating: getAverageRating(game.id),
    reviewCount: getReviewsByGameId(game.id).length,
  }))

  res.json(gamesWithRating)
})

app.get('/api/games/:id', (req, res) => {
  const game = getGameById(req.params.id)
  if (!game) {
    res.status(404).json({ error: 'Game not found' })
    return
  }
  res.json({
    ...game,
    averageRating: getAverageRating(game.id),
    reviewCount: getReviewsByGameId(game.id).length,
  })
})

app.get('/api/games/:id/reviews', (req, res) => {
  const reviews = getReviewsByGameId(req.params.id)
  res.json(reviews)
})

app.post('/api/games', (req, res) => {
  const {
    title,
    developer,
    description,
    screenshots,
    thumbnail,
    htmlPrototype,
    tags,
  } = req.body

  if (!title || !developer) {
    res.status(400).json({ error: 'Title and developer are required' })
    return
  }

  const newGame = addGame({
    title,
    developer,
    description: description || '',
    screenshots: screenshots || [],
    thumbnail: thumbnail || '',
    htmlPrototype: htmlPrototype || '',
    tags: tags || [],
  })

  res.status(201).json(newGame)
})

app.post('/api/games/:id/reviews', (req, res) => {
  const { userId, content, rating, tags } = req.body
  const gameId = req.params.id

  const game = getGameById(gameId)
  if (!game) {
    res.status(404).json({ error: 'Game not found' })
    return
  }

  if (!userId || !content || rating === undefined) {
    res
      .status(400)
      .json({ error: 'userId, content, and rating are required' })
    return
  }

  if (rating < 1 || rating > 5) {
    res.status(400).json({ error: 'Rating must be between 1 and 5' })
    return
  }

  if (content.length > 280) {
    res.status(400).json({ error: 'Content must be 280 characters or less' })
    return
  }

  const user = mockUsers.find((u) => u.id === userId)
  if (!user) {
    res.status(400).json({ error: 'Invalid userId' })
    return
  }

  const newReview = addReview({
    gameId,
    userId,
    userName: user.name,
    content,
    rating,
    tags: tags || [],
  })

  res.status(201).json(newReview)
})

app.get('/api/tags', (_req, res) => {
  res.json(AVAILABLE_TAGS)
})

app.get('/api/users', (_req, res) => {
  res.json(mockUsers)
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})

export default app
