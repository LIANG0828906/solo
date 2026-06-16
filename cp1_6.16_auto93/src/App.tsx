import React, { useState } from 'react';
import { SceneCardList } from './components/SceneCard';
import VotePanel from './components/VotePanel';
import PathTrail from './components/PathTrail';

const App: React.FC = () => {
  const [voteDrawerOpen, setVoteDrawerOpen] = useState(false);

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__logo">🎬 互动电影</h1>
        <span className="app__subtitle">分支叙事 · 观众投票</span>
      </header>

      <main className="app__main">
        <div className="app__left">
          <SceneCardList />
        </div>
        <aside className="app__right">
          <VotePanel />
        </aside>
      </main>

      <PathTrail />

      <button
        className="app__vote-fab"
        onClick={() => setVoteDrawerOpen(!voteDrawerOpen)}
      >
        📊 投票
      </button>

      <div className={`app__drawer ${voteDrawerOpen ? 'app__drawer--open' : ''}`}>
        <div className="app__drawer-header">
          <span>投票统计</span>
          <button onClick={() => setVoteDrawerOpen(false)}>✕</button>
        </div>
        <VotePanel />
      </div>
      {voteDrawerOpen && (
        <div className="app__drawer-overlay" onClick={() => setVoteDrawerOpen(false)} />
      )}
    </div>
  );
};

export default App;
