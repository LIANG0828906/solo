import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/stores/useStore';
import { JsonEditor } from '@/components/JsonEditor';
import { VersionPanel } from '@/components/VersionPanel';
import { Toolbar } from '@/components/Toolbar';
import { DiffViewer } from '@/components/DiffViewer';

export default function App() {
  const { drawerOpen, setDrawerOpen } = useStore();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 800;

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#F5F7FA',
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
      fontSize: '14px',
      lineHeight: '1.6',
      color: '#1A1A2E',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D9D9D9; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #BFBFBF; }
      `}</style>

      <header style={{
        height: '48px',
        backgroundColor: '#1A1A2E',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '12px',
        flexShrink: 0,
      }}>
        {isMobile && (
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
        )}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1890FF" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
          <span style={{
            color: '#FFFFFF',
            fontSize: '15px',
            fontWeight: 600,
            letterSpacing: '-0.02em',
          }}>
            UI Visual Diff
          </span>
        </div>
        <div style={{
          color: 'rgba(255,255,255,0.4)',
          fontSize: '11px',
          marginLeft: '8px',
        }}>
          Component Regression Testing
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {isMobile && drawerOpen && (
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              zIndex: 99,
            }}
          />
        )}

        <aside style={isMobile ? {
          position: 'fixed',
          top: 0,
          left: drawerOpen ? 0 : '-320px',
          bottom: 0,
          width: '320px',
          backgroundColor: '#F5F7FA',
          zIndex: 100,
          transition: 'left 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: drawerOpen ? '4px 0 16px rgba(0,0,0,0.1)' : 'none',
        } : {
          width: '320px',
          backgroundColor: '#F5F7FA',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #E8E8E8',
          flexShrink: 0,
        }}>
          <div style={{
            padding: '16px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <JsonEditor />
            <VersionPanel />
          </div>
        </aside>

        <main style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: isMobile ? '100%' : '600px',
          overflow: 'hidden',
        }}>
          <Toolbar />
          <DiffViewer />
        </main>
      </div>
    </div>
  );
}
