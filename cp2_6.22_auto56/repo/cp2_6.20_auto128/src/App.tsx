import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import ClubDetail from './pages/ClubDetail';
import MyClubs from './pages/MyClubs';
import { useState, useEffect } from 'react';

const { Content } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const contentMarginLeft = isMobile ? '0' : collapsed ? '88px' : '224px';

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f6fa' }}>
      <Navbar />
      <Layout style={{ marginTop: 64 }}>
        <Sidebar collapsed={collapsed || isMobile} setCollapsed={setCollapsed} />
        <Content
          style={{
            padding: '24px',
            width: '100%',
            maxWidth: isMobile ? '100%' : 1200,
            margin: '0 auto',
            marginLeft: contentMarginLeft,
            transition: 'margin-left 0.3s ease',
            boxSizing: 'border-box',
          }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/club/:id" element={<ClubDetail />} />
            <Route path="/my-clubs" element={<MyClubs />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
