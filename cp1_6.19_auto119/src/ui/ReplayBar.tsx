import React from 'react';
import { motion } from 'framer-motion';
import { eventBus } from '../eventBus';

interface ReplayBarProps {
  isRecording: boolean;
  isPlaying: boolean;
  currentFrame: number;
  totalFrames: number;
  playbackSpeed: number;
}

const SPEED_OPTIONS = [1, 2, 4];

export const ReplayBar: React.FC<ReplayBarProps> = ({
  isRecording,
  isPlaying,
  currentFrame,
  totalFrames,
  playbackSpeed,
}) => {
  const handleRecord = () => {
    eventBus.emit('combat:record', undefined);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      eventBus.emit('combat:pause', undefined);
    } else {
      eventBus.emit('combat:play', undefined);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const frame = parseInt(e.target.value);
    eventBus.emit('combat:seek', frame);
  };

  const handleSpeedChange = (speed: number) => {
    eventBus.emit('combat:speed', speed);
  };

  return (
    <div
      style={{
        background: 'rgba(11, 12, 16, 0.85)',
        border: '1px solid #45A29E',
        borderRadius: '8px',
        padding: '12px 16px',
        color: '#C5C6C7',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        <motion.button
          onClick={handleRecord}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.1 }}
          style={{
            padding: '8px 16px',
            background: isRecording ? '#E74C3C' : 'transparent',
            border: `1px solid ${isRecording ? '#E74C3C' : '#45A29E'}`,
            borderRadius: '4px',
            color: isRecording ? '#fff' : '#45A29E',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isRecording ? '#fff' : '#E74C3C',
            }}
          />
          {isRecording ? '记录中' : '记录战斗'}
        </motion.button>

        <motion.button
          onClick={handlePlayPause}
          disabled={totalFrames === 0}
          whileHover={totalFrames > 0 ? { scale: 1.05 } : {}}
          whileTap={totalFrames > 0 ? { scale: 0.95 } : {}}
          transition={{ duration: 0.1 }}
          style={{
            padding: '8px 16px',
            background: totalFrames > 0 ? '#45A29E' : '#333',
            border: 'none',
            borderRadius: '4px',
            color: '#fff',
            cursor: totalFrames > 0 ? 'pointer' : 'not-allowed',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          {isPlaying ? '⏸ 暂停' : '▶ 播放'}
        </motion.button>

        <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
          {SPEED_OPTIONS.map((speed) => (
            <motion.button
              key={speed}
              onClick={() => handleSpeedChange(speed)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
              style={{
                padding: '6px 10px',
                background: playbackSpeed === speed ? '#45A29E' : 'transparent',
                border: `1px solid ${playbackSpeed === speed ? '#45A29E' : '#1F2833'}`,
                borderRadius: '3px',
                color: playbackSpeed === speed ? '#fff' : '#C5C6C7',
                cursor: 'pointer',
                fontSize: '11px',
              }}
            >
              {speed}x
            </motion.button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '12px', color: '#666', minWidth: '40px', textAlign: 'right' }}>
          {Math.floor(currentFrame)}
        </span>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="range"
            min="0"
            max={Math.max(totalFrames - 1, 0)}
            value={Math.floor(currentFrame)}
            onChange={handleSeek}
            disabled={totalFrames === 0}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: '#1F2833',
              appearance: 'none',
              cursor: totalFrames > 0 ? 'pointer' : 'not-allowed',
              accentColor: '#66FCF1',
            }}
          />
          {totalFrames > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: `${(currentFrame / (totalFrames - 1)) * 100}%`,
                transform: 'translate(-50%, -50%)',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: '#66FCF1',
                boxShadow: '0 0 10px #66FCF1',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
        <span style={{ fontSize: '12px', color: '#666', minWidth: '40px' }}>
          {totalFrames > 0 ? totalFrames - 1 : 0}
        </span>
      </div>

      {isRecording && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{ marginTop: '10px', fontSize: '11px', color: '#E74C3C', textAlign: 'center' }}
        >
          ● 正在录制 {totalFrames}/60 帧
        </motion.div>
      )}
    </div>
  );
};
