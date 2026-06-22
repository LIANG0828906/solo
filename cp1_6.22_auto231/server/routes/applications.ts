import { Router } from 'express'
import { store } from '../data/store'

const router = Router()

router.get('/', (req, res) => {
  const applications = store.getApplications()
  res.json(applications)
})

router.get('/:id', (req, res) => {
  const app = store.getApplicationById(req.params.id)
  if (!app) {
    res.status(404).json({ error: 'Application not found' })
    return
  }
  res.json(app)
})

router.post('/', (req, res) => {
  const {
    animalId, animalName, applicantName, contact,
    housing, hasOtherPets, reason
  } = req.body

  if (!animalId || !applicantName || !contact || !reason) {
    res.status(400).json({ error: 'Missing required fields' })
    return
  }

  const animal = store.getAnimalById(animalId)
  if (!animal) {
    res.status(404).json({ error: 'Animal not found' })
    return
  }

  const application = store.createApplication({
    animalId,
    animalName: animalName || animal.name,
    applicantName,
    contact,
    housing: housing || 'rent',
    hasOtherPets: Boolean(hasOtherPets),
    reason
  })

  res.status(201).json(application)
})

router.patch('/:id/status', (req, res) => {
  const { status } = req.body
  if (!status || !['approved', 'rejected'].includes(status)) {
    res.status(400).json({ error: 'Invalid status' })
    return
  }

  const app = store.updateApplicationStatus(req.params.id, status)
  if (!app) {
    res.status(404).json({ error: 'Application not found' })
    return
  }

  if (status === 'approved') {
    store.updateAnimal(app.animalId, { status: 'adopted' })
    console.log(`[邮件通知] 申请已通过 - 申请人: ${app.applicantName}, 动物: ${app.animalName}`)
  }

  res.json(app)
})

export default router
