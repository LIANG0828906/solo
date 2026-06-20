import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarGrid } from './ui/CalendarGrid';
import { RecommendationPanel } from './ui/RecommendationPanel';
import { StatsPanel } from './ui/StatsPanel';
import { farmingEngine } from './engine/farmingEngine';
import { yieldForecaster } from './engine/forecast';
import { INITIAL_PLANS } from './mockData';
import { eventBus } from './eventBus';

function App() {
  const [selectedPlotId, setSelectedPlotId] = useState<string>('plot-1');
  const [selectedMonth, setSelectedMonth] = useState<number>(1);

  useEffect(() => {
    farmingEngine.setPlans([...INITIAL_PLANS]);
    yieldForecaster.setPlans([...INITIAL_PLANS]);

    const initialPlans = [
      { plotId: 'plot-1', month: 1, cropId: 'lettuce' },
      { plotId: 'plot-1', month: 2, cropId: 'spinach' },
      { plotId: 'plot-1', month: 3, cropId: 'tomato' },
      { plotId: 'plot-1', month: 4, cropId: 'tomato' },
      { plotId: 'plot-1', month: 5, cropId: 'cucumber' },
      { plotId: 'plot-2', month: 1, cropId: 'cabbage' },
      { plotId: 'plot-2', month: 3, cropId: 'carrot' },
      { plotId: 'plot-2', month: 6, cropId: 'beans' },
      { plotId: 'plot-3', month: 2, cropId: 'pepper' },
      { plotId: 'plot-3', month: 5, cropId: 'pumpkin' },
      { plotId: 'plot-3', month: 8, cropId: 'eggplant' },
    ];

    initialPlans.forEach(plan => {
      farmingEngine.updatePlanting(plan.plotId, plan.month, plan.cropId);
    });

    yieldForecaster.setPlans(farmingEngine.getPlans());
    yieldForecaster.triggerForecastUpdate();
  }, []);

  const handleCellClick = (plotId: string, month: number) => {
    setSelectedPlotId(plotId);
    setSelectedMonth(month);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          height: '60px',
          backgroundColor: '#2E7D32',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          borderBottom: '2px solid #6D4C41',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🌱</span>
          <h1
            className="header-title"
            style={{
              fontFamily: "'Caveat', cursive",
              fontSize: '28px',
              fontWeight: 600,
              letterSpacing: '1px',
            }}
          >
            社区农场规划工具
          </h1>
        </div>
        <div
          style={{
            marginLeft: 'auto',
            fontSize: '13px',
            opacity: 0.9,
          }}
        >
          全年轮作 · 智能推荐 · 产量预测
        </div>
      </motion.header>

      <main
        style={{
          flex: 1,
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '24px',
          width: '100%',
        }}
      >
        <div
          className="main-container"
          style={{
            display: 'flex',
            gap: '24px',
            alignItems: 'flex-start',
          }}
        >
          <div
            className="calendar-area"
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <CalendarGrid onCellClick={handleCellClick} />
          </div>

          <div
            className="sidebar-area"
            style={{
              width: '300px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              flexShrink: 0,
            }}
          >
            <RecommendationPanel
              selectedPlotId={selectedPlotId}
              selectedMonth={selectedMonth}
            />
            <StatsPanel />
          </div>
        </div>
      </main>

      <footer
        style={{
          padding: '16px 24px',
          textAlign: 'center',
          color: '#999',
          fontSize: '12px',
          borderTop: '1px solid #E0D5C0',
        }}
      >
        🌾 社区农场轮作规划系统 · 让每一寸土地都充满生机
      </footer>
    </div>
  );
}

export default App;
