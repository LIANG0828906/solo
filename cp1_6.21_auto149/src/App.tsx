import React from 'react';
import { AuctionProvider } from './context/AuctionContext';
import AuctionPanel from './components/AuctionPanel';
import DashboardPanel from './components/DashboardPanel';

const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  body {
    background: #0F172A;
    color: #F8FAFC;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow-x: hidden;
  }
  ::-webkit-scrollbar {
    width: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: #334155;
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #475569;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  select option {
    background: #1E293B;
    color: #F8FAFC;
  }
`;

export default function App() {
  return (
    <>
      <style>{styles}</style>
      <AuctionProvider>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <header
            style={{
              height: '60px',
              background: '#1E293B',
              borderBottom: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              padding: '0 24px',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#F8FAFC',
              }}
            >
              商品竞拍实时看板
            </div>
            <div
              style={{
                marginLeft: 'auto',
                fontSize: '13px',
                color: '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10B981',
                  display: 'inline-block',
                  animation: 'fadeIn 1s ease-in-out infinite alternate',
                }}
              />
              实时更新中
            </div>
          </header>

          <main
            className="app-main"
            style={{
              flex: 1,
              display: 'flex',
              gap: '16px',
              padding: '16px',
              overflow: 'auto',
            }}
          >
            <AuctionPanel />
            <DashboardPanel />
          </main>
        </div>
      </AuctionProvider>
    </>
  );
}
