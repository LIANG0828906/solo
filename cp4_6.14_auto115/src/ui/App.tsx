import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Equipment, EquipmentType } from '../logic/types';

const typeLabels: Record<EquipmentType, string> = {
  tool: '工具',
  medical: '医疗',
  food: '食物',
  communication: '通讯',
};

const typeColors: Record<EquipmentType, string> = {
  tool: '#60a5fa',
  medical: '#f87171',
  food: '#f59e0b',
  communication: '#a78bfa',
};

const terrainIcons: Record<string, string> = {
  丛林: '🌴',
  雪山: '🏔️',
  河谷: '🏞️',
  洞穴: '🕳️',
  森林: '🌲',
  草原: '🌾',
  山地: '⛰️',
  溪流: '💧',
  丘陵: '🏔️',
  平原: '🏕️',
};

const EquipmentCard: React.FC<{
  equipment: Equipment;
  onDragStart: (equipment: Equipment) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}> = ({ equipment, onDragStart, onDragEnd, isDragging }) => {
  const bgColor = typeColors[equipment.type];
  return (
    <div
      className={`equipment-card ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={() => onDragStart(equipment)}
      onDragEnd={onDragEnd}
    >
      <div
        className="equipment-icon"
        style={{
          backgroundColor: `${bgColor}22`,
          border: `2px solid ${bgColor}55`,
          boxShadow: `0 0 24px ${bgColor}30`,
        }}
      >
        <span style={{ filter: `drop-shadow(0 0 6px ${bgColor})`, fontSize: 36 }}>
          {equipment.icon}
        </span>
      </div>
      <div className="equipment-name">{equipment.name}</div>
      <div className="equipment-stats">
        <span className="equipment-stat">⚖️ {equipment.weight}kg</span>
        <span className="equipment-stat">🛡️ {equipment.durability}</span>
      </div>
    </div>
  );
};

const PackSlot: React.FC<{
  equipment: Equipment | null;
  index: number;
  onRemove: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragLeave: () => void;
  onDrop: () => void;
  isDragOver: boolean;
}> = ({ equipment, index, onRemove, onDragOver, onDragLeave, onDrop, isDragOver }) => {
  const bgColor = equipment ? typeColors[equipment.type] : null;
  return (
    <div
      className={`pack-slot ${equipment ? 'filled' : 'empty'} ${
        isDragOver ? 'drag-over' : ''
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(index);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        onDragLeave();
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDrop();
      }}
      onClick={() => equipment && onRemove(index)}
      title={equipment ? '点击移除' : ''}
    >
      {equipment && (
        <>
          <span
            className="pack-slot-icon"
            style={{
              filter: bgColor ? `drop-shadow(0 0 4px ${bgColor})` : undefined,
            }}
          >
            {equipment.icon}
          </span>
          <span className="pack-slot-remove">×</span>
        </>
      )}
    </div>
  );
};

const MissionCard: React.FC<{
  mission: ReturnType<typeof useGameStore.getState>['missions'][number];
  isActive: boolean;
  animateIn: boolean;
}> = ({ mission, isActive, animateIn }) => {
  const stars = [];
  for (let i = 0; i < 3; i++) {
    stars.push(
      <span
        key={i}
        className={`star ${i < mission.difficulty ? 'filled' : ''}`}
      >
        ★
      </span>
    );
  }

  return (
    <div
      className={`mission-card ${isActive ? 'active' : ''} ${
        animateIn ? 'animate-in' : ''
      }`}
    >
      <div className="mission-name">{mission.name}</div>
      <div className="mission-difficulty">
        {stars}
        <span className="mission-difficulty-label">
          {mission.difficulty === 1 ? '简单' : mission.difficulty === 2 ? '中等' : '困难'}
        </span>
      </div>
      <div className="mission-terrain">
        <span>{terrainIcons[mission.terrain] || '📍'}</span>
        <span>{mission.terrain}</span>
      </div>
      <div className="mission-description">{mission.description}</div>
      <div className="mission-required">
        {mission.requiredTypes.map((type) => (
          <span key={type} className={`required-type-tag ${type}`}>
            {typeLabels[type]}
          </span>
        ))}
      </div>
    </div>
  );
};

const ResultModal: React.FC<{
  result: ReturnType<typeof useGameStore.getState>['currentResult'];
  onClose: () => void;
}> = ({ result, onClose }) => {
  if (!result) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-pop-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon">
            {result.success ? '🎉' : '💔'}
          </div>
          <h2 className={`modal-title ${result.success ? 'success' : 'failure'}`}>
            {result.success ? '探险成功！' : '探险失败'}
          </h2>
          <p className="modal-message">{result.message}</p>
        </div>

        <div className="modal-stats">
          <div className="stat-row">
            <span className="stat-label">存活率</span>
            <span className={`stat-value ${result.success ? 'highlight' : ''}`}>
              {result.survivalRate}%
            </span>
          </div>
        </div>

        {result.events.length > 0 && (
          <div className="modal-section">
            <div className="modal-section-title">📜 经历事件</div>
            <ul className="modal-list events">
              {result.events.map((event, index) => (
                <li key={index}>{event}</li>
              ))}
            </ul>
          </div>
        )}

        {result.rewards.length > 0 && (
          <div className="modal-section">
            <div className="modal-section-title">🎁 收获物品</div>
            <ul className="modal-list rewards">
              {result.rewards.map((reward, index) => (
                <li key={index}>{reward}</li>
              ))}
            </ul>
          </div>
        )}

        {result.losses.length > 0 && (
          <div className="modal-section">
            <div className="modal-section-title">💔 损失</div>
            <ul className="modal-list losses">
              {result.losses.map((loss, index) => (
                <li key={index}>{loss}</li>
              ))}
            </ul>
          </div>
        )}

        <button className="modal-close-btn" onClick={onClose}>
          确定
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const {
    equipmentList,
    missions,
    packSlots,
    totalWeight,
    maxWeight,
    isExpediting,
    currentResult,
    addEquipmentToPack,
    removeEquipmentFromPack,
    generateNewMission,
    startExpedition,
    clearResult,
    setOverweight,
  } = useGameStore();

  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
  const [packDragOver, setPackDragOver] = useState(false);
  const [draggingEquipmentId, setDraggingEquipmentId] = useState<string | null>(null);
  const [prevMissionsLength] = useState(missions.length);
  const [animatingMissionIds, setAnimatingMissionIds] = useState<Set<string>>(new Set());
  const [overweightFlashKey, setOverweightFlashKey] = useState(0);

  const draggedEquipmentRef = useRef<Equipment | null>(null);
  const missionListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (missionListRef.current) {
      missionListRef.current.scrollTop = missionListRef.current.scrollHeight;
    }
  }, [missions.length]);

  useEffect(() => {
    if (missions.length > prevMissionsLength) {
      const newMission = missions[missions.length - 1];
      setAnimatingMissionIds((prev) => {
        const next = new Set(prev);
        next.add(newMission.id);
        return next;
      });
      const timer = window.setTimeout(() => {
        setAnimatingMissionIds((prev) => {
          const next = new Set(prev);
          next.delete(newMission.id);
          return next;
        });
      }, 600);
      return () => window.clearTimeout(timer);
    }
  }, [missions, prevMissionsLength]);

  const triggerOverweightFlash = useCallback(() => {
    setOverweight(false);
    setOverweightFlashKey((k) => k + 1);
    window.setTimeout(() => {
      setOverweight(true);
    }, 10);
    window.setTimeout(() => {
      setOverweight(false);
    }, 700);
  }, [setOverweight]);

  useEffect(() => {
    if (totalWeight > maxWeight) {
      triggerOverweightFlash();
    }
  }, [totalWeight, maxWeight, triggerOverweightFlash]);

  const handleDragStart = useCallback(
    (equipment: Equipment) => {
      draggedEquipmentRef.current = equipment;
      setDraggingEquipmentId(equipment.id);
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    draggedEquipmentRef.current = null;
    setDraggingEquipmentId(null);
    setDragOverSlot(null);
    setPackDragOver(false);
  }, []);

  const handleSlotDragOver = useCallback((index: number) => {
    setDragOverSlot(index);
    setPackDragOver(true);
  }, []);

  const handleSlotDragLeave = useCallback(() => {
    setDragOverSlot(null);
  }, []);

  const handleSlotDrop = useCallback(() => {
    const equipment = draggedEquipmentRef.current;
    if (equipment) {
      addEquipmentToPack(equipment);
    }
    setDragOverSlot(null);
    setPackDragOver(false);
    handleDragEnd();
  }, [addEquipmentToPack, handleDragEnd]);

  const handlePackDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setPackDragOver(true);
  }, []);

  const handlePackDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setPackDragOver(false);
      setDragOverSlot(null);
    }
  }, []);

  const handlePackDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const equipment = draggedEquipmentRef.current;
      if (equipment) {
        addEquipmentToPack(equipment);
      }
      setPackDragOver(false);
      setDragOverSlot(null);
      handleDragEnd();
    },
    [addEquipmentToPack, handleDragEnd]
  );

  const handleRemoveFromPack = useCallback(
    (index: number) => {
      removeEquipmentFromPack(index);
    },
    [removeEquipmentFromPack]
  );

  const handleDepart = useCallback(() => {
    if (!isExpediting && packSlots.some((s) => s !== null)) {
      startExpedition();
    }
  }, [isExpediting, packSlots, startExpedition]);

  const handleCloseModal = useCallback(() => {
    clearResult();
    generateNewMission();
  }, [clearResult, generateNewMission]);

  const hasEquipment = packSlots.some((s) => s !== null);
  const canDepart = hasEquipment && !isExpediting;

  const isOverweight = totalWeight > maxWeight;

  return (
    <div className="app" onDragEnd={handleDragEnd}>
      <section className="warehouse-section">
        <h2 className="section-title">
          <span className="icon">📦</span>
          仓库货架
        </h2>
        <div className="warehouse-grid">
          {equipmentList.map((equipment) => (
            <EquipmentCard
              key={equipment.id}
              equipment={equipment}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              isDragging={draggingEquipmentId === equipment.id}
            />
          ))}
        </div>
      </section>

      <section className="middle-section">
        <div
          key={`pack-${overweightFlashKey}`}
          className={`pack-area ${packDragOver ? 'drag-over' : ''} ${
            isOverweight ? 'overweight' : ''
          }`}
          onDragOver={handlePackDragOver}
          onDragLeave={handlePackDragLeave}
          onDrop={handlePackDrop}
        >
          <div className="pack-title">🎒 装备包</div>
          <div className="pack-weight">
            总重量：
            <span
              className={`weight-value ${isOverweight ? 'overweight' : ''}`}
            >
              {totalWeight.toFixed(1)}kg
            </span>
            {' / '}
            {maxWeight}kg
          </div>
          <div className="pack-slots">
            {packSlots.map((equipment, index) => (
              <PackSlot
                key={index}
                equipment={equipment}
                index={index}
                onRemove={handleRemoveFromPack}
                onDragOver={handleSlotDragOver}
                onDragLeave={handleSlotDragLeave}
                onDrop={handleSlotDrop}
                isDragOver={dragOverSlot === index}
              />
            ))}
          </div>
        </div>

        <button
          className={`depart-btn ${isExpediting ? 'loading' : ''}`}
          onClick={handleDepart}
          disabled={!canDepart}
        >
          {isExpediting ? (
            <>
              <span className="spinner"></span>
              探险中...
            </>
          ) : (
            <>
              <span>🚀</span>
              出发
            </>
          )}
        </button>
      </section>

      <section className="mission-panel">
        <div className="mission-panel-header">
          <h2 className="mission-panel-title">
            <span className="icon">📋</span>
            探险任务
          </h2>
          <button
            className="add-mission-btn"
            onClick={generateNewMission}
            disabled={isExpediting}
          >
            + 新任务
          </button>
        </div>
        <div className="mission-list" ref={missionListRef}>
          {missions.map((mission, index) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              isActive={index === missions.length - 1}
              animateIn={animatingMissionIds.has(mission.id)}
            />
          ))}
        </div>
      </section>

      {currentResult && (
        <ResultModal result={currentResult} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default App;
