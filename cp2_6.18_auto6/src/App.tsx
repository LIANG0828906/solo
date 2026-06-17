import { useState } from 'react';
import VoteList from './modules/投票模块/VoteList';
import VoteChart from './modules/统计模块/VoteChart';
import './App.css';

type Page = 'list' | 'stats';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('list');

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-brand">
          <span className="brand-icon">✓</span>
          <span className="brand-text">VoteHub</span>
        </div>
        <div className="navbar-links">
          <button
            className={`nav-link ${currentPage === 'list' ? 'active' : ''}`}
            onClick={() => setCurrentPage('list')}
          >
            投票列表
          </button>
          <button
            className={`nav-link ${currentPage === 'stats' ? 'active' : ''}`}
            onClick={() => setCurrentPage('stats')}
          >
            统计页面
          </button>
        </div>
      </nav>
      <main className="main-content">
        <div className={`page-container ${currentPage === 'list' ? 'active' : ''}`}>
          <VoteList />
        </div>
        <div className={`page-container ${currentPage === 'stats' ? 'active' : ''}`}>
          <VoteChart />
        </div>
      </main>
    </div>
  );
}

export default App;
