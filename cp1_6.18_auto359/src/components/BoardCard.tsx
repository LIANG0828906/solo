import { useNavigate } from 'react-router-dom';
import { Calendar, Users } from 'lucide-react';
import type { Board } from '@/types';
import { formatDate } from '@/utils/date';

interface BoardCardProps {
  board: Board;
  taskCount?: number;
}

export function BoardCard({ board, taskCount = 0 }: BoardCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className="card glass"
      style={{
        padding: '24px',
        cursor: 'pointer',
        minHeight: '160px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      onClick={() => navigate(`/board/${board.id}`)}
    >
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--color-primary)' }}>
          {board.name}
        </h3>
        {board.description && (
          <p style={{
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {board.description}
          </p>
        )}
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={14} />
            <span>{formatDate(board.createdAt)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Users size={14} />
            <span>{board.memberIds.length + 1}人</span>
          </div>
        </div>
        <div style={{
          background: 'var(--color-accent)',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 600,
        }}>
          {taskCount} 任务
        </div>
      </div>
    </div>
  );
}
