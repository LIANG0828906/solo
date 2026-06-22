import { Router } from 'express'
import { store } from '../data/store'

const router = Router()

router.get('/animal/:animalId', (req, res) => {
  const followups = store.getFollowupsByAnimalId(req.params.animalId)
  res.json(followups)
})

router.post('/', (req, res) => {
  const { animalId, date, status, notes } = req.body

  if (!animalId || !date || !status) {
    res.status(400).json({ error: 'Missing required fields' })
    return
  }

  const animal = store.getAnimalById(animalId)
  if (!animal) {
    res.status(404).json({ error: 'Animal not found' })
    return
  }

  const followup = store.createFollowup({
    animalId,
    date,
    status,
    notes: notes || ''
  })

  res.status(201).json(followup)
})

export default router
