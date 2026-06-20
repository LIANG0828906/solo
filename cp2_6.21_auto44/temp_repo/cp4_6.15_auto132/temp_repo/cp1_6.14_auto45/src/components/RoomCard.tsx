import type { RoomListItem } from '../types';
import { Users, StickyNote, Clock, Tag } from 'lucide-react';

interface RoomCardProps {
  room: RoomListItem;
  onClick: () => void;
}

export default function RoomCard({ room, onClick }: RoomCardProps) {
  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins}分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  };

  return (
    <div
      onClick={onClick}
      className="card p-5 cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-[#e0e0e0] group-hover:text-[#ffd700] transition-colors line-clamp-1">
          {room.name}
        </h3>
        {room.isVoting && (
          <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium bg-[#ffa502]/20 text-[#ffa502] border border-[#ffa502]/30">
            投票中
          </span>
        )}
      </div>

      {room.description && (
        <p className="text-sm text-[#9ca3af] mb-3 line-clamp-2">{room.description}</p>
      )}

      {room.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {room.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-[#1a1a2e] text-[#9ca3af] border border-white/5"
            >
              <Tag size={10} />
              {tag}
            </span>
          ))}
          {room.tags.length > 3 && (
            <span className="text-xs text-[#666]">+{room.tags.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-[#666] pt-2 border-t border-white/5">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Users size={12} />
            {room.participantCount}
          </span>
          <span className="flex items-center gap-1">
            <StickyNote size={12} />
            {room.cardCount}
          </span>
        </div>
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {timeAgo(room.createdAt)}
        </span>
      </div>
    </div>
  );
}
