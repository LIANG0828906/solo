import { useState, useEffect } from 'react';
import { Layout } from 'antd';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PollDetail from './components/PollDetail';
import PollForm from './components/PollForm';
import VotePage from './components/VotePage';
import { usePollStore } from './pollStore';
import { useSearchParams } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

const { Content } = Layout;

function AppContent() {
  const [searchParams] = useSearchParams();
  const shortCode = searchParams.get('code');
  const { currentPoll, fetchPolls, initSocket, disconnectSocket } = usePollStore();
  const [view, setView] = useState<'dashboard' | 'detail' | 'create'>('dashboard');

  useEffect(() => {
    initSocket();
    fetchPolls();
    return () => disconnectSocket();
  }, []);

  useEffect(() => {
    if (currentPoll && view === 'detail') {
      // nothing
    }
  }, [currentPoll, view]);

  if (shortCode) {
    return <VotePage shortCode={shortCode} />;
  }

  return (
    <Layout className="app-layout">
      <Sidebar onNavChange={setView} currentView={view} />
      <Content className="app-content">
        {view === 'dashboard' && <Dashboard onViewDetail={() => setView('detail')} onCreatePoll={() => setView('create')} />}
        {view === 'detail' && currentPoll && <PollDetail />}
        {view === 'create' && <PollForm onCreated={() => setView('dashboard')} />}
        {view === 'detail' && !currentPoll && (
          <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>
            请从左侧选择一个投票查看详情
          </div>
        )}
      </Content>
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
