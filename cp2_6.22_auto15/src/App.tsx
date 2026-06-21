import { useState, useEffect } from 'react';
import { Plus, Menu, PanelLeftClose, PanelRightClose } from 'lucide-react';
import Board from './components/Board';
import SprintPanel from './components/SprintPanel';
import OnlineUsers from './components/OnlineUsers';
import ActivityLog from './components/ActivityLog';
import TaskDetailModal from './components/TaskDetailModal';
import useKanbanStore from './store/useKanbanStore';
import socket from './utils/socket';
import type { Task } from '../shared/types';

export default function App() {
  const {
    setTasks,
    addTask,
    updateTask,
    setSprint,
    addOnlineUser,
    removeOnlineUser,
    addActivity,
    setCurrentUser,
  } = useKanbanStore();

  const [leftDrawer, setLeftDrawer] = useState(false);
  const [rightDrawer, setRightDrawer] = useState(false);

  useEffect(() => {
    const username = window.prompt('请输入你的用户名');
    if (username) {
      socket.emit('user:join', { name: username });
      setCurrentUser({ id: socket.id || '', name: username, connectedAt: new Date().toISOString() });
    }

    fetch('/api/tasks')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTasks(data);
      })
      .catch(() => {});

    fetch('/api/sprint')
      .then((res) => res.json())
      .then((data) => {
        if (data) setSprint(data);
      })
      .catch(() => {});

    fetch('/api/activities')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data))
          useKanbanStore.setState({ activities: data });
      })
      .catch(() => {});

    fetch('/api/users/online')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data))
          useKanbanStore.setState({ onlineUsers: data });
      })
      .catch(() => {});
  }, [setTasks, setSprint, addOnlineUser, removeOnlineUser, addActivity, setCurrentUser]);

  useEffect(() => {
    const handleTaskUpdated = (data: Task[] | Task) => {
      if (Array.isArray(data)) {
        setTasks(data);
      } else {
        const exists = useKanbanStore.getState().tasks.some((t) => t.id === data.id);
        if (exists) {
          updateTask(data.id, data);
        } else {
          addTask(data);
        }
      }
    };

    const handleSprintUpdated = (data: unknown) => {
      setSprint(data as Parameters<typeof setSprint>[0]);
    };

    const handleUserJoined = (user: { id: string; name: string; connectedAt: string }) => {
      addOnlineUser(user);
    };

    const handleUserLeft = (data: { id: string }) => {
      removeOnlineUser(data.id);
    };

    const handleActivityNew = (activity: {
      id: string;
      user: string;
      action: string;
      taskTitle: string;
      timestamp: string;
    }) => {
      addActivity(activity);
    };

    socket.on('task:updated', handleTaskUpdated);
    socket.on('sprint:updated', handleSprintUpdated);
    socket.on('user:joined', handleUserJoined);
    socket.on('user:left', handleUserLeft);
    socket.on('activity:new', handleActivityNew);

    return () => {
      socket.off('task:updated', handleTaskUpdated);
      socket.off('sprint:updated', handleSprintUpdated);
      socket.off('user:joined', handleUserJoined);
      socket.off('user:left', handleUserLeft);
      socket.off('activity:new', handleActivityNew);
    };
  }, [setTasks, updateTask, addTask, setSprint, addOnlineUser, removeOnlineUser, addActivity]);

  const currentUser = useKanbanStore((s) => s.currentUser);

  const handleAddTask = async () => {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '新任务',
        description: '',
        priority: 'medium',
        assignee: currentUser?.name ?? '',
        storyPoints: 0,
        status: 'todo',
        user: currentUser?.name ?? 'Unknown',
      }),
    });
  };

  return (
    <div className="h-screen flex flex-col bg-[#f5f6fa]">
      <header className="shrink-0 bg-white border-b border-[#e0e0e0] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLeftDrawer(!leftDrawer)}
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-[#2c3e50]"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-bold text-[#2c3e50]">敏捷看板</h1>
        </div>
        <button
          onClick={() => setRightDrawer(!rightDrawer)}
          className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-[#2c3e50]"
        >
          <Menu size={20} />
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-xl transform transition-transform duration-300 md:static md:translate-x-0 md:shadow-none md:border-r md:border-[#e0e0e0] ${
            leftDrawer ? 'translate-x-0' : '-translate-x-full'
          } md:w-[20%] overflow-y-auto p-4`}
        >
          <div className="flex items-center justify-between mb-4 md:hidden">
            <span className="font-semibold text-[#2c3e50]">冲刺面板</span>
            <button
              onClick={() => setLeftDrawer(false)}
              className="p-1 rounded hover:bg-gray-100 text-gray-400"
            >
              <PanelLeftClose size={18} />
            </button>
          </div>
          <SprintPanel />
          <div className="mt-5">
            <button
              onClick={handleAddTask}
              className="w-full flex items-center justify-center gap-2 bg-[#3498db] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#2980b9] transition-colors"
            >
              <Plus size={16} />
              添加任务
            </button>
          </div>
        </aside>

        <main className="flex-1 md:w-[60%] bg-white m-3 rounded-xl shadow-sm overflow-hidden">
          <Board />
        </main>

        <aside
          className={`fixed inset-y-0 right-0 z-40 w-72 bg-white shadow-xl transform transition-transform duration-300 md:static md:translate-x-0 md:shadow-none md:border-l md:border-[#e0e0e0] ${
            rightDrawer ? 'translate-x-0' : 'translate-x-full'
          } md:w-[20%] overflow-y-auto p-4`}
        >
          <div className="flex items-center justify-between mb-4 md:hidden">
            <span className="font-semibold text-[#2c3e50]">侧边栏</span>
            <button
              onClick={() => setRightDrawer(false)}
              className="p-1 rounded hover:bg-gray-100 text-gray-400"
            >
              <PanelRightClose size={18} />
            </button>
          </div>
          <OnlineUsers />
          <div className="mt-6">
            <ActivityLog />
          </div>
        </aside>
      </div>

      {leftDrawer && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={() => setLeftDrawer(false)}
        />
      )}
      {rightDrawer && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={() => setRightDrawer(false)}
        />
      )}

      <TaskDetailModal />
    </div>
  );
}
