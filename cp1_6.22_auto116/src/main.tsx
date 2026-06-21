import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import StarField from './components/StarField';
import ControlPanel from './components/ControlPanel';
import { getConstellationById, Star, Constellation } from './utils/constellationData';
import './styles.css';

const App: React.FC = () => {
  const [selectedConstellationId, setSelectedConstellationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStar, setSelectedStar] = useState<Star | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const selectedConstellation: Constellation | null = selectedConstellationId
    ? getConstellationById(selectedConstellationId) || null
    : null;

  const handleSelectConstellation = (id: string | null) => {
    setSelectedConstellationId(id);
    setSelectedStar(null);
  };

  const handleStarClick = (star: Star) => {
    setSelectedStar(star);
  };

  return (
    <div className="app-container">
      <StarField
        constellation={selectedConstellation}
        onStarClick={handleStarClick}
      />
      <ControlPanel
        selectedConstellation={selectedConstellation}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectConstellation={handleSelectConstellation}
        isMobile={isMobile}
        isOpen={isPanelOpen}
        onTogglePanel={() => setIsPanelOpen(!isPanelOpen)}
      />
      {selectedStar && <StarLabel star={selectedStar} />}
    </div>
  );
};

const StarLabel: React.FC<{ star: Star }> = ({ star }) => {
  return (
    <div className="star-label">
      <div className="star-label-name">{star.name}</div>
      <div className="star-label-magnitude">视星等: {star.magnitude.toFixed(2)}</div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
