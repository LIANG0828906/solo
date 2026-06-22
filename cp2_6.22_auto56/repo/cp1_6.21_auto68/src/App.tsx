import React, { useState, useEffect, useCallback, useRef } from 'react';
import FarmGrid from './farm/FarmGrid';
import { CROP_CONFIGS, type PlotData, type CropType } from './farm/CropManager';
import { EventSystem, type EventInfo } from './events/EventSystem';

type WeatherType = 'sunny' | 'cloudy' | 'rainy';

interface GameState {
  gold: number;
  plots: PlotData[];
  weather: WeatherType;
  gameTime: number;
  stats: {
    totalPlanted: number;
    totalHarvestGold: number;
    totalEvents: number;
  };
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    gold: 10,
    plots: [],
    weather: 'sunny',
    gameTime: 0,
    stats: {
      totalPlanted: 0,
      totalHarvestGold: 0,
      totalEvents: 0,
    },
  });
  const [showStats, setShowStats] = useState(false);
  const [eventMessage, setEventMessage] = useState<string | null>(null);
  const [showMobileShop, setShowMobileShop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [lightningFlash, setLightningFlash] = useState(false);
  const [shakeSeed, setShakeSeed] = useState<CropType | null>(null);
  const eventSystemRef = useRef<EventSystem | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchGameState = useCallback(async () => {
    try {
      const res = await fetch('/api/farm');
      const data = await res.json();
      setGameState(data);
    } catch (err) {
      console.error('Failed to fetch game state:', err);
    }
  }, []);

  useEffect(() => {
    fetchGameState();
    const interval = setInterval(fetchGameState, 1000);
    return () => clearInterval(interval);
  }, [fetchGameState]);

  useEffect(() => {
    eventSystemRef.current = new EventSystem({
      onEvent: (event: EventInfo) => {
        setEventMessage(event.message);
        setTimeout(() => setEventMessage(null), 3000);
      },
      onWeatherUpdate: (weather: WeatherType) => {
        setGameState((prev) => ({ ...prev, weather }));
        if (weather === 'rainy') {
          setLightningFlash(true);
          setTimeout(() => setLightningFlash(false), 200);
        }
      },
    });
    eventSystemRef.current.start();
    return () => {
      eventSystemRef.current?.stop();
    };
  }, []);

  const handlePlotClick = useCallback((_plotId: number) => {
    fetchGameState();
  }, [fetchGameState]);

  const handleHarvest = useCallback(async (plotId: number) => {
    try {
      const res = await fetch('/api/farm/harvest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plotId }),
      });
      if (res.ok) {
        fetchGameState();
      }
    } catch (err) {
      console.error('Failed to harvest:', err);
    }
  }, [fetchGameState]);

  const handleKillPest = useCallback(async (plotId: number) => {
    try {
      const res = await fetch('/api/farm/kill-pest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plotId }),
      });
      if (res.ok) {
        fetchGameState();
      }
    } catch (err) {
      console.error('Failed to kill pest:', err);
    }
  }, [fetchGameState]);

  const handleBuySeed = useCallback(async (cropType: CropType) => {
    const config = CROP_CONFIGS[cropType];
    if (gameState.gold < config.seedPrice) {
      setShakeSeed(cropType);
      setTimeout(() => setShakeSeed(null), 200);
      return;
    }
  }, [gameState.gold]);

  const triggerTestEvent = useCallback(async () => {
    try {
      await fetch('/api/events/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      fetchGameState();
    } catch (err) {
      console.error('Failed to trigger event:', err);
    }
  }, [fetchGameState]);

  const getWeatherIcon = (weather: WeatherType): string => {
    const icons: Record<WeatherType, string> = {
      sunny: '☀️',
      cloudy: '⛅',
      rainy: '⛈️',
    };
    return icons[weather];
  };

  const getWeatherName = (weather: WeatherType): string => {
    const names: Record<WeatherType, string> = {
      sunny: '晴天',
      cloudy: '多云',
      rainy: '雷雨',
    };
    return names[weather];
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderShopPanel = () => (
    <div
      style={{
        width: '220px',
        backgroundColor: '#2d5a27',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        color: 'white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      }}
    >
      <h3
        style={{
          textAlign: 'center',
          fontSize: '16px',
          marginBottom: '4px',
          borderBottom: '2px solid #4caf50',
          paddingBottom: '8px',
        }}
      >
        🏪 种子商店
      </h3>
      <div
        style={{
          textAlign: 'center',
          fontSize: '14px',
          marginBottom: '8px',
          color: '#ffd54f',
        }}
      >
        💰 当前余额: {gameState.gold} 金币
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
        {(Object.entries(CROP_CONFIGS) as [CropType, typeof CROP_CONFIGS[CropType]][]).map(
          ([type, config]) => {
            const canAfford = gameState.gold >= config.seedPrice;
            return (
              <div
                key={type}
                style={{
                  height: '60px',
                  backgroundColor: canAfford ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)',
                  borderRadius: '6px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  opacity: canAfford ? 1 : 0.6,
                  animation: shakeSeed === type ? 'shake 0.2s ease-in-out' : undefined,
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onClick={() => handleBuySeed(type)}
                onMouseEnter={(e) => {
                  if (canAfford) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: '28px' }}>{config.icon}</div>
                <div style={{ flex: 1, fontSize: '12px' }}>
                  <div style={{ fontWeight: 'bold' }}>{config.name}</div>
                  <div style={{ color: '#a5d6a7', fontSize: '10px' }}>
                    生长: {config.growthTime}秒
                  </div>
                  <div style={{ color: '#ffd54f', fontSize: '11px' }}>
                    💰{config.seedPrice} → 💰{config.harvestReward}
                  </div>
                </div>
              </div>
            );
          }
        )}
      </div>
      <button
        onClick={triggerTestEvent}
        style={{
          marginTop: 'auto',
          padding: '8px',
          borderRadius: '6px',
          border: 'none',
          backgroundColor: '#ff9800',
          color: 'white',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        🎲 触发随机事件
      </button>
    </div>
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#f5e6ca',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {lightningFlash && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(100,100,100,0.3)',
            zIndex: 50,
            pointerEvents: 'none',
            animation: 'lightning-flash 0.2s ease-out',
          }}
        />
      )}

      <div
        style={{
          backgroundColor: '#1565c0',
          color: 'white',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: '8px',
          margin: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
          💰 <span style={{ fontWeight: 'bold' }}>{gameState.gold}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
          <span style={{ fontSize: '20px' }}>{getWeatherIcon(gameState.weather)}</span>
          <span>{getWeatherName(gameState.weather)}</span>
        </div>
        <div style={{ fontSize: '16px', fontFamily: 'monospace' }}>
          ⏱️ {formatTime(gameState.gameTime)}
        </div>
      </div>

      {eventMessage && (
        <div
          style={{
            position: 'absolute',
            top: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            zIndex: 40,
            fontSize: '14px',
          }}
        >
          {eventMessage}
        </div>
      )}

      {isMobile && (
        <div
          style={{
            padding: '0 10px 10px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={() => setShowMobileShop(!showMobileShop)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#2d5a27',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            🏪 {showMobileShop ? '收起商店' : '打开商店'}
          </button>
        </div>
      )}

      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '10px',
          gap: '20px',
          overflow: 'auto',
        }}
      >
        {!isMobile && renderShopPanel()}

        {isMobile && showMobileShop && (
          <div
            style={{
              position: 'absolute',
              top: '130px',
              left: '10px',
              right: '10px',
              zIndex: 30,
            }}
          >
            {renderShopPanel()}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <h1
            style={{
              fontSize: isMobile ? '20px' : '28px',
              color: '#2d5a27',
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            🌾 像素农场模拟器 🌾
          </h1>
          <FarmGrid
            plots={gameState.plots}
            onPlotClick={handlePlotClick}
            onHarvest={handleHarvest}
            onKillPest={handleKillPest}
            gold={gameState.gold}
          />
          <p style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
            点击空地种植作物 | 点击成熟作物收获 | 点击虫子消灭虫害(1金币)
          </p>
        </div>
      </div>

      <button
        onClick={() => setShowStats(true)}
        style={{
          position: 'fixed',
          right: '20px',
          bottom: '20px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ffb74d, #ff8a65)',
          border: 'none',
          cursor: 'pointer',
          fontSize: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 20,
          transition: 'transform 0.15s ease',
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.95)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        📊
      </button>

      {showStats && (
        <div
          onClick={() => setShowStats(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '320px',
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            <h3
              style={{
                textAlign: 'center',
                marginBottom: '20px',
                color: '#2d5a27',
                fontSize: '20px',
              }}
            >
              📊 游戏统计
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '6px',
                }}
              >
                <span>🌱 种植次数</span>
                <span style={{ fontWeight: 'bold' }}>{gameState.stats.totalPlanted}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px',
                  backgroundColor: '#fff3e0',
                  borderRadius: '6px',
                }}
              >
                <span>💰 总收获金币</span>
                <span style={{ fontWeight: 'bold', color: '#ff9800' }}>
                  {gameState.stats.totalHarvestGold}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '6px',
                }}
              >
                <span>⚡ 遭遇事件</span>
                <span style={{ fontWeight: 'bold', color: '#1976d2' }}>
                  {gameState.stats.totalEvents}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowStats(false)}
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#4caf50',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
