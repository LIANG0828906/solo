import { useState, useEffect } from 'react'
import { Task, useBoardStore } from '../store/boardStore'
import { useTimerStore } from '../store/timerStore'

const priorityColors: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444', label: '高' },
  medium: { bg: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b', label: '中' },
  low: { bg: 'rgba(16, 185, 129, 0.2)', text: '#10b981', label: '低' },
}

const EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'

interface TaskCardProps {
  task: Task
}

export default function TaskCard({ task }: TaskCardProps) {
  const [newSubTask, setNewSubTask] = useState('')
  const [isAnimatingFlyIn, setIsAnimatingFlyIn] = useState(false)
  const {
    expandedTaskId,
    toggleExpand,
    toggleSubTask,
    addSubTask,
    flyingTaskIds,
  } = useBoardStore()
  const { activeTaskId, setActiveTaskId } = useTimerStore()

  const isExpanded = expandedTaskId === task.id
  const isActive = activeTaskId === task.id
  const isFlying = flyingTaskIds.includes(task.id)

  useEffect(() => {
    if (isFlying && !isAnimatingFlyIn) {
      setIsAnimatingFlyIn(true)
      const timer = setTimeout(() => {
        setIsAnimatingFlyIn(false)
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [isFlying, isAnimatingFlyIn])

  const completedSubTasks = task.subTasks.filter((st) => st.completed).length
  const progress = task.subTasks.length > 0
    ? Math.round((completedSubTasks / task.subTasks.length) * 100)
    : 0

  const handleAddSubTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (newSubTask.trim() && task.subTasks.length < 10) {
      addSubTask(task.id, newSubTask.trim())
      setNewSubTask('')
    }
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}分钟`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
  }

  const pc = priorityColors[task.priority]

  return (
    <div
      style={{
        backgroundColor: '#2d3e50',
        borderRadius: '8px',
        padding: '16px',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.3s ease-in-out',
        border: isActive ? '2px solid #3b82f6' : '2px solid transparent',
        animation: isAnimatingFlyIn ? `flyIn 0.6s ${EASING}` : undefined,
        overflow: 'hidden',
      }}
      onClick={() => toggleExpand(isExpanded ? null : task.id)}
      onMouseEnter={(e) => {
        if (!isExpanded) {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isExpanded) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)'
        }
      }}
      className="task-card"
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
        }}
        className="task-card-header"
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            style={{
              fontSize: '15px',
              fontWeight: 600,
              marginBottom: '8px',
              wordBreak: 'break-word',
              color: task.column === 'done' ? '#94a3b8' : '#e4e6eb',
              textDecoration: task.column === 'done' ? 'line-through' : 'none',
            }}
            className="task-title"
          >
            {task.title}
          </h4>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              alignItems: 'center',
            }}
            className="task-meta"
          >
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 500,
                backgroundColor: pc.bg,
                color: pc.text,
              }}
              className="priority-tag"
            >
              {pc.label}优先级
            </span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }} className="estimated-time">
              预估: {formatTime(task.estimatedDuration)}
            </span>
            {task.completedPomodoros > 0 && (
              <span style={{ fontSize: '12px', color: '#f59e0b' }} className="pomodoro-count">
                🍅 {task.completedPomodoros}
              </span>
            )}
          </div>
          {task.subTasks.length > 0 && (
            <div style={{ marginTop: '12px' }} className="progress-wrapper">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: '#94a3b8',
                  marginBottom: '4px',
                }}
              >
                <span>进度</span>
                <span>{completedSubTasks}/{task.subTasks.length}</span>
              </div>
              <div
                style={{
                  height: '4px',
                  backgroundColor: '#1a2332',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
                className="progress-bar-bg"
              >
                <div
                  style={{
                    height: '100%',
                    backgroundColor: '#3b82f6',
                    borderRadius: '2px',
                    width: `${progress}%`,
                    transition: 'width 0.3s ease-in-out',
                  }}
                  className="progress-bar-fill"
                />
              </div>
            </div>
          )}
          {task.totalTimeSpent > 0 && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#10b981' }} className="time-spent">
              已耗时: {formatTime(task.totalTimeSpent)}
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setActiveTaskId(isActive ? null : task.id)
          }}
          style={{
            padding: '8px 12px',
            backgroundColor: isActive ? '#ef4444' : '#3b82f6',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '12px',
            cursor: 'pointer',
            transition: `all 0.2s ${EASING}`,
            flexShrink: 0,
            minHeight: '36px',
            minWidth: '88px',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          className="pomodoro-link-btn"
        >
          {isActive ? '取消关联' : '关联番茄钟'}
        </button>
      </div>

      {isExpanded && (
        <div
          style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid #3d5166',
            animation: 'slideUp 0.3s ease-in-out',
          }}
          onClick={(e) => e.stopPropagation()}
          className="subtask-panel"
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <h5 style={{ fontSize: '14px', fontWeight: 600 }}>子任务</h5>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              {task.subTasks.length}/10
            </span>
          </div>

          {task.subTasks.length < 10 && (
            <form onSubmit={handleAddSubTask} style={{ marginBottom: '12px' }} className="add-subtask-form">
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newSubTask}
                  onChange={(e) => setNewSubTask(e.target.value)}
                  placeholder="添加子任务..."
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    backgroundColor: '#1a2332',
                    border: '1px solid #3d5166',
                    borderRadius: '6px',
                    color: '#e4e6eb',
                    fontSize: '13px',
                    outline: 'none',
                    minHeight: '40px',
                  }}
                  className="subtask-input"
                />
                <button
                  type="submit"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: `all 0.2s ${EASING}`,
                    minHeight: '40px',
                    minWidth: '56px',
                  }}
                  className="subtask-add-btn"
                >
                  添加
                </button>
              </div>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} className="subtask-list">
            {task.subTasks.map((subTask) => (
              <div
                key={subTask.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  backgroundColor: '#1a2332',
                  borderRadius: '6px',
                  transition: `all 0.3s ${EASING}`,
                  opacity: subTask.completed ? 0.6 : 1,
                  animation: 'fadeIn 0.3s ease-in-out',
                  minHeight: '44px',
                }}
                className="subtask-item"
              >
                <input
                  type="checkbox"
                  checked={subTask.completed}
                  onChange={() => toggleSubTask(task.id, subTask.id)}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    accentColor: '#3b82f6',
                    flexShrink: 0,
                  }}
                  className="subtask-checkbox"
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: '13px',
                    textDecoration: subTask.completed ? 'line-through' : 'none',
                    color: subTask.completed ? '#94a3b8' : '#e4e6eb',
                    transition: `all 0.3s ${EASING}`,
                    wordBreak: 'break-word',
                  }}
                  className="subtask-title"
                >
                  {subTask.title}
                </span>
                {subTask.timeSpent > 0 && (
                  <span style={{ fontSize: '11px', color: '#10b981', flexShrink: 0 }} className="subtask-time">
                    {subTask.timeSpent}分钟
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .task-card {
            padding: 12px !important;
          }
          .task-card-header {
            gap: 8px !important;
            flex-direction: column !important;
          }
          .task-card-header > div:first-child {
            width: 100% !important;
          }
          .task-title {
            font-size: 14px !important;
          }
          .task-meta {
            gap: 6px !important;
          }
          .priority-tag {
            font-size: 10px !important;
            padding: 2px 6px !important;
          }
          .estimated-time,
          .pomodoro-count {
            font-size: 11px !important;
          }
          .pomodoro-link-btn {
            width: 100% !important;
            minHeight: 40px !important;
            padding: 8px 12px !important;
          }
          .progress-wrapper {
            margin-top: 10px !important;
          }
          .time-spent {
            font-size: 11px !important;
          }
          .subtask-panel {
            margin-top: 12px !important;
            padding-top: 12px !important;
          }
          .add-subtask-form > div {
            flex-direction: column !important;
          }
          .subtask-input {
            width: 100% !important;
          }
          .subtask-add-btn {
            width: 100% !important;
          }
          .subtask-item {
            padding: 8px 10px !important;
            gap: 10px !important;
            min-height: 48px !important;
          }
          .subtask-checkbox {
            width: 22px !important;
            height: 22px !important;
          }
          .subtask-title {
            font-size: 13px !important;
          }
        }
      `}</style>
    </div>
  )
}
