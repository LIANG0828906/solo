import { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import TodoList, { TaskCard } from '../components/TodoList';
import { useAppContext } from '../App';
import { taskService } from '../services/taskService';
import { Task, TaskStatus, Priority } from '../types';
import '../styles/DashboardView.css';

function DashboardView() {
  const { tasks, setTasks } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    priority: 'medium' as Priority,
    estimatedHours: 1,
    status: 'todo' as TaskStatus,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const query = searchQuery.toLowerCase();
    return tasks.filter(task => 
      task.title.toLowerCase().includes(query)
    );
  }, [tasks, searchQuery]);

  const getSortedColumnTasks = useCallback((status: TaskStatus, taskList: Task[]) => {
    return taskList
      .filter(t => t.status === status)
      .sort((a, b) => {
        const priorityOrder: Record<Priority, number> = { 'high': 0, 'medium': 1, 'low': 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.order - b.order;
      });
  }, []);

  const todoTasks = useMemo(() => getSortedColumnTasks('todo', filteredTasks), [filteredTasks, getSortedColumnTasks]);
  const inProgressTasks = useMemo(() => getSortedColumnTasks('in-progress', filteredTasks), [filteredTasks, getSortedColumnTasks]);
  const doneTasks = useMemo(() => getSortedColumnTasks('done', filteredTasks), [filteredTasks, getSortedColumnTasks]);

  const getColumnTasks = (status: TaskStatus) => {
    switch (status) {
      case 'todo': return todoTasks;
      case 'in-progress': return inProgressTasks;
      case 'done': return doneTasks;
    }
  };

  const getTaskStatus = (taskId: string): TaskStatus | null => {
    if (todoTasks.find(t => t.id === taskId)) return 'todo';
    if (inProgressTasks.find(t => t.id === taskId)) return 'in-progress';
    if (doneTasks.find(t => t.id === taskId)) return 'done';
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeStatus = getTaskStatus(activeId);
    if (!activeStatus) return;

    let overStatus: TaskStatus | null = getTaskStatus(overId);
    if (!overStatus) {
      if (overId === 'todo' || overId === 'in-progress' || overId === 'done') {
        overStatus = overId as TaskStatus;
      }
    }

    if (!overStatus || activeStatus === overStatus) return;

    const activeTaskItem = tasks.find(t => t.id === activeId);
    if (!activeTaskItem) return;

    const sourceColumn = getColumnTasks(activeStatus);
    const destColumn = getColumnTasks(overStatus);
    const overIndex = destColumn.findIndex(t => t.id === overId);

    const newTasks = tasks.filter(t => t.id !== activeId);
    const newActiveTask = { ...activeTaskItem, status: overStatus };

    const samePriorityTasks = destColumn.filter(
      t => t.priority === newActiveTask.priority
    );

    let insertIndex = overIndex;
    if (overIndex === -1) {
      insertIndex = destColumn.length;
    }

    let priorityIndex = samePriorityTasks.length;
    for (let i = 0; i <= insertIndex && i < destColumn.length; i++) {
      if (destColumn[i].priority === newActiveTask.priority) {
        priorityIndex = samePriorityTasks.indexOf(destColumn[i]) + 1;
      }
    }

    newActiveTask.order = priorityIndex;
    newTasks.push(newActiveTask);
    setTasks(newTasks);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTaskItem = tasks.find(t => t.id === activeId);
    if (!activeTaskItem) return;

    const activeStatus = getTaskStatus(activeId);
    const overStatus = getTaskStatus(overId);

    if (activeStatus === overStatus && activeStatus) {
      const columnTasks = getColumnTasks(activeStatus);
      const oldIndex = columnTasks.findIndex(t => t.id === activeId);
      const newIndex = columnTasks.findIndex(t => t.id === overId);

      if (oldIndex !== newIndex) {
        const reordered = arrayMove(columnTasks, oldIndex, newIndex);
        const samePriority = reordered.filter(t => t.priority === activeTaskItem.priority);
        const newOrder = samePriority.findIndex(t => t.id === activeId);

        if (newOrder !== activeTaskItem.order) {
          const prevTasks = [...tasks];
          try {
            await taskService.updateTaskStatus(activeId, activeStatus, newOrder);
          } catch (error) {
            console.error('Failed to reorder task:', error);
            setTasks(prevTasks);
          }
        }
      }
    } else {
      const prevTasks = [...tasks];
      try {
        const targetStatus = overStatus || activeStatus;
        if (targetStatus) {
          await taskService.updateTaskStatus(activeId, targetStatus);
        }
      } catch (error) {
        console.error('Failed to move task:', error);
        setTasks(prevTasks);
      }
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const createdTask = await taskService.createTask(newTask);
      setTasks(prev => [...prev, createdTask]);
      setNewTask({
        title: '',
        priority: 'medium',
        estimatedHours: 1,
        status: 'todo',
      });
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setNewTask({
      title: '',
      priority: 'medium',
      estimatedHours: 1,
      status: 'todo',
    });
  };

  const hoursOptions = [
    { value: 0.25, label: '15分钟' },
    { value: 0.5, label: '30分钟' },
    { value: 0.75, label: '45分钟' },
    { value: 1, label: '1小时' },
    { value: 1.5, label: '1.5小时' },
    { value: 2, label: '2小时' },
    { value: 3, label: '3小时' },
    { value: 4, label: '4小时' },
    { value: 5, label: '5小时' },
    { value: 6, label: '6小时' },
    { value: 8, label: '8小时' },
  ];

  return (
    <div className="dashboard-view">
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="page-title">任务看板</h1>
          <p className="page-subtitle">管理你的工作任务，保持专注</p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="搜索任务..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <button 
            className="add-task-btn"
            onClick={() => setShowAddModal(true)}
          >
            <span className="btn-icon">+</span>
            添加任务
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          <SortableContext items={todoTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <TodoList
              tasks={filteredTasks}
              status="todo"
              title="待办"
            />
          </SortableContext>
          
          <div className="column-divider" />
          
          <SortableContext items={inProgressTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <TodoList
              tasks={filteredTasks}
              status="in-progress"
              title="进行中"
            />
          </SortableContext>
          
          <div className="column-divider" />
          
          <SortableContext items={doneTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <TodoList
              tasks={filteredTasks}
              status="done"
              title="已完成"
            />
          </SortableContext>
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="drag-overlay-card">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {showAddModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div 
            className="modal-content slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>添加新任务</h2>
              <button className="close-btn" onClick={handleCloseModal}>✕</button>
            </div>
            <form onSubmit={handleAddTask} className="task-form">
              <div className="form-group">
                <label>任务标题</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="请输入任务标题"
                  className="form-input"
                  autoFocus
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>优先级</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value as Priority }))}
                    className="form-select"
                  >
                    <option value="high">高优先级</option>
                    <option value="medium">中优先级</option>
                    <option value="low">低优先级</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>预计工时</label>
                  <select
                    value={newTask.estimatedHours}
                    onChange={(e) => setNewTask(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) }))}
                    className="form-select"
                  >
                    {hoursOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>状态</label>
                <select
                  value={newTask.status}
                  onChange={(e) => setNewTask(prev => ({ ...prev, status: e.target.value as TaskStatus }))}
                  className="form-select"
                >
                  <option value="todo">待办</option>
                  <option value="in-progress">进行中</option>
                  <option value="done">已完成</option>
                </select>
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting || !newTask.title.trim()}
                >
                  {isSubmitting ? '添加中...' : '添加任务'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardView;
