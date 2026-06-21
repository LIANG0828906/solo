import { v4 as uuidv4 } from 'uuid'

export interface Exercise {
  id: string
  name: string
  sets: number
  reps: number
  intensity: number
}

export interface Workout {
  id: string
  name: string
  muscleGroup: string
  exercises: Exercise[]
  createdAt: string
}

export interface WorkoutRecord {
  id: string
  workoutId: string
  workoutName: string
  date: string
  duration: number
  calories: number
  completionRate: number
  completedExercises: number
  totalExercises: number
}

class DataStore {
  private workouts: Workout[] = []
  private records: WorkoutRecord[] = []

  constructor() {
    this.initializeSampleData()
  }

  private initializeSampleData() {
    const sampleWorkouts: Workout[] = [
      {
        id: uuidv4(),
        name: '胸部力量训练',
        muscleGroup: '胸',
        exercises: [
          { id: uuidv4(), name: '平板卧推', sets: 4, reps: 10, intensity: 8 },
          { id: uuidv4(), name: '上斜哑铃飞鸟', sets: 3, reps: 12, intensity: 6 },
          { id: uuidv4(), name: '俯卧撑', sets: 3, reps: 15, intensity: 5 },
        ],
        createdAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        name: '背部塑形训练',
        muscleGroup: '背',
        exercises: [
          { id: uuidv4(), name: '引体向上', sets: 4, reps: 8, intensity: 9 },
          { id: uuidv4(), name: '哑铃划船', sets: 4, reps: 12, intensity: 7 },
          { id: uuidv4(), name: '坐姿下拉', sets: 3, reps: 12, intensity: 6 },
        ],
        createdAt: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        name: '腿部力量训练',
        muscleGroup: '腿',
        exercises: [
          { id: uuidv4(), name: '深蹲', sets: 5, reps: 10, intensity: 9 },
          { id: uuidv4(), name: '腿举', sets: 4, reps: 12, intensity: 8 },
          { id: uuidv4(), name: '腿弯举', sets: 3, reps: 15, intensity: 5 },
        ],
        createdAt: new Date().toISOString(),
      },
    ]

    this.workouts = sampleWorkouts

    const now = new Date()
    for (let i = 0; i < 20; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      if (Math.random() > 0.4) {
        const workout = sampleWorkouts[Math.floor(Math.random() * sampleWorkouts.length)]
        const duration = 30 + Math.floor(Math.random() * 60)
        const calories = this.calculateCalories(workout.exercises)
        this.records.push({
          id: uuidv4(),
          workoutId: workout.id,
          workoutName: workout.name,
          date: date.toISOString().split('T')[0],
          duration,
          calories,
          completionRate: 0.7 + Math.random() * 0.3,
          completedExercises: workout.exercises.length,
          totalExercises: workout.exercises.length,
        })
      }
    }
  }

  private calculateCalories(exercises: Exercise[]): number {
    return exercises.reduce((total, ex) => total + ex.intensity * ex.sets * ex.reps, 0)
  }

  getAllWorkouts(): Workout[] {
    return this.workouts
  }

  getWorkoutById(id: string): Workout | undefined {
    return this.workouts.find((w) => w.id === id)
  }

  createWorkout(data: Omit<Workout, 'id' | 'createdAt'>): Workout {
    const workout: Workout = {
      id: uuidv4(),
      ...data,
      exercises: data.exercises.map((ex) => ({ ...ex, id: uuidv4() })),
      createdAt: new Date().toISOString(),
    }
    this.workouts.push(workout)
    return workout
  }

  deleteWorkout(id: string): boolean {
    const index = this.workouts.findIndex((w) => w.id === id)
    if (index !== -1) {
      this.workouts.splice(index, 1)
      return true
    }
    return false
  }

  addWorkoutRecord(record: Omit<WorkoutRecord, 'id'>): WorkoutRecord {
    const newRecord: WorkoutRecord = {
      id: uuidv4(),
      ...record,
    }
    this.records.push(newRecord)
    return newRecord
  }

  getWeeklyStats() {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const weeklyRecords = this.records.filter((r) => {
      const recordDate = new Date(r.date)
      return recordDate >= weekStart
    })

    const workoutsThisWeek = new Set(weeklyRecords.map((r) => r.date)).size

    const weekDays: { date: string; duration: number }[] = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart)
      day.setDate(weekStart.getDate() + i)
      const dateStr = day.toISOString().split('T')[0]
      const dayRecords = weeklyRecords.filter((r) => r.date === dateStr)
      const totalDuration = dayRecords.reduce((sum, r) => sum + r.duration, 0)
      weekDays.push({ date: dateStr, duration: totalDuration })
    }

    return {
      workoutsThisWeek,
      weekDays,
    }
  }

  getMonthlyStats() {
    const now = new Date()
    const days: { date: string; exercises: number }[] = []

    for (let i = 29; i >= 0; i--) {
      const day = new Date(now)
      day.setDate(now.getDate() - i)
      const dateStr = day.toISOString().split('T')[0]
      const dayRecords = this.records.filter((r) => r.date === dateStr)
      const totalExercises = dayRecords.reduce((sum, r) => sum + r.completedExercises, 0)
      days.push({ date: dateStr, exercises: totalExercises })
    }

    return days
  }

  getWeeklyCompletion(workoutId: string): number {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)

    return this.records.filter(
      (r) => r.workoutId === workoutId && new Date(r.date) >= weekStart
    ).length
  }
}

export const dataStore = new DataStore()
