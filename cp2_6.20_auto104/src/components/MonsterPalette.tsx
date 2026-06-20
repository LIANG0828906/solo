import React from 'react';
import { useEditorStore } from '@store/editorStore';
import { monsters as monsterTemplates } from '@core/monsterData';

export const MonsterPalette: React.FC = () => {
  const selectedMonsterId = useEditorStore((s) => s.selectedMonsterId);
  const monstersOnMap = useEditorStore((s) => s.monsters);
  const removeMonster = useEditorStore((s) => s.removeMonster);
  const startPatrolPath = useEditorStore((s) => s.startPatrolPath);
  const animationSpeed = useEditorStore((s) => s.animationSpeed);
  const setAnimationSpeed = useEditorStore((s) => s.setAnimationSpeed);

  const selectedMonster = monstersOnMap.find((m) => m.id === selectedMonsterId);

  const handleDragStart = (e: React.DragEvent, monsterType: string) => {
    e.dataTransfer.setData('monster-type', monsterType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      style={{
        width: '30%',
        minWidth: 260,
        background: '#0f3460',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid #1a2a4a',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #1a2a4a',
        }}
      >
        <h3 style={{ color: '#e94560', fontSize: 14, margin: 0, fontWeight: 700 }}>
          怪物图鉴
        </h3>
        <p style={{ color: '#6a7a8a', fontSize: 11, margin: '4px 0 0' }}>
          拖拽怪物到地图上放置
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {monsterTemplates.map((m) => (
          <div
            key={m.type}
            draggable
            onDragStart={(e) => handleDragStart(e, m.type)}
            style={{
              background: '#e0e0e0',
              borderRadius: 8,
              padding: 10,
              marginBottom: 8,
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              transition: 'box-shadow 0.2s, transform 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                '0 6px 16px rgba(233,69,96,0.3)';
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                '0 2px 4px rgba(0,0,0,0.2)';
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
            }}
          >
            <div
              dangerouslySetInnerHTML={{ __html: m.svgAvatar }}
              style={{
                width: 40,
                height: 40,
                flexShrink: 0,
                background: '#2a2a3e',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>{m.name}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                <StatBadge label="HP" value={m.hp} color="#e94560" />
                <StatBadge label="ATK" value={m.attack} color="#ff8c00" />
                <StatBadge label="SPD" value={m.speed} color="#33cc66" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedMonster && (
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid #1a2a4a',
            background: '#0a192f',
          }}
        >
          <h4 style={{ color: '#e94560', fontSize: 13, margin: '0 0 8px' }}>
            已选怪物
          </h4>
          <div style={{ fontSize: 12, color: '#b0b8c0', lineHeight: 1.8 }}>
            <div>名称: {selectedMonster.name}</div>
            <div>坐标: ({selectedMonster.gridX}, {selectedMonster.gridY})</div>
            <div>巡逻路径: {selectedMonster.patrolPath.length} 个点</div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              onClick={() => startPatrolPath(selectedMonster.id)}
              style={{
                flex: 1,
                background: '#533483',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                padding: '6px 0',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              绘制巡逻路径
            </button>
            <button
              onClick={() => removeMonster(selectedMonster.id)}
              style={{
                flex: 1,
                background: '#e94560',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                padding: '6px 0',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              删除怪物
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid #1a2a4a',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#8899aa', fontSize: 12 }}>动画速度</span>
          <input
            type="range"
            min={0.1}
            max={5}
            step={0.1}
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
            style={{ width: 120, accentColor: '#e94560' }}
          />
          <span style={{ color: '#e0e0e0', fontSize: 12, minWidth: 28, textAlign: 'right' }}>
            {animationSpeed.toFixed(1)}x
          </span>
        </div>
      </div>
    </div>
  );
};

const StatBadge: React.FC<{ label: string; value: number; color: string }> = ({
  label,
  value,
  color,
}) => (
  <span
    style={{
      fontSize: 10,
      color,
      fontWeight: 600,
      background: 'rgba(0,0,0,0.1)',
      padding: '1px 4px',
      borderRadius: 3,
    }}
  >
    {label}:{value}
  </span>
);
