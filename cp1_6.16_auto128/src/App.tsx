import MapView from './components/MapView';
import MemoryPanel from './components/MemoryPanel';
import ScentCard from './components/ScentCard';
import FilterDrawer from './components/FilterDrawer';

const App = () => {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'relative',
      overflow: 'hidden',
      background: '#0F3460',
    }}>
      <MapView />
      <MemoryPanel />
      <FilterDrawer />
      <ScentCard />

      <style>{`
        @media (max-width: 768px) {
          .scent-panel-desktop {
            top: auto !important;
            bottom: 0 !important;
            left: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            max-height: 80px !important;
            height: 80px !important;
            border-radius: 16px 16px 0 0 !important;
            flex-direction: row !important;
          }
          .scent-panel-desktop > div:first-child {
            flex: 1;
            padding: 10px !important;
            border-bottom: none !important;
            border-right: 1px solid rgba(255,255,255,0.06);
          }
          .scent-panel-desktop > div:nth-child(2) {
            flex: 2;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            display: flex !important;
            padding: 8px !important;
          }
          .scent-panel-desktop > div:nth-child(2) > div {
            display: flex !important;
            gap: 8px;
          }
          .scent-panel-desktop > div:nth-child(2) > div > div {
            flex-shrink: 0;
            padding: 8px 12px !important;
            min-width: 180px;
            border-left: none !important;
            border-bottom: 3px solid transparent !important;
            border-radius: 8px;
            background: rgba(255,255,255,0.03) !important;
          }
          .scent-panel-desktop > div:last-child {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
