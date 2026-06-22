import React, { useRef, useState, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useMineralStore } from '../store/mineralStore';
import { getMineralById } from '../data/oreData';

interface CrystalInfoPanelProps {}

const CrystalInfoPanel: React.FC<CrystalInfoPanelProps> = () => {
  const { selectedCrystalId, crystals } = useMineralStore();
  const panelRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);

  const selectedCrystal = crystals.find((c) => c.id === selectedCrystalId);
  const mineral = selectedCrystal ? getMineralById(selectedCrystal.mineralType) : null;

  useEffect(() => {
    if (selectedCrystal) {
      setIsVisible(true);
      const timer = setTimeout(() => setOpacity(1), 10);
      return () => clearTimeout(timer);
    } else {
      setOpacity(0);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [selectedCrystalId]);

  if (!isVisible || !selectedCrystal || !mineral) {
    return null;
  }

  const progress = Math.round(selectedCrystal.growthProgress * 100);

  return (
    <Html
      position={[
        selectedCrystal.position.x,
        selectedCrystal.position.y + selectedCrystal.size * 0.6 + 0.3,
        selectedCrystal.position.z,
      ]}
      center
      distanceFactor={8}
      style={{
        transition: 'opacity 0.3s ease-out',
        opacity: opacity,
        pointerEvents: 'auto',
      }}
    >
      <div
        ref={panelRef}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          borderRadius: '8px',
          padding: '12px 16px',
          minWidth: '180px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          fontSize: '13px',
          color: '#333333',
          backdropFilter: 'blur(8px)',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '10px',
            paddingBottom: '8px',
            borderBottom: '1px solid rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '3px',
              backgroundColor: mineral.color,
              marginRight: '8px',
              boxShadow: `0 0 8px ${mineral.color}80`,
            }}
          />
          <span style={{ fontWeight: '700', fontSize: '14px', color: '#222' }}>
            {mineral.name}
          </span>
        </div>

        <div style={{ marginBottom: '8px' }}>
          <div
            style={{
              fontSize: '11px',
              color: 'rgba(0,0,0,0.5)',
              marginBottom: '3px',
            }}
          >
            当前尺寸
          </div>
          <div style={{ fontWeight: '600', color: '#1976D2' }}>
            {selectedCrystal.size.toFixed(2)} 单位
          </div>
        </div>

        <div style={{ marginBottom: '4px' }}>
          <div
            style={{
              fontSize: '11px',
              color: 'rgba(0,0,0,0.5)',
              marginBottom: '5px',
            }}
          >
            生长进度
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                flex: 1,
                height: '6px',
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${mineral.color}, ${mineral.color}aa)`,
                  borderRadius: '3px',
                  transition: 'width 0.3s ease-out',
                }}
              />
            </div>
            <span
              style={{
                fontWeight: '700',
                color: progress >= 100 ? '#4CAF50' : '#FF9800',
                fontSize: '12px',
                minWidth: '38px',
                textAlign: 'right',
              }}
            >
              {progress}%
            </span>
          </div>
        </div>

        <div
          style={{
            marginTop: '10px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: 'rgba(0,0,0,0.5)',
          }}
        >
          <span>密度: {mineral.density.toFixed(2)}</span>
          <span>速率: {(mineral.growthRate * 1000).toFixed(1)}/s</span>
        </div>
      </div>
    </Html>
  );
};

export default CrystalInfoPanel;
