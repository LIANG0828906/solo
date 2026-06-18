import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PreviewCanvas } from './components/PreviewCanvas';
import { ScalePanel } from './components/ScalePanel';
import { Toolbar } from './components/Toolbar';
import { ExportModal } from './components/ExportModal';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div className="app-container">
              <div className="main-content">
                <PreviewCanvas />
                <ScalePanel />
              </div>
              <Toolbar />
              <ExportModal />
            </div>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
