import React, { useEffect } from 'react';
import { useVoteStore } from '../store/voteStore';

export default function VoteList({
  onSelect,
  onCreate,
}: {
  onSelect: (id: string) => void;
  onCreate: () => void;
}) {
  const { voteList, loading, fetchVoteList } = useVoteStore();

  useEffect(() => {
    fetchVoteList();
  }, [fetchVoteList]);

  if (loading && voteList.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
        加载中...
      </div>
    );
  }

  if (voteList.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <div style={{ fontSize: '48px', marginBottom: 16 }}>📭</div>
        <p style={{ color: '#6B7280', fontSize: '16px', marginBottom: 20 }}>
          暂无投票，快来创建第一个吧！
        </p>
        <button
          onClick={onCreate}
          style={{
            background: '#6C63FF',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 24px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.background = '#5A52D5';
            (e.target as HTMLElement).style.transform = 'scale(1.02)';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.background = '#6C63FF';
            (e.target as HTMLElement).style.transform = 'scale(1)';
          }}
        >
          创建投票
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16,
        }}
        className="vote-list-grid"
      >
        {voteList.map((vote) => (
          <div
            key={vote.id}
            onClick={() => onSelect(vote.id)}
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px #00000010',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: '1.5px solid transparent',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform =
                'translateY(-2px)';
              (e.currentTarget as HTMLElement).style.boxShadow =
                '0 6px 20px #00000015';
              (e.currentTarget as HTMLElement).style.borderColor = '#6C63FF30';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow =
                '0 2px 8px #00000010';
              (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
            }}
          >
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#2C3E50',
                marginBottom: 8,
                lineHeight: 1.3,
              }}
            >
              {vote.title}
            </h3>
            {vote.description && (
              <p
                style={{
                  fontSize: '14px',
                  color: '#6C757D',
                  marginBottom: 12,
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {vote.description}
              </p>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '14px',
                  color: '#6C757D',
                  background: '#F3F4F6',
                  padding: '3px 10px',
                  borderRadius: '20px',
                }}
              >
                {vote.optionCount} 个选项
              </span>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#27AE60',
                }}
              >
                {vote.totalVotes} 人已投
              </span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .vote-list-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
