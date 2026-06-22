import { useState } from 'react';
import { useAuth } from './context';
import Login from './Login';
import TrainingPlan from './TrainingPlan';
import History from './History';

export default function App() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'training' | 'history'>('training');

  if (!user) {
    return <Login />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '56px',
          background: '#1E293B',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 100,
          borderBottom: '1px solid #334155',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
            }}
          >
            💪
          </div>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#F1F5F9' }}>训练日志本</span>
        </div>

        <div style={{ display: 'flex', gap: '4px', background: '#0F172A', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setActiveTab('training')}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              background: activeTab === 'training' ? '#6366F1' : 'transparent',
              color: activeTab === 'training' ? '#fff' : '#94A3B8',
            }}
          >
            训练
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              background: activeTab === 'history' ? '#6366F1' : 'transparent',
              color: activeTab === 'history' ? '#fff' : '#94A3B8',
            }}
          >
            历史
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#CBD5E1' }}>👤 {user.username}</span>
          <button
            onClick={logout}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              background: '#334155',
              color: '#CBD5E1',
              borderRadius: '6px',
            }}
          >
            退出
          </button>
        </div>
      </nav>

      <main style={{ marginTop: '56px', padding: '24px', flex: 1 }}>
        <div key={activeTab} className="fade-in">
          {activeTab === 'training' ? <TrainingPlan /> : <History />}
        </div>
      </main>
    </div>
  );
}
