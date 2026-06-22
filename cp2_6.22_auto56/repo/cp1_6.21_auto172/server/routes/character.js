import { Router } from 'express'
import { getCharacter, getAllCharacters, updateCharacter } from '../store/gameStore.js'

const router = Router()

router.get('/', (req, res) => {
  res.json({ success: true, data: getAllCharacters() })
})

router.get('/:id', (req, res) => {
  const char = getCharacter(req.params.id)
  if (!char) return res.status(404).json({ success: false, error: 'Character not found' })
  res.json({ success: true, data: char })
})

router.put('/:id', (req, res) => {
  const updated = updateCharacter(req.params.id, req.body)
  if (!updated) return res.status(404).json({ success: false, error: 'Character not found' })
  res.json({ success: true, data: updated })
})

export default router
