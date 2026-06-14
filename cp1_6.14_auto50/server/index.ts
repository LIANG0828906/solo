import express from 'express'
import cors from 'cors'
import {
  initDb,
  getAllActivities,
  getActivityById,
  createActivity,
  addBlessing,
  likeBlessing,
  updateActivity,
  type Activity,
} from './lowdb.js'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))

interface ActivityListItem {
  id: string
  birthdayPerson: string
  birthdayDate: string
  deadline: string
  isPublic: boolean
  createdAt: string
  blessingCount: number
  participantCount: number
}

function toListItem(activity: Activity): ActivityListItem {
  const participants = new Set(activity.blessings.map((b) => b.nickname))
  return {
    id: activity.id,
    birthdayPerson: activity.birthdayPerson,
    birthdayDate: activity.birthdayDate,
    deadline: activity.deadline,
    isPublic: activity.isPublic,
    createdAt: activity.createdAt,
    blessingCount: activity.blessings.length,
    participantCount: participants.size,
  }
}

app.get('/api/activities', async (req, res) => {
  const activities = await getAllActivities()
  const search = (req.query.search as string || '').toLowerCase()
  const visibility = req.query.visibility as string

  let filtered = activities

  if (search) {
    filtered = filtered.filter((a) =>
      a.birthdayPerson.toLowerCase().includes(search)
    )
  }

  if (visibility === 'public') {
    filtered = filtered.filter((a) => a.isPublic)
  } else if (visibility === 'private') {
    filtered = filtered.filter((a) => !a.isPublic)
  }

  const sorted = filtered.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  res.json(sorted.map(toListItem))
})

app.get('/api/activities/:id', async (req, res) => {
  const activity = await getActivityById(req.params.id)
  if (!activity) {
    return res.status(404).json({ error: 'Activity not found' })
  }
  res.json(activity)
})

app.post('/api/activities', async (req, res) => {
  const { birthdayPerson, birthdayDate, deadline, isPublic, creatorToken } = req.body

  if (!birthdayPerson || !birthdayDate || !deadline || !creatorToken) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const deadlineDate = new Date(deadline)
  const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000)
  if (deadlineDate < oneHourFromNow) {
    return res.status(400).json({ error: 'Deadline must be at least 1 hour from now' })
  }

  const activity = await createActivity({
    birthdayPerson,
    birthdayDate,
    deadline,
    isPublic: isPublic ?? true,
    creatorToken,
  })

  res.status(201).json(activity)
})

app.patch('/api/activities/:id', async (req, res) => {
  const activity = await getActivityById(req.params.id)
  if (!activity) {
    return res.status(404).json({ error: 'Activity not found' })
  }

  const { creatorToken, ...updates } = req.body
  if (creatorToken !== activity.creatorToken) {
    return res.status(403).json({ error: 'Invalid creator token' })
  }

  const updated = await updateActivity(req.params.id, updates)
  res.json(updated)
})

app.post('/api/activities/:id/blessings', async (req, res) => {
  const activity = await getActivityById(req.params.id)
  if (!activity) {
    return res.status(404).json({ error: 'Activity not found' })
  }

  if (new Date() > new Date(activity.deadline)) {
    return res.status(400).json({ error: 'Deadline has passed' })
  }

  const { nickname, content, mediaType, mediaData } = req.body

  if (!nickname || !content) {
    return res.status(400).json({ error: 'Nickname and content are required' })
  }

  if (content.length > 200) {
    return res.status(400).json({ error: 'Content must be 200 characters or less' })
  }

  const blessing = await addBlessing(req.params.id, {
    nickname,
    content,
    mediaType,
    mediaData,
  })

  if (!blessing) {
    return res.status(500).json({ error: 'Failed to add blessing' })
  }

  res.status(201).json(blessing)
})

app.get('/api/activities/:id/blessings', async (req, res) => {
  const activity = await getActivityById(req.params.id)
  if (!activity) {
    return res.status(404).json({ error: 'Activity not found' })
  }

  const page = Math.max(1, parseInt(req.query.page as string) || 1)
  const limit = Math.max(1, parseInt(req.query.limit as string) || 20)
  const start = (page - 1) * limit
  const end = start + limit

  const paginatedBlessings = activity.blessings.slice(start, end)

  res.json({
    blessings: paginatedBlessings,
    total: activity.blessings.length,
    page,
    limit,
    hasMore: end < activity.blessings.length,
  })
})

app.post('/api/activities/:activityId/blessings/:blessingId/like', async (req, res) => {
  const { sessionId } = req.body
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' })
  }

  const result = await likeBlessing(req.params.activityId, req.params.blessingId, sessionId)
  if (!result) {
    return res.status(400).json({ error: 'Cannot like this blessing (max likes reached or not found)' })
  }

  res.json(result)
})

app.get('/api/celebrations/:id', async (req, res) => {
  const activity = await getActivityById(req.params.id)
  if (!activity) {
    return res.status(404).json({ error: 'Activity not found' })
  }

  const today = new Date()
  const birthday = new Date(activity.birthdayDate)
  const isBirthdayToday =
    today.getMonth() === birthday.getMonth() &&
    today.getDate() === birthday.getDate()

  res.json({ ...activity, isBirthdayToday })
})

async function start() {
  await initDb()
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

start()
