import React, { useState, useEffect } from 'react';
import { TypographyProvider } from '@/contexts/TypographyContext';
import FontSelector from '@/FontSelectorModule/FontSelector';
import PreviewCanvas from '@/TypographyPreviewModule/PreviewCanvas';
import ControlPanel from '@/TypographyPreviewModule/ControlPanel';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <TypographyProvider>
      <div style={{ minWidth: '768px', overflowX: 'auto', minHeight: '100vh' }}>
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              position: 'fixed',
              left: '16px',
              top: '16px',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: '#2C3E50',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              zIndex: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            }}
          >
            ☰
          </button>
        )}

        {sidebarOpen && isMobile && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.4)',
              zIndex: 9,
              animation: 'fadeIn 0.3s ease',
            }}
          />
        )}

        <aside
          className={`sidebar ${sidebarOpen ? 'open' : ''}`}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            width: '320px',
            zIndex: 10,
            background: '#FFFFFF',
            borderRight: '1px solid var(--color-border, #EEEEEE)',
            boxShadow: '2px 0 12px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            ...(isMobile && {
              transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.3s ease',
            }),
          }}
        >
          <div
            style={{
              padding: '20px',
              borderBottom: '1px solid var(--color-border, #EEEEEE)',
              background: 'linear-gradient(135deg, #2C3E50 0%, #34495E 100%)',
              color: '#fff',
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.5px' }}>
              🔤 字体选择器
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
              Font Selector · 点击选择
            </div>
          </div>
          <FontSelector />
        </aside>

        <main
          className="main-area"
          style={{
            marginLeft: isMobile ? 0 : '320px',
            minHeight: '100vh',
            padding: '24px',
            background: '#F5F0E6',
            transition: 'margin-left 0.3s ease',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              marginBottom: '24px',
              padding: isMobile ? '0 0 0 60px' : 0,
            }}
          >
            <div
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#2C3E50',
                letterSpacing: '0.3px',
              }}
            >
              Font Pairing Studio · 字体搭配工坊
            </div>
          </div>

          <PreviewCanvas />
          <ControlPanel />
        </main>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 768px) {
          .sidebar {
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }
          .sidebar.open {
            transform: translateX(0);
          }
          .main-area {
            margin-left: 0 !important;
          }
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-accent, #E27D60);
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
          transition: transform 0.15s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-accent, #E27D60);
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
        }
      `}</style>
    </TypographyProvider>
  );
}
