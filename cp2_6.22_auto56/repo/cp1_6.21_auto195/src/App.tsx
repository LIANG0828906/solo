import React, { useState, useEffect } from 'react';
import CustomerView from './components/customer/CustomerView';
import AdminView from './components/admin/AdminView';

const App: React.FC = () => {
  const [view, setView] = useState<'customer' | 'admin'>('customer');

  const navStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background: 'linear-gradient(135deg, #FFF7ED 0%, #FEF2F2 100%)',
    borderBottom: '0.5px solid #E5E7EB',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  };

  const navContainerStyle: React.CSSProperties = {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const logoStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    color: '#F59E0B',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const tabsContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    background: '#FFFFFF',
    borderRadius: '12px',
    padding: '4px',
    border: '0.5px solid #E5E7EB',
  };

  const getTabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '10px 24px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'all 0.15s ease',
    background: isActive ? '#F59E0B' : 'transparent',
    color: isActive ? '#FFFFFF' : '#6B7280',
  });

  const mainStyle: React.CSSProperties = {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '100px 24px 40px',
    minHeight: '100vh',
  };

  return (
    <div>
      <nav style={navStyle}>
        <div style={navContainerStyle}>
          <div style={logoStyle}>
            <span style={{ fontSize: '28px' }}>🍽️</span>
            <span>美食轩</span>
          </div>
          <div style={tabsContainerStyle}>
            <button
              style={getTabStyle(view === 'customer')}
              onClick={() => setView('customer')}
              onMouseEnter={(e) => {
                if (view !== 'customer') {
                  (e.currentTarget as HTMLButtonElement).style.background = '#FEF3C7';
                  (e.currentTarget as HTMLButtonElement).style.color = '#92400E';
                }
              }}
              onMouseLeave={(e) => {
                if (view !== 'customer') {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = '#6B7280';
                }
              }}
            >
              🛒 顾客前台
            </button>
            <button
              style={getTabStyle(view === 'admin')}
              onClick={() => setView('admin')}
              onMouseEnter={(e) => {
                if (view !== 'admin') {
                  (e.currentTarget as HTMLButtonElement).style.background = '#FEF3C7';
                  (e.currentTarget as HTMLButtonElement).style.color = '#92400E';
                }
              }}
              onMouseLeave={(e) => {
                if (view !== 'admin') {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = '#6B7280';
                }
              }}
            >
              ⚙️ 管理后台
            </button>
          </div>
        </div>
      </nav>
      <main style={mainStyle}>
        {view === 'customer' ? <CustomerView /> : <AdminView />}
      </main>
    </div>
  );
};

export default App;
