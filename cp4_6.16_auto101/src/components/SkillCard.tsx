import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Skill } from '../types';
import { SKILL_CATEGORIES } from '../types';
import { useUserStore } from '../store/useUserStore';
import Avatar from './Avatar';
import { Clock, ArrowRightLeft } from 'lucide-react';

export interface SkillCardProps {
  skill: Skill;
  showUserInfo?: boolean;
  onExchangeClick?: (skill: Skill) => void;
  onClick?: (skill: Skill) => void;
  className?: string;
}

export default function SkillCard({
  skill,
  showUserInfo = false,
  onExchangeClick,
  onClick,
  className,
}: SkillCardProps) {
  const { users } = useUserStore();

  const user = useMemo(() => {
    return users.find((u) => u.id === skill.userId) || null;
  }, [users, skill.userId]);

  const categoryLabel = useMemo(() => {
    const cat = SKILL_CATEGORIES.find((c) => c.value === skill.category);
    return cat?.label || skill.category;
  }, [skill.category]);

  const displayTags = useMemo(() => {
    return skill.tags.slice(0, 3);
  }, [skill.tags]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    return date.toLocaleDateString('zh-CN');
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(skill);
    }
  };

  const handleExchangeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onExchangeClick) {
      onExchangeClick(skill);
    }
  };

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border-2 border-gray-200 p-5 cursor-pointer',
        'hover:-translate-y-1 hover:shadow-lg transition-all duration-200',
        'flex flex-col',
        className
      )}
      style={{
        width: '280px',
        animation: 'fadeIn 0.4s ease-out',
      }}
      onClick={handleCardClick}
    >
      {showUserInfo && user && (
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
          <Avatar username={user.username} size={40} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {user.username}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user.description || '暂无简介'}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-lg font-semibold text-gray-800 line-clamp-1 flex-1">
          {skill.name}
        </h3>
        <span className="shrink-0 px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">
          {categoryLabel}
        </span>
      </div>

      <p
        className="text-sm text-gray-600 mb-4 line-clamp-2 flex-1"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {skill.description}
      </p>

      {displayTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {displayTags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-md"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Clock size={14} />
          <span>{formatDate(skill.createdAt)}</span>
        </div>
        <button
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white',
            'bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors',
            'active:scale-95'
          )}
          onClick={handleExchangeClick}
        >
          <ArrowRightLeft size={14} />
          <span>发起交换</span>
        </button>
      </div>
    </div>
  );
}
