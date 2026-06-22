import { useState, useEffect } from 'react';
import { Plus, Vote } from 'lucide-react';
import { useVoteApi } from '../hooks/useVoteApi';
import { VoteCard } from './VoteCard';
import { CreateVoteModal } from './CreateVoteModal';
import type { CreateVoteForm } from '../types';

interface HousePageProps {
  onNavigateToDetail: (id: string) => void;
}

export function HousePage({ onNavigateToDetail }: HousePageProps) {
  const { topics, createTopic, hasUserVoted, updateTopicStatuses } = useVoteApi();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    updateTopicStatuses();
    const interval = setInterval(() => {
      updateTopicStatuses();
    }, 1000);
    return () => clearInterval(interval);
  }, [updateTopicStatuses]);

  const handleCreateVote = (form: CreateVoteForm) => {
    createTopic(form);
    setIsModalOpen(false);
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          padding: '24px 32px',
          borderBottom: '1px solid var(--border-default)',
          backgroundColor: 'rgba(15, 15, 35, 0.85)',
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-success))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Vote size={22} style={{ color: '#fff' }} />
            </div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-success))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              VoteCast
            </h1>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              width: '180px',
              height: '44px',
              backgroundColor: 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-primary-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
            }}
          >
            <Plus size={18} />
            创建投票
          </button>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          padding: '32px',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <div
          style={{
            marginBottom: '24px',
          }}
        >
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '8px',
            }}
          >
            投票主题列表
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
            }}
          >
            共 {topics.length} 个投票 · {topics.filter(t => t.status === 'ongoing').length} 个进行中
          </p>
        </div>

        {topics.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 20px',
              borderRadius: '16px',
              backgroundColor: 'var(--bg-card)',
              border: '1px dashed var(--border-hover)',
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                backgroundColor: 'rgba(108, 99, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <Vote size={36} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '8px',
              }}
            >
              还没有投票主题
            </h3>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                marginBottom: '24px',
                textAlign: 'center',
                maxWidth: '400px',
              }}
            >
              点击右上角的"创建投票"按钮，开始你的第一个团队投票吧！
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                padding: '10px 24px',
                backgroundColor: 'var(--accent-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-primary-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
              }}
            >
              <Plus size={16} />
              创建第一个投票
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
            }}
          >
            {topics.map((topic) => (
              <VoteCard
                key={topic.id}
                topic={topic}
                hasVoted={hasUserVoted(topic.id)}
                onClick={() => onNavigateToDetail(topic.id)}
              />
            ))}
          </div>
        )}
      </main>

      <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: repeat(3"] {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          div[style*="grid-template-columns: repeat(3"],
          div[style*="grid-template-columns: repeat(2"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {isModalOpen && (
        <CreateVoteModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateVote}
        />
      )}
    </div>
  );
}
