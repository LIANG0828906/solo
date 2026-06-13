import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import CoursePlanner from './components/CoursePlanner';
import LearningProgress from './components/LearningProgress';
import LearnerManagement from './components/LearnerManagement';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { useState } from 'react';

function App() {
  const [currentLearnerId] = useState('learner-1');

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/courses" replace />} />
          <Route path="/courses" element={<CoursePlanner />} />
          <Route path="/learners" element={<LearnerManagement />} />
          <Route
            path="/progress"
            element={<LearningProgress learnerId={currentLearnerId} />}
          />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
