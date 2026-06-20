import { useState, useCallback } from 'react';
import { FiSearch } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Timeline from './timeline/Timeline';
import MapView from './map/MapView';
import { getBatchData, BatchData, TimelineNode, LocationPoint } from './data/batchData';
import './styles/global.css';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentBatch, setCurrentBatch] = useState<BatchData | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationPoint | null>(null);
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      setError('请输入批次号');
      return;
    }
    setIsSearching(true);
    setError('');
    setTimeout(() => {
      const data = getBatchData(searchQuery.trim());
      if (data) {
        setCurrentBatch(data);
        setSelectedNodeId(null);
        setSelectedLocation(null);
        setError('');
      } else {
        setCurrentBatch(null);
        setError('未找到该批次号的溯源信息，请检查后重试');
      }
      setIsSearching(false);
    }, 300);
  }, [searchQuery]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch]
  );

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedNodeId((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  const handleLocationClick = useCallback((location: LocationPoint) => {
    setSelectedLocation(location);
  }, []);

  const handleMarkerClick = useCallback((location: LocationPoint) => {
    setSelectedLocation(location);
    if (currentBatch) {
      const node = currentBatch.nodes.find(
        (n) => n.location.lat === location.lat && n.location.lng === location.lng
      );
      if (node) {
        setSelectedNodeId(node.id);
      }
    }
  }, [currentBatch]);

  const locations = currentBatch ? currentBatch.nodes.map((n) => n.location) : [];

  return (
    <div className="app-container">
      <motion.header
        className="app-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="app-title">食品溯源与供应链透明化平台</h1>
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="请输入食品批次号，如：FOOD-2024-001234"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <motion.button
            className="search-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSearch}
          >
            <FiSearch size={18} color="#fff" />
          </motion.button>
        </div>
        {error && (
          <motion.div
            className="error-message"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {error}
          </motion.div>
        )}
      </motion.header>

      <main className="app-main">
        <AnimatePresence mode="wait">
          {isSearching ? (
            <motion.div
              key="loading"
              className="loading-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="loading-spinner"></div>
              <p>正在查询溯源信息...</p>
            </motion.div>
          ) : currentBatch ? (
            <motion.div
              key="content"
              className="content-wrapper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="batch-info"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2>
                  {currentBatch.productName}
                  <span className="batch-id">批次号：{currentBatch.batchId}</span>
                </h2>
                <p className="production-date">生产日期：{currentBatch.productionDate}</p>
              </motion.div>

              <div className="main-content">
                <div className="left-panel">
                  <Timeline
                    nodes={currentBatch.nodes}
                    selectedNodeId={selectedNodeId}
                    onNodeSelect={handleNodeSelect}
                    onLocationClick={handleLocationClick}
                  />

                  <motion.div
                    className="overview-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h3>全链路数据概览</h3>
                    <div className="overview-grid">
                      {currentBatch.nodes.map((node, index) => (
                        <OverviewCell key={node.id} node={node} index={index} />
                      ))}
                    </div>
                  </motion.div>
                </div>

                <div className="right-panel">
                  <MapView
                    locations={locations}
                    selectedLocation={selectedLocation}
                    onMarkerClick={handleMarkerClick}
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              className="empty-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="empty-icon">🔍</div>
              <h3>输入批次号查询溯源信息</h3>
              <p>示例批次号：FOOD-2024-001234 或 123456 或 test</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        .app-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--color-bg);
        }

        .app-header {
          background: var(--color-bg-white);
          padding: 24px 32px;
          box-shadow: var(--shadow-card);
          z-index: 10;
        }

        .app-title {
          font-size: 24px;
          margin-bottom: 16px;
          text-align: center;
        }

        .search-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .search-input {
          width: 320px;
          height: 44px;
          padding: 0 16px;
          background: var(--color-text-title);
          color: var(--color-text-white);
          border-radius: var(--radius-md);
          font-size: 14px;
          border: 2px solid transparent;
          transition: border-color var(--transition-slow) ease;
        }

        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .search-input:focus {
          border-color: var(--color-primary);
        }

        .search-button {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all var(--transition-normal) ease;
        }

        .search-button:hover {
          box-shadow: 0 4px 12px rgba(0, 184, 148, 0.4);
        }

        .error-message {
          text-align: center;
          color: var(--color-danger);
          margin-top: 12px;
          font-size: 13px;
        }

        .app-main {
          flex: 1;
          padding: 24px 32px;
          position: relative;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 0;
          gap: 16px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--color-border-light);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 0;
          gap: 12px;
        }

        .empty-icon {
          font-size: 64px;
          opacity: 0.5;
        }

        .empty-state h3 {
          font-size: 18px;
          color: var(--color-text-title);
        }

        .empty-state p {
          color: var(--color-text-body);
          font-size: 14px;
        }

        .content-wrapper {
          width: 100%;
        }

        .batch-info {
          background: var(--color-bg-white);
          padding: 20px 24px;
          border-radius: var(--radius-lg);
          margin-bottom: 20px;
          box-shadow: var(--shadow-card);
        }

        .batch-info h2 {
          font-size: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .batch-id {
          font-size: 14px;
          font-weight: 400;
          color: var(--color-primary);
          background: rgba(0, 184, 148, 0.1);
          padding: 4px 12px;
          border-radius: var(--radius-sm);
        }

        .production-date {
          margin-top: 8px;
          color: var(--color-text-body);
          font-size: 14px;
        }

        .main-content {
          display: flex;
          gap: 24px;
          height: calc(100vh - 320px);
          min-height: 500px;
        }

        .left-panel {
          width: 40%;
          display: flex;
          flex-direction: column;
          gap: 20px;
          overflow-y: auto;
          padding-right: 8px;
        }

        .right-panel {
          flex: 1;
          background: var(--color-bg-white);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-card);
        }

        .overview-card {
          background: var(--color-bg-card);
          border-radius: var(--radius-lg);
          padding: 16px;
          flex-shrink: 0;
        }

        .overview-card h3 {
          font-size: 16px;
          margin-bottom: 16px;
          color: var(--color-text-title);
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        .overview-cell {
          aspect-ratio: 1 / 1;
          background: var(--color-bg-white);
          border-radius: var(--radius-md);
          padding: 12px;
          box-shadow: var(--shadow-inner);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .overview-cell-header {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
        }

        .stage-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .stage-name {
          font-size: 11px;
          color: var(--color-text-body);
          font-weight: 500;
        }

        .overview-metrics {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .metric-row {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          line-height: 1.4;
        }

        .metric-label {
          color: var(--color-text-body);
        }

        .metric-value {
          color: var(--color-text-title);
          font-weight: 600;
        }

        .metric-value.anomaly {
          color: var(--color-danger);
        }

        .metric-value.anomaly.shake {
          animation: shake 0.1s ease-in-out;
        }

        @media (max-width: 768px) {
          .app-header {
            padding: 16px;
          }

          .app-title {
            font-size: 18px;
          }

          .search-input {
            width: 100%;
            max-width: 280px;
          }

          .app-main {
            padding: 16px;
          }

          .main-content {
            flex-direction: column;
            height: auto;
            min-height: 0;
          }

          .left-panel {
            width: 100%;
            height: auto;
            max-height: none;
            order: 1;
          }

          .right-panel {
            width: 100%;
            height: 300px;
            order: 2;
          }

          .overview-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

function OverviewCell({ node, index }: { node: TimelineNode; index: number }) {
  const [shake, setShake] = useState(false);
  const hasAnomaly = node.anomalies > 0;

  const stageColorMap: Record<string, string> = {
    origin: 'var(--color-stage-origin)',
    processing: 'var(--color-stage-processing)',
    logistics: 'var(--color-stage-logistics)',
    sales: 'var(--color-stage-sales)',
  };

  const stageNameMap: Record<string, string> = {
    origin: '原料产地',
    processing: '加工阶段',
    logistics: '物流阶段',
    sales: '销售阶段',
  };

  if (hasAnomaly && !shake) {
    setTimeout(() => setShake(true), index * 200 + 500);
  }

  return (
    <motion.div
      className="overview-cell"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 + index * 0.1 }}
    >
      <div className="overview-cell-header">
        <div
          className="stage-indicator"
          style={{ background: stageColorMap[node.stage] }}
        />
        <span className="stage-name">{stageNameMap[node.stage]}</span>
      </div>
      <div className="overview-metrics">
        <div className="metric-row">
          <span className="metric-label">总耗时</span>
          <span className="metric-value">{node.totalHours}h</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">机构数</span>
          <span className="metric-value">{node.organizations}</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">温度</span>
          <span className="metric-value">
            {node.temperatureRange[0]}-{node.temperatureRange[1]}°C
          </span>
        </div>
        <div className="metric-row">
          <span className="metric-label">异常</span>
          <span
            className={`metric-value ${hasAnomaly ? 'anomaly' : ''} ${
              hasAnomaly && shake ? 'shake' : ''
            }`}
          >
            {node.anomalies}次
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default App;
