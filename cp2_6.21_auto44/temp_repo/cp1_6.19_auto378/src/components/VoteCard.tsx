import { useEffect, useState } from 'react';
import { VoteListItem } from '../types';
import { EASING } from '../ChartRenderer';

interface VoteCardProps {
  vote: VoteListItem;
  onClick: () => void;
}

function formatTimeShort(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}小时${minutes}分`;
  }
  if (minutes > 0) {
    return `${minutes}分${seconds}秒`;
  }
  return `${seconds}秒`;
}

function VoteCard({ vote, onClick }: VoteCardProps) {
  const [remainingTime, setRemainingTime] = useState(vote.remainingTime);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingTime(prev => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setRemainingTime(vote.remainingTime);
  }, [vote.remainingTime]);

  const isExpired = remainingTime <= 0 || !vote.isActive;

  return (
    <div
      onClick={onClick}
      className="relative overflow-hidden cursor-pointer"
      style={{
        width: '300px',
        borderRadius: '12px',
        backgroundColor: '#FFFFFF',
        boxShadow: isHovered 
          ? '0 12px 32px rgba(93, 78, 55, 0.25)' 
          : '0 4px 12px rgba(93, 78, 55, 0.1)',
        transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: `all 0.5s ${EASING}`,
        opacity: isExpired ? 0.7 : 1
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 
            className="font-bold text-lg leading-tight pr-2"
            style={{ color: '#5D4E37' }}
          >
            {vote.title}
          </h3>
          <span 
            className="px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap"
            style={{ 
              backgroundColor: isExpired ? '#EFEBE9' : '#E8F5E9',
              color: isExpired ? '#8D6E63' : '#2E7D32'
            }}
          >
            {isExpired ? '已结束' : '进行中'}
          </span>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#F5F5DC' }}
            >
              <span style={{ color: '#8D6E63' }}>📊</span>
            </div>
            <div>
              <p className="text-xs" style={{ color: '#A1887F' }}>选项数量</p>
              <p className="font-semibold" style={{ color: '#5D4E37' }}>{vote.optionCount} 个选项</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: isExpired ? '#EFEBE9' : '#FFEBEE' }}
            >
              <span style={{ color: isExpired ? '#8D6E63' : '#FF5252' }}>⏱</span>
            </div>
            <div>
              <p className="text-xs" style={{ color: '#A1887F' }}>剩余时间</p>
              <p 
                className="font-semibold tabular-nums"
                style={{ color: isExpired ? '#8D6E63' : '#FF5252' }}
              >
                {isExpired ? '已结束' : formatTimeShort(remainingTime)}
              </p>
            </div>
          </div>
        </div>

        <div 
          className="mt-4 text-center py-2 rounded-lg transition-all"
          style={{
            backgroundColor: isHovered ? '#8D6E63' : '#F5F5DC',
            transition: `all 0.3s ${EASING}`
          }}
        >
          <span 
            className="font-medium text-sm"
            style={{ color: isHovered ? '#FFFFFF' : '#8D6E63' }}
          >
            {isExpired ? '查看结果' : '立即投票'}
          </span>
        </div>
      </div>

      <div 
        className="absolute top-0 left-0 h-1 transition-all"
        style={{
          width: isHovered ? '100%' : '0%',
          background: 'linear-gradient(90deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4)',
          transition: `width 0.5s ${EASING}`
        }}
      />
    </div>
  );
}

export default VoteCard;
