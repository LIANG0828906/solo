import React from 'react';
import { useControlStore } from '../stores/controlStore';

const SliderConfig = {
  light: {
    label: '光照强度',
    min: 0,
    max: 100,
    unit: '%',
    trackColor: '#ffd48a',
    handleColor: '#ffaa00',
    getter: (s: ReturnType<typeof useControlStore.getState>) => s.lightIntensity,
    setter: (s: ReturnType<typeof useControlStore.getState>, v: number) => s.setLightIntensity(v),
  },
  moisture: {
    label: '土壤水分',
    min: 0,
    max: 100,
    unit: '%',
    trackColor: '#4fc3f7',
    handleColor: '#0288d1',
    getter: (s: ReturnType<typeof useControlStore.getState>) => s.soilMoisture,
    setter: (s: ReturnType<typeof useControlStore.getState>, v: number) => s.setSoilMoisture(v),
  },
  temperature: {
    label: '环境温度',
    min: 10,
    max: 40,
    unit: '°C',
    trackColor: '#ef9a9a',
    handleColor: '#d32f2f',
    getter: (s: ReturnType<typeof useControlStore.getState>) => s.temperature,
    setter: (s: ReturnType<typeof useControlStore.getState>, v: number) => s.setTemperature(v),
  },
} as const;

type SliderKey = keyof typeof SliderConfig;

const ControlPanel: React.FC = () => {
  const store = useControlStore();

  const renderSlider = (key: SliderKey) => {
    const cfg = SliderConfig[key];
    const value = cfg.getter(store);
    const pct = ((value - cfg.min) / (cfg.max - cfg.min)) * 100;

    return (
      <div key={key} style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: '#333' }}>
          <span>{cfg.label}</span>
          <span style={{ fontWeight: 600 }}>{value}{cfg.unit}</span>
        </div>
        <div style={{ position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '100%',
              height: 6,
              borderRadius: 3,
              background: '#e0e0e0',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                borderRadius: 3,
                background: cfg.trackColor,
                transition: 'width 0.1s ease',
              }}
            />
          </div>
          <input
            type="range"
            min={cfg.min}
            max={cfg.max}
            value={value}
            step={1}
            onChange={(e) => cfg.setter(store, Number(e.target.value))}
            style={{
              position: 'absolute',
              width: '100%',
              height: 24,
              top: 0,
              left: 0,
              opacity: 0,
              cursor: 'pointer',
              margin: 0,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: `calc(${pct}% - 9px)`,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: cfg.handleColor,
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              pointerEvents: 'none',
              transition: 'left 0.1s ease',
            }}
          />
        </div>
      </div>
    );
  };

  const handleStart = () => {
    if (!store.isGrowing) {
      store.startGrowing();
    }
  };

  return (
    <div
      style={{
        width: 220,
        padding: '20px 18px',
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: 12,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        userSelect: 'none',
      }}
    >
      <h3 style={{ fontSize: 15, color: '#2e7d32', marginBottom: 8, fontWeight: 700, textAlign: 'center' }}>
        环境参数调节
      </h3>
      {renderSlider('light')}
      {renderSlider('moisture')}
      {renderSlider('temperature')}
      <button
        onClick={handleStart}
        disabled={store.isGrowing}
        style={{
          marginTop: 10,
          padding: '10px 0',
          border: 'none',
          borderRadius: 8,
          background: store.isGrowing ? '#a5d6a7' : '#4caf50',
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          cursor: store.isGrowing ? 'default' : 'pointer',
          transition: 'background 0.2s, transform 0.2s',
          outline: 'none',
        }}
        onMouseDown={(e) => {
          if (!store.isGrowing) (e.currentTarget.style.transform = 'scale(0.95)');
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onMouseEnter={(e) => {
          if (!store.isGrowing) e.currentTarget.style.background = '#388e3c';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = store.isGrowing ? '#a5d6a7' : '#4caf50';
        }}
      >
        {store.isGrowing ? `生长中 ${Math.round(store.growthProgress * 100)}%` : '🌱 开始生长'}
      </button>
      <div style={{ marginTop: 8, fontSize: 11, color: '#888', textAlign: 'center', lineHeight: 1.5 }}>
        调节参数观察植物形态变化
      </div>
    </div>
  );
};

export default ControlPanel;
