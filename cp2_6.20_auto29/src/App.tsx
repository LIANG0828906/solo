import React from 'react';
import { Routes, Route } from 'react-router-dom';

const VoteCreator: React.FC = () => {
  return (
    <div>
      <h1>Vote Creator</h1>
    </div>
  );
};

const VoteMain: React.FC = () => {
  return (
    <div>
      <h1>Vote Main</h1>
    </div>
  );
};

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
