import { useEffect, useRef, useState } from 'react';
import { SimulationPanel } from './components/SimulationPanel';
import { Visualization, VisualizationRef } from './components/Visualization';
import { AnalysisCharts } from './components/AnalysisCharts';
import { useAppStore } from './store';
import { Menu, X } from 'lucide-react';

function App() {
  const loadSavedSchemes = useAppStore((s) => s.loadSavedSchemes);
  const vizRef = useRef<VisualizationRef>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [panelExpanded, setPanelExpanded] = useState(false);

  useEffect(() => {
    loadSavedSchemes();
  }, [loadSavedSchemes]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleGenerateThumbnail = (): string => {
    return vizRef.current?.generateThumbnail() || '';
  };

  return (
    <div className="app-container">
      {isMobile && (
        <div className="mobile-topbar">
          <button
            className="mobile-menu-btn"
            onClick={() => setPanelExpanded(!panelExpanded)}
          >
            {panelExpanded ? <X size={24} /> : <Menu size={24} />}
          </button>
          <h1 className="mobile-title">微气候模拟器</h1>
          <div style={{ width: 40 }} />
        </div>
      )}

      <div className={`app-layout ${isMobile ? 'mobile' : ''} ${panelExpanded ? 'panel-expanded' : ''}`}>
        <aside className={`sidebar ${isMobile && !panelExpanded ? 'hidden' : ''}`}>
          <SimulationPanel onGenerateThumbnail={handleGenerateThumbnail} />
        </aside>

        <main className="main-content">
          <div className="viz-section">
            <Visualization ref={vizRef} />
          </div>
          <div className="charts-section">
            <AnalysisCharts />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
