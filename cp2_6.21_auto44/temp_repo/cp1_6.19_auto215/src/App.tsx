import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from './store/useStore';
import { ExchangeBoard } from './modules/core/ExchangeBoard';
import { DetailPanel } from './modules/core/DetailPanel';
import { EcoDashboard } from './modules/eco/EcoDashboard';
import { BottomNav } from './components/BottomNav';
import { PublishButton } from './components/PublishButton';
import { PublishModal } from './components/PublishModal';
import { NotificationToast } from './components/NotificationToast';
import type { Item } from './types';

export default function App() {
  const { activeTab } = useStore();
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
  };

  const handleBack = () => {
    setSelectedItem(null);
  };

  const renderContent = () => {
    if (activeTab === 'eco') {
      return <EcoDashboard key="eco" />;
    }

    if (selectedItem) {
      return <DetailPanel key="detail" item={selectedItem} onBack={handleBack} />;
    }

    return <ExchangeBoard key="board" onItemClick={handleItemClick} />;
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #1A2634 0%, #0F1419 100%)',
        color: '#E0E0E0',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
      }}
    >
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (selectedItem ? '-detail' : '')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            style={{
              flex: 1,
              display: 'flex',
            }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>

        <BottomNav />
        <PublishButton />
        <PublishModal />
        <NotificationToast />
      </div>

      <style>{`
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        @media (max-width: 768px) {
          .exchange-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
