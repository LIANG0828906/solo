import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Column } from './Column';
import { useStore } from './store';
import { audioEngine } from './audioEngine';
import { Mode } from './types';

const modeLabels: Record<Mode, string> = {
  free: '自由模式',
  beat: '节拍模式',
  chord: '和弦模式',
};

export const Wall: React.FC = () => {
  const {
    columns,
    gridSize,
    mode,
    lockedColumnId,
    modeFlash,
    setMode,
    setGridSize,
    triggerColumn,
    lockColumn,
    unlockColumn,
    triggerRipple,
    triggerChord,
  } = useStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [columnWidth, setColumnWidth] = useState(0);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const activeModeIndexRef = useRef(0);

  useEffect(() => {
    (window as any).__store = useStore;
    (window as any).__audioEngine = audioEngine;
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const newGridSize = window.innerWidth < 600 ? 5 : 7;
      if (newGridSize !== gridSize) {
        setGridSize(newGridSize);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gridSize, setGridSize]);

  useEffect(() => {
    const updateColumnWidth = () => {
      const vw = window.innerWidth;
      const width = vw / 10;
      setColumnWidth(width);
    };

    updateColumnWidth();
    window.addEventListener('resize', updateColumnWidth);
    return () => window.removeEventListener('resize', updateColumnWidth);
  }, []);

  const initAudio = useCallback(async () => {
    if (!audioInitialized) {
      await audioEngine.init();
      await audioEngine.resume();
      setAudioInitialized(true);
    } else {
      await audioEngine.resume();
    }
  }, [audioInitialized]);

  const handleColumnClick = useCallback(async (id: string) => {
    await initAudio();
    
    const column = columns.find(c => c.id === id);
    if (!column) return;

    if (column.isLocked) {
      unlockColumn(id);
      return;
    }

    switch (mode) {
      case 'free':
        triggerColumn(id);
        triggerRipple(id);
        break;
      case 'beat':
        triggerColumn(id, Math.random() * 3000);
        break;
      case 'chord':
        triggerChord(id);
        triggerRipple(id);
        break;
    }
  }, [mode, columns, triggerColumn, triggerRipple, triggerChord, unlockColumn, initAudio]);

  const handleLongPress = useCallback(async (id: string) => {
    await initAudio();
    lockColumn(id);
  }, [lockColumn, initAudio]);

  const handleUnlock = useCallback((id: string) => {
    unlockColumn(id);
  }, [unlockColumn]);

  const handleModeChange = useCallback((newMode: Mode) => {
    const modes: Mode[] = ['free', 'beat', 'chord'];
    activeModeIndexRef.current = modes.indexOf(newMode);
    setMode(newMode);
  }, [setMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawWaveform = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#121626';
      ctx.fillRect(0, 0, width, height);

      const dataArray = audioEngine.getWaveformData();
      
      if (dataArray.length > 0) {
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#00E5FF');
        gradient.addColorStop(1, '#FF6B6B');

        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const sliceWidth = width / dataArray.length;
        let x = 0;

        for (let i = 0; i < dataArray.length; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.stroke();

        ctx.lineTo(width, height / 2);
        ctx.lineTo(0, height / 2);
        ctx.closePath();

        const fillGradient = ctx.createLinearGradient(0, 0, 0, height);
        fillGradient.addColorStop(0, 'rgba(0, 229, 255, 0.3)');
        fillGradient.addColorStop(1, 'rgba(255, 107, 107, 0.1)');
        ctx.fillStyle = fillGradient;
        ctx.fill();
      }

      ctx.strokeStyle = '#334455';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, width, height);

      animationFrameRef.current = requestAnimationFrame(drawWaveform);
    };

    drawWaveform();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const modes: Mode[] = ['free', 'beat', 'chord'];
  const activeModeIndex = modes.indexOf(mode);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        background: 'radial-gradient(ellipse at center, #1A2035 0%, #0A0E1A 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 10,
        }}
      >
        <canvas
          ref={canvasRef}
          width={200}
          height={60}
          style={{
            display: 'block',
            borderRadius: '4px',
          }}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, auto)`,
          gap: '6px',
          padding: '20px',
          outline: '0.3px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '8px',
          position: 'relative',
          background: modeFlash > 0 
            ? `rgba(255, 255, 255, ${modeFlash})` 
            : 'transparent',
          transition: 'background 0.1s ease-out',
        }}
      >
        {columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            columnWidth={columnWidth}
            onClick={handleColumnClick}
            onLongPress={handleLongPress}
            onUnlock={handleUnlock}
          />
        ))}
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '40px',
          padding: '12px 30px',
          background: 'rgba(10, 14, 26, 0.9)',
          borderRadius: '30px',
          border: '1px solid #334455',
          zIndex: 100,
        }}
      >
        <div style={{ position: 'relative', display: 'flex', gap: '40px' }}>
          <div
            style={{
              position: 'absolute',
              bottom: '-8px',
              left: `${activeModeIndex * (80 + 40)}px`,
              width: '80px',
              height: '3px',
              background: '#FFD700',
              borderRadius: '2px',
              transition: 'left 0.3s ease-out',
            }}
          />
          
          {modes.map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              style={{
                background: 'none',
                border: 'none',
                color: mode === m ? '#FFD700' : '#8899AA',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                padding: '8px 0',
                minWidth: '80px',
                transition: 'color 0.3s ease-out',
                fontFamily: 'inherit',
              }}
            >
              {modeLabels[m]}
            </button>
          ))}
        </div>
      </div>

      {lockedColumnId && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '8px 16px',
            background: 'rgba(0, 188, 212, 0.2)',
            border: '1px solid #00BCD4',
            borderRadius: '20px',
            color: '#00BCD4',
            fontSize: '12px',
            zIndex: 10,
          }}
        >
          节奏源头已锁定，再次点击解除
        </div>
      )}

      <style>{`
        .column-bar:hover {
          transform: scale(1.1) !important;
          filter: brightness(1.2) !important;
        }
      `}</style>
    </div>
  );
};
