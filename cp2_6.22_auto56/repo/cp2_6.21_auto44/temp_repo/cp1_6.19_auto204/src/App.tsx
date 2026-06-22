import React, { useState, useEffect } from 'react';
import ControlPanel from './components/ControlPanel';
import EmotionLabel from './components/EmotionLabel';
import SculptureScene from './scene/SculptureScene';
import './index.css';

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const togglePanel = () => {
    setIsPanelExpanded(!isPanelExpanded);
  };

  return (
    <div className="app-container">
      <SculptureScene />
      <EmotionLabel />
      <ControlPanel
        isMobile={isMobile}
        isExpanded={isMobile ? isPanelExpanded : true}
        onToggleExpand={togglePanel}
      />
    </div>
  );
};

export default App;
