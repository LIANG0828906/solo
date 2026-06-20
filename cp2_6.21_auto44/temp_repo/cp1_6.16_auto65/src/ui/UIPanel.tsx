import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  GameState,
  ElementType,
  SpellResult,
  ELEMENT_COLORS,
  ELEMENT_NAMES,
  ParticleParams,
} from '../engine/types';
import { GameManager } from '../engine/GameManager';
import { ParticleEffect } from './ParticleEffect';
import { elasticEaseOut } from './Animations';

interface UIPanelProps {
  gameManager: GameManager;
  gameState: GameState;
  onSpellCast: (params: ParticleParams) => void;
}

const elementOrder = [
  ElementType.FIRE,
  ElementType.WATER,
  ElementType.WIND,
  ElementType.EARTH,
  ElementType.LIGHT,
  ElementType.ARCANE,
];

function PlayerInfoBar({ state }: { state: GameState }) {
  const allElements = elementOrder.filter(e => e !== ElementType.ARCANE);
  return (
    <div style={{
      position: 'absolute',
      top: 12,
      left: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '8px 14px',
      background: 'rgba(74,55,40,0.85)',
      borderRadius: 8,
      backdropFilter: 'blur(6px)',
      border: '1px solid rgba(184,134,11,0.4)',
      zIndex: 10,
    }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #3D2B56, #1A0F2E)',
        border: '2px solid #B8860B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        fontFamily: 'serif',
        color: '#FFD700',
      }}>
        🧙
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{
          fontFamily: 'serif',
          fontSize: 13,
          color: '#F5E6C8',
          fontWeight: 'bold',
        }}>
          {state.areas[state.currentArea]?.info.name || '中央大厅'}
        </div>
        <div style={{
          display: 'flex',
          gap: 3,
          height: 10,
        }}>
          {allElements.map(el => {
            const collected = state.player.collectedElements.includes(el);
            return (
              <div
                key={el}
                style={{
                  width: 28,
                  height: 10,
                  borderRadius: 5,
                  background: collected
                    ? `linear-gradient(180deg, ${ELEMENT_COLORS[el]}, ${ELEMENT_COLORS[el]}88)`
                    : 'rgba(245,230,200,0.15)',
                  border: collected ? `1px solid ${ELEMENT_COLORS[el]}` : '1px solid rgba(245,230,200,0.2)',
                  boxShadow: collected ? `0 0 4px ${ELEMENT_COLORS[el]}66` : 'none',
                  transition: 'all 0.3s ease',
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SpellQuickBar({ state, spells, onSelect }: { state: GameState; spells: SpellResult[]; onSelect: (idx: number) => void }) {
  return (
    <div style={{
      position: 'absolute',
      top: 12,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: 6,
      padding: '6px 10px',
      background: 'rgba(74,55,40,0.7)',
      borderRadius: 8,
      backdropFilter: 'blur(4px)',
      border: '1px solid rgba(184,134,11,0.3)',
      zIndex: 10,
    }}>
      {state.spellBar.map((spell, idx) => (
        <div
          key={spell.spellId}
          onClick={() => onSelect(idx)}
          style={{
            width: 60,
            height: 60,
            borderRadius: 6,
            background: 'rgba(245,230,200,0.12)',
            border: '1px solid rgba(184,134,11,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            fontFamily: 'serif',
            fontSize: 10,
            color: '#F5E6C8',
            textAlign: 'center',
            lineHeight: 1.2,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.1)';
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 10px rgba(184,134,11,0.5)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
          }}
        >
          {spell.spellName}
        </div>
      ))}
      {Array.from({ length: Math.max(0, 4 - state.spellBar.length) }).map((_, i) => (
        <div
          key={`empty-${i}`}
          style={{
            width: 60,
            height: 60,
            borderRadius: 6,
            background: 'rgba(245,230,200,0.06)',
            border: '1px dashed rgba(245,230,200,0.2)',
          }}
        />
      ))}
    </div>
  );
}

function ElementBackpack({
  collectedElements,
  onElementClick,
}: {
  collectedElements: ElementType[];
  onElementClick: (el: ElementType) => void;
}) {
  const [open, setOpen] = useState(false);
  const [animItems, setAnimItems] = useState<number>(0);

  useEffect(() => {
    if (open) {
      setAnimItems(0);
      const timer = setInterval(() => {
        setAnimItems(prev => {
          if (prev >= collectedElements.length) {
            clearInterval(timer);
            return prev;
          }
          return prev + 1;
        });
      }, 100);
      return () => clearInterval(timer);
    } else {
      setAnimItems(0);
    }
  }, [open, collectedElements.length]);

  return (
    <div style={{
      position: 'absolute',
      bottom: 12,
      right: 12,
      zIndex: 10,
    }}>
      {open && (
        <div style={{
          position: 'absolute',
          bottom: 50,
          right: 0,
          display: 'flex',
          flexDirection: 'column-reverse',
          gap: 6,
        }}>
          {collectedElements.map((el, i) => {
            const visible = i < animItems;
            const t = visible ? 1 : 0;
            const easedT = elasticEaseOut(t);
            return (
              <div
                key={`${el}-${i}`}
                onClick={() => onElementClick(el)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: 'rgba(74,55,40,0.9)',
                  border: `2px solid ${ELEMENT_COLORS[el]}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontFamily: 'serif',
                  fontSize: 14,
                  color: ELEMENT_COLORS[el],
                  fontWeight: 'bold',
                  transform: `scale(${easedT}) translateY(${(1 - easedT) * 20}px)`,
                  opacity: easedT,
                  transition: 'transform 0.3s ease, opacity 0.3s ease',
                  boxShadow: `0 0 8px ${ELEMENT_COLORS[el]}44`,
                }}
              >
                {ELEMENT_NAMES[el]}
              </div>
            );
          })}
        </div>
      )}
      <div
        onClick={() => setOpen(!open)}
        style={{
          width: 44,
          height: 44,
          borderRadius: 8,
          background: 'rgba(74,55,40,0.9)',
          border: '2px solid #B8860B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontFamily: 'serif',
          fontSize: 16,
          color: '#FFD700',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.1)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 12px rgba(184,134,11,0.5)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        }}
      >
        🎒
      </div>
    </div>
  );
}

function SpellCombinePanel({
  gameManager,
  onClose,
  onSpellCast,
}: {
  gameManager: GameManager;
  onClose: () => void;
  onSpellCast: (result: SpellResult) => void;
}) {
  const [gridElements, setGridElements] = useState<(ElementType | null)[]>(
    Array(16).fill(null)
  );
  const [dragItem, setDragItem] = useState<ElementType | null>(null);
  const [dragFromGrid, setDragFromGrid] = useState<number | null>(null);
  const [matchedSpell, setMatchedSpell] = useState<SpellResult | null>(null);
  const [shakeCount, setShakeCount] = useState(0);
  const [showGlow, setShowGlow] = useState(false);

  const state = gameManager.getState();
  const collected = state.player.collectedElements;

  const usedInGrid = gridElements.filter((e): e is ElementType => e !== null);

  const availableElements = collected.map((el, idx) => ({
    element: el,
    idx,
    used: usedInGrid.filter(e => e === el).length >= collected.filter(e => e === el).length,
  }));

  const checkCombination = useCallback((elements: (ElementType | null)[]) => {
    const filled = elements.filter((e): e is ElementType => e !== null);
    if (filled.length < 2) {
      setMatchedSpell(null);
      setShowGlow(false);
      return;
    }
    const result = gameManager.combineSpell(filled);
    if (result.matched && result.spell) {
      setMatchedSpell(result);
      setShowGlow(true);
      let count = 0;
      const shakeInterval = setInterval(() => {
        count++;
        setShakeCount(count);
        if (count >= 3) {
          clearInterval(shakeInterval);
          setShakeCount(0);
        }
      }, 150);
    } else {
      setMatchedSpell(null);
      setShowGlow(false);
    }
  }, [gameManager]);

  const handleDragStart = (element: ElementType, fromGrid?: number) => {
    setDragItem(element);
    if (fromGrid !== undefined) {
      setDragFromGrid(fromGrid);
    }
  };

  const handleDrop = (gridIdx: number) => {
    if (dragItem === null) return;
    const newGrid = [...gridElements];
    if (dragFromGrid !== null) {
      newGrid[dragFromGrid] = null;
    }
    newGrid[gridIdx] = dragItem;
    setGridElements(newGrid);
    setDragItem(null);
    setDragFromGrid(null);
    checkCombination(newGrid);
  };

  const handleRemoveFromGrid = (gridIdx: number) => {
    const newGrid = [...gridElements];
    newGrid[gridIdx] = null;
    setGridElements(newGrid);
    checkCombination(newGrid);
  };

  const handleCastSpell = () => {
    if (!matchedSpell?.spell) return;
    onSpellCast(matchedSpell);
    setGridElements(Array(16).fill(null));
    setMatchedSpell(null);
    setShowGlow(false);
  };

  const shakeOffset = shakeCount > 0 ? (shakeCount % 2 === 0 ? 5 : -5) : 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        animation: 'panelIn 0.3s ease-out',
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 24,
          padding: 24,
          background: 'rgba(74,55,40,0.92)',
          backdropFilter: 'blur(10px)',
          borderRadius: 12,
          border: '2px solid rgba(184,134,11,0.5)',
          boxShadow: showGlow
            ? '0 0 30px rgba(255,215,0,0.4), 0 0 60px rgba(255,215,0,0.2)'
            : '0 8px 32px rgba(0,0,0,0.4)',
          transform: `scale(1) translateX(${shakeOffset}px)`,
          transition: 'transform 0.15s ease, box-shadow 0.3s ease',
          position: 'relative',
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minWidth: 120,
        }}>
          <div style={{
            fontFamily: 'serif',
            fontSize: 14,
            color: '#F5E6C8',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 8,
          }}>
            已收集元素
          </div>
          {availableElements.map(({ element, idx, used }) => (
            <div
              key={`${element}-${idx}`}
              draggable={!used}
              onDragStart={() => handleDragStart(element)}
              onClick={() => {
                if (!used) {
                  const emptyIdx = gridElements.findIndex(e => e === null);
                  if (emptyIdx !== -1) {
                    const newGrid = [...gridElements];
                    newGrid[emptyIdx] = element;
                    setGridElements(newGrid);
                    checkCombination(newGrid);
                  }
                }
              }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: used ? 'rgba(245,230,200,0.06)' : 'rgba(245,230,200,0.15)',
                border: `2px solid ${used ? 'rgba(245,230,200,0.1)' : ELEMENT_COLORS[element]}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: used ? 'default' : 'grab',
                fontFamily: 'serif',
                fontSize: 14,
                color: used ? 'rgba(245,230,200,0.3)' : ELEMENT_COLORS[element],
                fontWeight: 'bold',
                opacity: used ? 0.4 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              {ELEMENT_NAMES[element]}
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}>
          <div style={{
            fontFamily: 'serif',
            fontSize: 14,
            color: '#F5E6C8',
            fontWeight: 'bold',
          }}>
            咒语网格
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 48px)',
            gridTemplateRows: 'repeat(4, 48px)',
            gap: 4,
            border: showGlow ? '2px solid #FFD700' : '1px dashed rgba(245,230,200,0.3)',
            borderRadius: 8,
            padding: 6,
            boxShadow: showGlow ? '0 0 20px rgba(255,215,0,0.3)' : 'none',
            transition: 'border 0.3s ease, box-shadow 0.3s ease',
          }}>
            {gridElements.map((el, idx) => (
              <div
                key={idx}
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(idx)}
                onClick={() => {
                  if (el !== null) handleRemoveFromGrid(idx);
                }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 4,
                  background: el ? 'rgba(245,230,200,0.15)' : 'rgba(245,230,200,0.04)',
                  border: el ? `1px solid ${ELEMENT_COLORS[el]}` : '1px dashed rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: el ? 'pointer' : 'default',
                  fontFamily: 'serif',
                  fontSize: 14,
                  color: el ? ELEMENT_COLORS[el] : 'transparent',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease',
                }}
              >
                {el ? ELEMENT_NAMES[el] : ''}
              </div>
            ))}
          </div>

          {matchedSpell && matchedSpell.spell && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              animation: 'panelIn 0.3s ease-out',
            }}>
              <div style={{
                fontFamily: 'serif',
                fontSize: 20,
                color: '#FFD700',
                fontWeight: 'bold',
                textShadow: '0 0 10px rgba(255,215,0,0.5)',
              }}>
                {matchedSpell.spell.spellName}
              </div>
              <button
                onClick={handleCastSpell}
                style={{
                  padding: '8px 24px',
                  background: 'linear-gradient(135deg, #B8860B, #DAA520)',
                  border: '1px solid #FFD700',
                  borderRadius: 6,
                  color: '#F5E6C8',
                  fontFamily: 'serif',
                  fontSize: 14,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(184,134,11,0.5)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                }}
              >
                释放咒语
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 8,
            right: 12,
            background: 'none',
            border: 'none',
            color: '#F5E6C8',
            fontSize: 18,
            cursor: 'pointer',
            fontFamily: 'serif',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function VictoryPanel({ state, gameManager }: { state: GameState; gameManager: GameManager }) {
  const elapsed = gameManager.getElapsedTime();
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  const discoveryRate = Math.round(gameManager.getDiscoveryRate() * 100);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)',
      zIndex: 200,
      animation: 'panelIn 0.3s ease-out',
    }}>
      <div style={{
        padding: '32px 48px',
        background: 'rgba(74,55,40,0.95)',
        borderRadius: 12,
        border: '2px solid #B8860B',
        boxShadow: '0 0 40px rgba(255,215,0,0.3)',
        textAlign: 'center',
        maxWidth: 400,
      }}>
        <h2 style={{
          fontFamily: 'serif',
          fontSize: 28,
          color: '#FFD700',
          marginBottom: 16,
          textShadow: '0 0 15px rgba(255,215,0,0.5)',
        }}>
          🏆 学院征服者
        </h2>
        <p style={{
          fontFamily: 'serif',
          fontSize: 14,
          color: '#F5E6C8',
          lineHeight: 1.8,
          marginBottom: 20,
        }}>
          你集齐了六种元素符石，解开了魔法学院的终极秘密。
          古老的魔法在你的手中苏醒，元素之力交汇融合，
          学院的大厅中回荡着你的名字。
        </p>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          marginBottom: 20,
        }}>
          <div style={{ fontFamily: 'serif', fontSize: 14, color: '#F5E6C8' }}>
            ⏱ 收集时间：<span style={{ color: '#FFD700' }}>{minutes}分{seconds}秒</span>
          </div>
          <div style={{ fontFamily: 'serif', fontSize: 14, color: '#F5E6C8' }}>
            ✨ 施法次数：<span style={{ color: '#FFD700' }}>{state.spellCount}</span>
          </div>
          <div style={{ fontFamily: 'serif', fontSize: 14, color: '#F5E6C8' }}>
            🔮 组合发现率：<span style={{ color: '#FFD700' }}>{discoveryRate}%</span>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 32px',
            background: 'linear-gradient(135deg, #B8860B, #DAA520)',
            border: '1px solid #FFD700',
            borderRadius: 6,
            color: '#F5E6C8',
            fontFamily: 'serif',
            fontSize: 16,
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
          }}
        >
          再次挑战
        </button>
      </div>
    </div>
  );
}

const UIPanel: React.FC<UIPanelProps> = ({ gameManager, gameState, onSpellCast }) => {
  const [showCombine, setShowCombine] = useState(false);
  const [cPressed, setCPressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'c' && !cPressed) {
        setCPressed(true);
        setShowCombine(prev => !prev);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'c') {
        setCPressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [cPressed]);

  const handleSpellCast = (result: SpellResult) => {
    if (!result.spell) return;
    const state = gameManager.getState();
    onSpellCast({
      count: result.spell.particleCount,
      colors: result.spell.particleColors,
      origin: { ...state.player.position },
      minRadius: result.spell.minRadius,
      maxRadius: result.spell.maxRadius,
      duration: 2000,
      minSize: 2,
      maxSize: 8,
    });
    setShowCombine(false);
  };

  return (
    <>
      <PlayerInfoBar state={gameState} />
      <SpellQuickBar
        state={gameState}
        spells={[]}
        onSelect={() => {}}
      />
      <ElementBackpack
        collectedElements={gameState.player.collectedElements}
        onElementClick={() => {}}
      />

      {showCombine && gameState.gamePhase === 'playing' && (
        <SpellCombinePanel
          gameManager={gameManager}
          onClose={() => setShowCombine(false)}
          onSpellCast={handleSpellCast}
        />
      )}

      {gameState.gamePhase === 'victory' && (
        <VictoryPanel state={gameState} gameManager={gameManager} />
      )}
    </>
  );
};

export default UIPanel;
