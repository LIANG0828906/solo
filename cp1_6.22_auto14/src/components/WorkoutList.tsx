import { useState, useEffect } from 'react'
import '../styles/workoutList.css'

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
  weeklyCompletion: number
  exerciseCount: number
}

interface WorkoutListProps {
  onSelectWorkout: (id: string) => void
}

const muscleGroupIcons: Record<string, string> = {
  '胸': '💪',
  '背': '🦴',
  '腿': '🦵',
  '肩': '🏋️',
  '手臂': '💪',
  '核心': '🎯',
}

function WorkoutList({ onSelectWorkout }: WorkoutListProps) {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    muscleGroup: '胸',
    exercises: [{ name: '', sets: 3, reps: 10, intensity: 5 }],
  })
  const [loading, setLoading] = useState(true)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  useEffect(() => {
    fetchWorkouts()
  }, [])

  const fetchWorkouts = async () => {
    try {
      const res = await fetch('/api/workouts')
      const data = await res.json()
      setWorkouts(data)
    } catch (error) {
      console.error('获取训练计划失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWorkout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    if (formData.exercises.some((ex) => !ex.name.trim())) return

    try {
      const res = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        await fetchWorkouts()
        setShowForm(false)
        setFormData({
          name: '',
          muscleGroup: '胸',
          exercises: [{ name: '', sets: 3, reps: 10, intensity: 5 }],
        })
      }
    } catch (error) {
      console.error('创建训练计划失败:', error)
    }
  }

  const handleDeleteWorkout = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('确定要删除这个训练计划吗？')) return

    try {
      const res = await fetch(`/api/workouts/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setWorkouts(workouts.filter((w) => w.id !== id))
      }
    } catch (error) {
      console.error('删除训练计划失败:', error)
    }
  }

  const addExercise = () => {
    setFormData({
      ...formData,
      exercises: [...formData.exercises, { name: '', sets: 3, reps: 10, intensity: 5 }],
    })
  }

  const removeExercise = (index: number) => {
    if (formData.exercises.length <= 1) return
    setFormData({
      ...formData,
      exercises: formData.exercises.filter((_, i) => i !== index),
    })
  }

  const updateExercise = (index: number, field: string, value: string | number) => {
    const newExercises = [...formData.exercises]
    newExercises[index] = { ...newExercises[index], [field]: value }
    setFormData({ ...formData, exercises: newExercises })
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="workout-list">
      <div className="page-header">
        <h1>训练计划</h1>
        <button
          className="btn-primary create-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '取消' : '+ 创建计划'}
        </button>
      </div>

      <div className={`create-form-container ${showForm ? 'expanded' : ''}`}>
        {showForm && (
          <form className="create-form" onSubmit={handleCreateWorkout}>
            <h2>新建训练计划</h2>

            <div className="form-group">
              <label>计划名称</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                className={focusedField === 'name' ? 'focused' : ''}
                placeholder="输入训练计划名称"
                required
              />
            </div>

            <div className="form-group">
              <label>目标肌群</label>
              <select
                value={formData.muscleGroup}
                onChange={(e) => setFormData({ ...formData, muscleGroup: e.target.value })}
                onFocus={() => setFocusedField('muscle')}
                onBlur={() => setFocusedField(null)}
                className={focusedField === 'muscle' ? 'focused' : ''}
              >
                <option value="胸">胸</option>
                <option value="背">背</option>
                <option value="腿">腿</option>
                <option value="肩">肩</option>
                <option value="手臂">手臂</option>
                <option value="核心">核心</option>
              </select>
            </div>

            <div className="exercises-section">
              <div className="section-header">
                <h3>动作列表</h3>
                <button
                  type="button"
                  className="btn-add-exercise"
                  onClick={addExercise}
                >
                  + 添加动作
                </button>
              </div>

              {formData.exercises.map((exercise, index) => (
                <div key={index} className="exercise-row">
                  <div className="exercise-name-input">
                    <input
                      type="text"
                      value={exercise.name}
                      onChange={(e) => updateExercise(index, 'name', e.target.value)}
                      onFocus={() => setFocusedField(`ex-name-${index}`)}
                      onBlur={() => setFocusedField(null)}
                      className={focusedField === `ex-name-${index}` ? 'focused' : ''}
                      placeholder="动作名称"
                      required
                    />
                  </div>
                  <div className="exercise-numbers">
                    <div className="number-input">
                      <label>组数</label>
                      <input
                        type="number"
                        min="3"
                        max="5"
                        value={exercise.sets}
                        onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 3)}
                        onFocus={() => setFocusedField(`ex-sets-${index}`)}
                        onBlur={() => setFocusedField(null)}
                        className={focusedField === `ex-sets-${index}` ? 'focused' : ''}
                      />
                    </div>
                    <div className="number-input">
                      <label>次数</label>
                      <input
                        type="number"
                        min="8"
                        max="15"
                        value={exercise.reps}
                        onChange={(e) => updateExercise(index, 'reps', parseInt(e.target.value) || 10)}
                        onFocus={() => setFocusedField(`ex-reps-${index}`)}
                        onBlur={() => setFocusedField(null)}
                        className={focusedField === `ex-reps-${index}` ? 'focused' : ''}
                      />
                    </div>
                    {formData.exercises.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove-exercise"
                        onClick={() => removeExercise(index)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button type="submit" className="btn-submit">
              创建训练计划
            </button>
          </form>
        )}
      </div>

      <div className="workouts-grid">
        {workouts.length === 0 ? (
          <div className="empty-state">
            <p>还没有训练计划，点击上方按钮创建一个吧！</p>
          </div>
        ) : (
          workouts.map((workout) => (
            <div
              key={workout.id}
              className="workout-card"
              onClick={() => onSelectWorkout(workout.id)}
            >
              <div className="card-left">
                <div className="muscle-icon">
                  {muscleGroupIcons[workout.muscleGroup] || '🏋️'}
                </div>
                <div className="card-info">
                  <h3 className="card-title">{workout.name}</h3>
                  <p className="card-muscle">{workout.muscleGroup}</p>
                </div>
              </div>
              <div className="card-right">
                <div className="card-stats">
                  <div className="stat-item">
                    <span className="stat-value">{workout.exerciseCount}</span>
                    <span className="stat-label">动作</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value highlight">
                      {workout.weeklyCompletion}
                    </span>
                    <span className="stat-label">本周完成</span>
                  </div>
                </div>
                <button
                  className="btn-delete"
                  onClick={(e) => handleDeleteWorkout(workout.id, e)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default WorkoutList
