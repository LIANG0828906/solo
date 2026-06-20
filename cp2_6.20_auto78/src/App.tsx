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

const refreshOptions = [
  { value: 5000, label: '5秒' },
  { value: 10000, label: '10秒' },
  { value: 30000, label: '30秒' },
];

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [underlineStyle, setUnderlineStyle] = useState({ left: 0, width: 0 });
  const tabContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<Platform, HTMLButtonElement | null>>({
    weibo: null,
    zhihu: null,
    baidu: null,
    twitter: null,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
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
    const selectedTab = tabRefs.current[selectedPlatform];
    const container = tabContainerRef.current;
    if (selectedTab && container) {
      const containerRect = container.getBoundingClientRect();
      const tabRect = selectedTab.getBoundingClientRect();
      setUnderlineStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
      });
    }
  }, [selectedPlatform, isMobile]);

  useEffect(() => {
    const baseColor = platformColors[selectedPlatform];
    setBgColor(baseColor);
    document.body.style.background = `linear-gradient(180deg, #0f1923 0%, ${baseColor}15 100%)`;
  }, [selectedPlatform]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleRefreshSelect = (value: number) => {
    setRefreshInterval(value);
    setIsDropdownOpen(false);
  };

  const selectedOption = refreshOptions.find(o => o.value === refreshInterval);

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
          0% { 
            background-position: -200% 0; 
          }
          100% { 
            background-position: 200% 0; 
          }
        }
        @keyframes shimmer {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .energy-bar {
          height: 3px;
          background: linear-gradient(90deg, 
            transparent 0%,
            rgba(239, 68, 68, 0.1) 5%,
            rgba(239, 68, 68, 0.6) 10%,
            rgba(245, 158, 11, 0.7) 20%,
            rgba(34, 197, 94, 0.8) 35%,
            rgba(59, 130, 246, 0.8) 50%,
            rgba(139, 92, 246, 0.7) 65%,
            rgba(236, 72, 153, 0.6) 80%,
            rgba(239, 68, 68, 0.4) 90%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: energyFlow 4s linear infinite;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.3),
                      0 0 20px rgba(139, 92, 246, 0.2);
        }
        .platform-tab {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        .platform-tab:hover {
          transform: translateY(-2px);
        }
        .platform-tab.active {
          font-weight: 700;
        }
        .tab-underline {
          position: absolute;
          bottom: 0;
          height: 3px;
          border-radius: 2px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 8px currentColor;
        }
        .custom-dropdown {
          position: relative;
        }
        .dropdown-trigger {
          transition: all 0.2s ease;
        }
        .dropdown-trigger:hover {
          background: rgba(255, 255, 255, 0.12) !important;
        }
        .dropdown-menu {
          animation: slideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dropdown-item {
          transition: all 0.2s ease;
        }
        .dropdown-item:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        .dropdown-item.selected {
          background: rgba(255, 255, 255, 0.1);
        }
        .dot-indicator {
          animation: fadeIn 0.3s ease;
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
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ 
              animation: 'shimmer 2s ease-in-out infinite',
              display: 'inline-block'
            }}>
              🔍
            </span>
            舆情热词看板
          </h1>

          <div 
            ref={tabContainerRef}
            style={{ 
              display: 'flex', 
              gap: isMobile ? '4px' : '8px',
              position: 'relative',
              paddingBottom: '2px',
            }}
          >
            {platforms.map(platform => (
              <button
                key={platform}
                ref={(el) => { tabRefs.current[platform] = el; }}
                className={`platform-tab ${selectedPlatform === platform ? 'active' : ''}`}
                onClick={() => handlePlatformClick(platform)}
                style={{
                  padding: isMobile ? '6px 10px' : '8px 18px',
                  border: 'none',
                  borderRadius: '8px 8px 0 0',
                  cursor: 'pointer',
                  fontSize: isMobile ? '12px' : '13px',
                  background: selectedPlatform === platform
                    ? `${platformColors[platform]}15`
                    : 'transparent',
                  color: selectedPlatform === platform
                    ? platformColors[platform]
                    : '#64748b',
                  fontWeight: selectedPlatform === platform ? 700 : 500,
                  letterSpacing: selectedPlatform === platform ? '0.3px' : '0',
                  minWidth: isMobile ? '50px' : '60px',
                  textAlign: 'center',
                }}
              >
                {platformNames[platform]}
              </button>
            ))}
            <div
              className="tab-underline"
              style={{
                left: underlineStyle.left,
                width: underlineStyle.width,
                background: platformColors[selectedPlatform],
                color: platformColors[selectedPlatform],
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontSize: '12px',
              color: '#64748b',
              display: isMobile ? 'none' : 'inline',
            }}
          >
            刷新频率:
          </span>
          <div className="custom-dropdown" ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              className="dropdown-trigger"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                padding: '8px 14px',
                paddingRight: '36px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                color: '#e2e8f0',
                fontSize: '12px',
                cursor: 'pointer',
                outline: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: '90px',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              <span
                className="dot-indicator"
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: platformColors[selectedPlatform],
                  boxShadow: `0 0 6px ${platformColors[selectedPlatform]}`,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontWeight: 500 }}>{selectedOption?.label}</span>
              <span
                style={{
                  position: 'absolute',
                  right: '12px',
                  transition: 'transform 0.2s ease',
                  transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  fontSize: '10px',
                  color: '#64748b',
                }}
              >
                ▼
              </span>
            </button>

            {isDropdownOpen && (
              <div
                className="dropdown-menu"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  background: 'rgba(15, 25, 35, 0.98)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  padding: '6px',
                  minWidth: '120px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  zIndex: 1000,
                  backdropFilter: 'blur(10px)',
                }}
              >
                {refreshOptions.map((option, index) => (
                  <div key={option.value}>
                    <button
                      className={`dropdown-item ${option.value === refreshInterval ? 'selected' : ''}`}
                      onClick={() => handleRefreshSelect(option.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: option.value === refreshInterval 
                          ? `${platformColors[selectedPlatform]}15`
                          : 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        color: option.value === refreshInterval 
                          ? platformColors[selectedPlatform]
                          : '#94a3b8',
                        fontSize: '12px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontWeight: option.value === refreshInterval ? 600 : 400,
                      }}
                    >
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: option.value === refreshInterval 
                            ? platformColors[selectedPlatform]
                            : 'transparent',
                          boxShadow: option.value === refreshInterval 
                            ? `0 0 4px ${platformColors[selectedPlatform]}`
                            : 'none',
                          transition: 'all 0.2s ease',
                        }}
                      />
                      {option.label}
                    </button>
                    {index < refreshOptions.length - 1 && (
                      <div
                        style={{
                          height: '1px',
                          background: 'rgba(255,255,255,0.06)',
                          margin: '2px 4px',
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="energy-bar" style={{ position: 'fixed', top: '60px', left: 0, right: 0, zIndex: 99 }} />

      <main
        style={{
          flex: 1,
          marginTop: '63px',
          padding: isMobile ? '12px' : '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '12px' : '16px',
          overflow: 'auto',
          height: 'calc(100vh - 63px)',
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
