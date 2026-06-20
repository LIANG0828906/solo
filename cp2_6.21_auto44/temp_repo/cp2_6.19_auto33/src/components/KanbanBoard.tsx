import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { useBoardStore, Priority, ColumnId } from '../store/boardStore'
import TaskCard from './TaskCard'

const columnConfig: Record<ColumnId, { title: string; color: string }> = {
  todo: { title: '待办', color: '#f59e0b' },
  inProgress: { title: '进行中', color: '#3b82f6' },
  done: { title: '已完成', color: '#10b981' },
}

const EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
const TRANSITION_DURATION = '300ms'

const AddTaskModal = ({ onClose }: { onClose: () => void }) => {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [estimatedDuration, setEstimatedDuration] = useState(60)
  const addTask = useBoardStore((state) => state.addTask)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      addTask({
        title: title.trim(),
        priority,
        estimatedDuration,
      })
      onClose()
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        WebkitBackdropFilter: 'blur(8px)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.3s ease-in-out',
        padding: '16px',
      }}
      onClick={onClose}
      className="modal-overlay"
    >
      <div
        style={{
          backgroundColor: '#2d3e50',
          WebkitBackdropFilter: 'blur(12px)',
          backdropFilter: 'blur(12px)',
          borderRadius: '12px',
          padding: '24px',
          width: '400px',
          maxWidth: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          animation: 'bounceIn 0.4s ease-in-out',
        }}
        onClick={(e) => e.stopPropagation()}
        className="modal-content"
      >
        <h2 style={{ marginBottom: '20px', fontSize: '20px', fontWeight: 600 }}>新建任务</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
              任务标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入任务标题"
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#1a2332',
                border: '1px solid #3d5166',
                borderRadius: '8px',
                color: '#e4e6eb',
                fontSize: '14px',
                outline: 'none',
                transition: `border-color ${TRANSITION_DURATION} ease-in-out`,
                minHeight: '44px',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
              onBlur={(e) => (e.target.style.borderColor = '#3d5166')}
              autoFocus
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
              优先级
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    backgroundColor: priority === p ? '#3b82f6' : '#1a2332',
                    border: '1px solid #3d5166',
                    borderRadius: '6px',
                    color: '#e4e6eb',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: `all ${TRANSITION_DURATION} ease-in-out`,
                    transform: priority === p ? 'scale(1.02)' : 'scale(1)',
                    minHeight: '44px',
                  }}
                >
                  {p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#94a3b8' }}>
              预估时长（分钟）
            </label>
            <input
              type="number"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#1a2332',
                border: '1px solid #3d5166',
                borderRadius: '8px',
                color: '#e4e6eb',
                fontSize: '14px',
                outline: 'none',
                transition: `border-color ${TRANSITION_DURATION} ease-in-out`,
                minHeight: '44px',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
              onBlur={(e) => (e.target.style.borderColor = '#3d5166')}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px 16px',
                backgroundColor: 'transparent',
                border: '1px solid #3d5166',
                borderRadius: '8px',
                color: '#94a3b8',
                fontSize: '14px',
                cursor: 'pointer',
                transition: `all ${TRANSITION_DURATION} ease-in-out`,
                minHeight: '48px',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              取消
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '12px 16px',
                backgroundColor: '#3b82f6',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: `all ${TRANSITION_DURATION} ease-in-out`,
                minHeight: '48px',
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function KanbanBoard() {
  const {
    getTasksByColumn,
    moveTask,
    reorderTask,
    showAddModal,
    setShowAddModal,
  } = useBoardStore()

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result
    if (!destination) return

    const sourceColumn = source.droppableId as ColumnId
    const destColumn = destination.droppableId as ColumnId

    if (sourceColumn === destColumn) {
      if (source.index !== destination.index) {
        reorderTask(sourceColumn, source.index, destination.index)
      }
    } else {
      moveTask(
        result.draggableId,
        sourceColumn,
        destColumn,
        source.index,
        destination.index
      )
    }
  }

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
        className="kanban-header"
      >
        <h1 style={{ fontSize: '24px', fontWeight: 700 }} className="kanban-title">任务看板</h1>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: `all ${TRANSITION_DURATION} ease-in-out`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minHeight: '44px',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          className="add-task-btn"
        >
          <span style={{ fontSize: '18px' }}>+</span>
          新建任务
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div
          style={{
            display: 'flex',
            gap: '20px',
            width: '100%',
          }}
          className="kanban-columns"
        >
          {(Object.keys(columnConfig) as ColumnId[]).map((columnId) => {
            const tasks = getTasksByColumn(columnId)
            const config = columnConfig[columnId]
            return (
              <Droppable key={columnId} droppableId={columnId}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      backgroundColor: snapshot.isDraggingOver
                        ? 'rgba(59, 130, 246, 0.15)'
                        : 'transparent',
                      borderRadius: '12px',
                      padding: '16px',
                      transition: `background-color ${TRANSITION_DURATION} ${EASING}, border-color ${TRANSITION_DURATION} ${EASING}, transform ${TRANSITION_DURATION} ${EASING}`,
                      border: snapshot.isDraggingOver
                        ? `2px dashed ${config.color}`
                        : '2px solid transparent',
                      transform: snapshot.isDraggingOver ? 'scale(1.01)' : 'scale(1)',
                      position: 'relative',
                    }}
                    className={`kanban-column ${snapshot.isDraggingOver ? 'is-dragging-over' : ''}`}
                  >
                    {snapshot.isDraggingOver && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-2px',
                          left: '16px',
                          right: '16px',
                          height: '4px',
                          backgroundColor: config.color,
                          borderRadius: '0 0 4px 4px',
                          boxShadow: `0 0 12px ${config.color}80`,
                          animation: 'pulseIndicator 1s ease-in-out infinite',
                        }}
                        className="drag-indicator-bar"
                      />
                    )}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '16px',
                        gap: '8px',
                        padding: snapshot.isDraggingOver ? '8px 12px' : '0',
                        backgroundColor: snapshot.isDraggingOver
                          ? `${config.color}20`
                          : 'transparent',
                        borderRadius: snapshot.isDraggingOver ? '8px' : '0',
                        transition: `all ${TRANSITION_DURATION} ${EASING}`,
                      }}
                      className="column-header"
                    >
                      {snapshot.isDraggingOver && (
                        <span
                          style={{
                            fontSize: '16px',
                            animation: 'bounceArrow 0.6s ease-in-out infinite',
                          }}
                          className="drag-arrow-indicator"
                        >
                          ⬇️
                        </span>
                      )}
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: config.color,
                          boxShadow: snapshot.isDraggingOver
                            ? `0 0 12px ${config.color}`
                            : `0 0 8px ${config.color}40`,
                          transition: `box-shadow ${TRANSITION_DURATION} ${EASING}`,
                        }}
                        className="column-color-dot"
                      />
                      <h3
                        style={{
                          fontSize: '16px',
                          fontWeight: 600,
                          color: snapshot.isDraggingOver ? config.color : '#e4e6eb',
                          transition: `color ${TRANSITION_DURATION} ${EASING}`,
                        }}
                        className="column-title"
                      >
                        {config.title}
                      </h3>
                      <span
                        style={{
                          backgroundColor: snapshot.isDraggingOver ? config.color : '#3d5166',
                          color: snapshot.isDraggingOver ? '#fff' : '#94a3b8',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          transition: `all ${TRANSITION_DURATION} ${EASING}`,
                          fontWeight: snapshot.isDraggingOver ? 600 : 400,
                        }}
                        className="column-count"
                      >
                        {tasks.length}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        minHeight: '200px',
                      }}
                      className="column-task-list"
                    >
                      {tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.5 : 1,
                                transition: snapshot.isDragging
                                  ? 'none'
                                  : `all ${TRANSITION_DURATION} ${EASING}`,
                                zIndex: snapshot.isDragging ? 999 : 'auto',
                              }}
                            >
                              <div
                                style={{
                                  transform: snapshot.isDragging ? 'scale(1.03)' : 'scale(1)',
                                  boxShadow: snapshot.isDragging
                                    ? '0 12px 40px rgba(0, 0, 0, 0.4)'
                                    : 'none',
                                  borderRadius: '8px',
                                  transition: `all ${TRANSITION_DURATION} ${EASING}`,
                                }}
                              >
                                <TaskCard task={task} key={`card-${task.id}`} />
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            )
          })}
        </div>
      </DragDropContext>

      {showAddModal && <AddTaskModal onClose={() => setShowAddModal(false)} />}

      <style>{`
        @keyframes pulseIndicator {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes bounceArrow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }
        @media (max-width: 768px) {
          .kanban-columns {
            flex-direction: column !important;
            gap: 16px !important;
          }
          .kanban-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
            margin-bottom: 16px !important;
          }
          .kanban-title {
            font-size: 20px !important;
          }
          .add-task-btn {
            width: 100% !important;
            justify-content: center !important;
          }
          .column-header {
            margin-bottom: 12px !important;
          }
          .column-title {
            font-size: 15px !important;
          }
          .column-color-dot {
            width: 10px !important;
            height: 10px !important;
          }
          .column-count {
            font-size: 11px !important;
          }
          .column-task-list {
            gap: 10px !important;
            min-height: 120px !important;
          }
          .kanban-column {
            padding: 12px !important;
          }
        }
        @supports not ((backdrop-filter: blur(8px)) or (-webkit-backdrop-filter: blur(8px))) {
          .modal-overlay {
            background-color: rgba(0, 0, 0, 0.85) !important;
          }
          .modal-content {
            background-color: #2d3e50 !important;
            border: 1px solid #3d5166;
          }
        }
      `}</style>
    </div>
  )
}
