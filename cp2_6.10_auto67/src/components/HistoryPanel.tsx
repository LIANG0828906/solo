import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import type { HistoryRecord, MarkedLine, MarkingDot } from '../types';

const SCORE_COLORS: Record<string, string> = {
  A: '#00ff00',
  B: '#ffff00',
  C: '#ffa500',
  D: '#ff0000'
};

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 300;
const THUMBNAIL_WIDTH = 120;
const THUMBNAIL_HEIGHT = 40;

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

const scaleToThumbnail = (x: number, y: number): { x: number; y: number } => ({
  x: (x / CANVAS_WIDTH) * THUMBNAIL_WIDTH,
  y: (y / CANVAS_HEIGHT) * THUMBNAIL_HEIGHT
});

interface ThumbnailSVGProps {
  line: MarkedLine;
  markers: MarkingDot[];
}

const ThumbnailSVG: React.FC<ThumbnailSVGProps> = ({ line, markers }) => {
  const woodX = (20 / CANVAS_WIDTH) * THUMBNAIL_WIDTH;
  const woodY = (150 / CANVAS_HEIGHT) * THUMBNAIL_HEIGHT;
  const woodWidth = (600 / CANVAS_WIDTH) * THUMBNAIL_WIDTH;
  const woodHeight = (80 / CANVAS_HEIGHT) * THUMBNAIL_HEIGHT;

  const start = scaleToThumbnail(line.startX, line.startY);
  const end = scaleToThumbnail(line.endX, line.endY);

  return (
    <svg width={THUMBNAIL_WIDTH} height={THUMBNAIL_HEIGHT} viewBox={`0 0 ${THUMBNAIL_WIDTH} ${THUMBNAIL_HEIGHT}`}>
      <defs>
        <linearGradient id="woodGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d4a574" />
          <stop offset="50%" stopColor="#b87333" />
          <stop offset="100%" stopColor="#8b5a2b" />
        </linearGradient>
      </defs>
      
      <rect
        x={woodX}
        y={woodY}
        width={woodWidth}
        height={woodHeight}
        fill="url(#woodGrad)"
        stroke="#5a3a1a"
        strokeWidth="0.5"
        rx="1"
      />
      
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke="#1a1a1a"
        strokeWidth="1"
        strokeLinecap="round"
      />
      
      {markers.map((marker) => {
        const pos = scaleToThumbnail(marker.x, marker.y);
        return (
          <circle
            key={marker.id}
            cx={pos.x}
            cy={pos.y}
            r="1.5"
            fill="#ff4444"
            stroke="#1a1a1a"
            strokeWidth="0.3"
          />
        );
      })}
    </svg>
  );
};

interface HistoryItemProps {
  record: HistoryRecord;
  isReplaying: boolean;
  onReplay: () => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ record, isReplaying, onReplay }) => {
  return (
    <motion.div
      initial={{ x: 150, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -150, opacity: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        padding: '8px',
        background: isReplaying 
          ? 'rgba(184, 115, 51, 0.3)' 
          : 'rgba(255, 255, 255, 0.6)',
        borderRadius: '8px',
        border: `2px solid ${isReplaying ? '#b87333' : 'rgba(184, 115, 51, 0.3)'}`,
        boxShadow: isReplaying 
          ? '0 0 12px rgba(184, 115, 51, 0.6)' 
          : '0 2px 6px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {isReplaying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, transparent, rgba(184, 115, 51, 0.4), transparent)',
            pointerEvents: 'none'
          }}
        />
      )}
      
      <ThumbnailSVG line={record.line} markers={record.markers} />
      
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: SCORE_COLORS[record.score],
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
          }}
        >
          {record.score}
        </span>
        <span style={{ fontSize: '11px', color: '#555' }}>
          {formatTime(record.timestamp)}
        </span>
      </div>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          e.stopPropagation();
          onReplay();
        }}
        style={{
          width: '100%',
          padding: '4px 8px',
          border: 'none',
          borderRadius: '4px',
          background: isReplaying ? '#b87333' : '#8b5a2b',
          color: '#fff',
          fontSize: '11px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          transition: 'background 0.2s ease'
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="8 5 19 12 8 19 8 5" />
        </svg>
        {isReplaying ? '回放中' : '回放'}
      </motion.button>
    </motion.div>
  );
};

const HistoryPanel: React.FC = () => {
  const { history, replayHistory } = useStore();
  const [replayingId, setReplayingId] = useState<string | null>(null);

  const displayHistory = history.slice(-10).reverse();

  const handleReplay = (record: HistoryRecord) => {
    setReplayingId(record.id);
    replayHistory(record);
    
    setTimeout(() => {
      setReplayingId(null);
    }, 1500);
  };

  return (
    <motion.div
      initial={{ x: 150, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        width: '150px',
        height: '100%',
        background: '#f5deb3',
        borderLeft: '2px solid #b87333',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.15)'
      }}
    >
      <div
        style={{
          padding: '12px',
          textAlign: 'center',
          borderBottom: '2px solid #b87333',
          background: 'linear-gradient(180deg, #d4a574 0%, #c4956a 100%)'
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#1a1a1a',
            textShadow: '0 1px 0 rgba(255, 255, 255, 0.3)'
          }}
        >
          历史记录
        </h2>
      </div>
      
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <AnimatePresence>
          {displayHistory.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                textAlign: 'center',
                color: '#888',
                fontSize: '12px',
                padding: '20px 8px'
              }}
            >
              暂无记录
            </motion.div>
          ) : (
            displayHistory.map((record) => (
              <HistoryItem
                key={record.id}
                record={record}
                isReplaying={replayingId === record.id}
                onReplay={() => handleReplay(record)}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default HistoryPanel;
