import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ActivityList from './components/ActivityList';
import ActivityForm from './components/ActivityForm';
import TestDashboard from './components/TestDashboard';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div style={styles.app}>
        <Navbar />
        <main style={styles.mainContent}>
          <Routes>
            <Route path="/" element={<ActivityList />} />
            <Route path="/activities" element={<ActivityList />} />
            <Route path="/create" element={<ActivityForm />} />
            <Route path="/edit/:id" element={<ActivityForm />} />
            <Route path="/dashboard" element={<TestDashboard />} />
            <Route path="/dashboard/:id" element={<TestDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  mainContent: {
    flex: 1,
    marginTop: '64px',
    padding: '0',
  },
};

export default App;
