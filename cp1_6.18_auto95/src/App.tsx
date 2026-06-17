import React, { useState, useEffect, useCallback, useRef } from 'react';
import PricePanel from './components/PricePanel';
import IndicatorPanel from './components/IndicatorPanel';
import TradeCard from './components/TradeCard';
import HistoryTable from './components/HistoryTable';
import { marketSimulator } from './data/marketSimulator';
import { CandleData, MarketData } from './services/types';
import { useTradeStore } from './stores/useTradeStore';
import './index.css';

const App: React.FC = () => {
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [latestData, setLatestData] = useState<MarketData | null>(null);
  const updatePrices = useTradeStore((state) => state.updatePrices);
  const positions = useTradeStore((state) => state.positions);
  const balance = useTradeStore((state) => state.balance);
  const totalPnl = useTradeStore((state) => state.totalPnl);
  const buy = useTradeStore((state) => state.buy);

  const rafRef = useRef<number | null>(null);
  const pendingDataRef = useRef<MarketData | null>(null);
  const pendingCandleRef = useRef<CandleData | null>(null);

  const processUpdates = useCallback(() => {
    const pendingCandle = pendingCandleRef.current;
    if (pendingCandle) {
      setCandles((prev) => {
        const newCandles = [...prev, pendingCandle];
        if (newCandles.length > 100) {
          return newCandles.slice(-100);
        }
        return newCandles;
      });
      pendingCandleRef.current = null;
    }

    const pendingData = pendingDataRef.current;
    if (pendingData) {
      setLatestData(pendingData);
      updatePrices(pendingData.close);
      pendingDataRef.current = null;
    }

    rafRef.current = requestAnimationFrame(processUpdates);
  }, [updatePrices]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(processUpdates);

    const unsubscribeData = marketSimulator.onData((data) => {
      pendingDataRef.current = data;
    });

    const unsubscribeCandle = marketSimulator.onCandle((candle) => {
      pendingCandleRef.current = candle;
    });

    const history = marketSimulator.getCandleHistory();
    if (history.length > 0) {
      setCandles(history);
    }

    marketSimulator.start();

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      unsubscribeData();
      unsubscribeCandle();
      marketSimulator.stop();
    };
  }, [processUpdates]);

  const handleBuy = () => {
    buy(marketSimulator.getSymbol(), 100);
  };

  const totalAssets = balance + positions.reduce((sum, p) => sum + p.currentPrice * p.quantity, 0);
  const totalPositionValue = positions.reduce((sum, p) => sum + p.currentPrice * p.quantity, 0);
  const totalCost = positions.reduce((sum, p) => sum + p.avgCost * p.quantity, 0);
  const floatingPnl = totalPositionValue - totalCost;

  return (
    <div className="app-container" style={styles.app}>
      <div style={styles.header}>
        <h1 style={styles.title}>股票模拟交易看板</h1>
        <div style={styles.statsRow}>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>总资产</span>
            <span style={styles.statValue}>¥{totalAssets.toFixed(2)}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>可用余额</span>
            <span style={styles.statValue}>¥{balance.toFixed(2)}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>持仓市值</span>
            <span style={styles.statValue}>¥{totalPositionValue.toFixed(2)}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>浮动盈亏</span>
            <span style={{ ...styles.statValue, color: floatingPnl >= 0 ? '#00D4AA' : '#FF5C58' }}>
              {floatingPnl >= 0 ? '+' : ''}¥{floatingPnl.toFixed(2)}
            </span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>累计盈亏</span>
            <span style={{ ...styles.statValue, color: totalPnl >= 0 ? '#00D4AA' : '#FF5C58' }}>
              {totalPnl >= 0 ? '+' : ''}¥{totalPnl.toFixed(2)}
            </span>
          </div>
          <button style={styles.buyBtn} onClick={handleBuy}>
            买入 100股
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="left-column">
          <IndicatorPanel candles={candles} />
          <HistoryTable />
        </div>

        <div className="right-column">
          <PricePanel candles={candles} latestData={latestData} />
          <div style={styles.positionsSection}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>当前持仓</h3>
              <span style={styles.positionCount}>{positions.length} 笔</span>
            </div>
            <div className="positions-scroll" style={styles.positionsScroll}>
              {positions.length === 0 ? (
                <div style={styles.emptyPositions}>
                  <p style={styles.emptyText}>暂无持仓，点击上方按钮开始交易</p>
                </div>
              ) : (
                positions.map((position) => (
                  <TradeCard key={position.id} position={position} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    backgroundColor: '#121220',
    color: '#E0E0E0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    padding: '20px 24px',
    backgroundColor: '#1E1E30',
    borderBottom: '1px solid #2A2A40',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: '#E0E0E0',
  },
  statsRow: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statLabel: {
    color: '#888',
    fontSize: '12px',
  },
  statValue: {
    color: '#E0E0E0',
    fontSize: '18px',
    fontWeight: 600,
    fontFamily: 'monospace',
    transition: 'color 0.2s ease',
  },
  buyBtn: {
    marginLeft: 'auto',
    padding: '10px 24px',
    backgroundColor: '#00D4AA',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
  },
  positionsSection: {
    backgroundColor: '#1E1E30',
    borderRadius: '12px',
    border: '1px solid #2A2A40',
    padding: '16px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  sectionTitle: {
    color: '#E0E0E0',
    fontSize: '16px',
    fontWeight: 600,
    margin: 0,
  },
  positionCount: {
    color: '#888',
    fontSize: '13px',
  },
  positionsScroll: {
    display: 'flex',
    gap: '12px',
    overflowX: 'auto',
    paddingBottom: '8px',
  },
  emptyPositions: {
    width: '100%',
    padding: '40px 20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    margin: 0,
    fontSize: '14px',
  },
};

export default App;
