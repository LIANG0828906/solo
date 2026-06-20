import React, { useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDraggable } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useGameStore } from '../store';
import { ALL_ITEMS, ItemId } from '../types';

const ItemCard = React.memo(function ItemCard({
  itemId,
  isHighlight,
  index,
}: {
  itemId: ItemId;
  isHighlight: boolean;
  index: number;
}) {
  const item = ALL_ITEMS[itemId];
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({ id: itemId });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: 'transform 200ms ease',
    opacity: isDragging ? 0.35 : 1,
    touchAction: 'none',
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        boxShadow: isHighlight
          ? [
              '0 0 0 0 rgba(160,224,255,0)',
              '0 0 24px 6px rgba(160,224,255,0.8), 0 0 0 3px rgba(160,224,255,0.6)',
              '0 0 0 0 rgba(160,224,255,0)',
            ]
          : '0 4px 16px rgba(0,0,0,0.5)',
        borderColor: isHighlight ? '#a0e0ff' : 'rgba(245,214,160,0.25)',
      }}
      exit={{ opacity: 0, scale: 0.7, y: -20 }}
      transition={{
        delay: index * 0.03,
        duration: 0.35,
        boxShadow: { duration: 1.6, repeat: isHighlight ? Infinity : 0, ease: 'easeInOut' },
        borderColor: { duration: 0.3 },
      }}
      whileHover={{ scale: 1.08, y: -6, boxShadow: '0 10px 28px rgba(0,0,0,0.6), 0 0 18px rgba(245,214,160,0.25)' }}
      whileTap={{ scale: 0.95 }}
      title={item.description}
    >
      <motion.div
        animate={{
          boxShadow: isHighlight
            ? ['inset 0 0 0 0 rgba(160,224,255,0)', 'inset 0 0 24px rgba(160,224,255,0.35)', 'inset 0 0 0 0 rgba(160,224,255,0)']
            : 'none',
        }}
        transition={{ duration: 1.6, repeat: isHighlight ? Infinity : 0, ease: 'easeInOut' }}
        style={{
          width: 96,
          height: 112,
          background: 'linear-gradient(160deg, #3a2512, #1a0f07)',
          border: `1.5px solid ${isHighlight ? '#a0e0ff' : 'rgba(245,214,160,0.3)'}`,
          borderRadius: 12,
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: isDragging ? 'grabbing' : 'grab',
          position: 'relative',
          overflow: 'hidden',
          willChange: 'transform',
        }}
      >
        <motion.div
          animate={{
            background: isHighlight
              ? ['linear-gradient(135deg, rgba(160,224,255,0) 0%, rgba(160,224,255,0) 100%)', 'linear-gradient(135deg, rgba(160,224,255,0.25) 0%, rgba(160,224,255,0) 100%)', 'linear-gradient(135deg, rgba(160,224,255,0) 0%, rgba(160,224,255,0) 100%)']
              : 'none',
          }}
          transition={{ duration: 1.6, repeat: isHighlight ? Infinity : 0 }}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        />
        <div style={{
          fontSize: 40,
          marginTop: 10,
          filter: isHighlight ? 'drop-shadow(0 0 12px #a0e0ff)' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
        }}>
          {item.icon}
        </div>
        <div style={{
          fontSize: 12,
          color: isHighlight ? '#a0e0ff' : '#f5d6a0',
          fontWeight: 600,
          textAlign: 'center',
          marginBottom: 4,
          letterSpacing: 1,
          textShadow: isHighlight ? '0 0 6px #a0e0ff' : '0 1px 2px rgba(0,0,0,0.6)',
        }}>
          {item.name}
        </div>
      </motion.div>
    </motion.div>
  );
});

export default function ItemBar() {
  const { collectedItems, itemBarCollapsed, toggleItemBarCollapsed, highlightNewItem } = useGameStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightNewItem && scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollWidth,
        behavior: 'smooth',
      });
    }
  }, [highlightNewItem, collectedItems.length]);

  const items = useMemo(() => collectedItems, [collectedItems]);

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key="itembar-wrapper"
        initial={{ y: 0 }}
        animate={{ y: itemBarCollapsed ? 'calc(100% - 28px)' : '0%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 8000,
          padding: '0 24px 20px 24px',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'relative',
            pointerEvents: 'auto',
            background: 'rgba(10, 6, 4, 0.55)',
            backdropFilter: 'blur(14px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(14px) saturate(1.2)',
            borderRadius: itemBarCollapsed ? 14 : 20,
            border: '1px solid rgba(245,214,160,0.18)',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
            overflow: 'hidden',
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 28,
            cursor: 'pointer',
            background: 'linear-gradient(180deg, rgba(245,214,160,0.06), transparent)',
            borderBottom: itemBarCollapsed ? 'none' : '1px solid rgba(245,214,160,0.1)',
            userSelect: 'none',
          }} onClick={toggleItemBarCollapsed}>
            <motion.div
              animate={{ rotate: itemBarCollapsed ? 180 : 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{
                width: 28,
                height: 20,
                borderRadius: 999,
                background: 'rgba(245,214,160,0.1)',
                border: '1px solid rgba(245,214,160,0.25)',
                color: '#f5d6a0',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
              whileHover={{ background: 'rgba(245,214,160,0.2)', scale: 1.1 }}
            >
              ▼
            </motion.div>
            {itemBarCollapsed && (
              <span style={{ marginLeft: 10, fontSize: 11, color: '#c49a6c', letterSpacing: 1 }}>
                物品栏 ({collectedItems.length}) · 点击展开
              </span>
            )}
          </div>

          {!itemBarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.25 }}
              style={{
                padding: '14px 18px 18px 18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 13, color: '#f5d6a0', letterSpacing: 2, fontWeight: 600 }}>
                  📦 物品栏
                  <span style={{ color: '#8b6914', fontWeight: 400, marginLeft: 8, fontSize: 11 }}>
                    {collectedItems.length === 0
                      ? '（还没有收集任何物品）'
                      : `（已收集 ${collectedItems.length} 件 · 拖拽物品到家具上进行组合）`}
                  </span>
                </div>
              </div>

              <div
                ref={scrollRef}
                style={{
                  display: 'flex',
                  gap: 14,
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  padding: '8px 6px 16px 6px',
                  minHeight: 140,
                  scrollBehavior: 'smooth',
                }}
              >
                <style>{`
                  div::-webkit-scrollbar {
                    height: 6px;
                  }
                  div::-webkit-scrollbar-track {
                    background: rgba(245,214,160,0.04);
                    border-radius: 999px;
                    margin: 0 12px;
                  }
                  div::-webkit-scrollbar-thumb {
                    background: linear-gradient(90deg, #8b6914, #c49a6c, #8b6914);
                    border-radius: 999px;
                    border: 1px solid rgba(43,26,14,0.4);
                    box-shadow: inset 0 0 4px rgba(245,214,160,0.2);
                  }
                  div::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(90deg, #a07c1a, #e0b880, #a07c1a);
                  }
                  div::-webkit-scrollbar-corner {
                    background: transparent;
                  }
                `}</style>
                <SortableContext items={items as string[]} strategy={verticalListSortingStrategy}>
                  <AnimatePresence mode="popLayout">
                    {items.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                          flex: 1,
                          minWidth: 200,
                          height: 112,
                          border: '2px dashed rgba(196,154,108,0.3)',
                          borderRadius: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#6b5032',
                          fontSize: 14,
                          letterSpacing: 2,
                        }}
                      >
                        点击家具，寻找隐藏的物品…
                      </motion.div>
                    ) : (
                      items.map((itemId, i) => (
                        <ItemCard
                          key={itemId}
                          itemId={itemId}
                          isHighlight={highlightNewItem === itemId}
                          index={i}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </SortableContext>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
