import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { useGameStore } from '../store';
import { ALL_ITEMS, FurnitureId, Furniture, HiddenItem } from '../types';

function useFurnitureDrop(furnitureId: FurnitureId) {
  const { isOver, setNodeRef } = useDroppable({
    id: `furn_${furnitureId}`,
  });
  return { isOver, setNodeRef };
}

const FurniturePiece = React.memo(function FurniturePiece({
  furniture,
  index,
}: {
  furniture: Furniture;
  index: number;
}) {
  const { openFurnitureOverlay, dropHoverTarget, draggedItemId, addFlashEvent, addItem, spawnParticles, collectHiddenItem, furniture: allFurniture, collectedItems, completedPuzzles, openPuzzle } =
    useGameStore();
  const { isOver, setNodeRef } = useFurnitureDrop(furniture.id);
  const hoverAcceptable = useMemo(() => {
    if (!draggedItemId) return false;
    return furniture.acceptsCombinationsWith.includes(draggedItemId);
  }, [draggedItemId, furniture.acceptsCombinationsWith]);

  const isHoverTarget = dropHoverTarget === furniture.id && hoverAcceptable;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const clickPos = {
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      };
      if (furniture.hasPuzzle && !completedPuzzles.includes(furniture.hasPuzzle)) {
        if (furniture.id === 'safe' && !collectedItems.includes('key_small')) {
          return;
        }
        openPuzzle(furniture.hasPuzzle);
        return;
      }
      openFurnitureOverlay(furniture.id, clickPos);
    },
    [furniture, openFurnitureOverlay, openPuzzle, completedPuzzles, collectedItems]
  );

  const renderFurnitureIcon = () => {
    switch (furniture.id) {
      case 'bookshelf':
        return (
          <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', borderRadius: 6 }}>
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${furniture.color}, #6b3f17)` }} />
            {[0, 1, 2, 3].map((r) => (
              <div
                key={r}
                style={{
                  position: 'absolute',
                  left: '8%',
                  right: '8%',
                  top: `${12 + r * 22}%`,
                  height: 4,
                  background: '#4a2c12',
                }}
              />
            ))}
            {[0, 1, 2, 3].map((c) => (
              <React.Fragment key={`book-${c}`}>
                <div
                  style={{
                    position: 'absolute',
                    left: `${14 + c * 18}%`,
                    top: '16%',
                    width: '12%',
                    height: '10%',
                    background: ['#8b2c2c', '#2c4a8b', '#2c8b3a', '#8b732c'][c],
                    borderRadius: 2,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: `${14 + c * 18}%`,
                    top: '38%',
                    width: '12%',
                    height: '10%',
                    background: ['#5a2c8b', '#8b4a2c', '#2c6b8b', '#8b2c6b'][(c + 2) % 4],
                    borderRadius: 2,
                  }}
                />
              </React.Fragment>
            ))}
          </div>
        );
      case 'desk':
        return (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '55%', background: `linear-gradient(180deg, ${furniture.color}, #7a5530)`, borderRadius: 4 }} />
            <div style={{ position: 'absolute', top: '55%', left: '8%', width: 6, height: '45%', background: '#6b4222', borderRadius: 2 }} />
            <div style={{ position: 'absolute', top: '55%', right: '8%', width: 6, height: '45%', background: '#6b4222', borderRadius: 2 }} />
            <div style={{ position: 'absolute', top: '12%', left: '15%', width: '28%', height: '22%', background: '#f5d6a0', border: '2px solid #8b6914', borderRadius: 2 }} />
            <div style={{ position: 'absolute', top: '15%', left: '55%', width: '30%', height: '8%', background: '#2b1a0e', borderRadius: 4 }} />
          </div>
        );
      case 'drawer':
        return (
          <div style={{ width: '100%', height: '100%', position: 'relative', background: `linear-gradient(180deg, ${furniture.color}, #4a2e15)`, borderRadius: 4 }}>
            {[0, 1, 2].map((d) => (
              <div
                key={d}
                style={{
                  position: 'absolute',
                  left: '10%',
                  right: '10%',
                  top: `${8 + d * 30}%`,
                  height: '22%',
                  border: '1.5px solid #3a1f0c',
                  borderRadius: 3,
                  background: furniture.locked ? `repeating-linear-gradient(45deg, #5c3317, #5c3317 4px, #4a2c12 4px, #4a2c12 8px)` : '#8b5a2b',
                }}
              >
                <div style={{ position: 'absolute', left: '50%', top: '45%', width: 12, height: 4, background: '#2b1a0e', borderRadius: 2, transform: 'translateX(-50%)' }} />
              </div>
            ))}
            {furniture.locked && (
              <div style={{ position: 'absolute', right: '12%', top: '12%', fontSize: 16 }}>🔒</div>
            )}
          </div>
        );
      case 'fireplace':
        return (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${furniture.color}, #3a1f0c)`, borderRadius: '8px 8px 0 0' }} />
            <div style={{ position: 'absolute', left: '12%', right: '12%', top: '20%', bottom: '8%', background: '#0a0604', borderRadius: 4, boxShadow: 'inset 0 0 30px #000' }}>
              <div style={{ position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)', fontSize: 24, filter: 'drop-shadow(0 0 8px #ff6600)' }}>🔥</div>
            </div>
            <div style={{ position: 'absolute', top: 0, left: '-4%', right: '-4%', height: 8, background: '#2b1a0e', borderRadius: 4 }} />
          </div>
        );
      case 'safe':
        return (
          <div style={{ width: '100%', height: '100%', position: 'relative', background: `linear-gradient(135deg, ${furniture.color}, #2a2a2a)`, borderRadius: 6, boxShadow: 'inset 0 0 20px #00000066' }}>
            <div style={{ position: 'absolute', left: '15%', right: '15%', top: '18%', bottom: '18%', border: '3px solid #1a1a1a', borderRadius: 4, background: completedPuzzles.includes('puzzle_safe') ? '#2a3a2a' : '#3a3a3a' }}>
              <div style={{ position: 'absolute', right: '20%', top: '40%', width: 20, height: 20, borderRadius: '50%', background: 'radial-gradient(circle, #8b6914, #3a2c08)', border: '2px solid #1a1a1a' }} />
            </div>
          </div>
        );
      case 'clock':
        return (
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${furniture.color}, #5a4210)`, borderRadius: '50%', border: '4px solid #2b1a0e' }} />
            <div style={{ position: 'absolute', inset: '12%', background: '#f5d6a0', borderRadius: '50%' }}>
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                {[...Array(12)].map((_, i) => (
                  <line key={i} x1="50" y1="10" x2="50" y2="15" stroke="#2b1a0e" strokeWidth="2" transform={`rotate(${i * 30} 50 50)`} />
                ))}
                <line x1="50" y1="50" x2="50" y2="28" stroke="#2b1a0e" strokeWidth="3" strokeLinecap="round" transform="rotate(90 50 50)" />
                <line x1="50" y1="50" x2="50" y2="18" stroke="#8b2c2c" strokeWidth="2" strokeLinecap="round" transform="rotate(270 50 50)" />
                <line x1="50" y1="50" x2="50" y2="12" stroke="#2b1a0e" strokeWidth="1.5" strokeLinecap="round" transform="rotate(150 50 50)" />
                <circle cx="50" cy="50" r="3" fill="#2b1a0e" />
              </svg>
            </div>
          </div>
        );
      case 'painting':
        return (
          <div style={{ width: '100%', height: '100%', position: 'relative', padding: '8%', background: `linear-gradient(135deg, ${furniture.color}, #2b1a0e)`, borderRadius: 4 }}>
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #6b8ea0, #c4b896 50%, #8b6b3a)' }}>
              <div style={{ position: 'absolute', left: '25%', top: '30%', fontSize: 'clamp(10px, 2vw, 20px)', color: '#2b1a0e' }}>△</div>
              <div style={{ position: 'absolute', left: '55%', top: '45%', fontSize: 'clamp(10px, 2vw, 20px)', color: '#8b2c2c' }}>○</div>
              <div style={{ position: 'absolute', left: '40%', top: '65%', fontSize: 'clamp(10px, 2vw, 20px)', color: '#2c6b4a' }}>□</div>
            </div>
          </div>
        );
      case 'door':
        return (
          <div style={{ width: '100%', height: '100%', position: 'relative', background: `linear-gradient(90deg, ${furniture.color}, #5a3a1a, ${furniture.color})`, borderRadius: 4, border: '3px solid #1a0f07' }}>
            <div style={{ position: 'absolute', left: '10%', right: '10%', top: '8%', bottom: '50%', border: '2px solid #1a0f07', borderRadius: 3 }} />
            <div style={{ position: 'absolute', left: '10%', right: '10%', top: '54%', bottom: '8%', border: '2px solid #1a0f07', borderRadius: 3 }} />
            <div style={{ position: 'absolute', right: '18%', top: '50%', width: 8, height: 14, background: '#8b6914', borderRadius: 2 }} />
          </div>
        );
      default:
        return <div style={{ width: '100%', height: '100%', background: furniture.color }} />;
    }
  };

  return (
    <motion.div
      ref={setNodeRef as any}
      onClick={handleClick}
      initial={{ opacity: 0, scale: 0.85, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: 'easeOut' }}
      whileHover={{
        scale: 1.04,
        filter: 'brightness(1.15)',
      }}
      whileTap={{ scale: 0.98 }}
      style={{
        position: 'absolute',
        left: `${furniture.position.x}%`,
        top: `${furniture.position.y}%`,
        width: `${furniture.position.w}%`,
        height: `${furniture.position.h}%`,
        cursor: 'pointer',
        borderRadius: 8,
        willChange: 'transform, opacity',
      }}
    >
      {renderFurnitureIcon()}

      <motion.div
        initial={false}
        animate={{
          boxShadow: isHoverTarget
            ? [
                'inset 0 0 0 3px rgba(245,214,160,0.3), 0 0 16px 4px rgba(245,214,160,0.2)',
                'inset 0 0 0 3px rgba(245,214,160,0.8), 0 0 30px 10px rgba(245,214,160,0.5)',
                'inset 0 0 0 3px rgba(245,214,160,0.3), 0 0 16px 4px rgba(245,214,160,0.2)',
              ]
            : hoverAcceptable
            ? [
                '0 0 0 0px rgba(245,214,160,0)',
                '0 0 0 2px rgba(245,214,160,0.25), 0 0 12px rgba(245,214,160,0.15)',
                '0 0 0 0px rgba(245,214,160,0)',
              ]
            : [
                '0 0 0 1px rgba(245,214,160,0)',
                '0 0 0 2px rgba(245,214,160,0.18), 0 0 8px rgba(245,214,160,0.1)',
                '0 0 0 1px rgba(245,214,160,0)',
              ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          position: 'absolute',
          inset: -4,
          borderRadius: 12,
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />

      <motion.div
        initial={false}
        animate={{
          opacity: isHoverTarget ? 1 : 0,
          scale: isHoverTarget ? [1, 1.06, 1] : 1,
        }}
        transition={{ duration: isHoverTarget ? 1.2 : 0.2, repeat: isHoverTarget ? Infinity : 0, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          inset: -8,
          border: '3px solid #f5d6a0',
          borderRadius: 14,
          pointerEvents: 'none',
          boxShadow: '0 0 28px 8px #f5d6a066',
          background: 'radial-gradient(circle, transparent 60%, rgba(245,214,160,0.08) 100%)',
        }}
      />
    </motion.div>
  );
});

const HiddenItemSpot = React.memo(function HiddenItemSpot({
  furnitureId,
  hidden,
}: {
  furnitureId: FurnitureId;
  hidden: HiddenItem;
}) {
  const { collectHiddenItem, collectedItems, furniture, spawnParticles, addFlashEvent } = useGameStore();
  const furn = furniture[furnitureId];
  if (hidden.collected) return null;
  const locked = hidden.requiresItem && !collectedItems.includes(hidden.requiresItem);
  const furnLocked = furn.locked && furn.unlockedBy && !collectedItems.includes(furn.unlockedBy);
  if (locked || furnLocked) return null;
  const item = ALL_ITEMS[hidden.itemId];

  const handleCollect = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const pos = {
      x: ((rect.left + rect.width / 2) / window.innerWidth) * 100,
      y: ((rect.top + rect.height / 2) / window.innerHeight) * 100,
    };
    collectHiddenItem(furnitureId, hidden.itemId);
    addFlashEvent(pos, 'item_pickup');
    spawnParticles(pos, '#a0e0ff', 16);
  };

  return (
    <motion.button
      onClick={handleCollect}
      whileHover={{ scale: 1.25 }}
      whileTap={{ scale: 0.9 }}
      animate={{
        boxShadow: [
          '0 0 0 0 rgba(160,224,255,0)',
          '0 0 0 6px rgba(160,224,255,0.2)',
          '0 0 0 0 rgba(160,224,255,0)',
        ],
      }}
      transition={{ boxShadow: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }}
      style={{
        position: 'absolute',
        left: `${hidden.position.x}%`,
        top: `${hidden.position.y}%`,
        transform: 'translate(-50%, -50%)',
        width: 52,
        height: 52,
        borderRadius: '50%',
        background: 'radial-gradient(circle, #a0e0ffaa 0%, #66ccff44 60%, transparent 100%)',
        border: '2px solid #a0e0ff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 26,
        padding: 0,
      }}
      title={item.name}
    >
      <span style={{ filter: 'drop-shadow(0 0 6px #fff)' }}>{item.icon}</span>
    </motion.button>
  );
});

const FurnitureOverlay = React.memo(function FurnitureOverlay() {
  const {
    activeFurnitureOverlay,
    closeFurnitureOverlay,
    furniture,
    overlayClickPosition,
    openPuzzle,
    completedPuzzles,
    collectedItems,
  } = useGameStore();

  const furn = activeFurnitureOverlay ? furniture[activeFurnitureOverlay] : null;
  const clickOrigin = overlayClickPosition ?? { x: 50, y: 50 };

  return (
    <AnimatePresence>
      {furn && (
        <motion.div
          key="overlay-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 6, 4, 0.55)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 9000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={closeFurnitureOverlay}
        >
          <motion.div
            key="overlay-panel"
            initial={{
              opacity: 0,
              scale: 0.4,
              clipPath: `circle(0% at ${clickOrigin.x}% ${clickOrigin.y}%)`,
              transformOrigin: `${clickOrigin.x}% ${clickOrigin.y}%`,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              clipPath: `circle(150% at ${clickOrigin.x}% ${clickOrigin.y}%)`,
            }}
            exit={{
              opacity: 0,
              scale: 0.85,
              clipPath: `circle(0% at ${clickOrigin.x}% ${clickOrigin.y}%)`,
            }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: 'min(720px, 90vw)',
              height: 'min(560px, 78vh)',
              background: `linear-gradient(160deg, rgba(43,26,14,0.96), rgba(26,15,7,0.98))`,
              border: '2px solid rgba(245,214,160,0.3)',
              borderRadius: 20,
              boxShadow: '0 20px 80px #00000099, inset 0 0 40px rgba(245,214,160,0.06)',
              overflow: 'hidden',
              backdropFilter: 'blur(8px)',
              willChange: 'transform, clip-path, opacity',
            }}
          >
            <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(245,214,160,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: '#f5d6a0', fontSize: 22, letterSpacing: 2 }}>{furn.name}</h2>
              <motion.button
                whileHover={{ scale: 1.15, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={closeFurnitureOverlay}
                style={{
                  background: 'rgba(245,214,160,0.1)',
                  border: '1px solid rgba(245,214,160,0.3)',
                  color: '#f5d6a0',
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </motion.button>
            </div>
            <div style={{ position: 'relative', height: 'calc(100% - 72px)', padding: 28, background: 'radial-gradient(circle at 30% 20%, rgba(245,214,160,0.05), transparent 60%)' }}>
              <div style={{ position: 'relative', width: '100%', height: '100%', maxHeight: 380 }}>
                {furn.hiddenItems.map((h, i) => (
                  <HiddenItemSpot key={`${h.itemId}-${i}`} furnitureId={furn.id} hidden={h} />
                ))}
                {furn.id === 'clock' && (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <div style={{ width: 240, height: 240, margin: '0 auto', position: 'relative', borderRadius: '50%', background: 'radial-gradient(circle, #8b6914, #3a2c08)', border: '6px solid #2b1a0e' }}>
                      <div style={{ position: 'absolute', inset: 12, borderRadius: '50%', background: '#f5d6a0' }}>
                        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                          {[...Array(12)].map((_, i) => (
                            <React.Fragment key={i}>
                              <line x1="50" y1="6" x2="50" y2="12" stroke="#2b1a0e" strokeWidth={i % 3 === 0 ? 3 : 1.5} transform={`rotate(${i * 30} 50 50)`} />
                              {i % 3 === 0 && (
                                <text x="50" y="16" fontSize="7" fill="#2b1a0e" fontWeight="bold" textAnchor="middle" transform={`rotate(${i * 30} 50 50)`}>
                                  {i === 0 ? 12 : i}
                                </text>
                              )}
                            </React.Fragment>
                          ))}
                          <line x1="50" y1="50" x2="50" y2="32" stroke="#2b1a0e" strokeWidth="4" strokeLinecap="round" transform="rotate(90 50 50)" />
                          <line x1="50" y1="50" x2="50" y2="20" stroke="#8b2c2c" strokeWidth="3" strokeLinecap="round" transform="rotate(270 50 50)" />
                          <line x1="50" y1="50" x2="50" y2="14" stroke="#2b1a0e" strokeWidth="2" strokeLinecap="round" transform="rotate(150 50 50)" />
                          <circle cx="50" cy="50" r="4" fill="#2b1a0e" />
                        </svg>
                      </div>
                    </div>
                    <p style={{ marginTop: 24, color: '#c49a6c', fontSize: 15, lineHeight: 1.8 }}>
                      指针指示：<span style={{ color: '#f5d6a0', fontWeight: 700, fontSize: 18 }}>时针 3 &nbsp;·&nbsp; 分针 9 &nbsp;·&nbsp; 秒针 5</span>
                      <br />
                      <span style={{ color: '#8b6914' }}>（思考：这可能与某个3位数密码有关...）</span>
                    </p>
                  </div>
                )}
                {furn.id === 'painting' && (
                  <div style={{ textAlign: 'center', padding: 10 }}>
                    <div style={{ display: 'inline-block', padding: 20, background: 'linear-gradient(135deg, #2b1a0e, #1a0f07)', border: '4px solid #3d2b1f', borderRadius: 8 }}>
                      <div style={{ width: 320, height: 220, background: 'linear-gradient(135deg, #6b8ea0, #c4b896 50%, #8b6b3a)', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '18%', top: '22%', fontSize: 40, color: '#2b1a0e', opacity: 0.8 }}>△</div>
                        <div style={{ position: 'absolute', left: '62%', top: '38%', fontSize: 40, color: '#8b2c2c', opacity: 0.8 }}>○</div>
                        <div style={{ position: 'absolute', left: '40%', top: '68%', fontSize: 40, color: '#2c6b4a', opacity: 0.8 }}>□</div>
                      </div>
                    </div>
                    <p style={{ marginTop: 20, color: '#c49a6c', fontSize: 15 }}>
                      画中有三个奇怪的符号，位置分别是：<span style={{ color: '#f5d6a0' }}>左上△、右中○、下方□</span>
                      <br />
                      <span style={{ color: '#8b6914' }}>（点击画框本体可以触发机关）</span>
                    </p>
                    {!completedPuzzles.includes('puzzle_pattern') && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          closeFurnitureOverlay();
                          setTimeout(() => openPuzzle('puzzle_pattern'), 200);
                        }}
                        style={{
                          marginTop: 14,
                          padding: '10px 28px',
                          background: 'linear-gradient(135deg, #c49a6c, #8b5a2b)',
                          border: '1px solid #f5d6a0',
                          color: '#2b1a0e',
                          borderRadius: 8,
                          fontSize: 15,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        触发机关 ▶
                      </motion.button>
                    )}
                  </div>
                )}
                {furn.id === 'safe' && (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <div style={{ width: 280, height: 240, margin: '0 auto', background: 'linear-gradient(135deg, #4a4a4a, #2a2a2a)', border: '4px solid #1a1a1a', borderRadius: 10, position: 'relative', boxShadow: 'inset 0 0 30px #000' }}>
                      <div style={{ position: 'absolute', left: '12%', right: '12%', top: '15%', bottom: '15%', border: '3px solid #0a0a0a', borderRadius: 4, background: completedPuzzles.includes('puzzle_safe') ? '#2a3a2a' : '#3a3a3a' }}>
                        <div style={{ position: 'absolute', right: '18%', top: '38%', width: 28, height: 28, borderRadius: '50%', background: 'radial-gradient(circle, #8b6914, #3a2c08)', border: '3px solid #1a1a1a' }} />
                        <div style={{ position: 'absolute', left: '18%', top: '32%', color: '#c49a6c', fontSize: 24 }}>
                          {completedPuzzles.includes('puzzle_safe') ? '✅' : collectedItems.includes('key_small') ? '🔓' : '🔒'}
                        </div>
                      </div>
                    </div>
                    <p style={{ marginTop: 20, color: '#c49a6c', fontSize: 15 }}>
                      {completedPuzzles.includes('puzzle_safe') ? (
                        <span style={{ color: '#a0e0ff' }}>保险箱已打开，物品已取走。</span>
                      ) : collectedItems.includes('key_small') ? (
                        '小钥匙已插入，接下来需要输入3位数字密码。'
                      ) : (
                        '保险箱被锁住了，需要一把小钥匙才能开启，而且还要知道密码...'
                      )}
                    </p>
                    {collectedItems.includes('key_small') && !completedPuzzles.includes('puzzle_safe') && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          closeFurnitureOverlay();
                          setTimeout(() => openPuzzle('puzzle_safe'), 200);
                        }}
                        style={{
                          marginTop: 14,
                          padding: '10px 28px',
                          background: 'linear-gradient(135deg, #c49a6c, #8b5a2b)',
                          border: '1px solid #f5d6a0',
                          color: '#2b1a0e',
                          borderRadius: 8,
                          fontSize: 15,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        输入密码 ▶
                      </motion.button>
                    )}
                  </div>
                )}
                {furn.id === 'desk' && (
                  <div style={{ textAlign: 'center', padding: 10 }}>
                    <div style={{ display: 'inline-block', padding: 16, background: 'rgba(0,0,0,0.25)', borderRadius: 8 }}>
                      <div style={{ width: 380, height: 120, display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ width: 110, height: 80, background: '#f5d6a0', border: '3px solid #8b6914', padding: 8, fontSize: 12, color: '#2b1a0e', textAlign: 'left' }}>
                          <b>📜 密码纸条</b>
                          <div style={{ fontSize: 10, marginTop: 4 }}>"钟表指向的时刻..."</div>
                          <div style={{ fontSize: 9, opacity: 0.6, marginTop: 4 }}>（若已拾取则不在此处）</div>
                        </div>
                        <div style={{ width: 110, height: 80, background: '#e8d9b8', border: '3px solid #8b6914', padding: 8, fontSize: 12, color: '#2b1a0e', textAlign: 'left' }}>
                          <b>🖼️ 旧照片</b>
                          <div style={{ fontSize: 10, marginTop: 4 }}>背面：△○□</div>
                        </div>
                        <div style={{ width: 110, height: 80, background: 'rgba(10,10,10,0.5)', border: '2px dashed #c49a6c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c49a6c', fontSize: 12 }}>
                          图纸拼合区
                        </div>
                      </div>
                    </div>
                    <p style={{ marginTop: 16, color: '#c49a6c', fontSize: 14 }}>
                      书桌上散落着纸条和照片。收集齐三块图纸碎片后，可在下方拼合。
                    </p>
                    {collectedItems.includes('puzzle_piece_1') &&
                      collectedItems.includes('puzzle_piece_2') &&
                      collectedItems.includes('puzzle_piece_3') &&
                      !completedPuzzles.includes('puzzle_assembly') && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            closeFurnitureOverlay();
                            setTimeout(() => openPuzzle('puzzle_assembly'), 200);
                          }}
                          style={{
                            marginTop: 12,
                            padding: '10px 28px',
                            background: 'linear-gradient(135deg, #c49a6c, #8b5a2b)',
                            border: '1px solid #f5d6a0',
                            color: '#2b1a0e',
                            borderRadius: 8,
                            fontSize: 15,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          开始拼合图纸 🧩
                        </motion.button>
                      )}
                  </div>
                )}
                {furn.id === 'bookshelf' && (
                  <div style={{ textAlign: 'center', color: '#c49a6c', fontSize: 14, padding: 40 }}>
                    <p>书架上摆满了厚重的古书。仔细检查后可以发现一些隐藏的物品... 🌟</p>
                  </div>
                )}
                {furn.id === 'drawer' && (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    {furn.locked && !collectedItems.includes('screwdriver') ? (
                      <p style={{ color: '#c49a6c', fontSize: 15 }}>
                        抽屉被螺丝牢牢固定住了，<span style={{ color: '#f5d6a0' }}>需要螺丝刀</span>才能撬开。
                      </p>
                    ) : (
                      <p style={{ color: '#a0e0ff', fontSize: 15 }}>
                        抽屉已被撬开，里面的物品可以拾取。
                      </p>
                    )}
                  </div>
                )}
                {furn.id === 'fireplace' && (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    {!furn.locked || collectedItems.includes('map_complete') ? (
                      <p style={{ color: '#a0e0ff', fontSize: 15 }}>
                        根据地图找到了第三块砖的位置，暗格已开启！
                      </p>
                    ) : (
                      <p style={{ color: '#c49a6c', fontSize: 15 }}>
                        壁炉旁有可疑的砖缝，但需要<span style={{ color: '#f5d6a0' }}>地图</span>才能确定确切位置。
                      </p>
                    )}
                  </div>
                )}
                {furn.id === 'door' && (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <p style={{ color: '#c49a6c', fontSize: 15 }}>
                      厚重的铁门紧闭。<br />
                      {collectedItems.includes('key_large') ? (
                        <span style={{ color: '#a0e0ff' }}>拖拽大钥匙到大门上即可逃离密室！</span>
                      ) : (
                        <span>需要一把<span style={{ color: '#f5d6a0' }}>大铁门钥匙</span>。</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default function RoomView() {
  const { furniture, puzzleChain } = useGameStore();
  const furnitureList = useMemo(() => Object.values(furniture), [furniture]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        bottom: 0,
        padding: 0,
        background: '#1a0f07',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, #2b1a0e 0%, #2b1a0e 45%, #3a2415 45%, #4a3322 100%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'repeating-linear-gradient(90deg, #6b4a2e 0px, #6b4a2e 14%, #5c3e24 14%, #5c3e24 14.3%), repeating-linear-gradient(0deg, #6b4a2e 0px, #6b4a2e 40px, #5c3e24 40px, #5c3e24 43px)',
          opacity: 0.85,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 20%, rgba(245,214,160,0.18) 0%, transparent 55%), radial-gradient(ellipse at 50% 55%, rgba(245,214,160,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: '45%',
          boxShadow: 'inset 0 -4px 12px rgba(0,0,0,0.4)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '45%',
          top: '5%',
          width: '25%',
          height: '25%',
          background: 'radial-gradient(ellipse, rgba(245,214,160,0.25), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 20,
          zIndex: 100,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 20, color: '#f5d6a0', letterSpacing: 3, fontWeight: 700, textShadow: '0 0 12px #000' }}>
          🏛️ 密室逃脱
        </div>
        <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
          <span style={{
            padding: '4px 10px',
            borderRadius: 999,
            background: puzzleChain.layer1 ? 'rgba(160,224,255,0.2)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${puzzleChain.layer1 ? '#a0e0ff' : 'rgba(245,214,160,0.3)'}`,
            color: puzzleChain.layer1 ? '#a0e0ff' : '#c49a6c',
          }}>
            线索层1 {puzzleChain.layer1 ? '✓' : '○'}
          </span>
          <span style={{
            padding: '4px 10px',
            borderRadius: 999,
            background: puzzleChain.layer2 ? 'rgba(160,224,255,0.2)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${puzzleChain.layer2 ? '#a0e0ff' : 'rgba(245,214,160,0.3)'}`,
            color: puzzleChain.layer2 ? '#a0e0ff' : '#c49a6c',
          }}>
            线索层2 {puzzleChain.layer2 ? '✓' : '○'}
          </span>
          <span style={{
            padding: '4px 10px',
            borderRadius: 999,
            background: puzzleChain.layer3 ? 'rgba(160,224,255,0.2)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${puzzleChain.layer3 ? '#a0e0ff' : 'rgba(245,214,160,0.3)'}`,
            color: puzzleChain.layer3 ? '#a0e0ff' : '#c49a6c',
          }}>
            线索层3 {puzzleChain.layer3 ? '✓' : '○'}
          </span>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 20,
          zIndex: 100,
          fontSize: 12,
          color: '#8b6914',
          maxWidth: 340,
          textAlign: 'right',
          lineHeight: 1.6,
          textShadow: '0 1px 2px #000',
        }}
      >
        提示：点击家具查看详情 → 拾取闪光物品 → 从底部物品栏拖拽到家具进行组合
      </div>

      <div style={{ position: 'absolute', inset: 0, padding: '6% 4%' }}>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          {furnitureList.map((f, i) => (
            <FurniturePiece key={f.id} furniture={f} index={i} />
          ))}
        </div>
      </div>

      <FurnitureOverlay />
    </div>
  );
}
