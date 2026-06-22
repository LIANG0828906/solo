import React, { useState, useEffect, useCallback } from 'react';
import { EventBus, DisasterOccurredEvent } from '../events/EventBus';
import { IslandStatus } from '../modules/EcosystemSimulator';
import { DisasterType } from '../modules/DisasterManager';

interface IslandMapProps {
  status: IslandStatus;
  activeDisasters: Map<string, DisasterType>;
  onZoneAction: (zone: 'forest' | 'desert' | 'glacier', action: 'harvest' | 'mine' | 'collect') => void;
  onRelief: (type: DisasterType) => void;
}

const ZONE_CONFIG = {
  forest: { color: '#2E7D32', label: '森林', icon: '🌲', action: 'harvest', actionLabel: '砍伐' },
  desert: { color: '#F9A825', label: '沙漠', icon: '🏜️', action: 'mine', actionLabel: '开采' },
  glacier: { color: '#4FC3F7', label: '冰川', icon: '🏔️', action: 'collect', actionLabel: '采集' },
};

const DISASTER_COLORS: Record<DisasterType, string> = {
  fire: '#FF5722',
  flood: '#2196F3',
  drought: '#FFEB3B',
};

const DISASTER_LABELS: Record<DisasterType, string> = {
  fire: '🔥 火灾',
  flood: '🌊 洪水',
  drought: '☀️ 干旱',
};

const RELIEF_LABELS: Record<DisasterType, string> = {
  fire: '灭火 (10木材)',
  flood: '排水 (15矿石)',
  drought: '抗干旱 (20水)',
};

type ZoneKey = 'forest' | 'desert' | 'glacier';

const ZONE_ORDER: ZoneKey[] = ['forest', 'desert', 'glacier'];

export const IslandMap: React.FC<IslandMapProps> = ({ status, activeDisasters, onZoneAction, onRelief }) => {
  const [pulse, setPulse] = useState(false);
  const [decorations, setDecorations] = useState<Record<ZoneKey, Array<{ x: number; y: number; type: string }>>>({ forest: [], desert: [], glacier: [] });

  useEffect(() => {
    const decor: Record<ZoneKey, Array<{ x: number; y: number; type: string }>> = { forest: [], desert: [], glacier: [] };
    decor.forest = Array.from({ length: 5 }, () => ({
      x: 20 + Math.random() * 60,
      y: 10 + Math.random() * 50,
      type: 'tree',
    }));
    decor.desert = Array.from({ length: 4 }, () => ({
      x: 20 + Math.random() * 60,
      y: 10 + Math.random() * 50,
      type: 'dune',
    }));
    decor.glacier = Array.from({ length: 3 }, () => ({
      x: 20 + Math.random() * 60,
      y: 10 + Math.random() * 50,
      type: 'iceberg',
    }));
    setDecorations(decor);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setPulse((p) => !p), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleZoneClick = useCallback((zone: ZoneKey) => {
    const action = ZONE_CONFIG[zone].action as 'harvest' | 'mine' | 'collect';
    onZoneAction(zone, action);
  }, [onZoneAction]);

  return (
    <div className="island-container">
      <div className="island-map">
        <svg viewBox="-10 -10 220 220" className="island-svg">
          {ZONE_ORDER.map((zone, i) => {
            const startAngle = i * 120 - 90;
            const endAngle = startAngle + 120;
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            const cx = 100, cy = 100, r = 90;
            const x1 = cx + r * Math.cos(startRad);
            const y1 = cy + r * Math.sin(startRad);
            const x2 = cx + r * Math.cos(endRad);
            const y2 = cy + r * Math.sin(endRad);
            const largeArc = 1;
            const pathD = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

            const z = status[zone];
            const healthOpacity = 0.4 + (z.health / 100) * 0.6;
            const disaster = activeDisasters.get(zone);
            const fillColor = ZONE_CONFIG[zone].color;

            return (
              <g key={zone} onClick={() => handleZoneClick(zone)} style={{ cursor: 'pointer' }}>
                <path
                  d={pathD}
                  fill={fillColor}
                  fillOpacity={healthOpacity}
                  stroke="#E6EDF3"
                  strokeWidth="1.5"
                  className="zone-path"
                />
                {disaster && (
                  <path
                    d={pathD}
                    fill={DISASTER_COLORS[disaster]}
                    fillOpacity={pulse ? 0.45 : 0.15}
                    className="disaster-overlay"
                  />
                )}
                <text
                  x={cx + (r * 0.5) * Math.cos((startRad + endRad) / 2)}
                  y={cy + (r * 0.5) * Math.sin((startRad + endRad) / 2)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#E6EDF3"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {ZONE_CONFIG[zone].label}
                </text>
                <text
                  x={cx + (r * 0.5) * Math.cos((startRad + endRad) / 2)}
                  y={cy + (r * 0.5) * Math.sin((startRad + endRad) / 2) + 16}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#C9D1D9"
                  fontSize="9"
                >
                  ❤️ {Math.round(z.health)}
                </text>
              </g>
            );
          })}
          <circle cx={100} cy={100} r={8} fill="#0D1117" />
        </svg>
        {ZONE_ORDER.map((zone) => {
          const disaster = activeDisasters.get(zone);
          return disaster ? (
            <button
              key={`relief-${zone}`}
              className="relief-btn"
              onClick={(e) => { e.stopPropagation(); onRelief(disaster); }}
            >
              {RELIEF_LABELS[disaster]}
            </button>
          ) : null;
        })}
      </div>
      <div className="zone-actions">
        {ZONE_ORDER.map((zone) => (
          <button key={`action-${zone}`} className="action-btn" onClick={() => handleZoneClick(zone)}>
            {ZONE_CONFIG[zone].icon} {ZONE_CONFIG[zone].actionLabel}
          </button>
        ))}
      </div>
    </div>
  );
};
