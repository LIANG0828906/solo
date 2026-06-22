import { memo } from 'react';
import { User, UserCheck } from 'lucide-react';
import type { Vote } from '@/types';

interface ParticipantListProps {
  votes: Vote[];
  newVoteId?: string | null;
}

const ParticipantList = memo(function ParticipantList({
  votes,
  newVoteId,
}: ParticipantListProps) {
  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {votes.length === 0 ? (
        <div className="text-center py-8 text-dark-500">
          <User className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">暂无参与者</p>
        </div>
      ) : (
        votes.map((vote, index) => (
          <div
            key={vote.id}
            className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-500 ${
              newVoteId === vote.id
                ? 'bg-primary-600/20 animate-pulse-soft'
                : 'hover:bg-dark-700'
            }`}
            style={{
              animation:
                newVoteId === vote.id
                  ? 'fade-in-up 0.5s ease-out'
                  : undefined,
              animationDelay: `${index * 0.03}s`,
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white flex-shrink-0"
              style={{ backgroundColor: vote.userColor }}
            >
              {vote.userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-dark-200 truncate">
                {vote.userName}
              </div>
              <div className="text-xs text-dark-500">
                {vote.availableSlotIds.length} 个时段可用
              </div>
            </div>
            <UserCheck className="w-4 h-4 text-dark-500 flex-shrink-0" />
          </div>
        ))
      )}
    </div>
  );
});

export default ParticipantList;
