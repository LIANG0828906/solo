import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BoardProvider } from './context/BoardContext';
import BoardList from './components/BoardList';
import Whiteboard from './components/Whiteboard';

const App: React.FC = () => {
  return (
    <BoardProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<BoardList />} />
          <Route path="/board/:id" element={<Whiteboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </BoardProvider>
  );
};

export default App;
