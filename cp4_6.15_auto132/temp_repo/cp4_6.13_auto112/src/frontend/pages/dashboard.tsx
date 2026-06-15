import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ChartCard, { ChartCardConfig } from '../components/ChartCard';
import DrillDownPanel from '../components/DrillDownPanel';
import wsClient, { ConnectionStatus } from '../utils/websocketClient';
import {
  startMockStream,
  stopMockStream,
  subscribe as mockSubscribe,
  setMockFrequency,
  getDrillDownData as getMockDrillDownData,
} from '../utils/dataGenerator';

interface DateRange {
  label: string;
  value: string;
}

interface FrequencyOption {
  label: string;
  value: number;
}

const DATE_RANGES: DateRange[] = [
  { label: '今日', value: 'today' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '自定义', value: 'custom' },
];

const FREQUENCIES: FrequencyOption[] = [
  { label: '实时', value: 100 },
  { label: '1秒', value: 1000 },
  { label: '5秒', value: 5000 },
];

const GRID_SIZE = 20;
const DEFAULT_CARDS: ChartCardConfig[] = [
  {
    id: uuidv4(),
    type: 'line',
    title: '实时销售趋势',
    x: 20,
    y: 20,
    width: 480,
    height: 320,
    pinned: false,
    hidden: false,
  },
  {
    id: uuidv4(),
    type: 'bar',
    title: '品类销售汇总',
    x: 520,
    y: 20,
    width: 420,
    height: 320,
    pinned: false,
    hidden: false,
  },
  {
    id: uuidv4(),
    type: 'heatmap',
    title: '访问热力图',
    x: 20,
    y: 360,
    width: 920,
    height: 280,
    pinned: false,
    hidden: false,
  },
];

const STORAGE_KEY = 'dashboard_layout_v1';

function Dashboard() {
  const [cards, setCards] = useState<ChartCardConfig[]>([]);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('disconnected');
  const [dateRange, setDateRange] = useState('today');
  const [frequency, setFrequency] = useState(1000);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showFreqDropdown, setShowFreqDropdown] = useState(false);

  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownChartType, setDrillDownChartType] = useState('');
  const [drillDownChartTitle, setDrillDownChartTitle] = useState('');
  const [drillDownDataPoint, setDrillDownDataPoint] = useState<unknown>(null);
  const [drillDownTableData, setDrillDownTableData] = useState<unknown[]>([]);
  const [drillDownSubChartData, setDrillDownSubChartData] = useState<unknown[]>(
    []
  );

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    cardId: string;
  }>({ visible: false, x: 0, y: 0, cardId: '' });

  const [salesData, setSalesData] = useState<unknown[]>([]);
  const [categoryData, setCategoryData] = useState<unknown[]>([]);
  const [heatmapData, setHeatmapData] = useState<unknown[]>([]);

  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    cardId: string;
    startX: number;
    startY: number;
    cardStartX: number;
    cardStartY: number;
  } | null>(null);

  const [resizeState, setResizeState] = useState<{
    isResizing: boolean;
    cardId: string;
    direction: string;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    cardStartX: number;
    cardStartY: number;
  } | null>(null);

  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [placeholder, setPlaceholder] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const [useMockData, setUseMockData] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCards(parsed);
      } catch {
        setCards(DEFAULT_CARDS);
      }
    } else {
      setCards(DEFAULT_CARDS);
    }
  }, []);

  useEffect(() => {
    if (cards.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    }
  }, [cards]);

  useEffect(() => {
    if (useMockData) {
      startMockStream(frequency);
      const unsub1 = mockSubscribe('sales-trend', (data) => {
        setSalesData(data as unknown[]);
      });
      const unsub2 = mockSubscribe('category-sales', (data) => {
        setCategoryData(data as unknown[]);
      });
      const unsub3 = mockSubscribe('heatmap', (data) => {
        setHeatmapData(data as unknown[]);
      });
      return () => {
        stopMockStream();
        unsub1();
        unsub2();
        unsub3();
      };
    } else {
      wsClient.connect();
      const unsubStatus = wsClient.onStatusChange((status) => {
        setConnectionStatus(status);
      });
      const unsub1 = wsClient.subscribe('sales-trend', (data) => {
        setSalesData(data as unknown[]);
      });
      const unsub2 = wsClient.subscribe('category-sales', (data) => {
        setCategoryData(data as unknown[]);
      });
      const unsub3 = wsClient.subscribe('heatmap', (data) => {
        setHeatmapData(data as unknown[]);
      });
      wsClient.setFrequency(frequency);
      return () => {
        unsubStatus();
        unsub1();
        unsub2();
        unsub3();
      };
    }
  }, [useMockData]);

  useEffect(() => {
    if (useMockData) {
      setMockFrequency(frequency);
    } else {
      wsClient.setFrequency(frequency);
    }
  }, [frequency, useMockData]);

  const handleFrequencyChange = (freq: number) => {
    setIsTransitioning(true);
    setFrequency(freq);
    setShowFreqDropdown(false);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const handleDateRangeChange = (range: string) => {
    setDateRange(range);
    setShowDateDropdown(false);
    setIsTransitioning(true);
    if (useMockData) {
      setMockFrequency(frequency);
    } else {
      wsClient.resetData();
    }
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const getChartData = (type: string): unknown[] => {
    switch (type) {
      case 'line':
        return salesData;
      case 'bar':
        return categoryData;
      case 'heatmap':
        return heatmapData;
      default:
        return [];
    }
  };

  const snapToGrid = (value: number): number => {
    return Math.round(value / GRID_SIZE) * GRID_SIZE;
  };

  const handleDragStart = useCallback(
    (cardId: string, e: React.MouseEvent) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card || card.pinned) return;

      setDragState({
        isDragging: true,
        cardId,
        startX: e.clientX,
        startY: e.clientY,
        cardStartX: card.x,
        cardStartY: card.y,
      });
      setPlaceholder({ x: card.x, y: card.y, width: card.width, height: card.height });
    },
    [cards]
  );

  const handleResizeStart = useCallback(
    (cardId: string, e: React.MouseEvent, direction: string) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card || card.pinned) return;

      setResizeState({
        isResizing: true,
        cardId,
        direction,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: card.width,
        startHeight: card.height,
        cardStartX: card.x,
        cardStartY: card.y,
      });
      setPlaceholder({ x: card.x, y: card.y, width: card.width, height: card.height });
    },
    [cards]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragState?.isDragging) {
        const deltaX = e.clientX - dragState.startX;
        const deltaY = e.clientY - dragState.startY;
        const newX = snapToGrid(Math.max(0, dragState.cardStartX + deltaX));
        const newY = snapToGrid(Math.max(0, dragState.cardStartY + deltaY));

        setPlaceholder((prev) =>
          prev ? { ...prev, x: newX, y: newY } : null
        );
      }

      if (resizeState?.isResizing) {
        const deltaX = e.clientX - resizeState.startX;
        const deltaY = e.clientY - resizeState.startY;

        let newWidth = resizeState.startWidth;
        let newHeight = resizeState.startHeight;
        let newX = resizeState.cardStartX;
        let newY = resizeState.cardStartY;

        if (resizeState.direction.includes('r')) {
          newWidth = snapToGrid(Math.max(200, resizeState.startWidth + deltaX));
        }
        if (resizeState.direction.includes('b')) {
          newHeight = snapToGrid(Math.max(150, resizeState.startHeight + deltaY));
        }

        setPlaceholder((prev) =>
          prev
            ? { ...prev, width: newWidth, height: newHeight, x: newX, y: newY }
            : null
        );
      }
    };

    const handleMouseUp = () => {
      if (dragState?.isDragging && placeholder) {
        setCards((prev) =>
          prev.map((c) =>
            c.id === dragState.cardId
              ? { ...c, x: placeholder.x, y: placeholder.y }
              : c
          )
        );
        setDragState(null);
        setPlaceholder(null);
      }

      if (resizeState?.isResizing && placeholder) {
        setCards((prev) =>
          prev.map((c) =>
            c.id === resizeState.cardId
              ? {
                  ...c,
                  width: placeholder.width,
                  height: placeholder.height,
                }
              : c
          )
        );
        setResizeState(null);
        setPlaceholder(null);
      }
    };

    if (dragState?.isDragging || resizeState?.isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, resizeState, placeholder]);

  const handleChartClick = useCallback(
    (card: ChartCardConfig, dataPoint: unknown) => {
      setDrillDownChartType(card.type);
      setDrillDownChartTitle(card.title);
      setDrillDownDataPoint(dataPoint);

      const result = getMockDrillDownData(card.type, dataPoint);
      setDrillDownTableData(result.detailTable);
      setDrillDownSubChartData(result.subChartData);
      setDrillDownOpen(true);
    },
    []
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, cardId: string) => {
      e.preventDefault();
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        cardId,
      });
    },
    []
  );

  const handlePinCard = () => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === contextMenu.cardId ? { ...c, pinned: !c.pinned } : c
      )
    );
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleHideCard = () => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === contextMenu.cardId ? { ...c, hidden: true } : c
      )
    );
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleCopyCard = () => {
    const card = cards.find((c) => c.id === contextMenu.cardId);
    if (card) {
      const newCard: ChartCardConfig = {
        ...card,
        id: uuidv4(),
        x: card.x + 30,
        y: card.y + 30,
        pinned: false,
        title: card.title + ' (副本)',
      };
      setCards((prev) => [...prev, newCard]);
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
      if (showDateDropdown) {
        setShowDateDropdown(false);
      }
      if (showFreqDropdown) {
        setShowFreqDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu.visible, showDateDropdown, showFreqDropdown]);

  const getStatusColor = () => {
    if (useMockData) return '#22c55e';
    switch (connectionStatus) {
      case 'connected':
        return '#22c55e';
      case 'connecting':
        return '#eab308';
      case 'disconnected':
        return '#ef4444';
      default:
        return '#ef4444';
    }
  };

  const getStatusText = () => {
    if (useMockData) return '模拟数据模式';
    switch (connectionStatus) {
      case 'connected':
        return '已连接';
      case 'connecting':
        return '正在连接...';
      case 'disconnected':
        return '已断开';
      default:
        return '未知';
    }
  };

  const visibleCards = cards.filter((c) => !c.hidden);
  const currentCard = cards.find((c) => c.id === contextMenu.cardId);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1 className="dashboard-title">数据看板</h1>
        </div>

        <div className="header-center">
          <div className="filter-group">
            <div
              className="dropdown"
              onClick={(e) => {
                e.stopPropagation();
                setShowDateDropdown(!showDateDropdown);
                setShowFreqDropdown(false);
              }}
            >
              <button className="filter-button">
                📅 {DATE_RANGES.find((d) => d.value === dateRange)?.label || '今日'}
              </button>
              {showDateDropdown && (
                <div className="dropdown-menu">
                  {DATE_RANGES.map((range) => (
                    <div
                      key={range.value}
                      className={`dropdown-item ${dateRange === range.value ? 'active' : ''}`}
                      onClick={() => handleDateRangeChange(range.value)}
                    >
                      {range.label}
                    </div>
                  ))}
                  {dateRange === 'custom' && (
                    <div className="custom-date-inputs">
                      <input
                        type="date"
                        value={customDateStart}
                        onChange={(e) => setCustomDateStart(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span>至</span>
                      <input
                        type="date"
                        value={customDateEnd}
                        onChange={(e) => setCustomDateEnd(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div
              className="dropdown"
              onClick={(e) => {
                e.stopPropagation();
                setShowFreqDropdown(!showFreqDropdown);
                setShowDateDropdown(false);
              }}
            >
              <button className="filter-button">
                ⏱️ {FREQUENCIES.find((f) => f.value === frequency)?.label || '1秒'}
              </button>
              {showFreqDropdown && (
                <div className="dropdown-menu">
                  {FREQUENCIES.map((freq) => (
                    <div
                      key={freq.value}
                      className={`dropdown-item ${frequency === freq.value ? 'active' : ''}`}
                      onClick={() => handleFrequencyChange(freq.value)}
                    >
                      {freq.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="header-right">
          <div className="status-indicator-wrapper">
            <div
              className="status-light"
              style={{ backgroundColor: getStatusColor() }}
            />
            <span className="status-tooltip">{getStatusText()}</span>
          </div>
        </div>
      </header>

      <div ref={gridContainerRef} className="dashboard-grid">
        {placeholder &&
          (dragState?.isDragging || resizeState?.isResizing) && (
            <div
              className="drag-placeholder"
              style={{
                left: placeholder.x,
                top: placeholder.y,
                width: placeholder.width,
                height: placeholder.height,
              }}
            />
          )}

        {visibleCards.map((card) => (
          <div key={card.id} onContextMenu={(e) => handleContextMenu(e, card.id)}>
            <ChartCard
              config={card}
              data={getChartData(card.type)}
              isDragging={dragState?.cardId === card.id}
              onDragStart={handleDragStart}
              onResizeStart={handleResizeStart}
              onClick={(dataPoint) => handleChartClick(card, dataPoint)}
              onContextMenu={(e) => handleContextMenu(e, card.id)}
              isTransitioning={isTransitioning}
            />
          </div>
        ))}
      </div>

      {contextMenu.visible && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="context-menu-item" onClick={handlePinCard}>
            📌 {currentCard?.pinned ? '取消固定' : '固定到顶部'}
          </div>
          <div className="context-menu-item" onClick={handleHideCard}>
            👁️ 隐藏此卡片
          </div>
          <div className="context-menu-item" onClick={handleCopyCard}>
            📋 复制图表
          </div>
        </div>
      )}

      <DrillDownPanel
        isOpen={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        chartType={drillDownChartType}
        chartTitle={drillDownChartTitle}
        dataPoint={drillDownDataPoint}
        detailTable={drillDownTableData}
        subChartData={drillDownSubChartData}
      />

      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
            Arial, sans-serif;
          background: #f1f5f9;
          color: #1e293b;
        }

        .dashboard-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .dashboard-header {
          background: #ffffff;
          padding: 14px 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .header-left {
          flex-shrink: 0;
        }

        .dashboard-title {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
        }

        .header-center {
          flex: 1;
          display: flex;
          justify-content: center;
        }

        .filter-group {
          display: flex;
          gap: 12px;
        }

        .dropdown {
          position: relative;
        }

        .filter-button {
          padding: 8px 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #475569;
          transition: all 0.2s ease;
        }

        .filter-button:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          transform: scale(0.97);
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          min-width: 140px;
          z-index: 100;
          padding: 4px 0;
        }

        .dropdown-item {
          padding: 8px 14px;
          cursor: pointer;
          font-size: 14px;
          color: #334155;
          transition: background 0.15s ease;
        }

        .dropdown-item:hover {
          background: #f8fafc;
        }

        .dropdown-item.active {
          background: #eef2ff;
          color: #6366f1;
        }

        .custom-date-inputs {
          padding: 8px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-top: 1px solid #f1f5f9;
        }

        .custom-date-inputs input {
          width: 110px;
          padding: 4px 6px;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          font-size: 12px;
        }

        .custom-date-inputs span {
          font-size: 12px;
          color: #94a3b8;
        }

        .header-right {
          flex-shrink: 0;
        }

        .status-indicator-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .status-light {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          animation: breathe 2s ease-in-out infinite;
          cursor: pointer;
        }

        @keyframes breathe {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 4px currentColor;
          }
          50% {
            opacity: 0.6;
            box-shadow: 0 0 12px currentColor;
          }
        }

        .status-tooltip {
          position: absolute;
          right: 100%;
          top: 50%;
          transform: translateY(-50%) translateX(-8px);
          background: #1e293b;
          color: #ffffff;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s ease;
          pointer-events: none;
        }

        .status-indicator-wrapper:hover .status-tooltip {
          opacity: 1;
          visibility: visible;
          transform: translateY(-50%) translateX(-4px);
        }

        .dashboard-grid {
          flex: 1;
          position: relative;
          min-height: calc(100vh - 60px);
          padding: 20px;
        }

        .drag-placeholder {
          position: absolute;
          border: 2px dashed #6366f1;
          border-radius: 12px;
          background: rgba(99, 102, 241, 0.05);
          pointer-events: none;
          z-index: 1;
        }

        .context-menu {
          position: fixed;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          padding: 4px 0;
          z-index: 1000;
          min-width: 140px;
        }

        .context-menu-item {
          padding: 8px 14px;
          cursor: pointer;
          font-size: 14px;
          color: #334155;
          transition: background 0.15s ease;
        }

        .context-menu-item:hover {
          background: #f8fafc;
          color: #6366f1;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            align-items: stretch;
            padding: 12px 16px;
          }

          .header-center {
            order: 3;
            justify-content: flex-start;
          }

          .filter-group {
            flex-direction: column;
            width: 100%;
          }

          .filter-button {
            width: 100%;
            text-align: left;
          }

          .dashboard-grid {
            display: flex;
            flex-direction: column;
            position: static;
            height: auto;
            padding: 12px;
            gap: 12px;
          }

          .chart-card {
            position: relative !important;
            left: auto !important;
            top: auto !important;
            width: 100% !important;
            height: 300px !important;
          }

          .drag-placeholder {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
