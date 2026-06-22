import { useState, useRef } from 'react';
import { Task, TaskStatus, Priority } from '../types';
import '../styles/TodoList.css';

interface TodoListProps {
  tasks: Task[];
  status: TaskStatus;
  title: string;
  onTaskMove: (taskId: string, newStatus: TaskStatus, newOrder: number) => void;
  onTaskReorder: (taskId: string, newOrder: number, status: TaskStatus) => void;
}

const statusColors: Record<TaskStatus, string> = {
  'todo': '待办',
  'in-progress': '进行中',
  'done': '已完成',
};

const priorityLabels: Record<Priority, string> = {
  'high': '高',
  'medium': '中',
  'low': '低',
};

function TodoList({ tasks, status, title, onTaskMove, onTaskReorder }: TodoListProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const columnTasks = tasks
    .filter(t => t.status === status)
    .sort((a, b) => {
      const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.order - b.order;
    });

  const handleDragStart = (e: React.DragEvent, task: Task, index: number) => {
    setDraggedTask(task);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    
    const dragImage = e.currentTarget as HTMLElement;
    dragImage.style.opacity = '0.5';
    
    setTimeout(() => {
      dragImage.style.opacity = '1';
    }, 0);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverIndex(null);
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedTask && draggedTask.status === status) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== status) {
      setDragOverIndex(columnTasks.length);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (!draggedTask) return;

    if (draggedTask.status !== status) {
      onTaskMove(draggedTask.id, status, targetIndex);
    } else if (dragOverIndex !== null && draggedTask.id !== columnTasks[targetIndex]?.id) {
      onTaskReorder(draggedTask.id, targetIndex, status);
    }

    setDraggedTask(null);
    setDragOverIndex(null);
    setIsDragging(false);
  };

  const handleColumnDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleColumnDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== status) {
      onTaskMove(draggedTask.id, status, columnTasks.length);
    }
    setDraggedTask(null);
    setDragOverIndex(null);
    setIsDragging(false);
  };

  const formatHours = (hours: number) => {
    if (hours >= 1) {
      return `${hours}小时`;
    }
    return `${Math.round(hours * 60)}分钟`;
  };

  return (
    <div 
      className={`kanban-column ${isDragging ? 'dragging' : ''}`}
      onDragOver={handleColumnDragOver}
      onDrop={handleColumnDrop}
      ref={listRef}
    >
      <div className="column-header">
        <h3 className="column-title">{title}</h3>
        <span className="task-count">{columnTasks.length}</span>
      </div>
      <div className="task-list">
        {columnTasks.map((task, index) => (
          <div
            key={task.id}
            className={`task-card priority-${task.priority} ${
              draggedTask?.id === task.id ? 'dragging' : ''
            } ${dragOverIndex === index && draggedTask?.status === status ? 'drag-over' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, task, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
          >
            <div className="priority-bar" />
            <div className="task-content">
              <h4 className="task-title">{task.title}</h4>
              <div className="task-meta">
                <span className="meta-item">
                  <span className="meta-label">预计:</span>
                  {formatHours(task.estimatedHours)}
                </span>
                <span className="meta-item">
                  <span className="meta-label">专注:</span>
                  {task.focusCount}次
                </span>
              </div>
              <div className="task-priority-tag">
                {priorityLabels[task.priority]}优先级
              </div>
            </div>
          </div>
        ))}
        {columnTasks.length === 0 && (
          <div className="empty-state">
          暂无任务
          </div>
        )}
      </div>
    </div>
  );
}

export default TodoList;
