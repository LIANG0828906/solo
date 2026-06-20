import { useState, useRef, useCallback, useEffect } from 'react';
import GameEngine, { type GameEngineHandle } from './GameEngine';
import type { Faction, UnitType, UnitData } from './Unit';
import { UNIT_LABELS, UNIT_COLORS, UNIT_STATS, getHpColor } from './Unit';

type GamePhase = 'placing' | 'fighting' | 'paused' | 'ended';

interface StatsData {
  blueAlive: number;
  redAlive: number;
  totalKills: number;
  battleDuration: number;
  winner: Faction | null;
}

const UNIT_TYPES: UnitType[] = ['swordsman', 'archer', 'cavalry', 'mage'];

function hexColor(num: number): string {
  return '#' + num.toString(16).padStart(6, '0');
}

function RadarChart({ stats }: { stats: { label: string; value: number; max: number }[] }) {
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 55;
  const n = stats.length;

  const points = stats.map((s, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = radius * (s.value / s.max);
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      labelX: cx + Math.cos(angle) * (radius + 18),
      labelY: cy + Math.sin(angle) * (radius + 18),
      angle
    };
  });

  const polyPoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <svg width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
      {gridLevels.map((lv, i) => (
        <polygon
          key={i}
          points={stats.map((_, idx) => {
            const a = (Math.PI * 2 * idx) / n - Math.PI / 2;
            return `${cx + Math.cos(a) * radius * lv},${cy + Math.sin(a) * radius * lv}`;
          }).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />
      ))}
      {stats.map((_, i) => {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(a) * radius}
            y2={cy + Math.sin(a) * radius}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
          />
        );
      })}
      <polygon
        points={polyPoints}
        fill="rgba(66, 165, 245, 0.35)"
        stroke="#42a5f5"
        strokeWidth="2"
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#ffd54f" />
      ))}
      {points.map((p, i) => (
        <text
          key={`l${i}`}
          x={p.labelX}
          y={p.labelY}
          fill="#bdbdbd"
          fontSize="10"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {stats[i].label}
        </text>
      ))}
    </svg>
  );
}

function AttributePanel({ unit, onClose }: { unit: UnitData; onClose: () => void }) {
  const stats = [
    { label: '攻击', value: unit.stats.attack, max: 30 },
    { label: '防御', value: unit.stats.defense, max: 15 },
    { label: '攻速', value: unit.stats.attackSpeed * 6, max: 20 },
    { label: '移速', value: unit.stats.moveSpeed / 8, max: 20 },
    { label: '冷却', value: (12 - unit.stats.skillCooldown), max: 10 }
  ];

  return (
    <div className="attribute-panel" onClick={e => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div className="attr-title">
          {unit.faction === 'blue' ? '蓝方' : '红方'} · {UNIT_LABELS[unit.type]}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#9e9e9e',
            cursor: 'pointer',
            fontSize: 16,
            padding: '2px 6px'
          }}
        >
          ✕
        </button>
      </div>
      <RadarChart stats={stats} />
      <div style={{ marginTop: 8 }}>
        <div className="attr-row">
          <span className="attr-name">生命值</span>
          <span className="attr-val" style={{ color: getHpColor(unit.hp, unit.stats.maxHp) }}>
            {Math.max(0, Math.round(unit.hp))} / {unit.stats.maxHp}
          </span>
        </div>
        <div className="attr-row">
          <span className="attr-name">攻击力</span>
          <span className="attr-val">{unit.stats.attack}</span>
        </div>
        <div className="attr-row">
          <span className="attr-name">防御力</span>
          <span className="attr-val">{unit.stats.defense}</span>
        </div>
        <div className="attr-row">
          <span className="attr-name">攻击速度</span>
          <span className="attr-val">{unit.stats.attackSpeed.toFixed(1)}/秒</span>
        </div>
        <div className="attr-row">
          <span className="attr-name">移动速度</span>
          <span className="attr-val">{unit.stats.moveSpeed}</span>
        </div>
        <div className="attr-row">
          <span className="attr-name">攻击范围</span>
          <span className="attr-val">{unit.stats.range}</span>
        </div>
        {unit.stats.splashRadius > 0 && (
          <div className="attr-row">
            <span className="attr-name">溅射范围</span>
            <span className="attr-val">{unit.stats.splashRadius}</span>
          </div>
        )}
        {unit.stats.knockback > 0 && (
          <div className="attr-row">
            <span className="attr-name">击退力度</span>
            <span className="attr-val">{unit.stats.knockback}</span>
          </div>
        )}
        <div className="attr-row">
          <span className="attr-name">技能冷却</span>
          <span className="attr-val">{unit.stats.skillCooldown}秒</span>
        </div>
      </div>
    </div>
  );
}

function SidePanel({
  faction,
  selectedType,
  onSelect,
  disabled
}: {
  faction: Faction;
  selectedType: UnitType | null;
  onSelect: (t: UnitType) => void;
  disabled: boolean;
}) {
  const title = faction === 'blue' ? '蓝方阵营' : '红方阵营';
  return (
    <div className={`side-panel ${faction}`}>
      <div className={`panel-title ${faction}`}>{title}</div>
      {UNIT_TYPES.map(t => (
        <button
          key={t}
          className={`unit-type-btn ${selectedType === t ? 'selected' : ''}`}
          onClick={() => onSelect(t)}
          disabled={disabled}
          style={disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          <span
            className="unit-dot"
            style={{ background: hexColor(UNIT_COLORS[t]) }}
          />
          <span>{UNIT_LABELS[t]}</span>
        </button>
      ))}
    </div>
  );
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function App() {
  const engineRef = useRef<GameEngineHandle>(null);
  const arenaWrapperRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<GamePhase>('placing');
  const [blueSelected, setBlueSelected] = useState<UnitType | null>('swordsman');
  const [redSelected, setRedSelected] = useState<UnitType | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<UnitData | null>(null);
  const [stats, setStats] = useState<StatsData>({
    blueAlive: 0,
    redAlive: 0,
    totalKills: 0,
    battleDuration: 0,
    winner: null
  });
  const [showVictory, setShowVictory] = useState(false);
  const victoryTimerRef = useRef<number | null>(null);

  const handleStatsUpdate = useCallback((s: StatsData) => {
    setStats(s);
    if (s.winner && !showVictory && phase !== 'ended') {
      setPhase('ended');
      setShowVictory(true);
      if (victoryTimerRef.current) window.clearTimeout(victoryTimerRef.current);
      victoryTimerRef.current = window.setTimeout(() => {
        setShowVictory(false);
      }, 2000);
    }
  }, [showVictory, phase]);

  const handleUnitClick = useCallback((unit: UnitData | null) => {
    setSelectedUnit(unit);
  }, []);

  const handleArenaClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (phase !== 'placing') return;
    if (!engineRef.current || !arenaWrapperRef.current) return;

    const rect = arenaWrapperRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const clickX = e.clientX - rect.left - cx;
    const clickY = e.clientY - rect.top - cy;

    const gridSize = 50;
    const gx = Math.round(clickX / gridSize) * gridSize;
    const gy = Math.round(clickY / gridSize) * gridSize;

    let faction: Faction | null = null;
    let unitType: UnitType | null = null;

    if (gx < -10 && blueSelected) {
      faction = 'blue';
      unitType = blueSelected;
    } else if (gx > 10 && redSelected) {
      faction = 'red';
      unitType = redSelected;
    }

    if (faction && unitType) {
      engineRef.current.placeUnit(faction, unitType, gx, gy);
    }
  }, [phase, blueSelected, redSelected]);

  const handleStart = () => {
    if (!engineRef.current) return;
    if (phase === 'placing' || phase === 'paused' || phase === 'ended') {
      engineRef.current.start();
      setPhase('fighting');
    } else if (phase === 'fighting') {
      engineRef.current.pause();
      setPhase('paused');
    }
  };

  const handleReset = () => {
    if (!engineRef.current) return;
    engineRef.current.reset();
    setPhase('placing');
    setSelectedUnit(null);
    setShowVictory(false);
    setStats({ blueAlive: 0, redAlive: 0, totalKills: 0, battleDuration: 0, winner: null });
    if (victoryTimerRef.current) {
      window.clearTimeout(victoryTimerRef.current);
      victoryTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (victoryTimerRef.current) window.clearTimeout(victoryTimerRef.current);
    };
  }, []);

  const isPlacing = phase === 'placing';
  const canStart = (stats.blueAlive > 0 && stats.redAlive > 0) || phase === 'paused';

  const startBtnLabel = phase === 'fighting' ? '暂停' : phase === 'paused' ? '继续' : '开始战斗';

  return (
    <div className="app-container">
      <div className="stats-panel">
        <div className="stats-item">
          <span className="stats-label">蓝方存活</span>
          <span className="stats-value blue">{stats.blueAlive}</span>
        </div>
        <div className="stats-item">
          <span className="stats-label">红方存活</span>
          <span className="stats-value red">{stats.redAlive}</span>
        </div>
        <div className="stats-item">
          <span className="stats-label">总击杀</span>
          <span className="stats-value gold">{stats.totalKills}</span>
        </div>
        <div className="stats-item">
          <span className="stats-label">战斗时长</span>
          <span className="stats-value white">{formatDuration(stats.battleDuration)}</span>
        </div>
      </div>

      <div className="main-content">
        <SidePanel
          faction="blue"
          selectedType={blueSelected}
          onSelect={t => { setBlueSelected(t); setRedSelected(null); }}
          disabled={!isPlacing}
        />

        <div
          className="arena-wrapper"
          ref={arenaWrapperRef}
          onClick={handleArenaClick}
          style={{ cursor: isPlacing ? 'crosshair' : 'default' }}
        >
          <GameEngine
            ref={engineRef}
            phase={phase}
            onStatsUpdate={handleStatsUpdate}
            onUnitClick={handleUnitClick}
            selectedUnitId={selectedUnit?.id ?? null}
          />
          {isPlacing && (
            <div className="hint-text">
              选择兵种后点击竞技场左（蓝方）/右（红方）区域放置单位 · 点击单位查看属性
            </div>
          )}
        </div>

        <SidePanel
          faction="red"
          selectedType={redSelected}
          onSelect={t => { setRedSelected(t); setBlueSelected(null); }}
          disabled={!isPlacing}
        />

        {selectedUnit && (
          <AttributePanel unit={selectedUnit} onClose={() => setSelectedUnit(null)} />
        )}
      </div>

      <div className="control-bar">
        <button
          className="ctrl-btn"
          onClick={handleStart}
          disabled={!canStart && phase !== 'paused'}
        >
          {startBtnLabel}
        </button>
        <button className="ctrl-btn secondary" onClick={handleReset}>
          重置
        </button>
      </div>

      {showVictory && stats.winner && (
        <div className="victory-overlay">
          <div className={`victory-text ${stats.winner}`}>
            {stats.winner === 'blue' ? '蓝方胜利！' : '红方胜利！'}
          </div>
        </div>
      )}
    </div>
  );
}
