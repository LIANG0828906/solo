import { Routes, Route, useNavigate } from 'react-router-dom';
import CreateVote from './pages/CreateVote';
import VotePage from './pages/VotePage';
import ResultsPage from './pages/ResultsPage';

function App() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="header-nav">
        <h1 onClick={() => navigate('/')}>偏好排序投票</h1>
      </div>
      <div className="container">
        <Routes>
          <Route path="/" element={<CreateVote />} />
          <Route path="/vote/:id" element={<VotePage />} />
          <Route path="/vote/:id/results" element={<ResultsPage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
