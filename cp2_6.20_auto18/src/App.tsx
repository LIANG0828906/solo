import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './views/HomePage';
import InterviewSetup from './views/InterviewSetup';
import RecordingPortal from './views/RecordingPortal';
import EvaluationDashboard from './views/EvaluationDashboard';
import EvaluationDetail from './views/EvaluationDetail';
import ResultsPage from './views/ResultsPage';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/interview/setup" element={<InterviewSetup />} />
          <Route path="/interview/:id/record" element={<RecordingPortal />} />
          <Route path="/evaluation" element={<EvaluationDashboard />} />
          <Route path="/evaluation/:id" element={<EvaluationDetail />} />
          <Route path="/results/:id" element={<ResultsPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
