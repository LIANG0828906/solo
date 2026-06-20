import { useState, useEffect, useRef } from 'react';
import {
  useDataStore,
  Platform,
  platformColors,
  platformNames,
  generateMockWords,
  generateHeatmapData,
  generateSentimentData,
  generatePlatformTrendData,
} from './store/useDataStore';
import WordCloud from './components/WordCloud';
import Heatmap from './components/Heatmap';
import TrendChart from './components/TrendChart';

function App() {
  const {
    selectedPlatform,
    refreshInterval,
    wordData,
    heatmapData,
    sentimentData,
    platformTrendData,
    setSelectedPlatform,
    setRefreshInterval,
    setWordData,
    setHeatmapData,
    setSentimentData,
    setPlatformTrendData,
  } = useDataStore();

  const [bgColor, setBgColor] = useState('#0f1923');
  const [isMobile, setIsMobile] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<number | null>(null);

  const platforms: Platform[] = ['weibo', 'zhihu', 'baidu', 'twitter'];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const baseColor = platformColors[selectedPlatform];
    setBgColor(baseColor);
    document.body.style.background = `linear-gradient(180deg, #0f1923 0%, ${baseColor}15 100%)`;
  }, [selectedPlatform]);

  const refreshData = () => {
    setWordData(generateMockWords(30));
    setHeatmapData(generateHeatmapData());
    setSentimentData(generateSentimentData());
    setPlatformTrendData(generatePlatformTrendData());
  };

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = window.setInterval(() => {
      refreshData();
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval]);

  const handlePlatformClick = (platform: Platform) => {
    setSelectedPlatform(platform);
  };

  const handleRefreshChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRefreshInterval(parseInt(e.target.value));
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes energyFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .energy-bar {
          height: 2px;
          background: linear-gradient(90deg, 
            #ef4444 0%, 
            #f59e0b 20%, 
            #22c55e 40%, 
            #3b82f6 60%, 
            #8b5cf6 80%, 
            #ef4444 100%
          );
          background-size: 200% 100%;
          animation: energyFlow 3s ease-in-out infinite;
        }
        .platform-tab {
          transition: all 0.3s ease;
        }
        .platform-tab:hover {
          transform: translateY(-1px);
        }
        .platform-tab.active {
          font-weight: 600;
        }
      `}</style>

      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '60px',
          background: '#0f1923',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <h1
            style={{
              fontSize: isMobile ? '16px' : '18px',
              fontWeight: 700,
              color: '#f1f5f9',
              whiteSpace: 'nowrap',
            }}
          >
            🔍 舆情热词看板
          </h1>

          <div style={{ display: 'flex', gap: isMobile ? '8px' : '16px' }}>
            {platforms.map(platform => (
              <button
                key={platform}
                className={`platform-tab ${selectedPlatform === platform ? 'active' : ''}`}
                onClick={() => handlePlatformClick(platform)}
                style={{
                  padding: isMobile ? '6px 10px' : '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: isMobile ? '12px' : '13px',
                  background: selectedPlatform === platform
                    ? `${platformColors[platform]}20`
                    : 'rgba(255,255,255,0.05)',
                  color: selectedPlatform === platform
                    ? platformColors[platform]
                    : '#94a3b8',
                  borderBottom: `2px solid ${selectedPlatform === platform ? platformColors[platform] : 'transparent'}`,
                }}
              >
                {platformNames[platform]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontSize: '12px',
              color: '#94a3b8',
              display: isMobile ? 'none' : 'inline',
            }}
          >
            刷新频率:
          </span>
          <select
            value={refreshInterval}
            onChange={handleRefreshChange}
            style={{
              padding: '6px 10px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#e2e8f0',
              fontSize: '12px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value={5000}>5秒</option>
            <option value={10000}>10秒</option>
            <option value={30000}>30秒</option>
          </select>
        </div>
      </header>

      <div className="energy-bar" style={{ position: 'fixed', top: '60px', left: 0, right: 0, zIndex: 99 }} />

      <main
        style={{
          flex: 1,
          marginTop: '62px',
          padding: isMobile ? '12px' : '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '12px' : '16px',
          overflow: 'auto',
          height: 'calc(100vh - 62px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '12px' : '16px',
            flex: '0 0 45%',
            minHeight: isMobile ? '320px' : '280px',
          }}
        >
          <div
            style={{
              flex: 1,
              height: '100%',
              minHeight: isMobile ? '300px' : '0',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <h3
              style={{
                fontSize: isMobile ? '13px' : '14px',
                fontWeight: 600,
                marginBottom: '8px',
                color: '#e2e8f0',
                flexShrink: 0,
              }}
            >
              🔥 热词云
            </h3>
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              <WordCloud words={wordData} />
            </div>
          </div>

          <div
            style={{
              flex: 1,
              height: '100%',
              minHeight: isMobile ? '250px' : '0',
            }}
          >
            <Heatmap data={heatmapData} />
          </div>
        </div>

        <div
          style={{
            flex: '1 1 55%',
            minHeight: isMobile ? '350px' : '300px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <TrendChart
            sentimentData={sentimentData}
            platformTrendData={platformTrendData}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
