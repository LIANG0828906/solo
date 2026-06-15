import { useEffect, useState } from 'react';
import StormGlobe from '@/components/StormGlobe';
import StormDetailPanel from '@/components/StormDetailPanel';
import FilterPanel from '@/components/FilterPanel';
import Timeline from '@/components/Timeline';
import StatsChart from '@/components/StatsChart';
import { useStormStore } from '@/store/useStormStore';
import { Globe, Info, Menu, X } from 'lucide-react';
import './App.css';

export default function App() {
  const { selectedStormId } = useStormStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  useEffect(() => {
    if (selectedStormId) {
      setMobileDetailOpen(true);
    }
  }, [selectedStormId]);

  return (
    <div className="app-container">
      <div className="app-bg" />
      
      <header className="app-header">
        <div className="header-left">
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="logo">
            <Globe size={24} className="logo-icon" />
            <h1 className="logo-text">StormGlobe</h1>
          </div>
        </div>
        <div className="header-right">
          <span className="header-subtitle">全球风暴路径 3D 可视化</span>
        </div>
      </header>

      <main className="main-layout">
        <aside className="left-panel">
          <FilterPanel />
        </aside>

        <section className="center-panel">
          <StormGlobe className="storm-globe-canvas" />
          <div className="stats-chart-container">
            <StatsChart />
          </div>
        </section>

        <aside className={`right-panel ${selectedStormId ? 'has-selection' : ''}`}>
          <StormDetailPanel />
        </aside>
      </main>

      <footer className="timeline-footer">
        <Timeline />
      </footer>

      {mobileMenuOpen && (
        <div className="mobile-drawer mobile-menu-drawer">
          <div className="drawer-overlay" onClick={() => setMobileMenuOpen(false)} />
          <div className="drawer-content">
            <div className="drawer-header">
              <h3>筛选条件</h3>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <FilterPanel />
          </div>
        </div>
      )}

      {mobileDetailOpen && (
        <div className="mobile-drawer mobile-detail-drawer">
          <div className="drawer-overlay" onClick={() => setMobileDetailOpen(false)} />
          <div className="drawer-content full">
            <div className="drawer-header">
              <h3>风暴详情</h3>
              <button onClick={() => setMobileDetailOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <StormDetailPanel />
          </div>
        </div>
      )}

      <div className="credit-badge">
        <Info size={12} />
        <span>1900-2024 历史气象数据</span>
      </div>
    </div>
  );
}
