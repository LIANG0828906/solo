import React, { useState, useEffect, useRef, useCallback } from 'react';
import ControlPanel from './ControlPanel';
import TradeChart from './TradeChart';
import ResultModal from './ResultModal';
import { tradeEngine } from '../engine/tradeEngine';
import {
  EngineState,
  CivilizationType,
  ResourceType,
  NegotiationStrategy,
  TradeRecord,
  CIVILIZATION_NAMES,
  RESOURCE_NAMES,
  CIVILIZATION_COLORS,
} from '../engine/types';

const App: React.FC = () => {
  const [engineState, setEngineState] = useState<EngineState>(tradeEngine.getState());
  const [tickProgress, setTickProgress] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [tradeListScrollTop, setTradeListScrollTop] = useState(0);
  const tradeListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleStateUpdate = (data: unknown) => {
      setEngineState(data as EngineState);
    };

    const handleTick = (data: unknown) => {
      const tickData = data as { progress: number; currentRound: number; totalRounds: number };
      setTickProgress(tickData.progress);
    };

    const handleNegotiationComplete = () => {
      setShowResultModal(true);
    };

    tradeEngine.on('stateUpdate', handleStateUpdate);
    tradeEngine.on('tick', handleTick);
    tradeEngine.on('negotiationComplete', handleNegotiationComplete);

    return () => {
      tradeEngine.off('stateUpdate', handleStateUpdate);
      tradeEngine.off('tick', handleTick);
      tradeEngine.off('negotiationComplete', handleNegotiationComplete);
    };
  }, []);

  const handleResourceChange = useCallback(
    (civId: CivilizationType, resource: ResourceType, value: number) => {
      tradeEngine.setResource(civId, resource, value);
    },
    []
  );

  const handleStrategyChange = useCallback(
    (civId: CivilizationType, strategy: NegotiationStrategy) => {
      tradeEngine.setStrategy(civId, strategy);
    },
    []
  );

  const handleStart = useCallback(() => {
    tradeEngine.start();
  }, []);

  const handleReset = useCallback(() => {
    tradeEngine.reset();
    setShowResultModal(false);
  }, []);

  const handleRandomize = useCallback(() => {
    tradeEngine.randomize();
    setShowResultModal(false);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowResultModal(false);
  }, []);

  const overallProgress =
    ((engineState.currentRound + tickProgress) / engineState.totalRounds) * 100;

  const allTrades = React.useMemo(() => {
    return [...engineState.tradeHistory].sort((a, b) => a.round - b.round);
  }, [engineState.tradeHistory]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#1a1a2e',
        color: '#e0e0e0',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: '12px 24px',
          backgroundColor: '#16213e',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '22px', margin: 0, fontWeight: 600 }}>
          多文明资源交易与谈判模拟器
        </h1>
      </header>

      <div
        className="main-container"
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          flexDirection: 'row',
        }}
      >
        <div
          className="left-panel"
          style={{
            width: '30%',
            minWidth: '320px',
            flexShrink: 0,
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            overflowY: 'auto',
          }}
        >
          <ControlPanel
            civilizations={engineState.civilizations}
            isRunning={engineState.isRunning}
            currentRound={engineState.currentRound}
            totalRounds={engineState.totalRounds}
            progress={overallProgress}
            onResourceChange={handleResourceChange}
            onStrategyChange={handleStrategyChange}
            onStart={handleStart}
            onReset={handleReset}
            onRandomize={handleRandomize}
          />
        </div>

        <div
          className="right-panel"
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            padding: '16px',
            gap: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#16213e',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
            }}
          >
            <h3
              style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              交易历史
            </h3>
            <div
              ref={tradeListRef}
              style={{
                maxHeight: '280px',
                overflowY: 'auto',
                scrollBehavior: 'smooth',
              }}
              onScroll={(e) => {
                const target = e.target as HTMLDivElement;
                setTradeListScrollTop(target.scrollTop);
              }}
            >
              {allTrades.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    color: '#888',
                    padding: '30px 0',
                    fontSize: '14px',
                  }}
                >
                  暂无交易记录，点击"开始谈判"开始模拟
                </div>
              ) : (
                allTrades.map((trade, index) => (
                  <TradeRow key={index} trade={trade} />
                ))
              )}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              backgroundColor: '#16213e',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden',
            }}
          >
            <TradeChart resourceHistory={engineState.resourceHistory} />
          </div>
        </div>
      </div>

      {showResultModal && (
        <ResultModal
          engineState={engineState}
          onClose={handleCloseModal}
          calculateTotalAssets={(res) => tradeEngine.calculateTotalAssets(res)}
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          .main-container {
            flex-direction: column !important;
          }
          .left-panel {
            width: 100% !important;
            min-width: auto !important;
            border-right: none !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            max-height: 50vh;
          }
          .right-panel {
            padding: 12px !important;
          }
        }
      `}</style>
    </div>
  );
};

const TradeRow: React.FC<{ trade: TradeRecord }> = ({ trade }) => {
  return (
    <div
      style={{
        padding: '8px 12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        fontSize: '13px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        transition: 'background-color 0.2s',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#888', fontSize: '12px' }}>第 {trade.round} 轮</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: CIVILIZATION_COLORS[trade.civilizationA] }}>
            {CIVILIZATION_NAMES[trade.civilizationA]}
          </span>
          <span style={{ color: '#666' }}>↔</span>
          <span style={{ color: CIVILIZATION_COLORS[trade.civilizationB] }}>
            {CIVILIZATION_NAMES[trade.civilizationB]}
          </span>
        </span>
      </div>
      <div style={{ display: 'flex', gap: '12px', color: '#b0b0c0' }}>
        <span>
          {RESOURCE_NAMES[trade.resourceA]}: -{trade.amountA} / +{trade.amountB}{' '}
          {RESOURCE_NAMES[trade.resourceB]}
        </span>
      </div>
    </div>
  );
};

export default App;
