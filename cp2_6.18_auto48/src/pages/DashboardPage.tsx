import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import StatsDashboard from '../components/StatsDashboard';
import { RippleButton } from './HomePage';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, loadData } = useAppStore();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogin = () => {
    if (password === 'admin123') {
      setAuthenticated(true);
    } else {
      alert('密码错误！');
    }
  };

  if (!authenticated) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 60px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '360px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            border: '1px solid #E5E7EB',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔐</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1F2937', margin: 0 }}>
              管理员登录
            </h2>
            <p style={{ fontSize: '14px', color: '#6B7280', margin: '8px 0 0 0' }}>
              请输入管理员密码访问统计看板
            </p>
          </div>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="请输入密码"
            style={{
              width: '100%',
              padding: '12px 14px',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: '16px',
            }}
          />

          <RippleButton onClick={handleLogin} style={{ width: '100%', padding: '12px' }}>
            登录
          </RippleButton>

          <button
            onClick={() => navigate('/')}
            style={{
              width: '100%',
              marginTop: '12px',
              padding: '10px',
              border: 'none',
              background: 'none',
              color: '#6B7280',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          border: 'none',
          background: 'none',
          color: '#10B981',
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        ← 返回首页
      </button>
      <StatsDashboard items={items} />
    </div>
  );
};

export default DashboardPage;
