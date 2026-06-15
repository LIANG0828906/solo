import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutGrid, Users, Settings, LogOut, Bell } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getSocket } from '../utils/socket';
import Toast from '../components/Toast';
import type { Board } from '../types';

export default function BoardList() {
  const { user, boards, setBoards, addBoard, addToast, setUser } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!user && savedUser) {
      setUser(JSON.parse(savedUser));
    } else if (!user) {
      navigate('/login');
      return;
    }
    loadBoards();

    const socket = getSocket();
    const handleBoardCreated = ({ board }: { board: Board }) => {
      addBoard(board);
    };
    socket.on('board:created', handleBoardCreated);
    socket.on('notification', (data: { message: string; type: string }) => {
      addToast({ message: data.message, type: 'info' });
    });

    return () => {
      socket.off('board:created', handleBoardCreated);
    };
  }, [user, navigate, setUser, addBoard, addToast]);

  const loadBoards = async () => {
    try {
      const response = await fetch('/api/boards');
      const data = await response.json();
      if (data.success) {
        setBoards(data.boards);
      }
    } catch {
      addToast({ message: '加载看板列表失败', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;
    try {
      const response = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBoardName }),
      });
      const data = await response.json();
      if (data.success) {
        addBoard(data.board);
        setNewBoardName('');
        setShowCreateModal(false);
        addToast({ message: '看板创建成功', type: 'success' });
        navigate(`/boards/${data.board.id}`);
      }
    } catch {
      addToast({ message: '创建失败，请重试', type: 'error' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-board-bg">
        <div className="animate-pulse text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-board-bg">
      <Toast />

      <header className="bg-primary text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <LayoutGrid className="w-6 h-6 text-mint" />
          <h1 className="text-lg font-bold">团队看板</h1>
        </div>

        <div className="flex items-center gap-4">
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/admin')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="团队管理"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 pl-4 border-l border-white/20">
            {user && (
              <>
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium hidden sm:block">
                  {user.username}
                </span>
              </>
            )}
            <button
              onClick={handleLogout}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors ml-2"
              title="退出登录"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">我的看板</h2>
            <p className="text-gray-500 mt-1">
              共 {boards.length} 个项目看板
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-mint text-primary font-medium rounded-xl hover:bg-mint/80 transition-colors shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" />
            新建看板
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {boards.map((board) => (
            <div
              key={board.id}
              onClick={() => navigate(`/boards/${board.id}`)}
              className="bg-white rounded-xl p-5 shadow-sm hover:shadow-lg cursor-pointer transition-all hover:-translate-y-1 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-mint/20 rounded-lg">
                  <LayoutGrid className="w-5 h-5 text-primary" />
                </div>
                <Users className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-primary transition-colors">
                {board.name}
              </h3>
              <p className="text-sm text-gray-500">
                {board.swimLanes?.length || 0} 个泳道
              </p>
            </div>
          ))}

          {boards.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-400">
              <LayoutGrid className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>还没有看板，点击右上角创建第一个看板吧</p>
            </div>
          )}
        </div>
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 modal-overlay"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 modal-content">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              创建新看板
            </h3>
            <input
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
              placeholder="输入看板名称"
              autoFocus
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-mint/50 mb-6"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateBoard}
                disabled={!newBoardName.trim()}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around z-40">
        <button className="flex flex-col items-center gap-1 text-primary">
          <LayoutGrid className="w-5 h-5" />
          <span className="text-xs">看板</span>
        </button>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex flex-col items-center gap-1 text-gray-500"
        >
          <Plus className="w-5 h-5" />
          <span className="text-xs">新建</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 text-gray-500"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-xs">我的</span>
        </button>
      </nav>
    </div>
  );
}
