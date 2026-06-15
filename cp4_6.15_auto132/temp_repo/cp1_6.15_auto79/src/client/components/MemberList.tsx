import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { Member } from '@/types';

interface MemberListProps {
  members: Member[];
  newJoinId?: string;
}

const RoleIcon = ({ role }: { role: Member['role'] }) => {
  if (role === 'admin') {
    return <span className="text-yellow-400" title="管理员">⭐</span>;
  }
  if (role === 'editor') {
    return <span className="text-blue-400" title="编辑者">✏️</span>;
  }
  return <span className="text-gray-400" title="查看者">👁</span>;
};

const getInitials = (name: string) => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};

const getAvatarColor = (id: string) => {
  const colors = [
    'from-pink-500 to-rose-500',
    'from-purple-500 to-indigo-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-yellow-500 to-orange-500',
    'from-red-500 to-pink-500',
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function MemberList({ members, newJoinId }: MemberListProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (newJoinId) {
      const member = members.find((m) => m.id === newJoinId);
      if (member) {
        setToast({ id: member.id, name: member.name });
        const timer = setTimeout(() => setToast(null), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [newJoinId, members]);

  const maxVisible = 6;
  const visibleMembers = members.slice(0, maxVisible);
  const remainingCount = members.length - maxVisible;

  return (
    <div className="relative flex items-center">
      <div className="flex items-center -space-x-3">
        {visibleMembers.map((member) => (
          <div
            key={member.id}
            className="relative"
            onMouseEnter={() => setHoveredId(member.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <div
              className={cn(
                'relative w-10 h-10 rounded-full bg-gradient-to-br',
                getAvatarColor(member.id),
                'flex items-center justify-center text-white font-semibold text-sm',
                'border-2 transition-shadow duration-200',
                member.online ? 'border-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'border-gray-500',
                newJoinId === member.id && 'avatar-drop',
                'cursor-pointer hover:z-10 hover:scale-110 transition-transform duration-200'
              )}
            >
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span>{getInitials(member.name)}</span>
              )}
              {member.online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--bg-primary)]" />
              )}
            </div>

            {hoveredId === member.id && (
              <div
                className={cn(
                  'absolute bottom-full left-1/2 -translate-x-1/2 mb-2',
                  'bg-[var(--bg-secondary)] border border-white/10 rounded-lg px-3 py-2',
                  'shadow-xl whitespace-nowrap z-50',
                  'flex items-center gap-2'
                )}
              >
                <span className="text-[var(--text-primary)] text-sm font-medium">
                  {member.name}
                </span>
                <RoleIcon role={member.role} />
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                  <div className="w-2 h-2 rotate-45 bg-[var(--bg-secondary)] border-r border-b border-white/10" />
                </div>
              </div>
            )}
          </div>
        ))}

        {remainingCount > 0 && (
          <div
            className={cn(
              'relative w-10 h-10 rounded-full bg-[var(--card-bg)]',
              'flex items-center justify-center text-white font-semibold text-sm',
              'border-2 border-gray-600'
            )}
          >
            <span>+{remainingCount}</span>
          </div>
        )}
      </div>

      {toast && (
        <div
          key={toast.id}
          className="absolute left-full ml-4 bubble-toast"
        >
          <div className="bg-[var(--card-bg)] border border-white/10 rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span className="text-sm text-[var(--text-primary)]">
              {toast.name}加入了排练
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
