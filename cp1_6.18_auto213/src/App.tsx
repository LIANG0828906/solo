import React, { useState, useEffect, useCallback } from 'react';
import { TimelinePanel } from './modules/timeline/TimelinePanel';
import { ExhibitionHall } from './modules/exhibition/ExhibitionHall';
import { InfoCard } from './components/InfoCard';
import { useAppStore } from './store/useAppStore';
import { getArtifactByEventId, getEvents } from './modules/data/dataFetch';
import { events as timelineEvents } from './modules/timeline/timelineData';
import './styles/global.css';

const App: React.FC = () => {
  const {
    selectedEventId,
    isLoading,
    artifactData,
    showInfoCard,
    isTransitioning,
    setSelectedEvent,
    setLoading,
    setArtifactData,
    setShowInfoCard,
    setTransitioning
  } = useAppStore();

  const [showWelcome, setShowWelcome] = useState(true);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [sceneOpacity, setSceneOpacity] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false);
    }, 100);
    
    const loadEvents = async () => {
      await getEvents();
      setEventsLoaded(true);
    };
    loadEvents();
    
    return () => clearTimeout(timer);
  }, []);

  const handleLoadingComplete = useCallback(() => {
    setLoading(false);
    setTransitioning(false);
    setTimeout(() => {
      setShowInfoCard(true);
    }, 300);
  }, [setLoading, setTransitioning, setShowInfoCard]);

  const handleEventSelect = useCallback(async (eventId: string) => {
    if (isLoading) return;
    
    if (selectedEventId) {
      setSceneOpacity(0);
      setTransitioning(true);
      setShowInfoCard(false);
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    setSelectedEvent(eventId);
    setLoading(true);
    setArtifactData(null);
    
    try {
      const artifact = await getArtifactByEventId(eventId);
      if (artifact) {
        setArtifactData(artifact);
      }
    } catch (error) {
      console.error('加载文物数据失败:', error);
      setLoading(false);
    }
    
    setSceneOpacity(1);
  }, [selectedEventId, isLoading, setSelectedEvent, setLoading, setArtifactData, setTransitioning, setShowInfoCard]);

  const handleCloseInfoCard = useCallback(() => {
    setShowInfoCard(false);
  }, [setShowInfoCard]);

  const handleRelatedEventClick = useCallback((eventId: string) => {
    handleEventSelect(eventId);
  }, [handleEventSelect]);

  return (
    <div className="app-container">
      <nav className="navbar">
        <h1 className="navbar-title">
          文明<span>漫游者</span>
        </h1>
        <div className="navbar-actions">
          <svg 
            className="nav-icon" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            aria-label="学习记录"
          >
            <path d="M12 20v-6M6 20V10M18 20V4" />
          </svg>
          <svg 
            className="nav-icon" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            aria-label="设置"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </div>
      </nav>

      <div className="main-content">
        <div 
          className={`exhibition-wrapper ${isTransitioning ? 'fade-out' : 'fade-in'}`}
          style={{ opacity: sceneOpacity }}
        >
          <ExhibitionHall
            selectedEventId={selectedEventId}
            artifactData={artifactData}
            isLoading={isLoading}
            onLoadingComplete={handleLoadingComplete}
          />
          
          {artifactData && !isLoading && (
            <InfoCard
              artifact={artifactData}
              visible={showInfoCard}
              onClose={handleCloseInfoCard}
              onRelatedEventClick={handleRelatedEventClick}
              events={timelineEvents}
            />
          )}

          <div className={`welcome-screen ${!showWelcome && !selectedEventId ? 'hidden' : ''}`}>
            {showWelcome && (
              <>
                <h1 className="welcome-title">文明漫游者</h1>
                <p className="welcome-subtitle">
                  穿越时空，探索人类文明的璀璨瑰宝。
                  <br />
                  点击下方时间轴，开启你的历史之旅。
                </p>
                <p className="welcome-hint">↓ 开始探索 ↓</p>
              </>
            )}
          </div>
        </div>

        {eventsLoaded && (
          <TimelinePanel
            selectedEventId={selectedEventId}
            onEventSelect={handleEventSelect}
          />
        )}
      </div>
    </div>
  );
};

export default App;
