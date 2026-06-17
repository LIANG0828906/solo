import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from './store'
import { useTaskStore } from './store'

interface TaskCardProps {
  task: Task
}

export function TaskCard({ task }: TaskCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteTask = useTaskStore((state) => state.deleteTask)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDeleting(true)
    setTimeout(() => {
      deleteTask(task.id)
    }, 300)
  }

  const cardClassName = `task-card ${isDragging ? 'is-dragging' : ''} ${isDeleting ? 'is-deleting' : ''}`

  return (
    <>
      <div
        ref={setNodeRef}
        className={cardClassName}
        data-status={task.status}
        style={{
          transform: CSS.Transform.toString(transform),
          transition: transition || 'transform 200ms ease',
        }}
        {...attributes}
        {...listeners}
      >
        <div className="task-card__status-bar" />
        <div className="task-card__content">
          <p className="task-card__text">{task.description}</p>
          <button
            onClick={handleDelete}
            className="task-card__delete-btn"
            aria-label="删除任务"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 2L10 10M10 2L2 10"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
      <style>{`
        .task-card {
          position: relative;
          background: #F8FAFC;
          border-radius: 8px;
          padding: 12px 12px 12px 16px;
          margin-bottom: 8px;
          cursor: grab;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: box-shadow 200ms ease, opacity 300ms ease-out, transform 300ms ease-out;
        }
        .task-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .task-card:active {
          cursor: grabbing;
        }
        .task-card.is-dragging {
          opacity: 0.5;
        }
        .task-card.is-deleting {
          opacity: 0;
          transform: scale(0.5) !important;
          transform-origin: center center;
        }
        .task-card__status-bar {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          border-radius: 8px 0 0 8px;
        }
        .task-card[data-status="todo"] .task-card__status-bar {
          background-color: #3B82F6;
        }
        .task-card[data-status="in-progress"] .task-card__status-bar {
          background-color: #F59E0B;
        }
        .task-card[data-status="done"] .task-card__status-bar {
          background-color: #10B981;
        }
        .task-card__content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .task-card__text {
          margin: 0;
          font-size: 16px;
          color: #334155;
          line-height: 1.5;
          word-break: break-word;
          padding-right: 8px;
          flex: 1;
        }
        .task-card__delete-btn {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: #EF4444;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.3;
          transition: opacity 200ms ease, transform 200ms ease;
          flex-shrink: 0;
          padding: 0;
          margin-top: 2px;
        }
        .task-card:hover .task-card__delete-btn {
          opacity: 1;
          transform: scale(1.2);
        }
      `}</style>
    </>
  )
}
