import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from './store/useGameStore';
import { IceStorage } from './components/IceStorage';
import { BanquetScene } from './components/BanquetScene';
import { useIceMelt } from './hooks/useIceMelt';
import './styles/global.css';

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const getLocationText = (location: string) => {
  switch (location) {
    case 'storage': return '凌阴';
    case 'backpack': return '背包';
    case 'vessel': return '冰鉴';
    default: return location;
  }
};

function App() {
  const {
    currentScene,
    iceBlocks,
    usedIceCount,
    totalLossRate,
    originalTotalIce,
    switchScene,
    meltedCount,
  } = useGameStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useIceMelt();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 900);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const batchIds = [...new Set(iceBlocks.map(b => b.batchId))];

  const totalRemaining = iceBlocks.length;
  const inStorage = iceBlocks.filter(b => b.location === 'storage').length;
  const inBackpack = iceBlocks.filter(b => b.location === 'backpack').length;
  const inVessel = iceBlocks.filter(b => b.location === 'vessel').length;

  const InfoPanel = () => (
    <div className="bamboo-panel">
      <h2 className="panel-title">冰政记录</h2>

      <div className="panel-section">
        <h3>冰块批次记录</h3>
        {batchIds.map(batchId => {
          const batchBlocks = iceBlocks.filter(b => b.batchId === batchId);
          return (
            <div key={batchId} className="ice-record">
              <div>
                <span className="batch-id">{batchId}</span>
                <span style={{ marginLeft: 8 }}>
                  入库: {formatTime(batchBlocks[0]?.storageTime || 0)}
                </span>
              </div>
              <div style={{ marginTop: 4, fontSize: 12 }}>
                数量: {batchBlocks.length} 块
              </div>
              {batchBlocks.slice(0, 3).map(block => (
                <div key={block.id} style={{ fontSize: 11, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    #{block.id.split('-')[1]} · {getLocationText(block.location)}
                  </span>
                  <span style={{ color: block.currentSize < 0.5 ? '#c0392b' : '#3d5a3a' }}>
                    {(block.currentSize * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
              {batchBlocks.length > 3 && (
                <div style={{ fontSize: 11, color: '#666' }}>... 还有 {batchBlocks.length - 3} 块</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="panel-section">
        <h3>冰块大小监控</h3>
        {iceBlocks.slice(0, 8).map(block => (
          <div key={block.id} className="ice-record" style={{ padding: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span>#{block.id.split('-')[1]} · {getLocationText(block.location)}</span>
              <span className="batch-id">{(block.currentSize * 100).toFixed(0)}%</span>
            </div>
            <div className="size-bar">
              <motion.div
                className="size-fill"
                initial={false}
                animate={{ width: `${block.currentSize * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        ))}
        {iceBlocks.length > 8 && (
          <div style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
            还有 {iceBlocks.length - 8} 块冰块...
          </div>
        )}
      </div>

      <div className="panel-section">
        <h3>宴会统计</h3>
        <div className="stat-row">
          <span>原始冰砖总数</span>
          <span className="stat-value">{originalTotalIce} 块</span>
        </div>
        <div className="stat-row">
          <span>当前剩余</span>
          <span className="stat-value">{totalRemaining} 块</span>
        </div>
        <div className="stat-row">
          <span>凌阴存储</span>
          <span className="stat-value">{inStorage} 块</span>
        </div>
        <div className="stat-row">
          <span>背包中</span>
          <span className="stat-value">{inBackpack} 块</span>
        </div>
        <div className="stat-row">
          <span>冰鉴中</span>
          <span className="stat-value">{inVessel} 块</span>
        </div>
        <div className="stat-row">
          <span>已使用冰砖</span>
          <span className="stat-value">{usedIceCount} 块</span>
        </div>
        <div className="stat-row">
          <span>已融化消失</span>
          <span className="stat-value">{meltedCount} 块</span>
        </div>
        <div className="stat-row">
          <span>总损耗率</span>
          <span className="stat-value">{totalLossRate}%</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <div className="main-area">
        <div className="scene-header">
          <motion.button
            className={`scene-btn ${currentScene === 'iceStorage' ? 'active' : ''}`}
            onClick={() => switchScene('iceStorage')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            凌阴
          </motion.button>
          <motion.button
            className={`scene-btn ${currentScene === 'banquet' ? 'active' : ''}`}
            onClick={() => switchScene('banquet')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            宴会厅
          </motion.button>
        </div>

        <AnimatePresence mode="wait">
          {currentScene === 'iceStorage' ? (
            <motion.div
              key="iceStorage"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              style={{ width: '100%', height: '100%' }}
            >
              <IceStorage />
            </motion.div>
          ) : (
            <motion.div
              key="banquet"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              style={{ width: '100%', height: '100%' }}
            >
              <BanquetScene />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!isMobile && (
        <div className="info-panel">
          <InfoPanel />
        </div>
      )}

      {isMobile && (
        <>
          <button
            className="hamburger-btn"
            onClick={() => setDrawerOpen(!drawerOpen)}
          >
            <span />
            <span />
            <span />
          </button>

          <div
            className={`drawer-overlay ${drawerOpen ? 'open' : ''}`}
            onClick={() => setDrawerOpen(false)}
          />

          <div className={`mobile-drawer ${drawerOpen ? 'open' : ''}`}>
            <InfoPanel />
          </div>
        </>
      )}
    </div>
  );
}

export default App;
