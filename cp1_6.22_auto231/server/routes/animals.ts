import { Router } from 'express'
import { store } from '../data/store'

const router = Router()

router.get('/', (req, res) => {
  const animals = store.getAnimals()
  res.json(animals)
})

router.get('/:id', (req, res) => {
  const animal = store.getAnimalById(req.params.id)
  if (!animal) {
    res.status(404).json({ error: 'Animal not found' })
    return
  }
  res.json(animal)
})

router.post('/', (req, res) => {
  const {
    name, breed, age, gender, weight, color,
    vaccinated, neutered, intakeDate, description, status
  } = req.body

  if (!name || !breed || age === undefined || !gender || weight === undefined) {
    res.status(400).json({ error: 'Missing required fields' })
    return
  }

  const animal = store.createAnimal({
    name,
    breed,
    age: Number(age),
    gender,
    weight: Number(weight),
    color: color || '',
    vaccinated: Boolean(vaccinated),
    neutered: Boolean(neutered),
    intakeDate: intakeDate || new Date().toISOString().split('T')[0],
    description: description || '',
    status: status || 'available'
  })

  res.status(201).json(animal)
})

router.put('/:id', (req, res) => {
  const animal = store.updateAnimal(req.params.id, req.body)
  if (!animal) {
    res.status(404).json({ error: 'Animal not found' })
    return
  }
  res.json(animal)
})

router.delete('/:id', (req, res) => {
  const deleted = store.deleteAnimal(req.params.id)
  if (!deleted) {
    res.status(404).json({ error: 'Animal not found' })
    return
  }
  res.status(204).send()
})

export default router
