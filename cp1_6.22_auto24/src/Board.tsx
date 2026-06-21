import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import Card from './Card';
import TaskForm from './TaskForm';
import { api } from './api';
import type { Task, TaskStatus, CreateTaskData } from './types';

interface BoardProps {
  boardId: string;
  boardName: string;
  onBack: () => void;
}

interface ColumnConfig {
  status: TaskStatus;
  title: string;
}

const columns: ColumnConfig[] = [
  { status: 'todo', title: '待办' },
  { status: 'inProgress', title: '进行中' },
  { status: 'done', title: '已完成' },
];

const Board: React.FC<BoardProps> = ({ boardId, boardName, onBack }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formStatus, setFormStatus] = useState<TaskStatus>('todo');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortControllerRef.current = new AbortController();

    const fetchBoard = async () => {
      try {
        const data = await api.getBoard(boardId);
        setTasks(data.tasks);
      } catch (err) {
        console.error('Failed to fetch board:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoard();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [boardId]);

  const getTasksByStatus = useCallback(
    (status: TaskStatus) => {
      return tasks.filter((task) => task.status === status);
    },
    [tasks]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent, taskId: string) => {
      setDraggingTaskId(taskId);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', taskId);

      const target = e.target as HTMLElement;
      if (target) {
        e.dataTransfer.setDragImage(target, 20, 20);
      }
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    setDraggingTaskId(null);
    setDragOverColumn(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, status: TaskStatus) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragOverColumn !== status) {
        setDragOverColumn(status);
      }
    },
    [dragOverColumn]
  );

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, newStatus: TaskStatus) => {
      e.preventDefault();
      const taskId = draggingTaskId;

      if (!taskId) return;

      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.status === newStatus) {
        handleDragEnd();
        return;
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );

      handleDragEnd();

      try {
        await api.updateTask(boardId, taskId, { status: newStatus });
      } catch (err) {
        console.error('Failed to update task status:', err);
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t))
        );
      }
    },
    [draggingTaskId, tasks, boardId, handleDragEnd]
  );

  const handleAddTask = useCallback((status: TaskStatus) => {
    setEditingTask(null);
    setFormStatus(status);
    setShowForm(true);
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setFormStatus(task.status);
    setShowForm(true);
  }, []);

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      try {
        await api.deleteTask(boardId, taskId);
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    },
    [boardId]
  );

  const handleSubmitTask = useCallback(
    async (data: CreateTaskData) => {
      if (editingTask) {
        const updatedTask = await api.updateTask(boardId, editingTask.id, data);
        setTasks((prev) =>
          prev.map((t) => (t.id === editingTask.id ? updatedTask : t))
        );
      } else {
        const newTask = await api.createTask(boardId, data);
        setTasks((prev) => [newTask, ...prev]);
      }
    },
    [boardId, editingTask]
  );

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditingTask(null);
  }, []);

  if (isLoading) {
    return (
      <div className="board-container">
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="board-container">
      <div className="board-header">
        <h2>{boardName}</h2>
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          返回看板列表
        </button>
      </div>

      <div className="columns-container">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.status);
          return (
            <div key={column.status} className={`column column-${column.status}`}>
              <div className="column-header">
                <span className="column-title">{column.title}</span>
                <span className="badge">{columnTasks.length}</span>
              </div>
              <div
                className={`column-content ${
                  dragOverColumn === column.status ? 'drag-over' : ''
                }`}
                onDragOver={(e) => handleDragOver(e, column.status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.status)}
              >
                {columnTasks.map((task) => (
                  <Card
                    key={task.id}
                    task={task}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    isDragging={draggingTaskId === task.id}
                  />
                ))}
                <button
                  className="add-task-btn"
                  onClick={() => handleAddTask(column.status)}
                >
                  <Plus size={16} />
                  添加任务
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <TaskForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmitTask}
        initialStatus={formStatus}
        editTask={editingTask}
      />
    </div>
  );
};

export default Board;
