import { useEffect } from 'react';
import { Users } from 'lucide-react';
import useKanbanStore from '../store/useKanbanStore';
import socket from '../utils/socket';

export default function OnlineUsers() {
  const { onlineUsers, setOnlineUsers, addOnlineUser, removeOnlineUser } =
    useKanbanStore();

  useEffect(() => {
    fetch('/api/users/online')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setOnlineUsers(data);
      })
      .catch(() => {});

    const handleJoined = (user: { id: string; name: string; connectedAt: string }) => {
      addOnlineUser(user);
    };
    const handleLeft = (data: { id: string }) => {
      removeOnlineUser(data.id);
    };

    socket.on('user:joined', handleJoined);
    socket.on('user:left', handleLeft);

    return () => {
      socket.off('user:joined', handleJoined);
      socket.off('user:left', handleLeft);
    };
  }, [setOnlineUsers, addOnlineUser, removeOnlineUser]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Users size={16} className="text-[#3498db]" />
        <h2 className="font-bold text-[#2c3e50] text-sm">在线用户</h2>
        <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
          {onlineUsers.length}
        </span>
      </div>
      <div className="space-y-2">
        {onlineUsers.map((user) => (
          <div key={user.id} className="flex items-center gap-2 px-2 py-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            <span className="text-sm text-[#2c3e50] truncate">
              {user.name}
            </span>
          </div>
        ))}
        {onlineUsers.length === 0 && (
          <div className="text-xs text-gray-400 px-2 py-2">
            暂无在线用户
          </div>
        )}
      </div>
    </div>
  );
}
