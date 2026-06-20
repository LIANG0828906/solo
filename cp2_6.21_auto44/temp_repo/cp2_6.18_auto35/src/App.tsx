import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RuneType, SpellLevel, SpellRecord } from './types';
import { useGameStore, getAllSpells } from './store';
import { RUNE_CONFIGS, RUNE_CONFIGS as runeConfigs } from './gameLogic';

const RUNE_TYPES = Object.values(RuneType);
const ALL_SPELLS = getAllSpells();
const TOTAL_SPELLS = ALL_SPELLS.length;

const App: React.FC = () => {
  const {
    runeBoard,
    mana,
    maxMana,
    combo,
    isCoolingDown,
    discoveredSpells,
    autoExplore,
    explorationLogs,
    selectedCell,
    showCollection,
    activeSpellEffect,
    pulseEffect,
    castFailTime,
    flyingSpellOrbs,
    boardSize,
    placeRune,
    clearBoard,
    toggleAutoExplore,
    toggleCollection,
    setSelectedCell,
    tick,
    autoExploreTick,
    setBoardSize,
  } = useGameStore();

  const [selectorPosition, setSelectorPosition] = useState<{ x: number; y: number } | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<SpellLevel, boolean>>({
    primary: false,
    intermediate: false,
    advanced: false,
  });

  const lastTickRef = useRef<number>(Date.now());
  const lastAutoExploreRef = useRef<number>(0);
  const castingAreaRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      const newSize = window.innerWidth < 768 ? 2 : 3;
      if (newSize !== boardSize) {
        setBoardSize(newSize);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [boardSize, setBoardSize]);

  useEffect(() => {
    let animationId: number;

    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = now - lastTickRef.current;
      lastTickRef.current = now;

      tick(deltaTime);

      if (autoExplore && now - lastAutoExploreRef.current > 3000) {
        autoExploreTick();
        lastAutoExploreRef.current = now;
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationId);
  }, [autoExplore, tick, autoExploreTick]);

  const handleCellClick = useCallback((row: number, col: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setSelectorPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    setSelectedCell({ row, col });
  }, [setSelectedCell]);

  const handleRuneSelect = useCallback((type: RuneType) => {
    if (selectedCell) {
      placeRune(selectedCell.row, selectedCell.col, type);
    }
    setSelectorPosition(null);
    setSelectedCell(null);
  }, [selectedCell, placeRune, setSelectedCell]);

  const handleCloseSelector = useCallback(() => {
    setSelectorPosition(null);
    setSelectedCell(null);
  }, [setSelectedCell]);

  const toggleSection = useCallback((level: SpellLevel) => {
    setCollapsedSections(prev => ({
      ...prev,
      [level]: !prev[level],
    }));
  }, []);

  const getSpellLevelLabel = (level: SpellLevel): string => {
    const labels: Record<SpellLevel, string> = {
      primary: '初级',
      intermediate: '中级',
      advanced: '高级',
    };
    return labels[level];
  };

  const renderFireEffect = () => {
    const particles = [];
    for (let i = 0; i < 40; i++) {
      const angle = (Math.PI * 2 * i) / 40;
      const distance = 60 + Math.random() * 60;
      const size = 8 + Math.random() * 8;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      particles.push(
        <div
          key={i}
          className="spell-particle fire-particle"
          style={{
            left: '50%',
            top: '50%',
            width: `${size}px`,
            height: `${size}px`,
            // @ts-expect-error css vars
            '--tx': `${tx}px`,
            '--ty': `${ty}px`,
            animationDelay: `${Math.random() * 0.2}s`,
          }}
        />
      );
    }
    return particles;
  };

  const renderIceEffect = () => {
    const particles = [];
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30;
      const distance = 50 + Math.random() * 70;
      const size = 8 + Math.random() * 12;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      particles.push(
        <div
          key={i}
          className="spell-particle ice-particle"
          style={{
            left: '50%',
            top: '50%',
            width: `${size}px`,
            height: `${size}px`,
            // @ts-expect-error css vars
            '--tx': `${tx}px`,
            '--ty': `${ty}px`,
            animationDelay: `${Math.random() * 0.3}s`,
          }}
        />
      );
    }
    return particles;
  };

  const renderThunderEffect = () => {
    const bolts = [];
    const boltCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < boltCount; i++) {
      const angle = (Math.PI * 2 * i) / boltCount + Math.random() * 0.5;
      const length = 60 + Math.random() * 40;
      const width = 2 + Math.random() * 2;
      bolts.push(
        <div
          key={i}
          className="thunder-bolt"
          style={{
            left: '50%',
            top: '50%',
            width: `${width}px`,
            height: `${length}px`,
            transform: `translate(-50%, 0) rotate(${angle}rad)`,
            transformOrigin: 'center top',
            animationDelay: `${Math.random() * 0.2}s`,
          }}
        />
      );
    }
    return bolts;
  };

  const renderSpellEffect = () => {
    if (!activeSpellEffect) return null;

    switch (activeSpellEffect.type) {
      case RuneType.FIRE:
        return renderFireEffect();
      case RuneType.ICE:
        return renderIceEffect();
      case RuneType.THUNDER:
        return renderThunderEffect();
      case RuneType.WIND:
        return renderFireEffect();
      case RuneType.EARTH:
        return renderIceEffect();
      case RuneType.SHADOW:
        return renderThunderEffect();
      default:
        return null;
    }
  };

  const renderComboParticles = () => {
    if (combo < 5) return null;

    const highestRune = activeSpellEffect?.type || RuneType.FIRE;
    const config = runeConfigs[highestRune];
    const particles = [];
    const particleCount = Math.min(combo, 10);

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const radius = 60 + (i % 2) * 15;
      const size = 6 + Math.random() * 4;
      particles.push(
        <div
          key={i}
          className="combo-particle"
          style={{
            left: `calc(50% + ${Math.cos(angle) * radius}px)`,
            top: `calc(50% + ${Math.sin(angle) * radius}px)`,
            fontSize: `${size}px`,
            color: config.color,
            animationDelay: `${i * 0.1}s`,
          }}
        >
          {config.icon}
        </div>
      );
    }

    return <div className="combo-particles">{particles}</div>;
  };

  const renderFlyingOrbs = () => {
    if (!castingAreaRef.current) return null;

    const castingRect = castingAreaRef.current.getBoundingClientRect();
    const targetX = castingRect.left + castingRect.width / 2;
    const targetY = castingRect.top + castingRect.height / 2;

    return flyingSpellOrbs.map((orb) => {
      const config = runeConfigs[orb.type];
      const startX = window.innerWidth / 2;
      const startY = window.innerHeight / 2 - 50;
      const dx = targetX - startX;
      const dy = targetY - startY;

      return (
        <div
          key={orb.id}
          className="flying-spell-orb"
          style={{
            left: `${startX}px`,
            top: `${startY}px`,
            background: `radial-gradient(circle, ${config.color} 0%, transparent 70%)`,
            // @ts-expect-error css vars
            '--orb-color': config.glowColor,
            '--dx': `${dx}px`,
            '--dy': `${dy}px`,
          }}
        />
      );
    });
  };

  const spellsByLevel: Record<SpellLevel, SpellRecord[]> = {
    primary: ALL_SPELLS.filter((s) => s.level === 'primary'),
    intermediate: ALL_SPELLS.filter((s) => s.level === 'intermediate'),
    advanced: ALL_SPELLS.filter((s) => s.level === 'advanced'),
  };

  const pulseColor = pulseEffect ? runeConfigs[pulseEffect.type].glowColor : 'transparent';

  return (
    <div className="app-container" ref={appRef} onClick={handleCloseSelector}>
      <h1 className="game-title">魔法工坊</h1>

      <div className="top-controls">
        <button
          className={`control-button ${autoExplore ? 'auto-explore-active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleAutoExplore();
          }}
          title={autoExplore ? '关闭自动探索' : '开启自动探索'}
        >
          ⚙️
        </button>
        <button
          className="control-button"
          onClick={(e) => {
            e.stopPropagation();
            toggleCollection();
          }}
          title="法术收藏"
        >
          📖
        </button>
      </div>

      <div className="main-game-area">
        <div className="resource-bars">
          <div className="mana-bar-container">
            <div
              className="mana-bar-fill"
              style={{ width: `${(mana / maxMana) * 100}%` }}
            />
          </div>
          <div className="combo-bar-container">
            <div
              className={`combo-bar-fill ${combo === 0 ? 'contracting' : ''}`}
              style={{ width: `${(combo / 10) * 100}%` }}
            />
          </div>
          {combo > 0 && (
            <div className="combo-display">
              {combo} 连击! (+{combo * 10}% 伤害)
            </div>
          )}
        </div>

        <div className="rune-board-container">
          <div className="rune-board-glow inner" />
          <div className="rune-board-glow outer" />
          <div
            className={`rune-board ${pulseEffect ? 'pulse-effect' : ''}`}
            style={{
              gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
              // @ts-expect-error css vars
              '--pulse-color': pulseColor,
            }}
          >
            {runeBoard.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const config = cell ? runeConfigs[cell] : null;
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`rune-cell ${cell ? 'filled' : 'empty'}`}
                    style={{
                      // @ts-expect-error css vars
                      '--rune-color': config?.color || 'transparent',
                      '--rune-glow': config?.glowColor || 'transparent',
                    }}
                    onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
                  >
                    {config?.icon}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <button className="clear-button" onClick={clearBoard}>
          清空符文盘
        </button>

        <div className="casting-area" ref={castingAreaRef}>
          {renderComboParticles()}
          <div
            className={`casting-zone ${castFailTime ? 'fail' : ''}`}
          >
            {isCoolingDown && <div className="cooldown-ring" />}
            {activeSpellEffect && (
              <div className="spell-effect">{renderSpellEffect()}</div>
            )}
            {!activeSpellEffect && !isCoolingDown && (
              <span style={{ fontSize: '32px', opacity: 0.3 }}>✨</span>
            )}
          </div>
        </div>

        {renderFlyingOrbs()}

        <div className="exploration-log">
          <div className="log-title">探索日志</div>
          {explorationLogs.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
              暂无探索记录...
            </div>
          ) : (
            explorationLogs.slice().reverse().map((log) => (
              <div key={log.id} className="log-entry">
                <span className="log-timestamp">{log.timestamp}</span>
                <span className="log-runes">
                  {log.runeCombination.slice(0, 3).map((r, i) => (
                    <span key={i}>{runeConfigs[r].icon}</span>
                  ))}
                </span>
                <span
                  className={`log-result ${log.success ? 'success' : 'fail'}`}
                >
                  {log.success
                    ? `成功 (${getSpellLevelLabel(log.spellLevel!)})`
                    : '失败'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {selectorPosition && selectedCell && (
        <div
          className="rune-selector"
          style={{
            left: `${selectorPosition.x}px`,
            top: `${selectorPosition.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="rune-selector-ring">
            {RUNE_TYPES.map((type, index) => {
              const config = runeConfigs[type];
              const angle = (Math.PI * 2 * index) / RUNE_TYPES.length - Math.PI / 2;
              const radius = 70;
              const x = 50 + Math.cos(angle) * radius;
              const y = 50 + Math.sin(angle) * radius;
              return (
                <button
                  key={type}
                  className="rune-option"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    background: config.color,
                    // @ts-expect-error css vars
                    '--rune-glow': config.glowColor,
                  }}
                  onClick={() => handleRuneSelect(type)}
                  title={config.name}
                >
                  {config.icon}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div
        className={`panel-overlay ${showCollection ? 'visible' : ''}`}
        onClick={() => toggleCollection()}
      />
      <div className={`collection-panel ${showCollection ? 'open' : ''}`}>
        <div className="panel-header">
          <h2 className="panel-title">法术收藏</h2>
          <button className="panel-close" onClick={() => toggleCollection()}>
            ×
          </button>
        </div>

        <div className="progress-container">
          <div className="progress-label">
            <span>发现进度</span>
            <span>
              {discoveredSpells.size} / {TOTAL_SPELLS}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(discoveredSpells.size / TOTAL_SPELLS) * 100}%` }}
            />
          </div>
        </div>

        {(Object.keys(spellsByLevel) as SpellLevel[]).map((level) => {
          const spells = spellsByLevel[level];
          const discovered = spells.filter((s) => discoveredSpells.has(s.id));
          const isCollapsed = collapsedSections[level];
          return (
            <div key={level} className="spell-section">
              <div className="section-header" onClick={() => toggleSection(level)}>
                <span className="section-title">
                  {getSpellLevelLabel(level)}法术
                </span>
                <span className="section-count">
                  {discovered.length}/{spells.length}
                </span>
                <span className={`section-toggle ${isCollapsed ? 'collapsed' : ''}`}>
                  ▼
                </span>
              </div>
              {!isCollapsed && (
                <div className="spell-grid">
                  {spells.map((spell) => {
                    const isDiscovered = discoveredSpells.has(spell.id);
                    const config = RUNE_CONFIGS[spell.type];
                    return (
                      <div
                        key={spell.id}
                        className={`spell-card ${!isDiscovered ? 'undiscovered' : ''}`}
                        style={{
                          background: isDiscovered
                            ? `linear-gradient(135deg, ${config.color}88, ${config.color}44)`
                            : undefined,
                          // @ts-expect-error css vars
                          '--card-shadow': `${config.color}66`,
                        }}
                      >
                        {isDiscovered ? (
                          <>
                            <span className="spell-icon">{config.icon}</span>
                            <span className="spell-name">{spell.name}</span>
                          </>
                        ) : (
                          <span className="spell-question">?</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default App;
