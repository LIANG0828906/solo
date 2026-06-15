import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { constellationsData, getConstellationById } from './data/constellations';
import { getStarById } from './data/stars';
import { useStarMapStore } from './store';
import { StarTableItem } from './types';

export const ConstellationSidebar: React.FC = () => {
  const { selectedConstellation, setSelectedConstellation } = useStarMapStore();

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '16px 12px',
        background: 'rgba(42, 31, 20, 0.85)',
        borderRight: '2px solid #5a3e2b',
        boxShadow: '4px 0 20px rgba(0,0,0,0.5)'
      }}
    >
      {constellationsData.map((constellation, index) => (
        <motion.div
          key={constellation.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.03, duration: 0.3 }}
          whileHover={{ scale: 1.05, x: 5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setSelectedConstellation(
              selectedConstellation === constellation.id ? null : constellation.id
            );
          }}
          style={{
            width: '40px',
            height: '60px',
            background: selectedConstellation === constellation.id
              ? 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)'
              : '#5a3e2b',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease-in-out',
            boxShadow: selectedConstellation === constellation.id
              ? '0 0 20px rgba(255, 215, 0, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.2)'
              : '2px 2px 8px rgba(0,0,0,0.4), inset 0 0 10px rgba(0,0,0,0.2)',
            border: selectedConstellation === constellation.id
              ? '2px solid #ffd700'
              : '1px solid #3a2818'
          }}
        >
          <span
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'upright',
              color: selectedConstellation === constellation.id ? '#3a2818' : '#fffdf5',
              fontSize: '14px',
              fontFamily: '"SimSun", "STSong", serif',
              letterSpacing: '2px',
              fontWeight: 'bold',
              textShadow: selectedConstellation === constellation.id
                ? 'none'
                : '1px 1px 2px rgba(0,0,0,0.5)'
            }}
          >
            {constellation.name}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

export const ConstellationInfo: React.FC = () => {
  const { selectedConstellation } = useStarMapStore();
  const constellation = selectedConstellation
    ? getConstellationById(selectedConstellation)
    : null;

  return (
    <AnimatePresence>
      {constellation && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'absolute',
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 20,
            width: '180px',
            height: '400px',
            background: '#fffacd',
            borderRadius: '4px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 0 20px rgba(139, 115, 85, 0.2)',
            border: '2px solid #c9a66b',
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            writingMode: 'vertical-rl',
            textOrientation: 'upright'
          }}
        >
          <div
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#3a2818',
              marginBottom: '20px',
              letterSpacing: '4px',
              fontFamily: '"KaiTi", "STKaiti", serif'
            }}
          >
            {constellation.name}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            <div style={{ fontSize: '15px', color: '#5a3e2b', fontFamily: '"KaiTi", "STKaiti", serif' }}>
              {`星数：${constellation.starCount}颗`}
            </div>
            <div style={{ fontSize: '15px', color: '#5a3e2b', fontFamily: '"KaiTi", "STKaiti", serif' }}>
              {`分野：${constellation.division}`}
            </div>
            <div style={{ fontSize: '15px', color: '#5a3e2b', fontFamily: '"KaiTi", "STKaiti", serif' }}>
              {`守护：${constellation.guardian}`}
            </div>
          </div>
          
          <div
            style={{
              fontSize: '14px',
              color: '#6b5344',
              lineHeight: '2',
              marginTop: '16px',
              fontFamily: '"KaiTi", "STKaiti", serif',
              letterSpacing: '2px'
            }}
          >
            {constellation.description}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const StarTableBar: React.FC<{ onSave: () => void }> = ({ onSave }) => {
  const { starTable, reorderStarTable, removeStarFromTable, clearStarTable } = useStarMapStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverItem(index);
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedItem === null) return;
    
    const newItems = [...starTable];
    const [removed] = newItems.splice(draggedItem, 1);
    newItems.splice(dropIndex, 0, removed);
    
    reorderStarTable(newItems.map((item, idx) => ({ ...item, order: idx })));
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 30,
        width: '80%',
        maxWidth: '900px',
        minWidth: '600px',
        background: 'linear-gradient(to bottom, #8b6914 0%, #6b4423 50%, #5a3e2b 100%)',
        borderRadius: '8px',
        padding: '12px 16px',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.6), inset 0 2px 0 rgba(255,255,255,0.1)',
        border: '3px solid #3a2818'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px'
        }}
      >
        <span
          style={{
            color: '#f5e6c8',
            fontSize: '16px',
            fontWeight: 'bold',
            fontFamily: '"KaiTi", "STKaiti", serif',
            letterSpacing: '2px',
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
          }}
        >
          星表
        </span>
        <span
          style={{
            color: '#c9a66b',
            fontSize: '12px',
            fontFamily: '"KaiTi", "STKaiti", serif'
          }}
        >
          ({starTable.length}/6颗) - 按住Shift点击星点添加，可拖拽排序
        </span>
        
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearStarTable}
            style={{
              padding: '6px 12px',
              background: '#8b0000',
              color: '#fffdf5',
              border: '1px solid #6b0000',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: '"KaiTi", "STKaiti", serif',
              fontSize: '13px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}
          >
            清空
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSave}
            disabled={starTable.length < 2}
            style={{
              padding: '6px 16px',
              background: starTable.length < 2 ? '#666' : 'linear-gradient(135deg, #cc0000 0%, #8b0000 100%)',
              color: '#fffdf5',
              border: starTable.length < 2 ? '1px solid #555' : '1px solid #8b0000',
              borderRadius: '4px',
              cursor: starTable.length < 2 ? 'not-allowed' : 'pointer',
              fontFamily: '"KaiTi", "STKaiti", serif',
              fontSize: '13px',
              fontWeight: 'bold',
              boxShadow: starTable.length < 2 ? 'none' : '0 2px 8px rgba(139, 0, 0, 0.4)'
            }}
          >
            存为图卷
          </motion.button>
        </div>
      </div>
      
      <div
        ref={scrollContainerRef}
        style={{
          display: 'flex',
          gap: '2px',
          overflowX: 'auto',
          overflowY: 'hidden',
          padding: '8px 4px',
          minHeight: '40px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#c9a66b #3a2818'
        }}
      >
        {starTable.length === 0 ? (
          <div
            style={{
              width: '100%',
              textAlign: 'center',
              color: '#8b7355',
              fontSize: '14px',
              fontFamily: '"KaiTi", "STKaiti", serif',
              padding: '12px 0'
            }}
          >
            暂无星点，请按住Shift点击星图中的星点添加
          </div>
        ) : (
          starTable.map((item, index) => {
            const star = getStarById(item.starId);
            if (!star) return null;
            
            return (
              <React.Fragment key={item.starId}>
                {index > 0 && (
                  <div
                    style={{
                      width: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <div
                      style={{
                        width: '1px',
                        height: '20px',
                        borderLeft: '1px dashed #8b6914'
                      }}
                    />
                  </div>
                )}
                
                <motion.div
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={handleDragEnd}
                  whileHover={{ y: -3 }}
                  whileDrag={{ scale: 1.05, zIndex: 10 }}
                  style={{
                    flexShrink: 0,
                    width: '60px',
                    height: '20px',
                    background: dragOverItem === index
                      ? 'linear-gradient(to bottom, #e8d5b0, #d4c294)'
                      : 'linear-gradient(to bottom, #d4c294, #c9a66b)',
                    borderRadius: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'grab',
                    boxShadow: dragOverItem === index
                      ? '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
                      : '0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                    border: '1px solid #8b6914',
                    position: 'relative',
                    opacity: draggedItem === index ? 0.5 : 1
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `repeating-linear-gradient(
                        90deg,
                        transparent,
                        transparent 8px,
                        rgba(139, 105, 20, 0.1) 8px,
                        rgba(139, 105, 20, 0.1) 9px
                      )`,
                      pointerEvents: 'none'
                    }}
                  />
                  
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#3a2818',
                      fontFamily: '"KaiTi", "STKaiti", serif',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '45px',
                      zIndex: 1
                    }}
                  >
                    {star.ancientName}
                  </span>
                  
                  <span
                    style={{
                      fontSize: '9px',
                      color: '#8b6914',
                      marginLeft: '2px',
                      zIndex: 1
                    }}
                  >
                    {star.magnitude}等
                  </span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStarFromTable(item.starId);
                    }}
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: '#cc0000',
                      color: 'white',
                      border: 'none',
                      fontSize: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      zIndex: 2
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLButtonElement).style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.opacity = '0';
                    }}
                  >
                    ×
                  </button>
                </motion.div>
              </React.Fragment>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export const FlashEffect: React.FC<{ show: boolean }> = ({ show }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flash-overlay"
        />
      )}
    </AnimatePresence>
  );
};

export const StampEffect: React.FC<{ show: boolean }> = ({ show }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 2, rotate: -15 }}
          animate={{ opacity: 1, scale: 1, rotate: -15 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="stamp-animation"
        >
          <div className="stamp-inner">
            敦煌星图
            <br />
            珍藏
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const CandleHolder: React.FC = () => {
  return (
    <div className="candle-holder">
      <div className="candle-flame" />
      <div className="candle-stick" />
      <div className="candle-base" />
    </div>
  );
};
