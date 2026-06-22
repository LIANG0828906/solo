import { useState, useMemo } from 'react';
import TodoList from '../components/TodoList';
import { useAppContext } from '../App';
import { taskService } from '../services/taskService';
import { TaskStatus, Priority } from '../types';
import '../styles/DashboardView.css';

function DashboardView() {
  const { tasks, setTasks, refreshTasks } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    priority: 'medium' as Priority,
    estimatedHours: 1,
    status: 'todo' as TaskStatus,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const query = searchQuery.toLowerCase();
    return tasks.filter(task => 
      task.title.toLowerCase().includes(query)
    );
  }, [tasks, searchQuery]);

  const handleTaskMove = async (taskId: string, newStatus: TaskStatus, newOrder: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const prevTasks = [...tasks];
    const updatedTasks = tasks.map(t => 
      t.id === taskId ? { ...t, status: newStatus, order: newOrder } : t
    );
    setTasks(updatedTasks);

    try {
      await taskService.updateTaskStatus(taskId, newStatus, newOrder);
    } catch (error) {
      console.error('Failed to update task status:', error);
      setTasks(prevTasks);
    }
  };

  const handleTaskReorder = async (taskId: string, newOrder: number, status: TaskStatus) => {
    const columnTasks = tasks
      .filter(t => t.status === status)
      .sort((a, b) => {
        const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.order - b.order;
      });
    
    const fromIndex = columnTasks.findIndex(t => t.id === taskId);
    if (fromIndex === -1 || fromIndex === newOrder) return;

    const prevTasks = [...tasks];
    const newTasks = [...tasks];
    
    const reorderedTask = newTasks.find(t => t.id === taskId);
    if (!reorderedTask) return;

    const samePriorityTasks = columnTasks.filter(
      t => t.priority === reorderedTask.priority && t.id !== taskId
    );
    
    const targetOrder = newOrder >= samePriorityTasks.length 
      ? samePriorityTasks.length 
      : newOrder;

    reorderedTask.order = targetOrder;

    samePriorityTasks.forEach((task, idx) => {
      const taskInNew = newTasks.find(t => t.id === task.id);
      if (taskInNew) {
        if (idx < targetOrder) {
          taskInNew.order = idx;
        } else {
          taskInNew.order = idx + 1;
        }
      }
    });

    setTasks(newTasks);

    try {
      await taskService.updateTaskStatus(taskId, status, targetOrder);
    } catch (error) {
      console.error('Failed to reorder task:', error);
      setTasks(prevTasks);
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

      <div className="kanban-board">
        <TodoList
          tasks={filteredTasks}
          status="todo"
          title="待办"
          onTaskMove={handleTaskMove}
          onTaskReorder={handleTaskReorder}
        />
        <div className="column-divider" />
        <TodoList
          tasks={filteredTasks}
          status="in-progress"
          title="进行中"
          onTaskMove={handleTaskMove}
          onTaskReorder={handleTaskReorder}
        />
        <div className="column-divider" />
        <TodoList
          tasks={filteredTasks}
          status="done"
          title="已完成"
          onTaskMove={handleTaskMove}
          onTaskReorder={handleTaskReorder}
        />
      </div>

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
