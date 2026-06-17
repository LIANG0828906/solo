import React, { useState, useEffect, useCallback } from 'react';
import { useVoteStore } from './store/voteStore';
import VoteList from './pages/VoteList';
import VoteCreate from './pages/VoteCreate';
import VoteDetail from './pages/VoteDetail';
import './index.css';

type Page =
  | { type: 'list' }
  | { type: 'create' }
  | { type: 'detail'; voteId: string };

export default function App() {
  const [page, setPage] = useState<Page>({ type: 'list' });
  const [fadeKey, setFadeKey] = useState(0);
  const fetchVoteList = useVoteStore((s) => s.fetchVoteList);

  useEffect(() => {
    fetchVoteList();
  }, [fetchVoteList]);

  const navigate = useCallback((p: Page) => {
    setPage(p);
    setFadeKey((k) => k + 1);
  }, []);

  let content: React.ReactNode;

  switch (page.type) {
    case 'create':
      content = (
        <VoteCreate
          onCreated={() => navigate({ type: 'list' })}
          onBack={() => navigate({ type: 'list' })}
        />
      );
      break;
    case 'detail':
      content = (
        <VoteDetail
          voteId={page.voteId}
          onBack={() => navigate({ type: 'list' })}
        />
      );
      break;
    default:
      content = (
        <VoteList
          onSelect={(id) => navigate({ type: 'detail', voteId: id })}
          onCreate={() => navigate({ type: 'create' })}
        />
      );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6F9' }}>
      <header
        style={{
          background: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#6C63FF',
            cursor: 'pointer',
          }}
          onClick={() => navigate({ type: 'list' })}
        >
          🗳️ Team Vote
        </h1>
        <button
          onClick={() => navigate({ type: 'create' })}
          style={{
            background: '#6C63FF',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 20px',
            fontSize: '14px',
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
          + 创建投票
        </button>
      </header>
      <main key={fadeKey} className="fade-in" style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        {content}
      </main>
    </div>
  );
}
