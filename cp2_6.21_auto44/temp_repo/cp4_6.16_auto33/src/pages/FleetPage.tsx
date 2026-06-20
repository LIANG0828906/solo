import React, { useCallback, useRef, useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useGameStore } from '../store/gameStore';
import { SHIP_CONFIGS, ShipType, Ship } from '../engine/types';
import { canAfford } from '../engine/fleetManager';

const SHIP_TYPES: ShipType[] = ['fighter', 'corvette', 'destroyer'];

const ShipCard: React.FC<{ type: ShipType }> = ({ type }) => {
  const config = SHIP_CONFIGS[type];
  const resources = useGameStore(s => s.resources);
  const buildShip = useGameStore(s => s.buildShip);
  const affordability = canAfford(resources, config.cost);
  const isDisabled = !affordability.canAfford;

  const [hoverSpring, hoverApi] = useSpring(() => ({
    transform: 'translateY(0px)',
    boxShadow: '0 0 0 rgba(0, 212, 255, 0)',
    config: { tension: 200, friction: 18 }
  }));

  return (
    <animated.div
      className="ship-card"
      style={hoverSpring}
      onMouseEnter={() => hoverApi.start({ transform: 'translateY(-6px)', boxShadow: '0 8px 32px rgba(0,212,255,0.15)' })}
      onMouseLeave={() => hoverApi.start({ transform: 'translateY(0px)', boxShadow: '0 0 0 rgba(0,212,255,0)' })}
    >
      <div className="ship-card-header">
        <div className="ship-3d-icon">
          <div className="ship-3d-body">
            <div className="ship-hull">
              <div className={`ship-hull-${type}`}>
                <div className="ship-flame" />
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="ship-card-name">{config.name}</div>
          <div className="ship-card-desc">{config.description}</div>
        </div>
      </div>

      <div className="ship-stats">
        <StatRow label="HP" value={config.baseStats.hp} max={250} type="hp" />
        <StatRow label="ATK" value={config.baseStats.attack} max={55} type="atk" />
        <StatRow label="DEF" value={config.baseStats.defense} max={30} type="def" />
        <StatRow label="SPD" value={config.baseStats.speed} max={10} type="spd" />
        <StatRow label="SHD" value={config.baseStats.shield.maxValue} max={110} type="shd" />
        <StatRow label="ACC" value={Math.round(config.baseStats.accuracy * 100)} max={100} type="hp" />
      </div>

      <div className="ship-cost">
        <CostItem label="铁" cost={config.cost.iron} current={resources.iron} field="iron" />
        <CostItem label="晶体" cost={config.cost.crystal} current={resources.crystal} field="crystal" />
        <CostItem label="能量" cost={config.cost.energy} current={resources.energy} field="energy" />
      </div>

      <button
        className="build-btn"
        disabled={isDisabled}
        onClick={() => buildShip(type)}
      >
        建造{config.name}
        <span className="insufficient-tip">资源不足</span>
      </button>
    </animated.div>
  );
};

const StatRow: React.FC<{ label: string; value: number; max: number; type: string }> = ({
  label, value, max, type
}) => (
  <div className="stat-row">
    <span className="stat-label">{label}</span>
    <div className="stat-bar-bg">
      <div className={`stat-bar-fill ${type}`} style={{ width: `${(value / max) * 100}%` }} />
    </div>
    <span className="stat-val">{value}</span>
  </div>
);

const CostItem: React.FC<{
  label: string;
  cost: number;
  current: number;
  field: 'iron' | 'crystal' | 'energy';
}> = ({ label, cost, current, field: _field }) => {
  const insufficient = current < cost;
  return (
    <span className={`cost-item ${insufficient ? 'insufficient' : ''}`}>
      {label}: {cost}
    </span>
  );
};

const FormationSlot: React.FC<{
  ship: Ship | null;
  index: number;
  onRemove: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  isDragOver: boolean;
  isDragging: boolean;
}> = ({ ship, index, onRemove, onDragStart, onDragOver, onDrop, isDragOver, isDragging }) => {
  const slotSpring = useSpring({
    transform: isDragging ? 'scale(0.9)' : 'scale(1)',
    opacity: isDragging ? 0.5 : 1,
    config: { tension: 300, friction: 20 }
  });

  return (
    <animated.div
      className={`formation-slot ${ship ? 'occupied' : ''} ${isDragOver ? 'drag-over' : ''}`}
      style={slotSpring}
      draggable={!!ship}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <span className="formation-slot-number">#{index + 1}</span>
      {ship ? (
        <>
          <div className={`ship-hull-${ship.type}`} style={{ width: 16, height: 24, margin: '4px auto', position: 'relative' }}>
            <div className="ship-flame" />
          </div>
          <span className="formation-slot-ship-name">{ship.name}</span>
          <span className="formation-slot-ship-hp">HP:{ship.stats.hp}/{ship.stats.maxHp}</span>
          <button className="formation-slot-remove" onClick={onRemove}>✕</button>
        </>
      ) : (
        <span className="formation-slot-empty">+</span>
      )}
    </animated.div>
  );
};

const FleetPage: React.FC = () => {
  const availableShips = useGameStore(s => s.availableShips);
  const formationSlots = useGameStore(s => s.formationSlots);
  const addShipToFormation = useGameStore(s => s.addShipToFormation);
  const removeShipFromFormation = useGameStore(s => s.removeShipFromFormation);
  const reorderFormation = useGameStore(s => s.reorderFormation);
  const waveNumber = useGameStore(s => s.waveNumber);

  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDragFromIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((toIndex: number) => {
    if (dragFromIndex !== null && dragFromIndex !== toIndex) {
      reorderFormation(dragFromIndex, toIndex);
    }
    setDragFromIndex(null);
    setDragOverIndex(null);
  }, [dragFromIndex, reorderFormation]);

  const handleDragEnd = useCallback(() => {
    setDragFromIndex(null);
    setDragOverIndex(null);
  }, []);

  return (
    <div className="fleet-page">
      <div>
        <div className="section-title">飞船建造</div>
        <div className="ship-cards">
          {SHIP_TYPES.map(type => (
            <ShipCard key={type} type={type} />
          ))}
        </div>
      </div>

      <div className="formation-section">
        <div className="section-title">编队配置 (当前波次: {waveNumber})</div>
        <div className="formation-slots" onDragEnd={handleDragEnd}>
          {formationSlots.map((ship, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div className="formation-connector" />}
              <FormationSlot
                ship={ship}
                index={i}
                onRemove={() => removeShipFromFormation(i)}
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={() => handleDrop(i)}
                isDragOver={dragOverIndex === i}
                isDragging={dragFromIndex === i}
              />
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="available-ships-section">
        <div className="section-title">可用飞船 ({availableShips.length})</div>
        {availableShips.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem', padding: 16 }}>
            暂无可用飞船，请先建造
          </div>
        ) : (
          <div className="available-ships-grid">
            {availableShips.map(ship => (
              <div
                key={ship.id}
                className="available-ship-chip"
                onClick={() => addShipToFormation(ship.id)}
              >
                <span className="available-ship-chip-name">{ship.name}</span>
                <span className="available-ship-chip-hp">
                  HP:{ship.stats.hp} ATK:{ship.stats.attack} SHD:{ship.stats.shield.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FleetPage;
