import express from 'express'
import cors from 'cors'
import { dataStore } from './dataStore'

const app = express()
const PORT = 3002

app.use(cors())
app.use(express.json())

app.get('/api/workouts', (req, res) => {
  const workouts = dataStore.getAllWorkouts()
  const workoutsWithStats = workouts.map((workout) => ({
    ...workout,
    weeklyCompletion: dataStore.getWeeklyCompletion(workout.id),
    exerciseCount: workout.exercises.length,
  }))
  res.json(workoutsWithStats)
})

app.get('/api/workouts/:id', (req, res) => {
  const workout = dataStore.getWorkoutById(req.params.id)
  if (workout) {
    res.json(workout)
  } else {
    res.status(404).json({ error: '训练计划不存在' })
  }
})

app.post('/api/workouts', (req, res) => {
  const { name, muscleGroup, exercises } = req.body
  if (!name || !muscleGroup || !exercises || !Array.isArray(exercises)) {
    return res.status(400).json({ error: '缺少必要参数' })
  }
  const workout = dataStore.createWorkout({ name, muscleGroup, exercises })
  res.status(201).json(workout)
})

app.delete('/api/workouts/:id', (req, res) => {
  const deleted = dataStore.deleteWorkout(req.params.id)
  if (deleted) {
    res.json({ success: true })
  } else {
    res.status(404).json({ error: '训练计划不存在' })
  }
})

app.post('/api/records', (req, res) => {
  const record = dataStore.addWorkoutRecord(req.body)
  res.status(201).json(record)
})

app.get('/api/stats/weekly', (req, res) => {
  const stats = dataStore.getWeeklyStats()
  res.json(stats)
})

app.get('/api/stats/monthly', (req, res) => {
  const stats = dataStore.getMonthlyStats()
  res.json(stats)
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
