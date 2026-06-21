import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import VoteCreator from './components/VoteCreator';
import VoteCard from './components/VoteCard';
import { Vote, getVotes, createVote, submitVote } from './api';

function getUserId(): string {
  let id = localStorage.getItem('vote_user_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('vote_user_id', id);
  }
  return id;
}

const userId = getUserId();

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export default function App() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'expired'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showCreator, setShowCreator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const loadVotes = useCallback(async () => {
    try {
      const data = await getVotes();
      setVotes(data);
    } catch {
      addToast('加载失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadVotes();
    const timer = setInterval(loadVotes, 5000);
    return () => clearInterval(timer);
  }, [loadVotes]);

  const handleCreate = useCallback(async (data: { title: string; options: string[]; duration: number }) => {
    try {
      await createVote(data);
      await loadVotes();
      setShowCreator(false);
      addToast('投票创建成功', 'success');
    } catch {
      addToast('创建失败', 'error');
    }
  }, [loadVotes, addToast]);

  const handleVote = useCallback(async (voteId: string, optionId: string) => {
    try {
      const updated = await submitVote(voteId, userId, optionId);
      setVotes(prev => prev.map(v => v.id === voteId ? updated : v));
      addToast('投票成功', 'success');
    } catch (err: any) {
      addToast(err.message || '投票失败', 'error');
    }
  }, [addToast]);

  const filteredVotes = votes.filter(v => {
    const isExpired = v.deadline < Date.now();
    if (activeTab === 'active' && isExpired) return false;
    if (activeTab === 'expired' && !isExpired) return false;
    if (searchKeyword) {
      return v.title.toLowerCase().includes(searchKeyword.toLowerCase());
    }
    return true;
  });

  const sortedVotes = [...filteredVotes].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA' }}>
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSearch={setSearchKeyword}
        onCreateClick={() => setShowCreator(true)}
      />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 80px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: 24,
                  height: 200,
                  animation: 'skeleton 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        ) : sortedVotes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#999' }}>
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ marginBottom: 16, opacity: 0.4 }}>
              <rect x="20" y="30" width="80" height="60" rx="8" fill="#E0E0E0" />
              <rect x="30" y="45" width="40" height="6" rx="3" fill="#BDBDBD" />
              <rect x="30" y="58" width="60" height="4" rx="2" fill="#BDBDBD" />
              <rect x="30" y="68" width="50" height="4" rx="2" fill="#BDBDBD" />
              <circle cx="85" cy="40" r="8" fill="#BDBDBD" />
              <text x="60" y="40" textAnchor="middle" fill="#9E9E9E" fontSize="10">?</text>
            </svg>
            <p style={{ fontSize: 16 }}>暂无投票</p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 20,
            }}
          >
            {sortedVotes.map(vote => (
              <div
                key={vote.id}
                style={{
                  animation: 'fadeIn 0.3s ease-out',
                }}
              >
                <VoteCard vote={vote} onVote={handleVote} userId={userId} />
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreator && (
        <VoteCreator onCreate={handleCreate} onClose={() => setShowCreator(false)} />
      )}

      <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 300, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              background: toast.type === 'success' ? '#4CAF50' : '#F44336',
              color: '#fff',
              padding: '10px 24px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 500,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              animation: 'slideIn 0.3s ease-out',
              whiteSpace: 'nowrap',
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes skeleton {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @media (max-width: 1024px) {
          main > div { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          main > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
