import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Task, TaskStatus } from './types';
import TaskCard from './TaskCard';

interface KanbanBoardProps {
  tasks: Task[];
  onDeleteTask: (taskId: string) => void;
  onMoveTask: (taskId: string, newStatus: TaskStatus) => void;
}

interface ColumnConfig {
  status: TaskStatus;
  title: string;
  accent: string;
}

const columns: ColumnConfig[] = [
  { status: 'todo', title: '待办', accent: '#6366f1' },
  { status: 'in-progress', title: '进行中', accent: '#f59e0b' },
  { status: 'done', title: '完成', accent: '#22c55e' },
];

interface TouchDragState {
  taskId: string;
  task: Task;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  offsetX: number;
  offsetY: number;
  cardWidth: number;
  cardHeight: number;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onDeleteTask, onMoveTask }) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [touchDrag, setTouchDrag] = useState<TouchDragState | null>(null);
  const [touchOverColumn, setTouchOverColumn] = useState<TaskStatus | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Map<TaskStatus, HTMLDivElement>>(new Map());

  const getTasksByStatus = useCallback((status: TaskStatus): Task[] => {
    return tasks.filter((task) => task.status === status);
  }, [tasks]);

  const getColumnByPoint = useCallback((x: number, y: number): TaskStatus | null => {
    for (const col of columns) {
      const el = columnRefs.current.get(col.status);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      ) {
        return col.status;
      }
    }
    return null;
  }, []);

  // ===== HTML5 drag handlers (desktop) =====
  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  }, []);

  const handleDragLeave = useCallback(() => {
    // no-op, prevent flickering — dragOver will set when moving over another column
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onMoveTask(taskId, status);
    }
    setDraggedTaskId(null);
    setDragOverColumn(null);
  }, [onMoveTask]);

  // ===== Touch drag handlers (mobile) =====
  const handleTouchStart = useCallback(
    (e: React.TouchEvent, task: Task) => {
      const target = e.currentTarget as HTMLElement;
      const touch = e.touches[0];
      const rect = target.getBoundingClientRect();
      setTouchDrag({
        taskId: task.id,
        task,
        startX: touch.clientX,
        startY: touch.clientY,
        currentX: touch.clientX,
        currentY: touch.clientY,
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top,
        cardWidth: rect.width,
        cardHeight: rect.height,
      });
    },
    []
  );

  useEffect(() => {
    if (!touchDrag) return;

    const onMove = (ev: TouchEvent) => {
      if (!touchDrag) return;
      ev.preventDefault();
      const touch = ev.touches[0];
      setTouchDrag((prev) =>
        prev
          ? {
              ...prev,
              currentX: touch.clientX,
              currentY: touch.clientY,
            }
          : prev
      );
      const col = getColumnByPoint(touch.clientX, touch.clientY);
      setTouchOverColumn(col);
    };

    const onEnd = (ev: TouchEvent) => {
      if (!touchDrag) return;
      let dropX = touchDrag.currentX;
      let dropY = touchDrag.currentY;
      if (ev.changedTouches && ev.changedTouches[0]) {
        dropX = ev.changedTouches[0].clientX;
        dropY = ev.changedTouches[0].clientY;
      }
      const col = getColumnByPoint(dropX, dropY);
      if (col && col !== touchDrag.task.status) {
        onMoveTask(touchDrag.taskId, col);
      }
      setTouchDrag(null);
      setTouchOverColumn(null);
    };

    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);
    return () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
  }, [touchDrag, getColumnByPoint, onMoveTask]);

  const setColumnRef = useCallback(
    (status: TaskStatus) => (el: HTMLDivElement | null) => {
      if (el) {
        columnRefs.current.set(status, el);
      } else {
        columnRefs.current.delete(status);
      }
    },
    []
  );

  return (
    <div
      ref={boardRef}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '24px',
        width: '100%',
        maxWidth: '1400px',
        position: 'relative',
      }}
    >
      {columns.map((column) => {
        const columnTasks = getTasksByStatus(column.status);
        const isDragOver = dragOverColumn === column.status || touchOverColumn === column.status;

        return (
          <div
            key={column.status}
            ref={setColumnRef(column.status)}
            data-column-status={column.status}
            onDragOver={(e) => handleDragOver(e, column.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.status)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '20px',
              minHeight: '400px',
              border: isDragOver
                ? `2px dashed ${column.accent}`
                : '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'border-color 0.2s ease, background 0.2s ease, transform 0.2s ease',
              backgroundClip: 'padding-box',
              backgroundColor: isDragOver
                ? 'rgba(255, 255, 255, 0.09)'
                : 'rgba(255, 255, 255, 0.05)',
              transform: isDragOver ? 'scale(1.01)' : 'scale(1)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                paddingBottom: '12px',
                borderBottom: `2px solid ${column.accent}`,
              }}
            >
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: 0,
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: column.accent,
                  }}
                />
                {column.title}
              </h3>
              <span
                style={{
                  background: column.accent,
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '2px 10px',
                  borderRadius: '10px',
                  minWidth: '28px',
                  textAlign: 'center',
                }}
              >
                {columnTasks.length - (touchDrag && touchDrag.task.status === column.status ? 1 : 0)}
              </span>
            </div>

            <div
              style={{
                minHeight: '200px',
              }}
            >
              {columnTasks.map((task) => {
                const isTouchDraggingThis = touchDrag?.taskId === task.id;
                // Wrap card with touch start listener (passive is fine, we handle document events)
                return (
                  <div
                    key={task.id}
                    onTouchStart={(e) => handleTouchStart(e, task)}
                    style={{ touchAction: 'none' }}
                  >
                    <TaskCard
                      task={task}
                      onDelete={onDeleteTask}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      isTouchDragging={isTouchDraggingThis}
                    />
                  </div>
                );
              })}

              {columnTasks.length === 0 && (
                <div
                  style={{
                    color: '#6b7280',
                    fontSize: '13px',
                    textAlign: 'center',
                    padding: '40px 20px',
                    border: `2px dashed rgba(255, 255, 255, 0.1)`,
                    borderRadius: '8px',
                  }}
                >
                  拖拽任务到这里
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Touch drag ghost element */}
      {touchDrag && (() => {
        const priorityStyle = {
          high: { bg: '#ef4444', label: '高', color: '#fff' },
          medium: { bg: '#f59e0b', label: '中', color: '#1f2937' },
          low: { bg: '#22c55e', label: '低', color: '#fff' },
        }[touchDrag.task.priority];
        const left = touchDrag.currentX - touchDrag.offsetX;
        const top = touchDrag.currentY - touchDrag.offsetY;
        return (
          <div
            className="touch-dragging-card"
            style={{
              left: `${left}px`,
              top: `${top}px`,
              width: `${touchDrag.cardWidth}px`,
              background: '#2a2a3e',
              borderRadius: '8px',
              padding: '14px',
              color: '#fff',
            }}
          >
            <button
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                fontSize: '18px',
                lineHeight: 1,
              }}
              aria-hidden
            >
              ×
            </button>
            <h4
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#ffffff',
                marginBottom: '10px',
                paddingRight: '24px',
                lineHeight: 1.4,
                margin: 0,
              }}
            >
              {touchDrag.task.title}
            </h4>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '12px',
              }}
            >
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                👤 {touchDrag.task.assignee}
              </span>
              <span
                style={{
                  background: priorityStyle.bg,
                  color: priorityStyle.color,
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: '10px',
                }}
              >
                {priorityStyle.label}
              </span>
            </div>
          </div>
        );
      })()}

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default KanbanBoard;
