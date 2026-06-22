import React, { useState, useCallback } from 'react';
import { CandlestickChart } from './CandlestickChart';
import { ControlPanel, MobileMenuToggle } from './ControlPanel';
import type { IndicatorConfig } from './types';

const App: React.FC = () => {
  const [stockCode, setStockCode] = useState<string>('AAPL');
  const [indicatorConfig, setIndicatorConfig] = useState<IndicatorConfig>({
    ma5: true,
    ma20: true,
    rsi: true
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleCodeSubmit = useCallback((code: string) => {
    setStockCode(code);
  }, []);

  const handleIndicatorChange = useCallback((config: IndicatorConfig) => {
    setIndicatorConfig(config);
  }, []);

  return (
    <div className="app">
      <ControlPanel
        onCodeSubmit={handleCodeSubmit}
        indicatorConfig={indicatorConfig}
        onIndicatorChange={handleIndicatorChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="main">
        <div className="main__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MobileMenuToggle onClick={() => setSidebarOpen(true)} />
            <div className="stock-info">
              <span className="stock-info__code">{stockCode}</span>
            </div>
          </div>
        </div>

        <CandlestickChart
          stockCode={stockCode}
          indicatorConfig={indicatorConfig}
        />
      </main>
    </div>
  );
};

export default App;
