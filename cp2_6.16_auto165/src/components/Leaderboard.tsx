import { useState } from 'react';
import Avatar from './Avatar';
import Timeline from './Timeline';
import { useAppStore } from '@/store';
import { formatDate } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface MedalProps {
  rank: number;
}

function Medal({ rank }: MedalProps) {
  const colors: Record<number, string> = {
    1: '#FFD700',
    2: '#C0C0C0',
    3: '#CD7F32',
  };
  const color = colors[rank];
  if (!color) return null;

  return (
    <div className="medal-spin" style={{ perspective: '1000px' }}>
      <svg width="28" height="28" viewBox="0 0 24 24" className="shrink-0 drop-shadow-sm">
        <circle cx="12" cy="14" r="7" fill={color} />
        <circle cx="12" cy="14" r="7" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
        <path d="M8 3 L9 9 L12 7 L15 9 L16 3" fill={color} stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
        <text
          x="12"
          y="17"
          textAnchor="middle"
          fontSize="8"
          fontWeight="bold"
          fill="#fff"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
        >
          {rank}
        </text>
      </svg>
    </div>
  );
}

const rankClasses: Record<number, string> = {
  1: 'leaderboard-gold',
  2: 'leaderboard-silver',
  3: 'leaderboard-bronze',
};

export default function Leaderboard() {
  const { rankedVolunteers, getTransactionsByVolunteerId } = useAppStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div>
      <h3 className="text-navy-900 font-bold text-xl mb-4">🏆 志愿者排行榜</h3>
      <div className="space-y-2">
        {rankedVolunteers.map((volunteer, index) => {
          const rank = index + 1;
          const isExpanded = expandedId === volunteer.id;
          const borderClass = rankClasses[rank] || 'border border-transparent';
          const transactions = getTransactionsByVolunteerId(volunteer.id);
          const timelineEvents = transactions.map((t) => ({
            id: t.id,
            date: t.created_at,
            title: t.type === 'donate' ? `捐赠 ${t.hours} 小时` : `完成 ${t.hours} 小时`,
            description: t.description,
          }));

          return (
            <div key={volunteer.id}>
              <div
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200',
                  borderClass,
                  isExpanded && 'shadow-md',
                )}
                onClick={() => setExpandedId(isExpanded ? null : volunteer.id)}
              >
                <div className="w-8 flex items-center justify-center shrink-0">
                  {rank <= 3 ? (
                    <Medal rank={rank} />
                  ) : (
                    <span className="text-gray-400 font-bold text-sm w-7 text-center">
                      {rank}
                    </span>
                  )}
                </div>

                <Avatar name={volunteer.name} size="sm" />

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-navy-900 truncate">{volunteer.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {formatDate(volunteer.last_active_at)}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-bold text-amber-700">{volunteer.completed_hours}h</p>
                  <p className="text-xs text-gray-400">累计</p>
                </div>
              </div>

              {isExpanded && (
                <div className="ml-8 mt-2 mb-4 pl-4 border-l-2 border-amber-100 py-2">
                  <Timeline events={timelineEvents} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
