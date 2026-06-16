import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { StorageManager } from '../data/StorageManager';
import type { StockHolding, StockComputed, KLineData } from '../data/types';
import PieChart from './components/PieChart';
import KLineChart from './components/KLineChart';
import StockTable from './components/StockTable';

const App: React.FC = () => {
  const [holdings, setHoldings] = useState<StockHolding[]>([]);
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null);
  const [klineData, setKlineData] = useState<KLineData[]>([]);
  const [klineStockCode, setKlineStockCode] = useState<string>('');
  const [klineInput, setKlineInput] = useState<string>('');

  const storageManager = useMemo(() => StorageManager.getInstance(), []);

  useEffect(() => {
    const saved = storageManager.getHoldings();
    setHoldings(saved);
  }, [storageManager]);

  const computedHoldings = useMemo((): StockComputed[] => {
    return holdings.map((h) => {
      const cost = h.quantity * h.buyPrice;
      const marketValue = h.quantity * h.currentPrice;
      const profit = marketValue - cost;
      const profitPercent = cost > 0 ? (profit / cost) * 100 : 0;
      return {
        ...h,
        cost,
        marketValue,
        profit,
        profitPercent,
      };
    });
  }, [holdings]);

  const totalStats = useMemo(() => {
    const totalCost = computedHoldings.reduce((sum, h) => sum + h.cost, 0);
    const totalMarketValue = computedHoldings.reduce((sum, h) => sum + h.marketValue, 0);
    const totalProfit = totalMarketValue - totalCost;
    const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
    return { totalCost, totalMarketValue, totalProfit, totalProfitPercent };
  }, [computedHoldings]);

  useEffect(() => {
    if (selectedStockId) {
      const saved = storageManager.getKLineData(selectedStockId);
      if (saved.length > 0) {
        setKlineData(saved);
        const stock = holdings.find((h) => h.id === selectedStockId);
        if (stock) {
          setKlineStockCode(stock.code);
        }
      } else {
        const stock = holdings.find((h) => h.id === selectedStockId);
        if (stock) {
          const generated = storageManager.generateKLineData(stock.currentPrice, 60);
          storageManager.saveKLineData(selectedStockId, generated);
          setKlineData(generated);
          setKlineStockCode(stock.code);
        }
      }
    } else {
      setKlineData([]);
      setKlineStockCode('');
    }
  }, [selectedStockId, holdings, storageManager]);

  const handleAdd = useCallback(
    (stock: Omit<StockHolding, 'id'>) => {
      const newStock: StockHolding = {
        ...stock,
        id: uuidv4(),
      };
      storageManager.addHolding(newStock);
      const kline = storageManager.generateKLineData(stock.currentPrice, 60);
      storageManager.saveKLineData(newStock.id, kline);
      setHoldings(storageManager.getHoldings());
      setSelectedStockId(newStock.id);
    },
    [storageManager]
  );

  const handleEdit = useCallback(
    (id: string, stock: Omit<StockHolding, 'id'>) => {
      storageManager.updateHolding(id, stock);
      const kline = storageManager.generateKLineData(stock.currentPrice, 60);
      storageManager.saveKLineData(id, kline);
      setHoldings(storageManager.getHoldings());
    },
    [storageManager]
  );

  const handleDelete = useCallback(
    (id: string) => {
      storageManager.deleteHolding(id);
      setHoldings(storageManager.getHoldings());
      if (selectedStockId === id) {
        setSelectedStockId(null);
      }
    },
    [storageManager, selectedStockId]
  );

  const handleSelect = useCallback((stock: StockComputed) => {
    setSelectedStockId(stock.id);
  }, []);

  const handleGenerateKLine = useCallback(() => {
    if (!klineInput.trim()) return;
    const basePrice = 100 + Math.random() * 400;
    const generated = storageManager.generateKLineData(basePrice, 60);
    setKlineData(generated);
    setKlineStockCode(klineInput.trim().toUpperCase());
  }, [klineInput, storageManager]);

  const formatNumber = (num: number): string => {
    return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatPercent = (num: number): string => {
    const sign = num > 0 ? '+' : '';
    return sign + num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📊 投资组合仪表盘</h1>
        <p>实时追踪您的股票持仓，分析资产分布与收益波动</p>
      </header>

      <div className="summary">
        <div className="summary-item">
          <div className="summary-label">总成本</div>
          <div className="summary-value">¥{formatNumber(totalStats.totalCost)}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">总市值</div>
          <div className="summary-value">¥{formatNumber(totalStats.totalMarketValue)}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">总盈亏</div>
          <div className={`summary-value ${totalStats.totalProfit >= 0 ? 'profit' : 'loss'}`}>
            {totalStats.totalProfit >= 0 ? '+' : ''}¥{formatNumber(totalStats.totalProfit)}
          </div>
        </div>
        <div className="summary-item">
          <div className="summary-label">收益率</div>
          <div className={`summary-value ${totalStats.totalProfitPercent >= 0 ? 'profit' : 'loss'}`}>
            {formatPercent(totalStats.totalProfitPercent)}
          </div>
        </div>
      </div>

      <div className="layout">
        <div className="left-panel">
          <div className="chart-card">
            <h2>📈 资产分布</h2>
            <PieChart holdings={computedHoldings} />
          </div>

          <div className="chart-card">
            <h2>🕯️ K线走势</h2>
            <div className="kline-controls">
              <input
                type="text"
                placeholder="输入股票代码查看K线 (如: 600519)"
                value={klineInput}
                onChange={(e) => setKlineInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateKLine()}
              />
              <button className="btn" onClick={handleGenerateKLine}>
                生成K线
              </button>
            </div>
            <KLineChart data={klineData} stockCode={klineStockCode} />
          </div>
        </div>

        <div className="right-panel">
          <StockTable
            holdings={computedHoldings}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onSelect={handleSelect}
            selectedId={selectedStockId}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
