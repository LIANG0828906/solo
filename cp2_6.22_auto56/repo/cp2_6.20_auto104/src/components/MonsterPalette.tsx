import React, { useRef } from 'react';
import { useEditorStore } from '@store/editorStore';
import { monsters as monsterTemplates, Monster, MonsterTemplate } from '@core/monsterData';

function setupDragImage(svgString: string): { element: HTMLDivElement; cleanup: () => void } {
  const div = document.createElement('div');
  div.style.width = '64px';
  div.style.height = '64px';
  div.style.position = 'absolute';
  div.style.top = '-9999px';
  div.style.left = '-9999px';
  div.style.pointerEvents = 'none';
  div.style.zIndex = '-1';
  div.style.background = 'rgba(22, 33, 62, 0.9)';
  div.style.border = '2px solid #e94560';
  div.style.borderRadius = '8px';
  div.style.display = 'flex';
  div.style.alignItems = 'center';
  div.style.justifyContent = 'center';
  div.style.boxShadow = '0 4px 16px rgba(233, 69, 96, 0.4)';
  div.innerHTML = svgString;
  const svg = div.querySelector('svg');
  if (svg) {
    svg.setAttribute('width', '48');
    svg.setAttribute('height', '48');
  }
  document.body.appendChild(div);
  return {
    element: div,
    cleanup: () => {
      if (div.parentNode) div.parentNode.removeChild(div);
    },
  };
}

const MonsterTemplateCard: React.FC<{ template: MonsterTemplate }> = ({ template }) => {
  const cleanupRef = useRef<(() => void) | null>(null);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('monster-type', template.type);
    e.dataTransfer.effectAllowed = 'copy';
    try {
      const { element, cleanup } = setupDragImage(template.svgAvatar);
      cleanupRef.current = cleanup;
      e.dataTransfer.setDragImage(element, 32, 32);
    } catch {}
  };

  const handleDragEnd = () => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{
        background: '#e0e0e0',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        cursor: 'grab',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        transition: 'box-shadow 0.2s, transform 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.boxShadow = '0 8px 20px rgba(233, 69, 96, 0.35)';
        el.style.transform = 'translateY(-3px)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        el.style.transform = 'translateY(0)';
      }}
    >
      <div
        dangerouslySetInnerHTML={{ __html: template.svgAvatar }}
        style={{
          width: 42,
          height: 42,
          flexShrink: 0,
          background: '#2a2a3e',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          padding: 3,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 3 }}>
          {template.name}
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <MiniStat label="HP" value={template.hp} color="#e94560" />
          <MiniStat label="ATK" value={template.attack} color="#ff8c00" />
          <MiniStat label="SPD" value={template.speed} color="#27ae60" />
        </div>
      </div>
    </div>
  );
};

const MiniStat: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <span
    style={{
      fontSize: 10,
      color,
      fontWeight: 700,
      background: 'rgba(0,0,0,0.08)',
      padding: '1px 5px',
      borderRadius: 3,
    }}
  >
    {label} {value}
  </span>
);

const PlacedMonsterCard: React.FC<{
  monster: Monster;
  isSelected: boolean;
  patrolPathMonsterId: string | null;
  previewMonsterId: string | null;
  onSelect: () => void;
  onEditPath: () => void;
  onPreview: () => void;
  onRemove: () => void;
  onStopPreview: () => void;
}> = ({ monster, isSelected, patrolPathMonsterId, previewMonsterId, onSelect, onEditPath, onPreview, onRemove, onStopPreview }) => {
  const isEditingPath = patrolPathMonsterId === monster.id;
  const isPreviewing = previewMonsterId === monster.id;
  const hasPath = monster.patrolPath.length >= 2;

  return (
    <div
      onClick={onSelect}
      style={{
        background: isSelected ? 'rgba(233, 69, 96, 0.15)' : 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        padding: 10,
        marginBottom: 8,
        cursor: 'pointer',
        border: isSelected ? '1px solid #e94560' : isEditingPath ? '1px solid #533483' : '1px solid rgba(255,255,255,0.08)',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <div
          dangerouslySetInnerHTML={{ __html: monster.svgAvatar }}
          style={{
            width: 32,
            height: 32,
            flexShrink: 0,
            background: '#1a1a2e',
            borderRadius: 5,
            padding: 2,
            overflow: 'hidden',
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#e0e0e0' }}>{monster.name}</div>
          <div style={{ fontSize: 10, color: '#6a7a8a' }}>
            ({monster.gridX}, {monster.gridY}) · {monster.patrolPath.length}路径点
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEditPath();
          }}
          style={{
            flex: 1,
            minWidth: 60,
            background: isEditingPath ? '#533483' : 'rgba(83, 52, 131, 0.6)',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '5px 6px',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#533483')}
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = isEditingPath ? '#533483' : 'rgba(83, 52, 131, 0.6)')
          }
        >
          {isEditingPath ? '编辑中...' : hasPath ? '重绘路径' : '编辑路径'}
        </button>

        {hasPath && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              isPreviewing ? onStopPreview() : onPreview();
            }}
            style={{
              flex: 1,
              minWidth: 60,
              background: isPreviewing ? '#27ae60' : 'rgba(39, 174, 96, 0.6)',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              padding: '5px 6px',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#27ae60')}
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = isPreviewing ? '#27ae60' : 'rgba(39, 174, 96, 0.6)')
            }
          >
            {isPreviewing ? '停止' : '预览动画'}
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{
            minWidth: 30,
            background: 'rgba(233, 69, 96, 0.6)',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '5px 8px',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#e94560')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(233, 69, 96, 0.6)')}
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export const MonsterPalette: React.FC = () => {
  const selectedMonsterId = useEditorStore((s) => s.selectedMonsterId);
  const monstersOnMap = useEditorStore((s) => s.monsters);
  const patrolPathMonsterId = useEditorStore((s) => s.patrolPath.monsterId);
  const previewMonsterId = useEditorStore((s) => s.previewAnim.monsterId);
  const animationSpeed = useEditorStore((s) => s.animationSpeed);

  const removeMonster = useEditorStore((s) => s.removeMonster);
  const startPatrolPath = useEditorStore((s) => s.startPatrolPath);
  const startPreviewAnimation = useEditorStore((s) => s.startPreviewAnimation);
  const stopPreviewAnimation = useEditorStore((s) => s.stopPreviewAnimation);
  const setSelectedMonsterId = useEditorStore((s) => s.setSelectedMonsterId);
  const setAnimationSpeed = useEditorStore((s) => s.setAnimationSpeed);

  return (
    <div
      style={{
        width: '30%',
        minWidth: 280,
        maxWidth: 380,
        background: '#0f3460',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid #1a2a4a',
        overflow: 'hidden',
      }}
    >
      {/* Section 1: 怪物图鉴模板 */}
      <div
        style={{
          padding: '12px 14px 6px',
          borderBottom: '1px solid #1a2a4a',
        }}
      >
        <h3 style={{ color: '#e94560', fontSize: 14, margin: 0, fontWeight: 800, letterSpacing: 0.5 }}>
          怪物图鉴
        </h3>
        <p style={{ color: '#6a7a8a', fontSize: 11, margin: '3px 0 8px' }}>
          拖拽怪物到左侧画布上放置
        </p>
      </div>
      <div
        style={{
          padding: '4px 12px 10px',
          borderBottom: '1px solid #1a2a4a',
          maxHeight: 310,
          overflowY: 'auto',
        }}
      >
        {monsterTemplates.map((m) => (
          <MonsterTemplateCard key={m.type} template={m} />
        ))}
      </div>

      {/* Section 2: 已放置的怪物 */}
      <div
        style={{
          padding: '12px 14px 6px',
          borderBottom: monstersOnMap.length > 0 ? '1px solid #1a2a4a' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ color: '#533483', fontSize: 13, margin: 0, fontWeight: 700 }}>
            已放置怪物
          </h3>
          <span style={{ color: '#6a7a8a', fontSize: 10, background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: 10 }}>
            {monstersOnMap.length}
          </span>
        </div>
      </div>

      {monstersOnMap.length > 0 ? (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '4px 12px',
            minHeight: 80,
          }}
        >
          {monstersOnMap.map((m) => (
            <PlacedMonsterCard
              key={m.id}
              monster={m}
              isSelected={selectedMonsterId === m.id}
              patrolPathMonsterId={patrolPathMonsterId}
              previewMonsterId={previewMonsterId}
              onSelect={() => setSelectedMonsterId(m.id)}
              onEditPath={() => startPatrolPath(m.id)}
              onPreview={() => startPreviewAnimation(m.id)}
              onRemove={() => removeMonster(m.id)}
              onStopPreview={() => stopPreviewAnimation()}
            />
          ))}
        </div>
      ) : (
        <div style={{ flex: 1, padding: '16px 14px', color: '#4a5a6a', fontSize: 11, textAlign: 'center' }}>
          暂无怪物，从上方拖拽到画布
        </div>
      )}

      {/* Section 3: 动画速度控制 */}
      <div
        style={{
          padding: '10px 16px 12px',
          borderTop: '1px solid #1a2a4a',
          background: '#0a192f',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ color: '#8899aa', fontSize: 11, fontWeight: 600 }}>⏱ 巡逻动画速度</span>
          <span style={{ color: '#e94560', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>
            {animationSpeed.toFixed(1)}x
          </span>
        </div>
        <input
          type="range"
          min={0.1}
          max={5}
          step={0.1}
          value={animationSpeed}
          onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
          style={{
            width: '100%',
            accentColor: '#e94560',
            height: 4,
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, fontSize: 9, color: '#4a5a6a' }}>
          <span>0.1x</span>
          <span>2.5x</span>
          <span>5x</span>
        </div>
      </div>
    </div>
  );
};
