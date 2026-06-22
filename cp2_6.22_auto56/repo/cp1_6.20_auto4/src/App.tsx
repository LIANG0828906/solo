import React, { useState, useEffect } from 'react';
import CreatePoll from './CreatePoll';
import PollView from './PollView';
import AdminPanel from './AdminPanel';
import { WebSocketProvider } from './WebSocketProvider';

type Page = 'create' | 'poll' | 'admin';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('create');
  const [pollId, setPollId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash.slice(1);
      if (hash.startsWith('poll/')) {
        const id = hash.slice(5);
        setPollId(id);
        setCurrentPage('poll');
      } else if (hash === 'admin') {
        setCurrentPage('admin');
      } else {
        setCurrentPage('create');
        setPollId(null);
      }
    };

    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handlePollCreated = (id: string) => {
    window.location.hash = `poll/${id}`;
    showToast('投票创建成功！');
  };

  const goToCreate = () => {
    window.location.hash = '';
  };

  const goToAdmin = () => {
    window.location.hash = 'admin';
  };

  const openPoll = (id: string) => {
    window.location.hash = `poll/${id}`;
  };

  return (
    <WebSocketProvider>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <h1 className="logo" onClick={goToCreate} style={{ cursor: 'pointer' }}>
              实时投票系统
            </h1>
            <nav>
              <button className="btn btn-secondary nav-btn" onClick={goToCreate}>
                创建投票
              </button>
              <button className="btn btn-secondary nav-btn" onClick={goToAdmin}>
                管理后台
              </button>
            </nav>
          </div>
        </header>

        <main className="container">
          {currentPage === 'create' && <CreatePoll onCreated={handlePollCreated} />}
          {currentPage === 'poll' && pollId && (
            <PollView pollId={pollId} showToast={showToast} />
          )}
          {currentPage === 'admin' && (
            <AdminPanel onPollSelect={openPoll} showToast={showToast} />
          )}
        </main>

        {toast && <div className="toast">{toast}</div>}
      </div>
    </WebSocketProvider>
  );
};

export default App;
