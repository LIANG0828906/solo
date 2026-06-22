import React, { useState, useEffect, useRef } from 'react';
import StarMap, { PlanetData } from './StarMap';
import TradePanel, { ResourceData } from './TradePanel';

interface PlayerState {
  credits: number;
  cargoCapacity: number;
  cargoUsed: number;
  inventory: Record<string, number>;
  currentPlanet: string;
  energy: number;
}

interface PlanetFull {
  id: string;
  name: string;
  color: string;
  position: { x: number; y: number };
  resources: ResourceData[];
  travelTime: Record<string, number>;
}

interface GameLogItem {
  id: string;
  type: 'trade' | 'travel' | 'event';
  message: string;
  timestamp: number;
  icon: string;
}

interface RandomEventResult {
  event: {
    id: string;
    title: string;
    description: string;
    type: 'good' | 'bad';
  };
  result: {
    message: string;
  };
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

const TypewriterCredits: React.FC<{ value: number }> = ({ value }) => {
  const [display, setDisplay] = useState(0);
  const targetRef = useRef(value);

  useEffect(() => {
    const from = display;
    const to = value;
    const diff = to - from;
    if (diff === 0) return;
    const duration = 400;
    const steps = 20;
    const stepDuration = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setDisplay(Math.round(from + diff * progress));
      if (step >= steps) {
        clearInterval(timer);
        setDisplay(to);
      }
    }, stepDuration);
    targetRef.current = value;
    return () => clearInterval(timer);
  }, [value]);

  return <span>{display.toLocaleString()}¢</span>;
};

const CargoProgressBar: React.FC<{ used: number; total: number }> = ({ used, total }) => {
  const pct = Math.min(100, (used / total) * 100);
  const color = pct < 30 ? '#00E676' : pct < 70 ? '#FF9800' : '#FF5252';
  return (
    <div style={{ width: 180 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4, color: '#888' }}>
        <span>货仓容量</span>
        <span style={{ color: '#E0E0E0' }}>{used} / {total}</span>
      </div>
      <div
        style={{
          width: '100%',
          height: 10,
          background: '#2C2C3A',
          borderRadius: 5,
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: 5,
            transition: 'all 0.3s ease',
            boxShadow: `0 0 8px ${color}88`
          }}
        />
      </div>
    </div>
  );
};

const TravelProgressBar: React.FC<{ duration: number; onComplete: () => void }> = ({ duration, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
    const anim = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct >= 100) {
        onComplete();
      } else {
        requestAnimationFrame(anim);
      }
    };
    const raf = requestAnimationFrame(anim);
    return () => cancelAnimationFrame(raf);
  }, [duration, onComplete]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, marginBottom: 16, color: '#00FFFF' }}>🚀 航行中...</div>
        <div
          style={{
            width: 320,
            height: 24,
            background: '#2C2C3A',
            borderRadius: 12,
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #00BCD4, #9C27B0)',
              borderRadius: 12,
              transition: 'width 0.05s linear',
              boxShadow: '0 0 10px #00BCD4'
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              textShadow: '0 0 4px #000'
            }}
          >
            {Math.round(progress)}%
          </div>
        </div>
      </div>
    </div>
  );
};

const GameBoard: React.FC = () => {
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [planets, setPlanets] = useState<PlanetFull[]>([]);
  const [selectedPlanetId, setSelectedPlanetId] = useState<string | null>(null);
  const [logs, setLogs] = useState<GameLogItem[]>([]);
  const [logsExpanded, setLogsExpanded] = useState(true);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [isTraveling, setIsTraveling] = useState(false);
  const [travelDuration, setTravelDuration] = useState(0);
  const [pendingEvent, setPendingEvent] = useState<RandomEventResult | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    try {
      const [pRes, planetsRes, logsRes] = await Promise.all([
        fetch('/api/player').then(r => r.json()),
        fetch('/api/planets').then(r => r.json()),
        fetch('/api/events').then(r => r.json())
      ]);
      setPlayer(pRes);
      setPlanets(planetsRes);
      setLogs(logsRes);
      if (!selectedPlanetId) setSelectedPlanetId(pRes.currentPlanet);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (warningMsg) {
      const t = setTimeout(() => setWarningMsg(null), 3000);
      return () => clearTimeout(t);
    }
  }, [warningMsg]);

  const handleSelectPlanet = async (planetId: string) => {
    if (!player) return;
    if (planetId === player.currentPlanet) {
      setSelectedPlanetId(planetId);
      return;
    }

    try {
      const res = await fetch('/api/travel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetPlanetId: planetId })
      });

      if (!res.ok) {
        const data = await res.json();
        setWarningMsg(data.error || '航行失败');
        return;
      }

      const data = await res.json();
      setTravelDuration(data.travelTime || 5000);
      setIsTraveling(true);
      setSelectedPlanetId(planetId);

      if (data.event) {
        setPendingEvent(data.event);
      }

      const updatedPlayer = data.player as PlayerState;
      setPlayer(updatedPlayer);

      const logsRes = await fetch('/api/events').then(r => r.json());
      setLogs(logsRes);
    } catch (e) {
      setWarningMsg('网络错误');
    }
  };

  const handleTravelComplete = async () => {
    setIsTraveling(false);
    try {
      const pRes = await fetch('/api/player').then(r => r.json());
      setPlayer(pRes);
      const logsRes = await fetch('/api/events').then(r => r.json());
      setLogs(logsRes);
    } catch (e) {}
  };

  const handleTrade = async (resourceId: string, action: 'buy' | 'sell', quantity: number): Promise<string | null> => {
    try {
      const res = await fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId, action, quantity })
      });
      if (!res.ok) {
        const data = await res.json();
        return data.error || '交易失败';
      }
      const data = await res.json();
      setPlayer(data.player);
      if (data.event) setPendingEvent(data.event);
      const logsRes = await fetch('/api/events').then(r => r.json());
      setLogs(logsRes);
      return null;
    } catch (e) {
      return '网络错误';
    }
  };

  const handleBuyEnergy = async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/energy/buy');
      if (!res.ok) {
        const data = await res.json();
        return data.error || '购买失败';
      }
      const data = await res.json();
      setPlayer(data);
      const logsRes = await fetch('/api/events').then(r => r.json());
      setLogs(logsRes);
      return null;
    } catch (e) {
      return '网络错误';
    }
  };

  if (loading || !player) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A1A' }}>
        <div style={{ color: '#00FFFF', fontSize: 20 }}>🚀 正在初始化星际贸易系统...</div>
      </div>
    );
  }

  const currentPlanet = planets.find(p => p.id === player.currentPlanet);
  const selectedPlanet = planets.find(p => p.id === selectedPlanetId) || currentPlanet;
  const showTradePanel = !isTraveling && selectedPlanet;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#0A0A1A', overflow: 'hidden' }}>
      {/* 顶部信息栏 */}
      <div
        style={{
          padding: '12px 24px',
          background: 'linear-gradient(180deg, rgba(15, 15, 40, 0.95) 0%, rgba(10, 10, 26, 0.9) 100%)',
          borderBottom: '1px solid rgba(0, 255, 255, 0.15)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 20,
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🌌</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#E0E0E0' }}>星际贸易系统</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>💰</span>
            <div>
              <div style={{ fontSize: 10, color: '#888' }}>财富</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#FFC107', fontFamily: 'monospace' }}>
                <TypewriterCredits value={player.credits} />
              </div>
            </div>
          </div>

          <CargoProgressBar used={player.cargoUsed} total={player.cargoCapacity} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>⚡</span>
            <div>
              <div style={{ fontSize: 10, color: '#888' }}>能源</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#45B7D1' }}>{player.energy}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>🪐</span>
            <div>
              <div style={{ fontSize: 10, color: '#888' }}>当前位置</div>
              <div className="planet-glow" style={{ fontSize: 15, fontWeight: 700, color: '#00FFFF' }}>
                {currentPlanet?.name || '未知'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 16, gap: 16, overflow: 'hidden', position: 'relative' }}>
        <div
          style={{
            flex: 1,
            display: 'flex',
            gap: 16,
            minHeight: 0,
            flexDirection: window.innerWidth < 768 ? 'column' : 'row'
          }}
        >
          {/* 星际地图 */}
          <div style={{ flex: 1.5, minWidth: 0, minHeight: 300, position: 'relative' }}>
            {isTraveling ? (
              <TravelProgressBar duration={travelDuration} onComplete={handleTravelComplete} />
            ) : (
              <StarMap
                planets={planets.map(p => ({
                  id: p.id,
                  name: p.name,
                  color: p.color,
                  position: p.position
                }))}
                currentPlanetId={player.currentPlanet}
                selectedPlanetId={selectedPlanetId}
                onSelectPlanet={handleSelectPlanet}
                isTraveling={isTraveling}
              />
            )}

            {/* 能源不足警告 */}
            {warningMsg && (
              <div
                className="warning-popup"
                style={{
                  position: 'absolute',
                  top: 20,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '14px 28px',
                  background: '#D32F2F',
                  color: '#FFFFFF',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 14,
                  boxShadow: '0 0 20px #D32F2F88',
                  zIndex: 100
                }}
              >
                ⚠️ {warningMsg}
              </div>
            )}
          </div>

          {/* 交易面板 */}
          {showTradePanel && selectedPlanet && (
            <div style={{ flex: 1, minWidth: 320, maxWidth: 420, minHeight: 400 }}>
              <TradePanel
                planetName={selectedPlanet.name}
                resources={selectedPlanet.resources}
                credits={player.credits}
                inventory={player.inventory}
                cargoUsed={player.cargoUsed}
                cargoCapacity={player.cargoCapacity}
                energy={player.energy}
                onTrade={handleTrade}
                onBuyEnergy={selectedPlanetId === player.currentPlanet ? handleBuyEnergy : undefined}
                onClose={() => setSelectedPlanetId(null)}
              />
            </div>
          )}
        </div>
      </div>

      {/* 日志面板 */}
      <div
        style={{
          position: 'fixed',
          top: 80,
          right: 16,
          width: 280,
          background: 'rgba(15, 15, 40, 0.95)',
          border: '1px solid rgba(0, 255, 255, 0.2)',
          borderRadius: 8,
          overflow: 'hidden',
          zIndex: 50,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}
      >
        <div
          onClick={() => setLogsExpanded(!logsExpanded)}
          style={{
            padding: '10px 14px',
            background: 'rgba(0, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 13, color: '#00FFFF' }}>📋 游戏日志</span>
          <span style={{ fontSize: 12, color: '#888' }}>{logsExpanded ? '▼' : '▲'}</span>
        </div>

        <div
          style={{
            maxHeight: logsExpanded ? 300 : 0,
            overflow: logsExpanded ? 'hidden' : 'hidden',
            transition: 'max-height 0.3s ease'
          }}
        >
          <div
            className="scrollbar-thin"
            style={{
              padding: logsExpanded ? 8 : 0,
              maxHeight: 300,
              overflowY: 'auto'
            }}
          >
            {logs.length === 0 ? (
              <div style={{ padding: 12, fontSize: 12, color: '#666', textAlign: 'center' }}>暂无日志</div>
            ) : (
              logs.map(log => (
                <div
                  key={log.id}
                  style={{
                    padding: '6px 8px',
                    marginBottom: 4,
                    fontSize: 11,
                    color: '#BBB',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 4,
                    lineHeight: 1.5
                  }}
                >
                  <span style={{ color: '#666', fontFamily: 'monospace', marginRight: 6 }}>
                    [{formatTime(log.timestamp)}]
                  </span>
                  <span style={{ marginRight: 4 }}>{log.icon}</span>
                  <span>{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 随机事件卡片 */}
      {pendingEvent && (
        <div
          style={{
            position: 'fixed',
            left: 24,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 200
          }}
        >
          <div
            className="event-card"
            style={{
              width: 280,
              padding: 20,
              background: 'linear-gradient(135deg, #FFC107 0%, #FFA000 100%)',
              borderRadius: 12,
              color: '#1A1A1A',
              position: 'relative',
              boxShadow: '0 0 30px #FFC10788, inset 0 0 0 2px #FFD54F, inset 0 0 20px rgba(255,255,255,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ fontSize: 24 }}>{pendingEvent.event.type === 'good' ? '🌟' : '💥'}</span>
              <button
                onClick={() => setPendingEvent(null)}
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  cursor: 'pointer',
                  color: '#1A1A1A',
                  fontWeight: 700,
                  fontSize: 12
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{pendingEvent.event.title}</div>
            <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 10 }}>{pendingEvent.event.description}</div>
            <div
              style={{
                padding: '8px 12px',
                background: 'rgba(0,0,0,0.15)',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600
              }}
            >
              {pendingEvent.result.message}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
