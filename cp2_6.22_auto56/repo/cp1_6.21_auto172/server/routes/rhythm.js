import { Router } from 'express'
import { getLevelProgress, updateLevelProgress, saveCombo, getHealthTimeline, saveHealthTimeline } from '../store/gameStore.js'

const router = Router()

router.get('/progress/:levelId', (req, res) => {
  res.json({ success: true, data: getLevelProgress(req.params.levelId) })
})

router.put('/progress/:levelId', (req, res) => {
  const updated = updateLevelProgress(req.params.levelId, req.body)
  res.json({ success: true, data: updated })
})

router.post('/combo', (req, res) => {
  const { comboCount, levelId, timestamp } = req.body
  const result = saveCombo(comboCount, levelId, timestamp || Date.now())
  res.json({ success: true, data: result })
})

router.get('/health-timeline/:levelId', (req, res) => {
  res.json({ success: true, data: getHealthTimeline(req.params.levelId) })
})

router.post('/health-timeline', (req, res) => {
  const { levelId, timeline } = req.body
  const result = saveHealthTimeline(levelId, timeline)
  res.json({ success: true, data: result })
})

export default router
