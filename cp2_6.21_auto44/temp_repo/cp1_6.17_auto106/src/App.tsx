import { useEffect, useState } from 'react';
import { useStore } from './store';
import HallPage from './HallPage';
import CollectionPage from './CollectionPage';
import LabPage from './LabPage';
import type { TabType } from './types';

const TABS: { key: TabType; label: string }[] = [
  { key: 'hall', label: '展厅概览' },
  { key: 'collection', label: '收藏册' },
  { key: 'lab', label: '气味实验室' }
];

export default function App() {
  const { currentTab, setCurrentTab, fetchSmells, smells } = useStore();
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    if (smells.length === 0) {
      fetchSmells();
    }
  }, [fetchSmells, smells.length]);

  const handleTabChange = (tab: TabType) => {
    if (tab !== currentTab) {
      setCurrentTab(tab);
      setFadeKey((k) => k + 1);
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'hall':
        return <HallPage />;
      case 'collection':
        return <CollectionPage />;
      case 'lab':
        return <LabPage />;
      default:
        return <HallPage />;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#2C3E50'
      }}
    >
      <nav
        style={{
          height: '60px',
          backgroundColor: '#1A252F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          flexShrink: 0,
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
        }}
      >
        {TABS.map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isActive ? '#2C3E50' : 'transparent',
                color: isActive ? '#ECF0F1' : '#7F8C8D',
                fontSize: '15px',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#BDC3C7';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = '#7F8C8D';
                }
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <main
        key={fadeKey}
        style={{
          flex: 1,
          overflow: 'hidden',
          animation: 'fadeIn 0.3s ease'
        }}
      >
        {renderContent()}
      </main>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #1A252F;
        }

        ::-webkit-scrollbar-thumb {
          background: #34495E;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #7F8C8D;
        }
      `}</style>
    </div>
  );
}
