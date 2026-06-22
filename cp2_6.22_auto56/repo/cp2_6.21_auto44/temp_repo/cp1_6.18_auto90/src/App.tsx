import React from 'react';
import { useAppStore } from '@/stores/appStore';
import TastingForm from './components/TastingForm';
import HistoryPanel from './components/HistoryPanel';
import ShareCard from './components/ShareCard';
import FlavorRadar from './components/FlavorRadar';
import { WheelCanvas } from './components/WheelCanvas';

const App: React.FC = () => {
  const currentWheel = useAppStore((state) => state.currentWheel);

  return (
    <div className="app-container">
      <ShareCard />
      <HistoryPanel />

      <div className="main-content">
        <header className="app-header">
          <h1 className="app-title">🍽️ 风味轮盘</h1>
          <p className="app-subtitle">记录每一道菜的风味轮廓</p>
        </header>

        <section className="wheel-section">
          <div className="wheel-container">
            <h3 className="section-title">拖拽指针调整风味</h3>
            <WheelCanvas size={320} />
          </div>

          <div className="radar-container">
            <h3 className="section-title">风味轮廓图</h3>
            <FlavorRadar data={currentWheel} size={320} />
          </div>
        </section>

        <TastingForm />
      </div>
    </div>
  );
};

export default App;
