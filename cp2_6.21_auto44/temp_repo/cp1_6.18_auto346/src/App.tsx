import React, { useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { CityScene } from './scene/Renderer';
import { useCityStore } from './store';
import { cityBuilder } from './scene/CityBuilder';
import { onPointerDown } from './controls/InteractionHandler';

function DataPanel() {
  const averageSpeed = useCityStore((s) => s.averageSpeed);
  const particleCount = useCityStore((s) => s.particleCount);
  const greenCount = useCityStore((s) => s.greenCount);

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: 16,
        background: '#00000080',
        borderRadius: 8,
        padding: '12px 16px',
        color: '#fff',
        fontSize: 14,
        fontFamily: 'monospace',
        lineHeight: 1.8,
        pointerEvents: 'none',
      }}
    >
      <div>平均风速: {averageSpeed.toFixed(2)} 单位/帧</div>
      <div>粒子总数: {particleCount}</div>
      <div>绿地建筑数: {greenCount}</div>
    </div>
  );
}

function VerticalSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 20,
      }}
    >
      <div style={{ color: '#fff', fontSize: 12, marginBottom: 6, fontFamily: 'monospace' }}>
        {label}
      </div>
      <div style={{ position: 'relative', width: 24, height: 180 }}>
        <div
          style={{
            position: 'absolute',
            left: 10,
            top: 0,
            width: 4,
            height: '100%',
            background: 'linear-gradient(to top, #00000050, #00000050)',
            borderRadius: 2,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 10,
            bottom: 0,
            width: 4,
            height: `${pct}%`,
            background: 'linear-gradient(to top, #4FC3F7, #0288D1)',
            borderRadius: 2,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            position: 'absolute',
            top: 0,
            left: -8,
            width: 200,
            height: 24,
            transformOrigin: '12px 12px',
            transform: 'rotate(-90deg)',
            opacity: 0,
            cursor: 'pointer',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 5,
            bottom: `calc(${pct}% - 6px)`,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 0 4px rgba(0,0,0,0.4)',
            pointerEvents: 'none',
          }}
        />
      </div>
      <div style={{ color: '#ccc', fontSize: 11, marginTop: 4, fontFamily: 'monospace' }}>
        {value.toFixed(step < 1 ? 1 : 0)}
      </div>
    </div>
  );
}

function SliderPanel() {
  const wind = useCityStore((s) => s.wind);
  const setWind = useCityStore((s) => s.setWind);

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        right: 20,
        transform: 'translateY(-50%)',
        background: '#00000050',
        borderRadius: 8,
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <VerticalSlider
        label="风向 (°)"
        value={wind.direction}
        min={0}
        max={360}
        step={1}
        onChange={(v) => setWind({ direction: v })}
      />
      <VerticalSlider
        label="风速"
        value={wind.speed}
        min={0.5}
        max={5}
        step={0.1}
        onChange={(v) => setWind({ speed: v })}
      />
    </div>
  );
}

function WindIndicator() {
  const wind = useCityStore((s) => s.wind);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 200,
        height: 30,
        background: 'linear-gradient(to right, #333, #555)',
        borderRadius: 15,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderBottom: '16px solid #fff',
          transform: `rotate(${wind.direction}deg)`,
          transformOrigin: 'center center',
          transition: 'transform 0.3s ease-out',
        }}
      />
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const initialBuildings = cityBuilder.getBuildings();
    useCityStore.getState().setBuildings(initialBuildings);
  }, []);

  const handlePointerDown = useCallback((e: PointerEvent) => {
    onPointerDown(e);
  }, []);

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative' }}
      onPointerDown={handlePointerDown}
    >
      <Canvas
        shadows
        camera={{ position: [120, 100, 120], fov: 50, near: 0.1, far: 1000 }}
        style={{ width: '100%', height: '100%' }}
      >
        <CityScene />
      </Canvas>
      <DataPanel />
      <SliderPanel />
      <WindIndicator />
    </div>
  );
}
