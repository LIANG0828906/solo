import { useState, useEffect, useRef } from 'react'
import '../styles/workoutDetail.css'

interface Exercise {
  id: string
  name: string
  sets: number
  reps: number
  intensity: number
}

interface Workout {
  id: string
  name: string
  muscleGroup: string
  exercises: Exercise[]
}

interface WorkoutDetailProps {
  workoutId: string
  onBack: () => void
}

function WorkoutDetail({ workoutId, onBack }: WorkoutDetailProps) {
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)
  const [isTraining, setIsTraining] = useState(false)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [currentSet, setCurrentSet] = useState(0)
  const [completedSets, setCompletedSets] = useState<boolean[][]>([])
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showSummary, setShowSummary] = useState(false)
  const [summaryData, setSummaryData] = useState<{
    duration: number
    calories: number
    completionRate: number
  } | null>(null)
  const [progressAnimating, setProgressAnimating] = useState(false)
  const timerRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    fetchWorkout()
  }, [workoutId])

  useEffect(() => {
    if (isTraining) {
      startTimeRef.current = Date.now() - elapsedTime
      timerRef.current = window.setInterval(() => {
        setElapsedTime(Date.now() - startTimeRef.current)
      }, 10)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isTraining])

  const fetchWorkout = async () => {
    try {
      const res = await fetch(`/api/workouts/${workoutId}`)
      const data = await res.json()
      setWorkout(data)
      const initialSets = data.exercises.map(() =>
        new Array(data.exercises[0].sets).fill(false)
      )
      setCompletedSets(initialSets)
    } catch (error) {
      console.error('获取训练详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const startTraining = () => {
    setIsTraining(true)
    setElapsedTime(0)
    setCurrentExerciseIndex(0)
    setCurrentSet(0)
    if (workout) {
      const initialSets = workout.exercises.map((ex) =>
        new Array(ex.sets).fill(false)
      )
      setCompletedSets(initialSets)
    }
  }

  const completeSet = () => {
    if (!workout) return

    setProgressAnimating(true)

    setTimeout(() => {
      const newCompletedSets = completedSets.map((sets, i) => [...sets])
      newCompletedSets[currentExerciseIndex][currentSet] = true
      setCompletedSets(newCompletedSets)
      setProgressAnimating(false)

      const currentExercise = workout.exercises[currentExerciseIndex]

      if (currentSet < currentExercise.sets - 1) {
        setCurrentSet(currentSet + 1)
      } else if (currentExerciseIndex < workout.exercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1)
        setCurrentSet(0)
      } else {
        finishTraining(newCompletedSets)
      }
    }, 500)
  }

  const finishTraining = (finalSets: boolean[][]) => {
    if (!workout) return

    setIsTraining(false)

    const totalSets = workout.exercises.reduce(
      (sum, ex) => sum + ex.sets,
      0
    )
    const completedCount = finalSets.flat().filter(Boolean).length
    const completionRate = completedCount / totalSets

    const calories = workout.exercises.reduce(
      (sum, ex) => sum + ex.intensity * ex.sets * ex.reps,
      0
    )

    const durationMinutes = Math.ceil(elapsedTime / 60000)

    setSummaryData({
      duration: durationMinutes,
      calories,
      completionRate,
    })
    setShowSummary(true)

    saveRecord(durationMinutes, calories, completionRate)
  }

  const saveRecord = async (
    duration: number,
    calories: number,
    completionRate: number
  ) => {
    if (!workout) return

    try {
      await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutId: workout.id,
          workoutName: workout.name,
          date: new Date().toISOString().split('T')[0],
          duration,
          calories,
          completionRate,
          completedExercises: workout.exercises.length,
          totalExercises: workout.exercises.length,
        }),
      })
    } catch (error) {
      console.error('保存记录失败:', error)
    }
  }

  const closeSummary = () => {
    setShowSummary(false)
    setSummaryData(null)
  }

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const milliseconds = Math.floor((ms % 1000) / 10)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
  }

  const isExerciseComplete = (index: number) => {
    if (!workout) return false
    return completedSets[index]?.every(Boolean) || false
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="error-state">
        <p>训练计划不存在</p>
        <button className="btn-primary" onClick={onBack}>
          返回列表
        </button>
      </div>
    )
  }

  if (isTraining) {
    const currentExercise = workout.exercises[currentExerciseIndex]
    const progress = (currentSet / currentExercise.sets) * 100

    return (
      <div className="training-mode">
        <div className="training-header">
          <div className="training-timer">
            <span className="timer-label">训练时长</span>
            <span className="timer-value">{formatTime(elapsedTime)}</span>
          </div>
          <div className="training-progress">
            {currentExerciseIndex + 1} / {workout.exercises.length}
          </div>
        </div>

        <div className="training-content">
          <div
            className={`training-exercise-card ${isExerciseComplete(currentExerciseIndex) ? 'completed' : ''}`}
          >
            <h2 className="exercise-name">{currentExercise.name}</h2>
            <div className="exercise-info">
              <span>
                {currentExercise.sets}组 × {currentExercise.reps}次
              </span>
            </div>

            <div className="sets-progress">
              {Array.from({ length: currentExercise.sets }).map((_, i) => (
                <div
                  key={i}
                  className={`set-dot ${i < currentSet || completedSets[currentExerciseIndex]?.[i] ? 'done' : ''} ${i === currentSet && !progressAnimating ? 'current' : ''}`}
                />
              ))}
            </div>

            <div className="progress-bar-container">
              <div
                className={`progress-bar ${progressAnimating ? 'animating' : ''}`}
                style={{ width: `${progressAnimating ? 100 : progress}%` }}
              />
            </div>

            <div className="current-set-info">
              第 {currentSet + 1} 组 / 共 {currentExercise.sets} 组
            </div>

            <button
              className="btn-complete-set"
              onClick={completeSet}
              disabled={progressAnimating}
            >
              {progressAnimating ? '完成中...' : '完成一组'}
            </button>
          </div>
        </div>

        <div className="training-warning">
          <p>训练中请勿退出，保持专注！</p>
        </div>
      </div>
    )
  }

  return (
    <div className="workout-detail">
      <button className="btn-back" onClick={onBack}>
        ← 返回列表
      </button>

      <div className="detail-header">
        <h1>{workout.name}</h1>
        <p className="muscle-group">目标肌群：{workout.muscleGroup}</p>
      </div>

      <div className="exercises-list">
        <h2>动作列表</h2>
        {workout.exercises.map((exercise, index) => (
          <div key={exercise.id} className="exercise-card">
            <div className="exercise-number">{index + 1}</div>
            <div className="exercise-details">
              <h3>{exercise.name}</h3>
              <p>
                {exercise.sets} 组 × {exercise.reps} 次
              </p>
            </div>
            <div className="exercise-intensity">
              <span className="intensity-label">强度</span>
              <div className="intensity-bar">
                <div
                  className="intensity-fill"
                  style={{ width: `${exercise.intensity * 10}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="start-section">
        <button className="btn-start-training" onClick={startTraining}>
          开始训练
        </button>
      </div>

      {showSummary && summaryData && (
        <div className="summary-overlay">
          <div className="summary-panel">
            <div className="summary-icon">🎉</div>
            <h2>太棒了，继续坚持！</h2>

            <div className="summary-stats">
              <div className="summary-stat">
                <span className="stat-value">{summaryData.duration}</span>
                <span className="stat-label">分钟</span>
              </div>
              <div className="summary-stat">
                <span className="stat-value">{summaryData.calories}</span>
                <span className="stat-label">卡路里</span>
              </div>
              <div className="summary-stat">
                <span className="stat-value">
                  {Math.round(summaryData.completionRate * 100)}%
                </span>
                <span className="stat-label">完成度</span>
              </div>
            </div>

            <button className="btn-summary-confirm" onClick={closeSummary}>
              确认
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkoutDetail
