import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useBoardStore } from '../../store/boardStore';
import type { TaskData } from '../../types';
import Column from './Column';
import Card from './Card';
import TaskModal from '../TaskModal/TaskModal';

function Board() {
  const columns = useBoardStore((s) => s.columns);
  const tasks = useBoardStore((s) => s.tasks);
  const getColumnTasks = useBoardStore((s) => s.getColumnTasks);
  const moveTask = useBoardStore((s) => s.moveTask);
  const loading = useBoardStore((s) => s.loading);

  const [activeTask, setActiveTask] = useState<TaskData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskData | null>(null);
  const [modalColumnId, setModalColumnId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const findColumnOfTask = useCallback(
    (taskId: string): string | null => {
      for (const col of columns) {
        const colTasks = getColumnTasks(col.id);
        if (colTasks.some((t) => t.id === taskId)) {
          return col.id;
        }
      }
      return null;
    },
    [columns, getColumnTasks]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const task = tasks.find((t) => t.id === active.id);
      if (task) {
        setActiveTask(task);
      }
    },
    [tasks]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      // handled in drag end for simplicity
    },
    []
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over) return;

      const activeTaskId = String(active.id);
      const activeTaskData = tasks.find((t) => t.id === activeTaskId);
      if (!activeTaskData) return;

      const fromColumnId = findColumnOfTask(activeTaskId);
      if (!fromColumnId) return;

      let toColumnId: string | null = null;
      let toIndex = 0;

      const overIdStr = String(over.id);
      const overColumn = columns.find((c) => c.id === overIdStr);
      if (overColumn) {
        toColumnId = overColumn.id;
        const colTasks = getColumnTasks(toColumnId).filter((t) => t.id !== activeTaskId);
        toIndex = colTasks.length;
      } else {
        const overTask = tasks.find((t) => t.id === overIdStr);
        if (overTask) {
          toColumnId = overTask.column_id;
          const colTasks = getColumnTasks(toColumnId).filter((t) => t.id !== activeTaskId);
          const overTaskIndex = colTasks.findIndex((t) => t.id === overIdStr);
          toIndex = overTaskIndex >= 0 ? overTaskIndex : 0;
        }
      }

      if (!toColumnId) return;

      if (fromColumnId === toColumnId) {
        const sameColTasks = getColumnTasks(toColumnId);
        const currentIdx = sameColTasks.findIndex((t) => t.id === activeTaskId);
        if (currentIdx === toIndex) return;
      }

      await moveTask({
        task_id: activeTaskId,
        from_column_id: fromColumnId,
        to_column_id: toColumnId,
        to_index: toIndex,
      });
    },
    [tasks, columns, findColumnOfTask, getColumnTasks, moveTask]
  );

  const handleAddCard = (columnId: string) => {
    setEditingTask(null);
    setModalColumnId(columnId);
    setModalOpen(true);
  };

  const handleEditCard = (task: TaskData) => {
    setEditingTask(task);
    setModalColumnId(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTask(null);
    setModalColumnId(null);
  };

  if (loading && columns.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="board">
          {columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              tasks={getColumnTasks(column.id)}
              onAddCard={() => handleAddCard(column.id)}
              onEditCard={handleEditCard}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <Card task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      <TaskModal
        open={modalOpen}
        onClose={handleCloseModal}
        editingTask={editingTask}
        defaultColumnId={modalColumnId}
      />
    </>
  );
}

export default Board;
