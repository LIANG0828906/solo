import React from 'react';
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

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onDeleteTask, onMoveTask }) => {
  const [draggedTaskId, setDraggedTaskId] = React.useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = React.useState<TaskStatus | null>(null);

  const getTasksByStatus = (status: TaskStatus): Task[] => {
    return tasks.filter((task) => task.status === status);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onMoveTask(taskId, status);
    }
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '24px',
        width: '100%',
        maxWidth: '1400px',
      }}
    >
      {columns.map((column) => {
        const columnTasks = getTasksByStatus(column.status);
        const isDragOver = dragOverColumn === column.status;

        return (
          <div
            key={column.status}
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
              transition: 'border-color 0.2s ease, background 0.2s ease',
              backgroundClip: 'padding-box',
              backgroundColor: isDragOver
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(255, 255, 255, 0.05)',
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
                {columnTasks.length}
              </span>
            </div>

            <div
              style={{
                minHeight: '200px',
              }}
            >
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDelete={onDeleteTask}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              ))}

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
