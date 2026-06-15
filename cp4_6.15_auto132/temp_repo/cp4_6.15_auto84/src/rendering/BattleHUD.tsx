import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameEngine, GameEvents } from '../game/GameEngine';
import { UnitData, Faction } from '../game/UnitData';
import { eventBus } from './EventBus';

interface BattleHUDProps {
  engine: GameEngine;
}

interface DamageNumber {
  id: number;
  value: number;
  x: number;
  y: number;
}

const SHIP_NAMES: Record<string, string> = {
  frigate: '护卫舰',
  cruiser: '巡洋舰',
  battleship: '战列舰',
};

const KEYFRAMES = `
@keyframes turnOverlayIn {
  0% { opacity: 0; transform: scale(3); }
  30% { opacity: 1; transform: scale(1); }
  70% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1); }
}
@keyframes slideUp {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@keyframes floatUp {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-80px); }
}
@keyframes breathe {
  0%, 100% { box-shadow: 0 0 15px rgba(0, 212, 255, 0.4); transform: scale(1); }
  50% { box-shadow: 0 0 30px rgba(0, 212, 255, 0.8); transform: scale(1.05); }
}
@keyframes nebulaRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes particleDrift {
  0% { opacity: 1; transform: translate(0, 0) scale(1); }
  100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(0.2); }
}
@keyframes victoryTextIn {
  0% { opacity: 0; transform: scale(2); }
  60% { opacity: 1; transform: scale(1); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes barPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
`;

let damageIdCounter = 0;

function HealthBar({
  current,
  max,
  gradient,
  height = 8,
}: {
  current: number;
  max: number;
  gradient: string;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <div
      style={{
        width: '100%',
        height,
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: gradient,
          borderRadius: 4,
          transition: 'width 0.4s ease',
        }}
      />
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: height < 10 ? 7 : 9,
          fontFamily: 'Orbitron, monospace',
          color: '#fff',
          textShadow: '0 0 3px rgba(0,0,0,0.8)',
          lineHeight: 1,
        }}
      >
        {current}/{max}
      </span>
    </div>
  );
}

function FleetPanel({
  title,
  units,
  faction,
  selectedUnitId,
}: {
  title: string;
  units: UnitData[];
  faction: Faction;
  selectedUnitId: string | null;
}) {
  const isPlayer = faction === 'player';
  const accent = isPlayer ? '#00d4ff' : '#ff4d2a';
  const glowShadow = isPlayer
    ? '0 0 12px rgba(0,212,255,0.3)'
    : '0 0 12px rgba(255,77,42,0.3)';

  return (
    <div
      style={{
        position: 'absolute',
        top: 60,
        [isPlayer ? 'left' : 'right']: 12,
        width: 220,
        background: 'rgba(10,14,23,0.85)',
        border: `1px solid ${accent}33`,
        borderRadius: 8,
        padding: '12px 10px',
        boxShadow: glowShadow,
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: 14,
          color: accent,
          textShadow: `0 0 10px ${accent}`,
          marginBottom: 10,
          textAlign: 'center',
          letterSpacing: 2,
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {units.map((u) => {
          const destroyed = u.armor <= 0 || u.isDestroyed;
          const selected = u.id === selectedUnitId;
          return (
            <div
              key={u.id}
              style={{
                padding: '6px 8px',
                borderRadius: 6,
                background: selected
                  ? `${accent}18`
                  : 'rgba(255,255,255,0.03)',
                border: selected ? `1px solid ${accent}66` : '1px solid transparent',
                opacity: destroyed ? 0.35 : 1,
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  fontFamily: 'Orbitron, monospace',
                  fontSize: 11,
                  color: destroyed ? '#666' : '#ddd',
                  marginBottom: 4,
                }}
              >
                {SHIP_NAMES[u.type] ?? u.type}
              </div>
              <div style={{ marginBottom: 3 }}>
                <HealthBar
                  current={Math.max(0, u.shield)}
                  max={u.maxShield}
                  gradient="linear-gradient(90deg, #004466, #00d4ff)"
                  height={8}
                />
              </div>
              <HealthBar
                current={Math.max(0, u.armor)}
                max={u.maxArmor}
                gradient="linear-gradient(90deg, #333, #888)"
                height={6}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SelectedUnitPanel({ unit }: { unit: UnitData | null }) {
  if (!unit) return null;

  const accent = unit.faction === 'player' ? '#00d4ff' : '#ff4d2a';

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 420,
        background: 'rgba(10,14,23,0.92)',
        border: `1px solid ${accent}44`,
        borderRadius: 10,
        padding: '14px 18px',
        boxShadow: `0 0 20px ${accent}22, 0 -4px 30px rgba(0,0,0,0.5)`,
        backdropFilter: 'blur(8px)',
        animation: 'slideUp 0.35s ease-out forwards',
      }}
    >
      <div
        style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: 16,
          color: accent,
          textShadow: `0 0 12px ${accent}`,
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: `${accent}22`,
            border: `2px solid ${accent}`,
            boxShadow: `0 0 8px ${accent}66`,
            textAlign: 'center',
            lineHeight: '24px',
            fontSize: 14,
          }}
        >
          ◆
        </span>
        {SHIP_NAMES[unit.type] ?? unit.type}
      </div>

      <div style={{ display: 'flex', gap: 20, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: '#00d4ff', fontFamily: 'Orbitron, monospace', marginBottom: 3 }}>
            护盾
          </div>
          <HealthBar
            current={Math.max(0, unit.shield)}
            max={unit.maxShield}
            gradient="linear-gradient(90deg, #004466, #00d4ff)"
            height={12}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: '#999', fontFamily: 'Orbitron, monospace', marginBottom: 3 }}>
            装甲
          </div>
          <HealthBar
            current={Math.max(0, unit.armor)}
            max={unit.maxArmor}
            gradient="linear-gradient(90deg, #333, #999)"
            height={12}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: '#ff8800', fontFamily: 'Orbitron, monospace', marginBottom: 4, letterSpacing: 1 }}>
            武器
          </div>
          {unit.weapons.map((w, i) => (
            <div
              key={i}
              style={{
                fontSize: 10,
                color: '#ccc',
                fontFamily: 'Orbitron, monospace',
                marginBottom: 2,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>{w.name}</span>
              <span style={{ color: '#ff8800' }}>
                {w.damage} / {w.range}
              </span>
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: '#aa66ff', fontFamily: 'Orbitron, monospace', marginBottom: 4, letterSpacing: 1 }}>
            技能
          </div>
          {unit.skills.map((s, i) => (
            <div key={i} style={{ marginBottom: 2 }}>
              <div
                style={{
                  fontSize: 10,
                  fontFamily: 'Orbitron, monospace',
                  color: s.currentCooldown > 0 ? '#666' : '#aa66ff',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>{s.name}</span>
                <span>
                  {s.currentCooldown > 0 ? `CD:${s.currentCooldown}` : '就绪'}
                </span>
              </div>
              <div style={{ fontSize: 8, color: '#777' }}>{s.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 6 }}>
        <span
          style={{
            fontSize: 10,
            fontFamily: 'Orbitron, monospace',
            color: '#00d4ff',
            background: 'rgba(0,212,255,0.1)',
            padding: '3px 12px',
            borderRadius: 4,
            border: '1px solid rgba(0,212,255,0.3)',
          }}
        >
          移动
        </span>
        <span
          style={{
            fontSize: 10,
            fontFamily: 'Orbitron, monospace',
            color: '#ff4d2a',
            background: 'rgba(255,77,42,0.1)',
            padding: '3px 12px',
            borderRadius: 4,
            border: '1px solid rgba(255,77,42,0.3)',
          }}
        >
          攻击
        </span>
      </div>
    </div>
  );
}

function TurnTransitionOverlay({
  faction,
  visible,
  opacity,
}: {
  faction: Faction;
  visible: boolean;
  opacity: number;
}) {
  if (!visible) return null;
  const isPlayer = faction === 'player';
  const color = isPlayer ? '#00d4ff' : '#ff4d2a';
  const label = isPlayer ? '我方回合' : '敌方回合';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `rgba(0,0,0,${0.5 * opacity})`,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: 56,
          color,
          textShadow: `0 0 30px ${color}, 0 0 60px ${color}88`,
          animation: 'turnOverlayIn 1.5s ease-out forwards',
          letterSpacing: 6,
          opacity,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function VictoryPanel({ winner }: { winner: 'player' | 'enemy' }) {
  const isVictory = winner === 'player';
  const color = isVictory ? '#00d4ff' : '#ff4d2a';
  const label = isVictory ? '胜利!' : '战败';

  const particles = Array.from({ length: 30 }, (_, i) => {
    const angle = (i / 30) * Math.PI * 2;
    const dist = 60 + Math.random() * 120;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const size = 2 + Math.random() * 5;
    const delay = Math.random() * 0.8;
    const duration = 1.2 + Math.random() * 1.5;
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 ${size * 2}px ${color}`,
          left: '50%',
          top: '45%',
          '--dx': `${dx}px`,
          '--dy': `${dy}px`,
          animation: `particleDrift ${duration}s ease-out ${delay}s forwards`,
          opacity: 0.8,
        } as React.CSSProperties}
      />
    );
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: '-50%',
          background: `radial-gradient(ellipse at center, ${color}15 0%, transparent 60%)`,
          animation: 'nebulaRotate 20s linear infinite',
        }}
      />
      {particles}
      <div style={{ position: 'relative', textAlign: 'center', zIndex: 1 }}>
        <div
          style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: 72,
            color,
            textShadow: `0 0 40px ${color}, 0 0 80px ${color}88`,
            animation: 'victoryTextIn 1.2s ease-out forwards',
            letterSpacing: 8,
            marginBottom: 40,
          }}
        >
          {label}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            fontFamily: 'Orbitron, monospace',
            fontSize: 14,
            color: '#fff',
            background: `${color}22`,
            border: `1px solid ${color}66`,
            borderRadius: 6,
            padding: '10px 32px',
            cursor: 'pointer',
            textShadow: `0 0 8px ${color}`,
            boxShadow: `0 0 20px ${color}33`,
            transition: 'all 0.3s ease',
            letterSpacing: 2,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${color}44`;
            e.currentTarget.style.boxShadow = `0 0 30px ${color}55`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `${color}22`;
            e.currentTarget.style.boxShadow = `0 0 20px ${color}33`;
          }}
        >
          重新开始
        </button>
      </div>
    </div>
  );
}

export default function BattleHUD({ engine }: BattleHUDProps) {
  const [turn, setTurn] = useState(engine.currentTurn);
  const [faction, setFaction] = useState<Faction>(engine.currentFaction);
  const [units, setUnits] = useState<UnitData[]>(Array.from(engine.units.values()));
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(engine.selectedUnitId);
  const [showTurnTransition, setShowTurnTransition] = useState(false);
  const [transitionFaction, setTransitionFaction] = useState<Faction>('player');
  const [turnTextOpacity, setTurnTextOpacity] = useState(0);
  const [showVictoryPanel, setShowVictoryPanel] = useState(false);
  const [winner, setWinner] = useState<'player' | 'enemy'>('player');
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);

  const rafRef = useRef<number | null>(null);
  const turnStartRef = useRef<number>(0);

  const refreshUnits = useCallback(() => {
    setUnits(Array.from(engine.units.values()));
  }, [engine]);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = KEYFRAMES;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const initial = engine.getState();
    setTurn(initial.currentTurn);
    setFaction(initial.currentFaction);
    setUnits(initial.units);
    setSelectedUnitId(initial.selectedUnitId);

    const onTurnChanged = (payload: GameEvents['turn-changed']) => {
      setTurn(payload.turn);
      setFaction(payload.faction);
      setTransitionFaction(payload.faction);
      setShowTurnTransition(true);
      turnStartRef.current = performance.now();

      const tick = () => {
        const elapsed = performance.now() - turnStartRef.current;
        let opacity = 0;
        if (elapsed < 400) {
          opacity = elapsed / 400;
        } else if (elapsed < 900) {
          opacity = 1;
        } else if (elapsed < 1500) {
          opacity = 1 - (elapsed - 900) / 600;
        } else {
          opacity = 0;
        }
        setTurnTextOpacity(Math.max(0, Math.min(1, opacity)));
        if (elapsed < 1500) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };
      rafRef.current = requestAnimationFrame(tick);

      setTimeout(() => {
        setShowTurnTransition(false);
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      }, 1500);
      refreshUnits();
    };

    const onUnitSelected = (payload: GameEvents['unit-selected']) => {
      setSelectedUnitId(payload.unitId);
      refreshUnits();
    };

    const onUnitAttacked = (payload: GameEvents['unit-attacked']) => {
      refreshUnits();
      const id = ++damageIdCounter;
      const newDmg: DamageNumber = {
        id,
        value: payload.damage,
        x: 20 + Math.random() * 60,
        y: 30 + Math.random() * 40,
      };
      setDamageNumbers((prev) => [...prev, newDmg]);
      setTimeout(() => {
        setDamageNumbers((prev) => prev.filter((d) => d.id !== id));
      }, 1000);
    };

    const onUnitDestroyed = (_payload: GameEvents['unit-destroyed']) => {
      refreshUnits();
    };

    const onUnitMoved = (_payload: GameEvents['unit-moved']) => {
      refreshUnits();
    };

    const onGameOver = (payload: GameEvents['game-over']) => {
      setWinner(payload.winner);
      setShowVictoryPanel(true);
    };

    eventBus.on('turn-changed', onTurnChanged);
    eventBus.on('unit-selected', onUnitSelected);
    eventBus.on('unit-attacked', onUnitAttacked);
    eventBus.on('unit-destroyed', onUnitDestroyed);
    eventBus.on('unit-moved', onUnitMoved);
    eventBus.on('game-over', onGameOver);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      eventBus.off('turn-changed', onTurnChanged);
      eventBus.off('unit-selected', onUnitSelected);
      eventBus.off('unit-attacked', onUnitAttacked);
      eventBus.off('unit-destroyed', onUnitDestroyed);
      eventBus.off('unit-moved', onUnitMoved);
      eventBus.off('game-over', onGameOver);
    };
  }, [refreshUnits, engine]);

  const playerUnits = units.filter((u) => u.faction === 'player');
  const enemyUnits = units.filter((u) => u.faction === 'enemy');
  const selectedUnit = selectedUnitId
    ? units.find((u) => u.id === selectedUnitId) ?? null
    : null;
  const isPlayerTurn = faction === 'player';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        fontFamily: 'Orbitron, monospace',
        zIndex: 50,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          background: 'rgba(10,14,23,0.85)',
          padding: '8px 24px',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(6px)',
        }}
      >
        <span
          style={{
            fontSize: 14,
            color: '#aaa',
            letterSpacing: 1,
          }}
        >
          回合 {turn}
        </span>
        <span
          style={{
            fontSize: 14,
            color: isPlayerTurn ? '#00d4ff' : '#ff4d2a',
            textShadow: isPlayerTurn
              ? '0 0 12px rgba(0,212,255,0.6)'
              : '0 0 12px rgba(255,77,42,0.6)',
            letterSpacing: 2,
          }}
        >
          {isPlayerTurn ? '我方回合' : '敌方回合'}
        </span>
      </div>

      <FleetPanel
        title="我方舰队"
        units={playerUnits}
        faction="player"
        selectedUnitId={selectedUnitId}
      />

      <FleetPanel
        title="敌方舰队"
        units={enemyUnits}
        faction="enemy"
        selectedUnitId={selectedUnitId}
      />

      {selectedUnit && <SelectedUnitPanel unit={selectedUnit} />}

      {isPlayerTurn && !showVictoryPanel && (
        <button
          onClick={() => engine.endTurn()}
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            fontFamily: 'Orbitron, monospace',
            fontSize: 13,
            color: '#00d4ff',
            background: 'rgba(0,212,255,0.08)',
            border: '1px solid rgba(0,212,255,0.4)',
            borderRadius: 8,
            padding: '10px 24px',
            cursor: 'pointer',
            textShadow: '0 0 10px rgba(0,212,255,0.6)',
            letterSpacing: 2,
            animation: 'breathe 2.5s ease-in-out infinite',
            transition: 'all 0.3s ease',
            pointerEvents: 'auto',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0,212,255,0.2)';
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0,212,255,0.08)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          结束回合
        </button>
      )}

      {damageNumbers.map((d) => (
        <div
          key={d.id}
          style={{
            position: 'absolute',
            left: `${d.x}%`,
            top: `${d.y}%`,
            fontFamily: 'Orbitron, monospace',
            fontSize: 28,
            fontWeight: 700,
            color: '#ff4d2a',
            textShadow: '0 0 12px rgba(255,77,42,0.8), 0 0 24px rgba(255,77,42,0.4)',
            animation: 'floatUp 1s ease-out forwards',
            pointerEvents: 'none',
          }}
        >
          -{d.value}
        </div>
      ))}

      <TurnTransitionOverlay
        faction={transitionFaction}
        visible={showTurnTransition}
        opacity={turnTextOpacity}
      />

      {showVictoryPanel && <VictoryPanel winner={winner} />}
    </div>
  );
}
