import React, { useState, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { shipRepair } from '../../modules/ship/ShipRepair';
import type { CollectedPart, RepairSlot } from '../../store/types';

const RepairPanel: React.FC = () => {
  const collectedParts = useGameStore((s) => s.collectedParts);
  const repairSlots = useGameStore((s) => s.repairSlots);
  const engineStarted = useGameStore((s) => s.engineStarted);
  const gameView = useGameStore((s) => s.gameView);
  const fillRepairSlot = useGameStore((s) => s.fillRepairSlot);

  const [draggedPart, setDraggedPart] = useState<CollectedPart | null>(null);
  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null);
  const [flyAnimations, setFlyAnimations] = useState<Map<string, { fromX: number; fromY: number }>>(new Map());
  const [showEngineShake, setShowEngineShake] = useState(false);

  const progress = shipRepair.getProgress();
  const isComplete = shipRepair.isRepairComplete();

  const handleDragStart = useCallback((part: CollectedPart, e: React.DragEvent) => {
    setDraggedPart(part);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', part.id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedPart(null);
    setDragOverSlotId(null);
  }, []);

  const handleSlotDragOver = useCallback((slotId: string, e: React.DragEvent) => {
    e.preventDefault();
    if (draggedPart) {
      setDragOverSlotId(slotId);
    }
  }, [draggedPart]);

  const handleSlotDragLeave = useCallback(() => {
    setDragOverSlotId(null);
  }, []);

  const handleSlotDrop = useCallback((slot: RepairSlot, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverSlotId(null);

    if (!draggedPart) return;
    if (!shipRepair.canPartFillSlot(draggedPart, slot)) {
      useGameStore.getState().addEvent('部件类型不匹配！', 'warning');
      return;
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const animId = `fly-${slot.id}-${Date.now()}`;
    setFlyAnimations((prev) => {
      const next = new Map(prev);
      next.set(animId, { fromX: e.clientX - rect.left, fromY: e.clientY - rect.top });
      return next;
    });

    fillRepairSlot(slot.id, draggedPart);
    setDraggedPart(null);

    setTimeout(() => {
      setFlyAnimations((prev) => {
        const next = new Map(prev);
        next.delete(animId);
        return next;
      });
    }, 400);
  }, [draggedPart, fillRepairSlot]);

  const handleStartEngine = useCallback(() => {
    setShowEngineShake(true);
    setTimeout(() => {
      shipRepair.startEngine();
      setShowEngineShake(false);
    }, 500);
  }, []);

  const handleStartDiving = useCallback(() => {
    shipRepair.enterDivingMode();
  }, []);

  const handleReturn = useCallback(() => {
    shipRepair.returnToMap();
  }, []);

  const hullSlots = repairSlots.filter((s) => s.region === 'hull');
  const pipelineSlots = repairSlots.filter((s) => s.region === 'pipeline');
  const engineSlots = repairSlots.filter((s) => s.region === 'engine');

  return (
    <div
      className={`glass-panel glow-panel p-4 ${showEngineShake ? 'engine-shake' : ''}`}
      style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '100%', overflow: 'hidden' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: '#64ffda', fontSize: 16, fontWeight: 600 }}>
          ⚓ 潜水艇修复
        </h3>
        <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#8892b0' }}>
          {progress.filled}/{progress.total}
        </span>
      </div>

      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: '#8892b0',
            marginBottom: 4,
          }}
        >
          <span>修复进度</span>
          <span style={{ color: '#64ffda' }}>{progress.percentage.toFixed(0)}%</span>
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: '#112240',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress.percentage}%`,
              background: 'linear-gradient(90deg, #64ffda, #4dd8b8)',
              transition: 'width 0.4s ease',
              boxShadow: '0 0 8px rgba(100, 255, 218, 0.5)',
            }}
          />
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          background: 'linear-gradient(180deg, rgba(17, 34, 64, 0.6) 0%, rgba(10, 25, 47, 0.8) 100%)',
          borderRadius: 12,
          border: '1px solid rgba(100, 255, 218, 0.15)',
          height: 200,
          overflow: 'hidden',
        }}
      >
        <svg
          viewBox="0 0 100 100"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          <defs>
            <linearGradient id="subGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4a5568" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#2d3748" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <ellipse cx="50" cy="55" rx="42" ry="30" fill="url(#subGrad)" stroke="rgba(100,255,218,0.4)" strokeWidth="0.5" />
          <path d="M35 30 Q50 15 65 30 L60 30 L40 30 Z" fill="rgba(45, 55, 72, 0.4)" stroke="rgba(100,255,218,0.3)" strokeWidth="0.3" />
        </svg>

        {[
          { slots: hullSlots, label: '船体', y: 8 },
          { slots: pipelineSlots, label: '管路系统', y: 45 },
          { slots: engineSlots, label: '引擎舱', y: 75 },
        ].map(({ slots, label, y }) => (
          <React.Fragment key={label}>
            <div
              style={{
                position: 'absolute',
                left: 4,
                top: y,
                fontSize: 9,
                color: 'rgba(100, 255, 218, 0.6)',
                fontFamily: 'monospace',
              }}
            >
              {label}
            </div>
            {slots.map((slot) => (
              <SlotView
                key={slot.id}
                slot={slot}
                onDragOver={handleSlotDragOver}
                onDragLeave={handleSlotDragLeave}
                onDrop={handleSlotDrop}
                isDragOver={dragOverSlotId === slot.id}
                draggedPartType={draggedPart?.type}
              />
            ))}
          </React.Fragment>
        ))}

        {Array.from(flyAnimations.entries()).map(([id, _pos]) => (
          <div
            key={id}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: 24,
              height: 24,
              animation: 'part-fly 0.4s ease-out forwards',
              pointerEvents: 'none',
            }}
          >
            ✨
          </div>
        ))}
      </div>

      <div>
        <div
          style={{
            fontSize: 12,
            color: '#8892b0',
            marginBottom: 8,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>🎒 部件背包</span>
          <span style={{ fontFamily: 'monospace', color: '#64ffda' }}>{collectedParts.length}件</span>
        </div>
        {collectedParts.length === 0 ? (
          <div
            style={{
              padding: 16,
              textAlign: 'center',
              fontSize: 11,
              color: '#5a6a85',
              border: '1px dashed rgba(100, 255, 218, 0.2)',
              borderRadius: 8,
            }}
          >
            搜索沉船残骸获取部件
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))',
              gap: 6,
            }}
          >
            {collectedParts.map((part) => (
              <PartItem
                key={part.id}
                part={part}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                isDragging={draggedPart?.id === part.id}
              />
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
        {gameView === 'map' ? (
          <>
            <button
              className="btn btn-primary"
              onClick={handleStartEngine}
              disabled={!isComplete || engineStarted}
              style={{ width: '100%' }}
            >
              {engineStarted ? '✓ 引擎已启动' : isComplete ? '🚀 启动引擎' : '🔧 修复中...'}
            </button>
            <button
              className="btn"
              onClick={handleStartDiving}
              disabled={!engineStarted}
              style={{ width: '100%' }}
            >
              🌊 开始下潜
            </button>
          </>
        ) : (
          <button
            className="btn"
            onClick={handleReturn}
            style={{ width: '100%' }}
          >
            🗺️ 返回地图
          </button>
        )}
      </div>
    </div>
  );
};

const SlotView: React.FC<{
  slot: RepairSlot;
  onDragOver: (slotId: string, e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (slot: RepairSlot, e: React.DragEvent) => void;
  isDragOver: boolean;
  draggedPartType?: string;
}> = ({ slot, onDragOver, onDragLeave, onDrop, isDragOver, draggedPartType }) => {
  const typeMatches = draggedPartType === slot.requiredType && !slot.filled;
  const shouldHighlight = isDragOver || (typeMatches && !slot.filled);

  return (
    <div
      onDragOver={(e) => onDragOver(slot.id, e)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(slot, e)}
      className={shouldHighlight ? 'slot-highlight' : ''}
      style={{
        position: 'absolute',
        left: `${slot.x}%`,
        top: `${slot.y}%`,
        width: 44,
        height: 36,
        marginLeft: -22,
        marginTop: -18,
        borderRadius: 6,
        border: `1.5px dashed ${
          slot.filled
            ? 'rgba(100, 255, 218, 0.7)'
            : shouldHighlight
            ? '#64ffda'
            : 'rgba(136, 146, 176, 0.4)'
        }`,
        background: slot.filled
          ? 'rgba(100, 255, 218, 0.12)'
          : shouldHighlight
          ? 'rgba(100, 255, 218, 0.05)'
          : 'rgba(10, 25, 47, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        cursor: !slot.filled && shouldHighlight ? 'copy' : 'default',
      }}
      title={slot.filled ? `${slot.filledPart?.icon} ${slot.filledPart?.name}` : `需要: ${slot.label}`}
    >
      {slot.filled ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: 16 }}>{slot.filledPart?.icon}</span>
        </div>
      ) : (
        <span style={{ fontSize: 10, color: 'rgba(136, 146, 176, 0.5)' }}>＋</span>
      )}
    </div>
  );
};

const PartItem: React.FC<{
  part: CollectedPart;
  onDragStart: (part: CollectedPart, e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}> = ({ part, onDragStart, onDragEnd, isDragging }) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(part, e)}
      onDragEnd={onDragEnd}
      style={{
        padding: 6,
        borderRadius: 8,
        border: '1px solid rgba(100, 255, 218, 0.25)',
        background: 'linear-gradient(135deg, rgba(17, 34, 64, 0.8) 0%, rgba(22, 52, 82, 0.6) 100%)',
        cursor: isDragging ? 'grabbing' : 'grab',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        opacity: isDragging ? 0.4 : 1,
        transition: 'all 0.15s ease',
        boxShadow: isDragging
          ? '0 8px 20px rgba(100, 255, 218, 0.3)'
          : '0 2px 4px rgba(0,0,0,0.2)',
        transform: isDragging ? 'scale(1.05)' : undefined,
      }}
      title={`${part.name} - 拖拽到修复槽位`}
    >
      <span style={{ fontSize: 20 }}>{part.icon}</span>
      <span
        style={{
          fontSize: 9,
          color: '#8892b0',
          textAlign: 'center',
          lineHeight: 1.1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
        }}
      >
        {part.name}
      </span>
    </div>
  );
};

export default RepairPanel;
