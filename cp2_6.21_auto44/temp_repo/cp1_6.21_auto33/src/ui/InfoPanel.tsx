import React from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SelectedRayInfo } from '../scene/SceneManager';

interface InfoPanelProps {
  info: SelectedRayInfo | null;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({ info }) => {
  const { camera, size } = useThree();
  const [screenPos, setScreenPos] = React.useState({ x: 0, y: 0 });

  React.useEffect(() => {
    if (!info) return;

    const vec = info.position.clone();
    vec.project(camera);

    const x = (vec.x * 0.5 + 0.5) * size.width;
    const y = (-vec.y * 0.5 + 0.5) * size.height;

    setScreenPos({ x, y });
  }, [info, camera, size]);

  if (!info) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: screenPos.x + 15,
        top: screenPos.y - 40,
        background: 'rgba(20, 20, 40, 0.95)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(137, 207, 240, 0.4)',
        borderRadius: 8,
        padding: '12px 16px',
        color: '#fff',
        fontSize: 13,
        pointerEvents: 'none',
        zIndex: 100,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(137, 207, 240, 0.2)',
        minWidth: 160,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
          paddingBottom: 6,
          borderBottom: '1px solid rgba(137, 207, 240, 0.2)',
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: info.color,
            boxShadow: `0 0 10px ${info.color}`,
          }}
        />
        <span style={{ fontWeight: 'bold', fontSize: 14 }}>
          {info.name}色光
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <span style={{ color: '#89CFF0' }}>波长</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
            {info.wavelength} nm
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <span style={{ color: '#89CFF0' }}>出射角</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
            {info.exitAngle.toFixed(1)}°
          </span>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: -6,
          top: 20,
          width: 0,
          height: 0,
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          borderRight: '6px solid rgba(137, 207, 240, 0.4)',
        }}
      />
    </div>
  );
};
