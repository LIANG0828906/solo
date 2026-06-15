import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutGrid, Settings, LogOut, Bell, Users } from 'lucide-react';
import BoardView from '../components/BoardView';
import Toast from '../components/Toast';
import { useAppStore } from '../store/useAppStore';
import { getSocket } from '../utils/socket';
import type { User, Board } from '../types';

export default function BoardDetail() {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { user, currentBoard, setCurrentBoard, setUser, addToast } = useAppStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!user && savedUser) {
      setUser(JSON.parse(savedUser));
    } else if (!user) {
      navigate('/login');
      return;
    }

    if (boardId) {
      loadBoard(boardId);
      loadUsers();
    }

    const socket = getSocket();
    socket.on('notification', (data: { message: string; type: string }) => {
      addToast({ message: data.message, type: 'info' });
    });
    socket.on('board:updated', ({ board }: { board: Board }) => {
      if (board.id === boardId) {
        setCurrentBoard(board);
      }
    });

    return () => {
      socket.off('notification');
      socket.off('board:updated');
    };
  }, [boardId, user, navigate, setCurrentBoard, setUser, addToast]);

  const loadBoard = async (id: string) => {
    try {
      const response = await fetch(`/api/boards/${id}`);
      const data = await response.json();
      if (data.success) {
        setCurrentBoard(data.board);
      } else {
        addToast({ message: '看板不存在', type: 'error' });
        navigate('/boards');
      }
    } catch {
      addToast({ message: '加载看板失败', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  if (isLoading || !currentBoard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-board-bg">
        <div className="animate-pulse text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-board-bg overflow-hidden">
      <Toast />

      <header className="bg-primary text-white px-4 sm:px-6 py-3 flex items-center justify-between shadow-lg flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/boards')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors -ml-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-mint hidden sm:block" />
            <h1 className="text-base sm:text-lg font-bold truncate max-w-[200px] sm:max-w-none">
              {currentBoard.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
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
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-white/20">
            {user && (
              <>
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium">{user.username}</span>
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

      <div className="hidden sm:flex items-center gap-4 px-6 py-2 bg-white/50 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>{users.length} 位成员</span>
        </div>
        <div className="flex -space-x-2">
          {users.slice(0, 5).map((u) => (
            <img
              key={u.id}
              src={u.avatar}
              alt={u.username}
              className="w-7 h-7 rounded-full border-2 border-white"
              title={u.username}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <BoardView board={currentBoard} users={users} />
      </div>

      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around z-40 flex-shrink-0">
        <button
          onClick={() => navigate('/boards')}
          className="flex flex-col items-center gap-1 text-gray-500"
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-xs">看板</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-primary">
          <Users className="w-5 h-5" />
          <span className="text-xs">团队</span>
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
