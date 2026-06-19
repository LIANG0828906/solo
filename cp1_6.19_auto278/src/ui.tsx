import { useState, useEffect } from 'react';
import { useStore } from './store';

const glassStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.6)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  backdropFilter: 'blur(10px)',
  color: 'white',
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const formatSimulationTime = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
};

const useResponsive = () => {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (width > 1024) return 'desktop';
  if (width >= 768) return 'tablet';
  return 'mobile';
};

export const Title = () => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        left: 20,
        zIndex: 10,
        color: 'white',
        fontSize: 24,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textShadow: '0 0 10px rgba(255,255,255,0.5)',
        fontWeight: 600,
        letterSpacing: 1,
      }}
    >
      太阳系轨道模拟器
    </div>
  );
};

export const TimeControl = () => {
  const screenType = useResponsive();
  const isPlaying = useStore((s) => s.isPlaying);
  const speedFactor = useStore((s) => s.speedFactor);
  const simulationTime = useStore((s) => s.simulationTime);
  const togglePlay = useStore((s) => s.togglePlay);
  const setSpeedFactor = useStore((s) => s.setSpeedFactor);
  const [collapsed, setCollapsed] = useState(false);

  const baseStyle: React.CSSProperties = {
    ...glassStyle,
    position: 'fixed',
    right: 20,
    bottom: 20,
    zIndex: 10,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    transition: 'all 0.3s ease',
  };

  if (screenType === 'mobile' && collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        style={{
          ...glassStyle,
          position: 'fixed',
          right: 16,
          bottom: 16,
          zIndex: 10,
          width: 48,
          height: 48,
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          color: 'white',
        }}
      >
        ⏱
      </button>
    );
  }

  if (screenType === 'tablet' && collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        style={{
          ...glassStyle,
          position: 'fixed',
          right: 16,
          bottom: 80,
          zIndex: 10,
          width: 44,
          height: 44,
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          color: 'white',
        }}
      >
        ⏱
      </button>
    );
  }

  return (
    <div
      style={{
        ...baseStyle,
        width: screenType === 'mobile' ? 'calc(100vw - 32px)' : 320,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div
          style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.7)',
          }}
        >
          {formatSimulationTime(simulationTime)}
        </div>
        {screenType !== 'desktop' && (
          <button
            onClick={() => setCollapsed(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              fontSize: 16,
              padding: 0,
            }}
          >
            −
          </button>
        )}
      </div>

      <div
        style={{
          width: '100%',
          height: 4,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${((simulationTime.getTime() % 31536000000) / 31536000000) * 100}%`,
            background: 'linear-gradient(90deg, #4a9eff, #7dbfff)',
            borderRadius: 2,
            transition: 'width 0.1s linear',
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={togglePlay}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.2)',
            background: 'rgba(74,158,255,0.2)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(74,158,255,0.4)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(74,158,255,0.2)';
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              color: 'rgba(255,255,255,0.6)',
            }}
          >
            <span>速度</span>
            <span>{speedFactor.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.1"
            value={speedFactor}
            onChange={(e) => setSpeedFactor(parseFloat(e.target.value))}
            style={{
              width: '100%',
              height: 4,
              accentColor: '#4a9eff',
              cursor: 'pointer',
            }}
          />
        </div>
      </div>
    </div>
  );
};

interface MiniOrbitProps {
  color: string;
  angle: number;
  eccentricity: number;
}

const MiniOrbitIndicator = ({ color, angle, eccentricity }: MiniOrbitProps) => {
  const size = 80;
  const cx = size / 2;
  const cy = size / 2;
  const rx = size / 2 - 4;
  const ry = rx * (1 - eccentricity * 0.5);
  const px = cx + Math.cos(angle) * rx;
  const py = cy + Math.sin(angle) * ry;

  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill="none"
        stroke={color}
        strokeWidth={1}
        strokeOpacity={0.6}
      />
      <circle cx={cx} cy={cy} r={3} fill="#FFD700" fillOpacity={0.9} />
      <circle cx={px} cy={py} r={4} fill={color} stroke="white" strokeWidth={0.5} />
    </svg>
  );
};

export const DataPanel = () => {
  const screenType = useResponsive();
  const selectedPlanetId = useStore((s) => s.selectedPlanetId);
  const planets = useStore((s) => s.planets);
  const setSelectedPlanet = useStore((s) => s.setSelectedPlanet);

  const selectedPlanet = planets.find((p) => p.id === selectedPlanetId);

  if (!selectedPlanet) return null;

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    left: 20,
    top: screenType === 'mobile' ? 70 : 80,
    zIndex: 10,
    width: screenType === 'mobile' ? 'calc(100vw - 40px)' : 280,
    padding: 20,
    background: 'rgba(10,10,30,0.8)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    backdropFilter: 'blur(10px)',
    color: 'white',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    transform: 'translateX(0)',
    transition: 'transform 0.35s ease, opacity 0.35s ease',
    opacity: 1,
  };

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: selectedPlanet.color,
              marginBottom: 4,
              textShadow: `0 0 8px ${selectedPlanet.color}40`,
            }}
          >
            {selectedPlanet.name}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            行星数据
          </div>
        </div>
        <button
          onClick={() => setSelectedPlanet(null)}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            fontSize: 18,
            padding: 0,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
            半径
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>
            {selectedPlanet.realRadius.toLocaleString()} km
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
            公转周期
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>
            {selectedPlanet.orbitalPeriod.toLocaleString()} 天
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
            日距
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>
            {selectedPlanet.distanceFromSun.toFixed(2)} AU
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
            公转速度
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>
            {selectedPlanet.orbitalSpeed} km/s
          </div>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
          轨道位置
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: 8,
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 6,
          }}
        >
          <MiniOrbitIndicator
            color={selectedPlanet.color}
            angle={selectedPlanet.angle}
            eccentricity={selectedPlanet.orbitEccentricity}
          />
        </div>
      </div>
    </div>
  );
};

interface SettingsPanelProps {
  onResetCamera?: () => void;
}

export const SettingsPanel = ({ onResetCamera }: SettingsPanelProps) => {
  const screenType = useResponsive();
  const speedFactor = useStore((s) => s.speedFactor);
  const setSpeedFactor = useStore((s) => s.setSpeedFactor);
  const resetView = useStore((s) => s.resetView);

  const presets = [0.5, 1, 2, 5];

  const handleReset = () => {
    if (onResetCamera) {
      onResetCamera();
    } else {
      resetView();
    }
  };

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 16px',
    ...glassStyle,
  };

  if (screenType === 'mobile') {
    return (
      <div
        style={{
          ...containerStyle,
          bottom: 90,
          padding: '8px 12px',
          gap: 8,
        }}
      >
        <button
          onClick={handleReset}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 6,
            padding: '6px 10px',
            color: 'white',
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'inherit',
            transition: 'all 0.2s ease',
          }}
        >
          重置视角
        </button>
        <div style={{ display: 'flex', gap: 4 }}>
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => setSpeedFactor(p)}
              style={{
                background: speedFactor === p ? 'rgba(74,158,255,0.4)' : 'rgba(255,255,255,0.06)',
                border: speedFactor === p ? '1px solid rgba(74,158,255,0.6)' : '1px solid rgba(255,255,255,0.12)',
                borderRadius: 5,
                padding: '5px 8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: 11,
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
              }}
            >
              {p}x
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <button
        onClick={handleReset}
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 6,
          padding: '8px 16px',
          color: 'white',
          cursor: 'pointer',
          fontSize: 13,
          fontFamily: 'inherit',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)';
        }}
      >
        重置视角
      </button>
      <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
      <div style={{ display: 'flex', gap: 6 }}>
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => setSpeedFactor(p)}
            style={{
              background: speedFactor === p ? 'rgba(74,158,255,0.35)' : 'rgba(255,255,255,0.06)',
              border: speedFactor === p ? '1px solid rgba(74,158,255,0.6)' : '1px solid rgba(255,255,255,0.12)',
              borderRadius: 6,
              padding: '7px 12px',
              color: speedFactor === p ? '#ffffff' : 'rgba(255,255,255,0.85)',
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: 'inherit',
              fontWeight: speedFactor === p ? 600 : 400,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (speedFactor !== p) {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)';
              }
            }}
            onMouseLeave={(e) => {
              if (speedFactor !== p) {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
              }
            }}
          >
            {p}x
          </button>
        ))}
      </div>
    </div>
  );
};

export const UI = () => {
  return (
    <>
      <Title />
      <DataPanel />
      <SettingsPanel />
      <TimeControl />
    </>
  );
};
