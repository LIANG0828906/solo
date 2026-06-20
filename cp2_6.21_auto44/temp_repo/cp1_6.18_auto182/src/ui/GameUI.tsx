import { useEffect, useState, useMemo, useCallback } from 'react';
import { useGameStore } from '../stores/GameStore';
import type { Unit, HexCoord } from '../types';

function ClassIcon({ heroClass, size = 14 }: { heroClass: string; size?: number }) {
  const s = size;
  if (heroClass === 'warrior') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
        <path d="M13 19l6-6" />
        <path d="M16 16l4 4" />
        <path d="M19 21l2-2" />
      </svg>
    );
  }
  if (heroClass === 'mage') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 18l-4 4" />
        <path d="M17 3l4 4-10 10H7v-4L17 3z" />
        <circle cx="15" cy="5" r="1.2" fill="white" />
      </svg>
    );
  }
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20l8-16 8 16" />
      <path d="M4 20l16 0" />
      <path d="M6 16l12 0" />
    </svg>
  );
}

function HpBar({ hp, maxHp, width = 48 }: { hp: number; maxHp: number; width?: number }) {
  const ratio = Math.max(0, hp / maxHp);
  const color = ratio > 0.5 ? '#4CAF50' : ratio > 0.25 ? '#FFC107' : '#F44336';
  return (
    <div style={{ width, height: 5, background: '#333', borderRadius: 3, overflow: 'hidden', border: '1px solid #222' }}>
      <div style={{
        width: `${ratio * 100}%`,
        height: '100%',
        background: color,
        transition: 'width 0.3s ease',
      }} />
    </div>
  );
}

export function GameUI() {
  const {
    heroes, enemies, turn, currentTeam, phase,
    selectedHeroId, selectedSkill, reachableCells,
    attackableCells, attackableEnemyIds, animations,
    corpses, aiThinkingEnemyId, gameResult,
    gridEngine, selectHero, moveHero, selectSkill,
    attackEnemy, endPlayerTurn, resetGame, cleanupAnimations,
  } = useGameStore();

  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      cleanupAnimations();
      setTick(t => t + 1);
    }, 50);
    return () => clearInterval(interval);
  }, [cleanupAnimations]);

  const hexSize = gridEngine.getHexSize();
  const allCoords = useMemo(() => gridEngine.getAllCoords(), [gridEngine]);

  const mapPixelOffset = useMemo(() => {
    const last = gridEngine.hexToPixel({ q: gridEngine.getGridWidth() - 1, r: gridEngine.getGridHeight() - 1 });
    const first = gridEngine.hexToPixel({ q: 0, r: 0 });
    const width = Math.abs(last.x - first.x) + hexSize * 2.5;
    const height = Math.abs(last.y - first.y) + hexSize * 2.5;
    return { offsetX: hexSize * 1.3, offsetY: hexSize * 1.6, width, height };
  }, [gridEngine, hexSize]);

  const isReachable = useCallback((c: HexCoord) => {
    const k = gridEngine.hexKey(c);
    return reachableCells.some(rc => gridEngine.hexKey(rc) === k);
  }, [gridEngine, reachableCells]);

  const isAttackable = useCallback((c: HexCoord) => {
    const k = gridEngine.hexKey(c);
    return attackableCells.some(ac => gridEngine.hexKey(ac) === k);
  }, [gridEngine, attackableCells]);

  const isSelected = useCallback((c: HexCoord) => {
    if (!selectedHeroId) return false;
    const hero = heroes.find(h => h.id === selectedHeroId);
    if (!hero) return false;
    return gridEngine.hexKey(hero.position) === gridEngine.hexKey(c);
  }, [gridEngine, selectedHeroId, heroes]);

  const unitAtCell = useCallback((c: HexCoord): Unit | null => {
    const k = gridEngine.hexKey(c);
    for (const u of [...heroes, ...enemies]) {
      if (!u.isDead && gridEngine.hexKey(u.position) === k) return u;
    }
    return null;
  }, [gridEngine, heroes, enemies]);

  const corpseAtCell = useCallback((c: HexCoord) => {
    const k = gridEngine.hexKey(c);
    return corpses.some(cp => gridEngine.hexKey(cp) === k);
  }, [gridEngine, corpses]);

  const handleHexClick = (c: HexCoord) => {
    if (currentTeam !== 'player' || phase === 'animating' || gameResult) return;

    const unit = unitAtCell(c);
    if (unit) {
      if (unit.team === 'player') {
        selectHero(unit.id);
        return;
      }
      if (unit.team === 'enemy' && selectedHeroId && attackableEnemyIds.has(unit.id)) {
        attackEnemy(unit.id);
        return;
      }
    }

    if (selectedHeroId && phase === 'move' && isReachable(c)) {
      moveHero(c);
      return;
    }

    selectHero(null);
  };

  const getFlashState = (unitId: string): boolean => {
    const now = Date.now();
    for (const a of animations) {
      if (a.type === 'flash' && a.unitId === unitId) {
        const age = now - a.timestamp;
        if (age >= 0 && age < a.duration) {
          return Math.floor(age / 100) % 2 === 0;
        }
      }
    }
    return false;
  };

  const getFadeOpacity = (unitId: string): number => {
    const now = Date.now();
    for (const a of animations) {
      if (a.type === 'fade' && a.unitId === unitId) {
        const age = now - a.timestamp;
        if (age >= 0 && age < a.duration) {
          return 1 - age / a.duration;
        }
        if (age >= a.duration) return 0;
      }
    }
    return 1;
  };

  const getThinkingEnemy = (unitId: string): boolean => {
    return aiThinkingEnemyId === unitId;
  };

  const damagePopups = useMemo(() => {
    const now = Date.now();
    return animations
      .filter(a => a.type === 'damagePopup' && a.position && a.damage !== undefined)
      .map(a => {
        const age = now - a.timestamp;
        const progress = Math.min(1, age / a.duration);
        return {
          ...a,
          progress,
          opacity: 1 - progress,
          yOffset: -progress * 40,
        };
      });
  }, [animations, tick]);

  const selectedHero = heroes.find(h => h.id === selectedHeroId) || null;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      background: '#1A1A2E',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#2A2A3E',
        position: 'relative',
        overflow: 'auto',
      }}>
        <svg
          width={mapPixelOffset.width + 40}
          height={mapPixelOffset.height + 40}
          style={{ display: 'block' }}
        >
          <defs>
            {['warrior', 'mage', 'archer'].map(cls => {
              const color = cls === 'warrior' ? '#FF6B6B' : cls === 'mage' ? '#4ECDC4' : '#FFD93D';
              return (
                <filter key={cls} id={`glow-${cls}`} x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                  <feColorMatrix type="matrix" values={
                    `0 0 0 0 ${parseInt(color.slice(1,3),16)/255}  0 0 0 0 ${parseInt(color.slice(3,5),16)/255}  0 0 0 0 ${parseInt(color.slice(5,7),16)/255}  0 0 0 1 0`
                  } />
                </filter>
              );
            })}
          </defs>

          {allCoords.map(c => {
            const { x, y } = gridEngine.hexToPixel(c);
            const px = x + mapPixelOffset.offsetX;
            const py = y + mapPixelOffset.offsetY;
            const points = gridEngine.getHexCornerPoints(px, py);
            const sel = isSelected(c);
            const reach = isReachable(c);
            const attack = isAttackable(c);
            const corpse = corpseAtCell(c);
            const u = unitAtCell(c);

            let fill = 'transparent';
            let fillOpacity = 0;

            if (sel) { fill = '#FFD54F'; fillOpacity = 0.35; }
            else if (attack) { fill = '#E57373'; fillOpacity = 0.3; }
            else if (reach) { fill = '#4FC3F7'; fillOpacity = 0.3; }

            return (
              <g key={`hex-${c.q}-${c.r}`} style={{ cursor: 'pointer' }} onClick={() => handleHexClick(c)}>
                <polygon
                  points={points}
                  fill="#2A2A3E"
                  stroke="#4A4A6E"
                  strokeWidth={1}
                  style={{ transition: 'fill 0.3s ease, fill-opacity 0.3s ease' }}
                />
                {(sel || reach || attack) && (
                  <polygon
                    points={points}
                    fill={fill}
                    fillOpacity={fillOpacity}
                    style={{
                      animation: 'fadeInHex 0.3s ease forwards',
                      pointerEvents: 'none',
                    }}
                  />
                )}
                {corpse && (
                  <circle cx={px} cy={py} r={10} fill="#555" fillOpacity={0.4} stroke="#777" strokeWidth={1} pointerEvents="none" />
                )}
              </g>
            );
          })}

          {[...heroes, ...enemies].map(u => {
            if (u.isDead && getFadeOpacity(u.id) <= 0) return null;
            const { x, y } = gridEngine.hexToPixel(u.position);
            const px = x + mapPixelOffset.offsetX;
            const py = y + mapPixelOffset.offsetY;
            const isSelected = u.team === 'player' && u.id === selectedHeroId;
            const flashing = getFlashState(u.id);
            const opacity = getFadeOpacity(u.id);
            const thinking = getThinkingEnemy(u.id);

            const fillColor = flashing ? '#FF0000' : u.color;

            return (
              <g
                key={u.id}
                style={{
                  cursor: u.team === 'player' ? 'pointer' : 'default',
                  opacity,
                  transition: 'opacity 0.3s ease',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleHexClick(u.position);
                }}
              >
                {thinking && (
                  <polygon
                    points={gridEngine.getHexCornerPoints(px, py)}
                    fill="#E57373"
                    fillOpacity={0.2}
                    style={{ animation: 'thinkBlink 0.5s ease-in-out infinite' }}
                  />
                )}
                <circle
                  cx={px}
                  cy={py}
                  r={12}
                  fill={fillColor}
                  stroke={u.team === 'enemy' ? '#2C3E50' : '#FFF'}
                  strokeWidth={2}
                  filter={isSelected ? `url(#glow-${u.heroClass})` : undefined}
                  style={{ transition: 'fill 0.1s ease' }}
                />
                <g transform={`translate(${px - 7}, ${py - 7})`}>
                  <ClassIcon heroClass={u.heroClass} size={14} />
                </g>
                <g transform={`translate(${px - 24}, ${py - 22})`}>
                  <HpBar hp={u.hp} maxHp={u.maxHp} width={48} />
                </g>
              </g>
            );
          })}

          {damagePopups.map((a, i) => {
            if (!a.position || a.damage === undefined) return null;
            const { x, y } = gridEngine.hexToPixel(a.position);
            const px = x + mapPixelOffset.offsetX;
            const py = y + mapPixelOffset.offsetY + a.yOffset;
            const fontSize = a.isCrit ? 24 : 18;

            return (
              <g key={`dp-${i}-${a.timestamp}`} style={{ pointerEvents: 'none' }}>
                {a.isCrit && (
                  <rect
                    x={px - 30}
                    y={py - fontSize - 2}
                    width={60}
                    height={fontSize + 8}
                    rx={4}
                    fill="#FFD700"
                    fillOpacity={a.opacity * 0.6}
                  />
                )}
                <text
                  x={px}
                  y={py}
                  fill="#FFFFFF"
                  fontSize={fontSize}
                  fontWeight="bold"
                  textAnchor="middle"
                  opacity={a.opacity}
                  style={{
                    textShadow: '2px 2px 4px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)',
                  }}
                >
                  -{a.damage}{a.isCrit ? '!' : ''}
                </text>
              </g>
            );
          })}
        </svg>

        <style>{`
          @keyframes fadeInHex {
            from { fill-opacity: 0; }
            to { fill-opacity: var(--target-opacity, 0.3); }
          }
          @keyframes thinkBlink {
            0%, 100% { fill-opacity: 0.1; }
            50% { fill-opacity: 0.5; }
          }
        `}</style>
      </div>

      <div style={{
        width: 280,
        background: '#1E1E2E',
        borderLeft: '1px solid #3A3A5E',
        borderRadius: '12px 0 0 12px',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        color: '#fff',
        gap: 16,
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>回合 {turn}</div>
          <div style={{
            padding: '6px 14px',
            borderRadius: 8,
            fontWeight: 'bold',
            fontSize: 14,
            background: currentTeam === 'player' ? 'rgba(79, 195, 247, 0.2)' : 'rgba(229, 115, 115, 0.2)',
            color: currentTeam === 'player' ? '#4FC3F7' : '#E57373',
            border: `1px solid ${currentTeam === 'player' ? '#4FC3F7' : '#E57373'}`,
            transition: 'all 0.3s ease',
          }}>
            {currentTeam === 'player' ? '玩家回合' : '敌人回合'}
          </div>
        </div>

        {currentTeam === 'player' && phase !== 'animating' && (
          <button
            onClick={endPlayerTurn}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              background: '#4FC3F7',
              color: '#fff',
              border: 'none',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: 14,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#29B6F6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#4FC3F7'; }}
          >
            结束回合
          </button>
        )}

        {selectedHero && (
          <div style={{
            background: '#262640',
            borderRadius: 12,
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: selectedHero.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #fff',
              }}>
                <ClassIcon heroClass={selectedHero.heroClass} size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: 16 }}>{selectedHero.name}</div>
                <div style={{ fontSize: 12, color: '#aaa' }}>
                  HP {selectedHero.hp}/{selectedHero.maxHp}
                </div>
              </div>
            </div>

            <HpBar hp={selectedHero.hp} maxHp={selectedHero.maxHp} width={232} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
              <div>攻击: <span style={{ color: '#FFD93D' }}>{selectedHero.atk}</span></div>
              <div>防御: <span style={{ color: '#4FC3F7' }}>{selectedHero.def}</span></div>
              <div>移动: <span style={{ color: '#A5D6A7' }}>{selectedHero.move}</span></div>
              <div>暴击: <span style={{ color: '#FF8A65' }}>{Math.round(selectedHero.critChance * 100)}%</span></div>
            </div>

            {!selectedHero.hasActed && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 13, color: '#aaa', marginTop: 4 }}>技能：</div>
                {selectedHero.skills.map(skill => {
                  const onCooldown = skill.currentCooldown > 0;
                  const isSelected = selectedSkill?.id === skill.id;
                  return (
                    <button
                      key={skill.id}
                      disabled={onCooldown || phase !== 'attack' && phase !== 'move' && phase !== 'select'}
                      onClick={() => selectSkill(isSelected ? null : skill)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: isSelected ? '2px solid #FFD54F' : '1px solid #3A3A5E',
                        background: onCooldown ? '#2a2a3a' : (isSelected ? 'rgba(255, 213, 79, 0.15)' : '#2E2E48'),
                        color: onCooldown ? '#666' : '#fff',
                        cursor: onCooldown ? 'not-allowed' : 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                        <span>{skill.name}</span>
                        {onCooldown && <span style={{ color: '#E57373', fontSize: 11 }}>CD:{skill.currentCooldown}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: '#999', marginTop: 3, lineHeight: 1.4 }}>
                        {skill.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedHero.hasActed && (
              <div style={{ fontSize: 12, color: '#888', textAlign: 'center' }}>
                本回合已行动
              </div>
            )}
          </div>
        )}

        {!selectedHero && currentTeam === 'player' && (
          <div style={{
            background: '#262640',
            borderRadius: 12,
            padding: 16,
            color: '#aaa',
            fontSize: 13,
            lineHeight: 1.6,
          }}>
            点击己方英雄开始行动。<br />
            蓝色区域：可移动范围<br />
            红色区域：可攻击范围
          </div>
        )}

        <div style={{ flex: 1, minHeight: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#E57373' }}>
            敌方单位 ({enemies.filter(e => !e.isDead).length}/{enemies.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {enemies.map(enemy => {
              if (enemy.isDead) {
                return (
                  <div key={enemy.id} style={{
                    padding: 8, borderRadius: 8, background: '#262640',
                    opacity: 0.4, display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: '#555',
                    }} />
                    <div style={{ fontSize: 12, color: '#888', textDecoration: 'line-through' }}>
                      {enemy.name}
                    </div>
                  </div>
                );
              }
              return (
                <div
                  key={enemy.id}
                  style={{
                    padding: 8, borderRadius: 8,
                    background: selectedHeroId && attackableEnemyIds.has(enemy.id)
                      ? 'rgba(229, 115, 115, 0.2)'
                      : '#262640',
                    border: selectedHeroId && attackableEnemyIds.has(enemy.id)
                      ? '1px solid #E57373'
                      : '1px solid transparent',
                    display: 'flex', alignItems: 'center', gap: 8,
                    cursor: selectedHeroId && attackableEnemyIds.has(enemy.id) ? 'pointer' : 'default',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => {
                    if (selectedHeroId && attackableEnemyIds.has(enemy.id)) {
                      attackEnemy(enemy.id);
                    }
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: enemy.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid #2C3E50',
                  }}>
                    <ClassIcon heroClass={enemy.heroClass} size={14} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>{enemy.name}</div>
                    <HpBar hp={enemy.hp} maxHp={enemy.maxHp} width={160} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {gameResult && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{
            padding: '60px 80px',
            borderRadius: 16,
            textAlign: 'center',
            background: gameResult === 'victory'
              ? 'radial-gradient(circle, rgba(255,213,79,0.3) 0%, rgba(26,26,46,0.95) 70%)'
              : 'radial-gradient(circle, rgba(229,115,115,0.3) 0%, rgba(26,26,46,0.95) 70%)',
            boxShadow: gameResult === 'victory'
              ? '0 0 60px rgba(255,213,79,0.5)'
              : '0 0 60px rgba(229,115,115,0.5)',
            animation: 'resultPop 0.5s ease forwards',
          }}>
            <div style={{
              fontSize: 36, fontWeight: 'bold', marginBottom: 30,
              color: gameResult === 'victory' ? '#FFD54F' : '#fff',
              textShadow: gameResult === 'victory'
                ? '0 0 20px rgba(255,213,79,0.8)'
                : '0 0 20px rgba(229,115,115,0.8)',
            }}>
              {gameResult === 'victory' ? '胜利！' : '失败...'}
            </div>
            <button
              onClick={resetGame}
              style={{
                padding: '14px 40px',
                borderRadius: 12,
                background: '#4FC3F7',
                color: '#fff',
                border: 'none',
                fontSize: 16,
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#29B6F6'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#4FC3F7'; }}
            >
              再来一局
            </button>
          </div>
          <style>{`
            @keyframes resultPop {
              0% { transform: scale(1.2); opacity: 0; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
