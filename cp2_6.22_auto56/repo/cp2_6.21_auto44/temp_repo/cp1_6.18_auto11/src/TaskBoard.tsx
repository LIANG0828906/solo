import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  PointerSensor,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { TaskCard } from './TaskCard'
import type { TaskStatus } from './store'
import { useTaskStore } from './store'

const lanes: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: '待办' },
  { id: 'in-progress', title: '进行中' },
  { id: 'done', title: '已完成' },
]

export function TaskBoard() {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const tasks = useTaskStore((state) => state.tasks)
  const moveTask = useTaskStore((state) => state.moveTask)
  const getTasksByStatus = useTaskStore((state) => state.getTasksByStatus)
  const getTaskCount = useTaskStore((state) => state.getTaskCount)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    })
  )

  const activeTask = tasks.find((t) => t.id === activeTaskId) || null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTaskId(null)

    const { active, over } = event
    if (!over) return

    const taskId = String(active.id)
    const overId = String(over.id)

    if (taskId === overId) return

    let targetStatus: TaskStatus
    let targetIndex: number

    const isOverLane = lanes.some((lane) => lane.id === overId)

    if (isOverLane) {
      targetStatus = overId as TaskStatus
      const laneTasks = getTasksByStatus(targetStatus)
      targetIndex = laneTasks.length
    } else {
      const overTask = tasks.find((t) => t.id === overId)
      if (!overTask) return

      targetStatus = overTask.status
      const laneTasks = getTasksByStatus(targetStatus)
      const overIndex = laneTasks.findIndex((t) => t.id === overId)
      targetIndex = overIndex
    }

    moveTask(taskId, targetStatus, targetIndex)
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="board">
          {lanes.map((lane) => {
            const laneTasks = getTasksByStatus(lane.id)
            const taskCount = getTaskCount(lane.id)

            return (
              <div key={lane.id} className="lane" data-lane-id={lane.id}>
                <div className="lane__header">
                  <h2 className="lane__title">
                    {lane.title} <span className="lane__count">{taskCount}</span>
                  </h2>
                </div>
                <div className="lane__content" data-lane-id={lane.id}>
                  <SortableContext
                    items={laneTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {laneTasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </SortableContext>
                  {laneTasks.length === 0 && (
                    <div className="empty-state">
                      <p className="empty-state__text">暂无任务，拖拽或新建</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <DragOverlay>
          {activeTask ? (
            <div className="drag-overlay">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      <style>{`
        .board {
          display: flex;
          gap: 16px;
          width: 100%;
        }
        .lane {
          flex: 1;
          width: 33.33%;
          background: #FFFFFF;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          min-height: 400px;
        }
        .lane__header {
          padding-bottom: 12px;
          border-bottom: 1px solid #E2E8F0;
          margin-bottom: 16px;
        }
        .lane__title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1E293B;
        }
        .lane__count {
          color: #64748B;
          font-weight: 500;
        }
        .lane__content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 200px;
        }
        .empty-state {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px dashed #CBD5E1;
          border-radius: 12px;
          height: 120px;
          margin-top: 8px;
        }
        .empty-state__text {
          margin: 0;
          color: #94A3B8;
          font-size: 14px;
        }
        .drag-overlay {
          cursor: grabbing;
        }
        .drag-overlay .task-card {
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          opacity: 0.9;
        }
      `}</style>
    </>
  )
}
