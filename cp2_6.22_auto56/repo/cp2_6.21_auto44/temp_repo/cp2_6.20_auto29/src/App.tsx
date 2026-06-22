import React from 'react';
import { Routes, Route } from 'react-router-dom';
import VoteCreator from './components/VoteCreator';
import VoteMain from './components/VoteMain';

const App: React.FC = () => {
  return (
    <div style={{ backgroundColor: '#f0f4f8', minHeight: '100vh' }}>
      <Routes>
        <Route path="/" element={<VoteCreator />} />
        <Route path="/vote/:voteId" element={<VoteMain />} />
      </Routes>
    </div>
  );
};

export default App;
