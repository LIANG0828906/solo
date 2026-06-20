import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import VoteCreator from './components/VoteCreator';
import VotePage from './components/VotePage';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <Link to="/" className="app-logo">
          <span className="app-logo-icon">L</span>
          <span>LiveVote</span>
        </Link>
        <div style={{ fontSize: '13px', color: '#8892a0' }}>
          实时匿名投票看板
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<VoteCreator />} />
          <Route path="/vote/:voteId" element={<VotePage />} />
        </Routes>
      </main>
    </div>
    </Router>
  );
}

export default App;
