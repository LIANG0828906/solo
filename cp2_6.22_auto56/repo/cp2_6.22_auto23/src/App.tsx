import React, { useState, useEffect } from 'react';
import { Task, Sprint, User, LogEntry, TaskStatus } from './types';
import { socketApi } from './utils/socket';
import Board from './components/Board';
import SprintPanel from './components/SprintPanel';
import TaskModal from './components/TaskModal';
import UserList from './components/UserList';
import ActivityLog from './components/ActivityLog';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprint, setSprint] = useState<Sprint | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [addStatus, setAddStatus] = useState<TaskStatus>('todo');
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchSprint();
    fetchLogs();
    
    const handleTaskCreated = (task: Task) => {
      setTasks((prev) => [...prev, task]);
    };
    
    const handleTaskUpdated = (task: Task) => {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    };
    
    const handleTaskMoved = (data: { task: Task; allTasks: Task[] }) => {
      setTasks(data.allTasks);
    };
    
    const handleTaskDeleted = (taskId: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    };
    
    const handleUsersUpdated = (userList: User[]) => {
      setUsers(userList);
    };
    
    const handleSelfUser = (user: User) => {
      setCurrentUser(user);
    };
    
    const handleSprintUpdated = (sprintData: Sprint) => {
      setSprint(sprintData);
    };
    
    const handleNewLog = (log: LogEntry) => {
      setLogs((prev) => [log, ...prev].slice(0, 50));
    };

    socketApi.on('task:created', handleTaskCreated);
    socketApi.on('task:updated', handleTaskUpdated);
    socketApi.on('task:moved', handleTaskMoved);
    socketApi.on('task:deleted', handleTaskDeleted);
    socketApi.on('users:updated', handleUsersUpdated);
    socketApi.on('user:self', handleSelfUser);
    socketApi.on('sprint:updated', handleSprintUpdated);
    socketApi.on('log:new', handleNewLog);

    return () => {
      socketApi.off('task:created', handleTaskCreated);
      socketApi.off('task:updated', handleTaskUpdated);
      socketApi.off('task:moved', handleTaskMoved);
      socketApi.off('task:deleted', handleTaskDeleted);
      socketApi.off('users:updated', handleUsersUpdated);
      socketApi.off('user:self', handleSelfUser);
      socketApi.off('sprint:updated', handleSprintUpdated);
      socketApi.off('log:new', handleNewLog);
    };
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const fetchSprint = async () => {
    try {
      const response = await fetch('/api/sprint');
      const data = await response.json();
      setSprint(data);
    } catch (error) {
      console.error('Failed to fetch sprint:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/logs');
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsAddingTask(false);
    setIsModalOpen(true);
  };

  const handleAddTask = (status: TaskStatus) => {
    setAddStatus(status);
    setIsAddingTask(true);
    setSelectedTask(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
    setIsAddingTask(false);
  };

  const handleSaveTask = (taskData: Partial<Task>) => {
    if (isAddingTask) {
      socketApi.createTask({
        ...taskData,
        status: addStatus,
      });
    } else if (taskData.id) {
      socketApi.updateTask(taskData);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    socketApi.deleteTask(taskId);
  };

  const handleTaskMove = (taskId: string, status: TaskStatus, order: number) => {
    socketApi.moveTask(taskId, status, order);
  };

  const handleSprintUpdate = (sprintData: Sprint) => {
    setSprint(sprintData);
  };

  const toggleLeftDrawer = () => {
    setLeftDrawerOpen(!leftDrawerOpen);
    setRightDrawerOpen(false);
  };

  const toggleRightDrawer = () => {
    setRightDrawerOpen(!rightDrawerOpen);
    setLeftDrawerOpen(false);
  };

  const closeDrawers = () => {
    setLeftDrawerOpen(false);
    setRightDrawerOpen(false);
  };

  return (
    <div className="app-container">
      <aside className={`sidebar-left ${leftDrawerOpen ? 'open' : ''}`}>
        {sprint && (
          <SprintPanel sprint={sprint} onSprintUpdate={handleSprintUpdate} />
        )}
      </aside>

      <main className="main-content">
        <header className="app-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn mobile-toggle" onClick={toggleLeftDrawer} style={{ color: '#fff' }}>
              ☰ Sprint
            </button>
            <h1 className="app-title">📋 敏捷看板</h1>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary mobile-toggle" onClick={toggleRightDrawer}>
              👥 {users.length}
            </button>
            <button className="btn btn-secondary" onClick={() => handleAddTask('todo')}>
              + 新建任务
            </button>
          </div>
        </header>
        
        <div className="board-container">
          <Board
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onTaskMove={handleTaskMove}
            onAddTask={handleAddTask}
          />
        </div>
      </main>

      <aside className={`sidebar-right ${rightDrawerOpen ? 'open' : ''}`}>
        <UserList users={users} currentUser={currentUser} />
        <ActivityLog logs={logs} />
      </aside>

      {(leftDrawerOpen || rightDrawerOpen) && (
        <div className="drawer-overlay" onClick={closeDrawers}></div>
      )}

      <TaskModal
        task={isAddingTask ? null : selectedTask}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />
    </div>
  );
};

export default App;
