import { useDocStore } from '../store/useDocStore';
import { Users } from 'lucide-react';

export default function OnlineUsers() {
  const onlineUsers = useDocStore((s) => s.onlineUsers);
  const currentUser = useDocStore((s) => s.currentUser);

  return (
    <div className="absolute top-3 right-3 z-20">
      <div className="flex items-center gap-1">
        {onlineUsers.map((user) => (
          <div
            key={user.userId}
            className="group relative flex items-center"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm border-2 border-white transition-transform hover:scale-110"
              style={{ backgroundColor: user.color }}
            >
              {user.nickname.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald rounded-full border-2 border-white" />
            <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 px-2 py-1 bg-navy text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {user.nickname}
              {user.userId === currentUser?.userId && ' (你)'}
            </div>
          </div>
        ))}
        {onlineUsers.length > 0 && (
          <div className="flex items-center gap-1 ml-1 px-2 py-1 bg-navy/5 rounded-full text-navy text-xs">
            <Users className="w-3 h-3" />
            <span>{onlineUsers.length}</span>
          </div>
        )}
      </div>
    </div>
  );
}
