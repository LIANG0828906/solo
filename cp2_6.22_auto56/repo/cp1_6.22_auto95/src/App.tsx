import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import VoteCreation from '@/components/VoteCreation';
import VotePanel from '@/components/VotePanel';
import ResultsDashboard from '@/components/ResultsDashboard';

type View = 'create' | 'vote' | 'results';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('create');
  const [currentVoteId, setCurrentVoteId] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [voterId] = useState(() => uuidv4().substring(0, 12));

  const handleVoteCreated = useCallback((voteId: string) => {
    setCurrentVoteId(voteId);
    setCurrentView('vote');
  }, []);

  const handleViewResults = useCallback(() => {
    setCurrentView('results');
  }, []);

  const handleJoin = useCallback(() => {
    const trimmed = joinInput.trim();
    if (trimmed.length === 8) {
      setCurrentVoteId(trimmed);
      setCurrentView('vote');
      setJoinInput('');
    }
  }, [joinInput]);

  const navigateTo = (view: View) => {
    setCurrentView(view);
  };

  return (
    <div className="app">
      <nav className="navbar">
        <span className="app-title">实时投票</span>
        <div className="nav-indicators">
          {(['create', 'vote', 'results'] as View[]).map((view) => (
            <button
              key={view}
              className={`nav-dot ${currentView === view ? 'active' : ''}`}
              onClick={() => {
                if (view === 'create') navigateTo('create');
                else if (view === 'vote' && currentVoteId) navigateTo('vote');
                else if (view === 'results' && currentVoteId) navigateTo('results');
              }}
            >
              <span className="dot" />
              <span className="dot-label">
                {view === 'create' ? '创建' : view === 'vote' ? '投票' : '结果'}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {currentVoteId && currentView !== 'create' && (
        <div className="vote-id-banner">
          投票 ID：<span className="vote-id-text">{currentVoteId}</span>
        </div>
      )}

      <main className="main-content">
        {currentView === 'create' && (
          <div className="home-layout">
            <div className="home-left">
              <VoteCreation onVoteCreated={handleVoteCreated} />
            </div>
            <div className="home-right">
              <div className="glass-card join-card">
                <h3 className="join-title">加入投票</h3>
                <p className="join-hint">输入 8 位投票 ID 即可参与</p>
                <div className="join-row">
                  <input
                    type="text"
                    className="form-input join-input"
                    placeholder="输入投票 ID"
                    maxLength={8}
                    value={joinInput}
                    onChange={(e) => setJoinInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  />
                  <button
                    className="btn-primary btn-join"
                    onClick={handleJoin}
                    disabled={joinInput.trim().length !== 8}
                  >
                    加入
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'vote' && currentVoteId && (
          <VotePanel
            voteId={currentVoteId}
            voterId={voterId}
            onViewResults={handleViewResults}
          />
        )}

        {currentView === 'results' && currentVoteId && (
          <ResultsDashboard voteId={currentVoteId} />
        )}
      </main>
    </div>
  );
};

export default App;
