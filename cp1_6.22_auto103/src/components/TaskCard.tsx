import React from 'react';
import { Task } from '../types';

const ASSIGNEE_COLORS: Record<string, string> = {
  Alice: '#FF6B6B',
  Bob: '#4ECDC4',
  Charlie: '#FF9F43',
};

interface Props {
  task: Task;
  onClick: () => void;
}

export default function TaskCard({ task, onClick }: Props) {
  const timeAgo = getTimeAgo(task.createdAt);
  const assigneeColor = ASSIGNEE_COLORS[task.assignee] || '#888';

  return (
    <div
      onClick={onClick}
      style={{
        background: '#32324A', borderRadius: 8, padding: 14, cursor: 'pointer',
        border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.15s',
        marginBottom: 8, position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <h4 style={{ fontSize: 14, color: '#fff', marginBottom: 8, lineHeight: 1.4 }}>{task.title}</h4>
      {task.description && (
        <p style={{ fontSize: 12, color: '#999', marginBottom: 10, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {task.description}
        </p>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 22, height: 22, borderRadius: '50%', background: assigneeColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, color: '#fff', fontWeight: 600,
          }}>
            {task.assignee[0]}
          </div>
          <span style={{ fontSize: 12, color: '#aaa' }}>{task.assignee}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#777' }}>
          <span>{timeAgo}</span>
          {task.comments.length > 0 && (
            <div style={{
              background: '#FF6B6B', borderRadius: 10, padding: '2px 7px',
              fontSize: 11, color: '#fff', fontWeight: 600, lineHeight: 1.2,
            }}>
              {task.comments.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}
