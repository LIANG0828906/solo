import React from 'react';
import { BoardSummary } from '../types';

interface Props {
  boards: BoardSummary[];
  onBoardClick: (id: string) => void;
  onCreateBoard: () => void;
}

export default function BoardList({ boards, onBoardClick, onCreateBoard }: Props) {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            <span style={{ color: '#00D4AA' }}>Task</span>Board
          </h1>
          <p style={{ color: '#888', fontSize: 14 }}>团队任务看板与协作空间</p>
        </div>
        <button
          onClick={onCreateBoard}
          style={{
            background: '#00D4AA', border: 'none', color: '#1E1E2E', borderRadius: 8,
            padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 8,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#00B894'; e.currentTarget.style.transform = 'scale(1.03)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#00D4AA'; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> 创建看板
        </button>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20,
      }}>
        {boards.map((board) => (
          <div
            key={board.id}
            onClick={() => onBoardClick(board.id)}
            style={{
              background: '#2A2A3E', borderRadius: 12, padding: 24, cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,212,170,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <h3 style={{ fontSize: 17, color: '#fff', marginBottom: 8 }}>{board.name}</h3>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 16, lineHeight: 1.5 }}>
              {board.description || '暂无描述'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#666', fontSize: 13 }}>
              <span>📋</span> {board.taskCount} 个任务
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
