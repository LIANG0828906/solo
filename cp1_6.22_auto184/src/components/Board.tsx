import { useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import { BurndownChart } from './BurndownChart';
import type { Task, TaskColumn, Sprint } from '../types';
import { COLUMN_LABELS, PRIORITY_ORDER } from '../types';

interface BoardProps {
  sprint: Sprint;
  onTaskMove: (taskId: string, newColumn: TaskColumn, newIndex: number) => void;
  onTaskReorder: (column: TaskColumn, oldIndex: number, newIndex: number) => void;
  onTaskEdit: (task: Task) => void;
  onAddTask: (column: TaskColumn) => void;
}

const COLUMNS: TaskColumn[] = ['backlog', 'in-progress', 'testing', 'done'];

export function Board({
  sprint,
  onTaskMove,
  onTaskReorder,
  onTaskEdit,
  onAddTask,
}: BoardProps) {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const tasksByColumn = useMemo(() => {
    const result: Record<TaskColumn, Task[]> = {
      'backlog': [],
      'in-progress': [],
      'testing': [],
      'done': [],
    };

    sprint.tasks.forEach((task) => {
      result[task.column].push(task);
    });

    Object.keys(result).forEach((key) => {
      const col = key as TaskColumn;
      result[col].sort((a, b) => {
        const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.order - b.order;
      });
    });

    return result;
  }, [sprint.tasks]);

  const activeTask = useMemo(() => {
    if (!activeTaskId) return null;
    return sprint.tasks.find((t) => t.id === activeTaskId) || null;
  }, [activeTaskId, sprint.tasks]);

  const findTaskColumn = (taskId: string): TaskColumn | null => {
    for (const col of COLUMNS) {
      if (tasksByColumn[col].some((t) => t.id === taskId)) {
        return col;
      }
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTaskId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findTaskColumn(activeId);
    if (!activeColumn) return;

    if (COLUMNS.includes(overId as TaskColumn)) {
      const targetColumn = overId as TaskColumn;
      if (activeColumn !== targetColumn) {
        onTaskMove(activeId, targetColumn, tasksByColumn[targetColumn].length);
      }
      return;
    }

    const overColumn = findTaskColumn(overId);
    if (!overColumn) return;

    if (activeColumn === overColumn) {
      const tasks = tasksByColumn[activeColumn];
      const oldIndex = tasks.findIndex((t) => t.id === activeId);
      const newIndex = tasks.findIndex((t) => t.id === overId);
      if (oldIndex !== newIndex && oldIndex !== -1 && newIndex !== -1) {
        onTaskReorder(activeColumn, oldIndex, newIndex);
      }
    } else {
      const overTasks = tasksByColumn[overColumn];
      const newIndex = overTasks.findIndex((t) => t.id === overId);
      onTaskMove(activeId, overColumn, Math.max(0, newIndex));
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="board-container">
          <div className="board-columns">
            {COLUMNS.map((column) => (
              <div key={column} className="board-column">
                <div className="board-column-header">
                  <span className="column-title">{COLUMN_LABELS[column]}</span>
                  <span className="column-badge">
                    {tasksByColumn[column].length}
                  </span>
                </div>
                <SortableContext
                  items={tasksByColumn[column].map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                  id={column}
                >
                  <div className="column-content" data-column={column}>
                    {tasksByColumn[column].length === 0 && (
                      <div className="empty-column">暂无任务，拖拽任务到这里</div>
                    )}
                    {tasksByColumn[column].map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={onTaskEdit}
                      />
                    ))}
                    <button
                      className="add-task-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddTask(column);
                      }}
                    >
                      + 添加任务
                    </button>
                  </div>
                </SortableContext>
              </div>
            ))}
          </div>
        </div>

        <div className="burndown-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span className="burndown-title">燃尽图</span>
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-line ideal" />
                <span>理想线</span>
              </div>
              <div className="legend-item">
                <span className="legend-line actual" />
                <span>实际线</span>
              </div>
            </div>
          </div>
          <BurndownChart
            startDate={sprint.startDate}
            endDate={sprint.endDate}
            tasks={sprint.tasks}
            snapshots={sprint.dailySnapshots}
            height={160}
          />
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div style={{ opacity: 0.8, transform: 'rotate(3deg)' }}>
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
