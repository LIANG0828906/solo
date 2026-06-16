import React, { useEffect, useState } from 'react';
import {
  HashRouter,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PollDetail from './components/PollDetail';
import PollForm from './components/PollForm';
import VotePage from './components/VotePage';
import { usePollStore } from './pollStore';
import { Input, Button, Modal } from 'antd';
import { EnterOutlined } from '@ant-design/icons';

const AppContent: React.FC = () => {
  const location = useLocation();
  const { initSocket } = usePollStore();
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  const isVotePage = location.pathname.startsWith('/vote/');

  const handleJoinPoll = () => {
    if (joinCode.trim()) {
      window.location.hash = `#/vote/${joinCode.trim().toUpperCase()}`;
      setJoinModalOpen(false);
      setJoinCode('');
    }
  };

  if (isVotePage) {
    return (
      <div>
        <Routes>
          <Route path="/vote/:shortCode" element={<VotePage />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="top-nav">
          <h1 style={{ flex: 1 }}>Quick Poll 投票系统</h1>
          <Button
            type="default"
            icon={<EnterOutlined />}
            onClick={() => setJoinModalOpen(true)}
            style={{ borderRadius: 20, background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}
          >
            参与投票
          </Button>
        </div>
        <div className="content-area">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/poll/:id" element={<PollDetail />} />
            <Route path="/create" element={<PollForm />} />
          </Routes>
        </div>
      </div>

      <Modal
        title="参与投票"
        open={joinModalOpen}
        onCancel={() => setJoinModalOpen(false)}
        footer={null}
        centered
      >
        <div style={{ padding: '16px 0' }}>
          <p style={{ marginBottom: '16px', color: '#666' }}>请输入6位短码参与投票</p>
          <Input
            size="large"
            placeholder="请输入短码"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            style={{
              fontSize: '20px',
              letterSpacing: '8px',
              textAlign: 'center',
              fontFamily: 'monospace',
              textTransform: 'uppercase',
            }}
            onPressEnter={handleJoinPoll}
          />
          <Button
            type="primary"
            block
            size="large"
            onClick={handleJoinPoll}
            style={{ marginTop: '16px', borderRadius: 20 }}
          >
            进入投票
          </Button>
        </div>
      </Modal>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;
