import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReadingGoal } from '@/types';
import { CATEGORY_GRADIENTS } from '@/types';

interface ReadingGoalCardProps {
  goal: ReadingGoal;
  onClick?: () => void;
}

export function ReadingGoalCard({ goal, onClick }: ReadingGoalCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const progress = goal.totalPages > 0
    ? Math.min(Math.round((goal.currentPage / goal.totalPages) * 100), 100)
    : 0;

  const gradient = CATEGORY_GRADIENTS[goal.category] || CATEGORY_GRADIENTS['其他'];
  const circumference = 2 * Math.PI * 24;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/goal/${goal.id}`);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-[#DCD6D0] bg-white cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group"
      style={{ transition: 'all 0.25s ease' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{ background: gradient }}
      />

      <div className="relative p-5">
        <div className="flex items-start gap-4">
          <div className="w-20 h-28 rounded-lg overflow-hidden shadow-md flex-shrink-0">
            <img
              src={goal.coverImage}
              alt={goal.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-800 truncate font-serif" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              {goal.title}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{goal.author}</p>
            <span className="inline-block mt-2 px-2 py-0.5 text-xs rounded-full bg-white/80 text-gray-600 border border-gray-200">
              {goal.category}
            </span>
            <p className="text-xs text-gray-400 mt-2">
              截止：{formatDate(goal.deadline)}
            </p>
          </div>

          <div className="relative flex-shrink-0">
            <svg
              width="60"
              height="60"
              viewBox="0 0 60 60"
              className={`transition-transform duration-500 ${isHovered ? 'rotate-360' : ''}`}
              style={{ transform: isHovered ? 'rotate(360deg)' : 'rotate(0deg)' }}
            >
              <circle
                cx="30"
                cy="30"
                r="24"
                stroke="#E5E7EB"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="30"
                cy="30"
                r="24"
                stroke="url(#gradient)"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 30 30)"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B4513" />
                  <stop offset="100%" stopColor="#A0522D" />
                </linearGradient>
              </defs>
            </svg>
            <div
              className={`absolute inset-0 flex items-center justify-center text-sm font-bold transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
              style={{ color: '#8B4513' }}
            >
              {progress}%
            </div>
            <div
              className={`absolute inset-0 flex items-center justify-center text-sm font-bold transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}
              style={{ color: '#8B4513' }}
            >
              {goal.currentPage}/{goal.totalPages}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">已读页数</span>
            <span className="font-medium" style={{ color: '#8B4513' }}>
              {goal.currentPage} / {goal.totalPages} 页
            </span>
          </div>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #8B4513, #A0522D)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
