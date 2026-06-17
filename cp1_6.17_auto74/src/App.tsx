import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { NoteEditor } from './components/NoteEditor';
import { StatisticsCharts } from './components/StatisticsCharts';
import { useNoteStore } from './store/useNoteStore';

const MainLayout: React.FC = () => {
  const { currentView, loadNotes } = useNoteStore();

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {currentView === 'editor' ? <NoteEditor /> : <StatisticsCharts />}
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
