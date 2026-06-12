import React, { useRef, useEffect, useState } from 'react';
import { useGameState, useRecorder, useDispatch, useLevelName, useMoveCount } from '../store';
import { getLevel } from '../gameEngine';
import { ActionType } from '../gameEngine';

const TILE_SIZE = 32;
const BG_COLOR = '#2d2d2d';
const BORDER_COLOR = '#4a4a4a';
const WALL_COLOR = '#5a5a5a';
const FLOOR_COLOR = '#3a3a3a';
const PLAYER_COLOR = '#4ade80';
const PLAYER_EYE_COLOR = '#ffffff';
const BOX_COLOR = '#a16207';
const DOOR_CLOSED_COLOR = '#ef4444';
const DOOR_OPEN_COLOR = '#22c55e';
const PLATE_COLOR = '#60a5fa';
const PLATE_GLOW_COLOR = '#93c5fd';
const TELEPORTER_COLOR = '#a855f7';
const EXIT_COLOR = '#fbbf24';

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameState = useGameState();
  const recorder = useRecorder();
  const dispatch = useDispatch();
  const levelName = useLevelName();
  const moveCount = useMoveCount();
  const [breathPhase, setBreathPhase] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!recorder.isRewindMode) return;
    
    let animationId: number;
    let lastTime = performance.now();
    
    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;
      
      if (recorder.isPlaying) {
        dispatch({ type: 'stepForward' });
      }
      
      setBreathPhase(prev => (prev + delta / 3000) % 1);
      
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationId);
  }, [recorder.isRewindMode, recorder.isPlaying, dispatch]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const level = getLevel(gameState);
    const width = level.width * TILE_SIZE;
    const height = level.height * TILE_SIZE;

    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, width, height);

    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        const tile = gameState.map[y][x];
        
        if (tile === 'wall') {
          ctx.fillStyle = WALL_COLOR;
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        } else if (tile === 'floor' || tile === 'exit') {
          ctx.fillStyle = FLOOR_COLOR;
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          
          if (tile === 'exit') {
            ctx.fillStyle = EXIT_COLOR;
            ctx.fillRect(px + 6, py + 6, TILE_SIZE - 12, TILE_SIZE - 12);
            ctx.fillStyle = '#fde68a';
            ctx.fillRect(px + 10, py + 10, TILE_SIZE - 20, TILE_SIZE - 20);
          }
        }

        ctx.strokeStyle = BORDER_COLOR;
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
      }
    }

    for (const plate of gameState.plates) {
      const px = plate.x * TILE_SIZE;
      const py = plate.y * TILE_SIZE;
      
      if (plate.activated) {
        ctx.shadowColor = PLATE_GLOW_COLOR;
        ctx.shadowBlur = 10;
        ctx.fillStyle = PLATE_GLOW_COLOR;
      } else {
        ctx.shadowBlur = 0;
        ctx.fillStyle = PLATE_COLOR;
      }
      
      ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
      ctx.shadowBlur = 0;
      
      ctx.strokeStyle = plate.activated ? PLATE_GLOW_COLOR : '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 4.5, py + 4.5, TILE_SIZE - 9, TILE_SIZE - 9);
    }

    for (const door of gameState.doors) {
      const px = door.x * TILE_SIZE;
      const py = door.y * TILE_SIZE;
      
      if (!door.open) {
        ctx.fillStyle = DOOR_CLOSED_COLOR;
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(px + TILE_SIZE / 2 - 2, py + TILE_SIZE / 2 - 2, 4, 4);
      } else {
        ctx.fillStyle = DOOR_OPEN_COLOR;
        ctx.fillRect(px + 2, py + 2, 4, TILE_SIZE - 4);
        ctx.fillRect(px + TILE_SIZE - 6, py + 2, 4, TILE_SIZE - 4);
      }
    }

    for (const teleporter of gameState.teleporters) {
      const px = teleporter.x * TILE_SIZE + TILE_SIZE / 2;
      const py = teleporter.y * TILE_SIZE + TILE_SIZE / 2;
      
      ctx.beginPath();
      ctx.arc(px, py, TILE_SIZE / 2 - 4, 0, Math.PI * 2);
      ctx.fillStyle = TELEPORTER_COLOR;
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(px, py, TILE_SIZE / 2 - 10, 0, Math.PI * 2);
      ctx.fillStyle = '#c084fc';
      ctx.fill();
    }

    for (const box of gameState.boxes) {
      const px = box.x * TILE_SIZE;
      const py = box.y * TILE_SIZE;
      
      ctx.fillStyle = BOX_COLOR;
      ctx.fillRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 6);
      
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 3.5, py + 3.5, TILE_SIZE - 7, TILE_SIZE - 7);
      
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 3, py + TILE_SIZE / 2);
      ctx.lineTo(px + TILE_SIZE - 3, py + TILE_SIZE / 2);
      ctx.stroke();
    }

    const playerPx = gameState.player.x * TILE_SIZE;
    const playerPy = gameState.player.y * TILE_SIZE;
    
    ctx.fillStyle = PLAYER_COLOR;
    ctx.fillRect(playerPx + 4, playerPy + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    
    ctx.fillStyle = PLAYER_EYE_COLOR;
    ctx.fillRect(playerPx + 9, playerPy + 10, 4, 4);
    ctx.fillRect(playerPx + 19, playerPy + 10, 4, 4);
    
    ctx.fillStyle = '#166534';
    ctx.fillRect(playerPx + 10, playerPy + 11, 2, 2);
    ctx.fillRect(playerPx + 20, playerPy + 11, 2, 2);

    if (recorder.isRewindMode) {
      const alpha = 0.1 + Math.sin(breathPhase * Math.PI * 2) * 0.1 + 0.1;
      ctx.fillStyle = `rgba(0, 100, 255, ${alpha})`;
      ctx.fillRect(0, 0, width, height);
    }

  }, [gameState, recorder.isRewindMode, breathPhase]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          if (recorder.isRewindMode) {
            dispatch({ type: 'stepBackward' });
          } else {
            dispatch({ type: 'move', dx: 0, dy: -1 });
          }
          break;
        case 's':
        case 'arrowdown':
          if (recorder.isRewindMode) {
            dispatch({ type: 'stepForward' });
          } else {
            dispatch({ type: 'move', dx: 0, dy: 1 });
          }
          break;
        case 'a':
        case 'arrowleft':
          if (recorder.isRewindMode) {
            dispatch({ type: 'stepBackward' });
          } else {
            dispatch({ type: 'move', dx: -1, dy: 0 });
          }
          break;
        case 'd':
        case 'arrowright':
          if (recorder.isRewindMode) {
            dispatch({ type: 'stepForward' });
          } else {
            dispatch({ type: 'move', dx: 1, dy: 0 });
          }
          break;
        case ' ':
          e.preventDefault();
          if (!recorder.isRewindMode) {
            dispatch({ type: 'special' });
          }
          break;
        case 't':
          dispatch({ type: 'toggleRewind' });
          break;
        case 'p':
          if (recorder.isRewindMode) {
            dispatch({ type: 'togglePlayback' });
          }
          break;
        case 'r':
          dispatch({ type: 'restartLevel' });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, recorder.isRewindMode]);

  const level = getLevel(gameState);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ marginBottom: 12, textAlign: 'center' }}>
        <h2 style={{ color: '#fff', marginBottom: 4, fontSize: isMobile ? 16 : 20 }}>
          {levelName}
        </h2>
        <div style={{ color: '#aaa', fontSize: isMobile ? 12 : 14 }}>
          步数: {moveCount} | 回溯次数: {recorder.rewindCount}
          {recorder.isRewindMode && <span style={{ color: '#60a5fa', marginLeft: 8 }}>[回溯模式]</span>}
        </div>
      </div>
      
      <div style={{ position: 'relative' }}>
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            imageRendering: 'pixelated'
          }}
        />
        
        {gameState.won && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 4
          }}>
            <h2 style={{ color: '#fbbf24', marginBottom: 16, fontSize: 24 }}>🎉 通关！</h2>
            <p style={{ color: '#fff', marginBottom: 8 }}>步数: {moveCount}</p>
            <p style={{ color: '#fff', marginBottom: 8 }}>回溯次数: {recorder.rewindCount}</p>
            <p style={{ color: '#aaa', marginBottom: 16, fontSize: 12 }}>
              评分: {calculateScore(moveCount, recorder.rewindCount)}
            </p>
            <button
              onClick={() => dispatch({ type: 'nextLevel' })}
              style={{
                padding: '10px 24px',
                background: '#4ade80',
                color: '#166534',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'bold'
              }}
            >
              下一关
            </button>
          </div>
        )}
      </div>

      <div style={{ marginTop: 12, color: '#888', fontSize: isMobile ? 10 : 12, textAlign: 'center' }}>
        WASD/方向键移动 | 空格交互 | T键回溯模式 | R键重开
      </div>
    </div>
  );
};

function calculateScore(steps: number, rewinds: number): string {
  const baseScore = 1000;
  const stepPenalty = steps * 5;
  const rewindPenalty = rewinds * 50;
  const final = Math.max(0, baseScore - stepPenalty - rewindPenalty);
  
  if (final >= 800) return '⭐⭐⭐ 完美！';
  if (final >= 600) return '⭐⭐ 优秀';
  if (final >= 400) return '⭐ 良好';
  return '继续加油';
}

export default GameCanvas;
