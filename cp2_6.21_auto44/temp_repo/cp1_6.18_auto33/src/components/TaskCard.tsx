import { useRef, useState } from 'react'
import type { SkillNode, Task } from '@/types'
import { useSkillTreeStore } from '@/store/skillTreeStore'
import { DIFFICULTY_LABEL, DIFFICULTY_XP, getCategoryColor } from '@/utils/mockApi'
import { ParticleEffect } from './ParticleEffect'
import './TaskCard.css'

interface TaskCardProps {
  node: SkillNode
  task: Task
}

export const TaskCard = ({ node, task }: TaskCardProps) => {
  const { completeTask, deleteTask, editTask } = useSkillTreeStore()
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([])
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editDueDate, setEditDueDate] = useState(task.dueDate)
  const [editDifficulty, setEditDifficulty] = useState(task.difficulty)
  const cardRef = useRef<HTMLDivElement>(null)
  const particleIdRef = useRef(0)

  const handleComplete = () => {
    if (task.completed) return
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      particleIdRef.current += 1
      setParticles((prev) => [
        ...prev,
        {
          id: particleIdRef.current,
          x: rect.width / 2,
          y: rect.height / 2,
          color: getCategoryColor(task.category),
        },
      ])
    }
    completeTask(node.id, task.id)
  }

  const handleSave = () => {
    if (editTitle.trim()) {
      editTask(node.id, task.id, editTitle.trim(), editDueDate, editDifficulty)
    }
    setEditing(false)
  }

  const removeParticle = (id: number) => {
    setParticles((prev) => prev.filter((p) => p.id !== id))
  }

  const categoryColor = getCategoryColor(task.category)

  if (editing) {
    return (
      <div className="task-card editing" ref={cardRef}>
        <input
          className="edit-input"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="任务标题"
        />
        <input
          type="date"
          className="edit-input"
          value={editDueDate}
          onChange={(e) => setEditDueDate(e.target.value)}
        />
        <select
          className="edit-input"
          value={editDifficulty}
          onChange={(e) => setEditDifficulty(e.target.value as Task['difficulty'])}
        >
          <option value="easy">简单 (5 XP)</option>
          <option value="medium">中等 (10 XP)</option>
          <option value="hard">困难 (20 XP)</option>
        </select>
        <div className="edit-actions">
          <button className="btn btn-primary" onClick={handleSave}>
            保存
          </button>
          <button className="btn btn-ghost" onClick={() => setEditing(false)}>
            取消
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`task-card ${task.completed ? 'completed' : ''}`}
      ref={cardRef}
      style={{ borderColor: task.completed ? '#3A3A5C' : `${categoryColor}40` }}
    >
      <div className="task-header">
        <button
          className={`checkbox ${task.completed ? 'checked' : ''}`}
          onClick={handleComplete}
          style={{ borderColor: categoryColor }}
          aria-label="完成任务"
        >
          {task.completed && '✓'}
        </button>
        <div className="task-title">{task.title}</div>
      </div>
      <div className="task-meta">
        <span className="task-date">📅 {task.dueDate}</span>
        <span
          className="task-difficulty"
          style={{ backgroundColor: `${categoryColor}25`, color: categoryColor }}
        >
          {DIFFICULTY_LABEL[task.difficulty]} · +{DIFFICULTY_XP[task.difficulty]}XP
        </span>
      </div>
      {!task.completed && (
        <div className="task-actions">
          <button className="task-btn" onClick={() => setEditing(true)}>
            ✏️
          </button>
          <button className="task-btn delete" onClick={() => deleteTask(node.id, task.id)}>
            🗑️
          </button>
        </div>
      )}
      {particles.map((p) => (
        <ParticleEffect
          key={p.id}
          x={p.x}
          y={p.y}
          color={p.color}
          onComplete={() => removeParticle(p.id)}
        />
      ))}
    </div>
  )
}
