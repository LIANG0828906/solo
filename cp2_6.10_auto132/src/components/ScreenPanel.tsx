import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLampStore, getOrderedScreens } from '../store/lampStore';
import { ScreenArt } from './ScreenArt';

export const ScreenPanel: React.FC = () => {
  const { screens, screenOrder, selectedIndex, setSelectedIndex, setScreenOrder } = useLampStore();
  const orderedScreens = getOrderedScreens(screens, screenOrder);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      const newOrder = [...screenOrder];
      const [draggedItem] = newOrder.splice(draggedIndex, 1);
      newOrder.splice(dropIndex, 0, draggedItem);
      setScreenOrder(newOrder);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragStartPos.current = null;
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragStartPos.current = null;
  };

  const selectedScreen = screens[selectedIndex];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'linear-gradient(180deg, #f5e6cc 0%, #e8d5b0 100%)',
        borderRadius: '8px',
        border: '2px solid #8b5e3c',
        padding: '16px',
        boxShadow: 'inset 0 0 30px rgba(139, 94, 60, 0.2)'
      }}
    >
      <h3
        style={{
          fontFamily: "'Ma Shan Zheng', cursive",
          color: '#5d4037',
          fontSize: '20px',
          margin: '0 0 16px 0',
          textAlign: 'center',
          borderBottom: '2px solid #8b5e3c',
          paddingBottom: '8px'
        }}
      >
        画稿选览
      </h3>

      {selectedScreen && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '6px',
            border: '1px solid #c9a87c'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '12px'
            }}
          >
            <ScreenArt screen={selectedScreen} width={150} height={200} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: "'Ma Shan Zheng', cursive",
                fontSize: '22px',
                color: '#3e2723',
                marginBottom: '4px'
              }}
            >
              {selectedScreen.title}
            </div>
            <div style={{ fontSize: '13px', color: '#5d4037', marginBottom: '2px' }}>
              {selectedScreen.theme}
            </div>
            <div style={{ fontSize: '12px', color: '#6d4c41' }}>
              {selectedScreen.dynasty} · {selectedScreen.author}
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
          flex: 1,
          overflowY: 'auto',
          padding: '4px'
        }}
      >
        <AnimatePresence>
          {orderedScreens.map((screen, index) => (
            <motion.div
              key={screen.id}
              draggable
              onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, index)}
              onDragOver={(e) => handleDragOver(e as unknown as React.DragEvent, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e as unknown as React.DragEvent, index)}
              onDragEnd={handleDragEnd}
              onClick={() => setSelectedIndex(screen.id)}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: draggedIndex === index ? 0.5 : 1,
                scale: draggedIndex === index ? 0.95 : 1,
                border: selectedIndex === screen.id ? '3px solid #ff6f00' : '2px solid #8b5e3c',
                y: dragOverIndex === index ? -5 : 0
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{
                width: '80px',
                height: '80px',
                cursor: 'grab',
                borderRadius: '4px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: selectedIndex === screen.id
                  ? '0 0 15px rgba(255, 111, 0, 0.5)'
                  : '0 2px 8px rgba(0, 0, 0, 0.2)',
                background: '#f5e6cc',
                margin: '0 auto'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98, cursor: 'grabbing' }}
            >
              <ScreenArt screen={screen} width={80} height={80} showFrame={false} />
              {dragOverIndex === index && draggedIndex !== index && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255, 183, 77, 0.4)',
                    border: '2px dashed #ff6f00',
                    borderRadius: '4px'
                  }}
                />
              )}
              <div
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  left: '2px',
                  right: '2px',
                  background: 'rgba(62, 39, 35, 0.8)',
                  color: '#f5e6cc',
                  fontSize: '10px',
                  textAlign: 'center',
                  padding: '1px 0',
                  borderRadius: '2px'
                }}
              >
                {screen.theme}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div
        style={{
          marginTop: '12px',
          fontSize: '11px',
          color: '#6d4c41',
          textAlign: 'center',
          fontStyle: 'italic'
        }}
      >
        拖拽缩略图可调整画屏顺序
      </div>
    </div>
  );
};
