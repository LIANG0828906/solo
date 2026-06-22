import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Layout, theme } from 'antd';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PollDetail from './components/PollDetail';
import PollForm from './components/PollForm';
import VotePage from './components/VotePage';
import ThankYouPage from './components/ThankYouPage';
import { usePollStore } from './pollStore';

const { Header, Content } = Layout;

const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initSocket = usePollStore(s => s.initSocket);
  const fetchPolls = usePollStore(s => s.fetchPolls);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    initSocket();
    fetchPolls();
  }, []);

  const isVotePage = location.pathname.startsWith('/vote') || location.pathname.startsWith('/thank-you');

  if (isVotePage) {
    return (
      <Routes>
        <Route path="/vote/:shortCode" element={<VotePage />} />
        <Route path="/thank-you" element={<ThankYouPage />} />
      </Routes>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#F5F5F5' }}>
      <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      <Layout>
        <Header
          style={{
            background: '#3F51B5',
            height: 56,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#fff',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            {location.pathname === '/' && '仪表盘'}
            {location.pathname === '/create' && '创建投票'}
            {location.pathname.startsWith('/poll/') && '投票详情'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {location.pathname === '/' && (
              <button
                onClick={() => navigate('/create')}
                style={{
                  background: '#FF4081',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 20,
                  padding: '8px 20px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#F50057')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#FF4081')}
              >
                + 创建投票
              </button>
            )}
          </div>
        </Header>
        <Content
          style={{
            margin: 0,
            padding: 24,
            minHeight: 280,
            animation: 'fadeIn 0.5s ease',
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<PollForm />} />
            <Route path="/poll/:id" element={<PollDetail />} />
          </Routes>
        </Content>
      </Layout>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(63, 81, 181, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(63, 81, 181, 0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes drawLine {
          from { stroke-dashoffset: 1000; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </Layout>
  );
};

export default App;
