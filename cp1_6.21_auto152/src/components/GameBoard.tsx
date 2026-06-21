import { useRef, useEffect, useState, useCallback } from 'react';
import { useGameContext } from '@/contexts/GameContext';
import {
  drawBackground,
  drawPlatform,
  drawEnemy,
  drawTrajectoryLine,
  drawPlayerInfo,
} from '@/utils/canvasRenderer';
import { cardHoverTransition, breathAnimation } from '@/utils/animations';
import type { Card, Enemy } from '@/types/game';

const CARD_W = 120;
const CARD_H = 170;
const FAN_SPREAD = 12;
const FAN_RADIUS = 900;
const MIN_WIDTH = 1024;

const TYPE_COLORS: Record<string, string> = {
  attack: '#FF4D4D',
  defense: '#4D79FF',
  skill: '#9B59B6',
};

export default function GameBoard() {
  const { battleState, playCard, endTurn, startGame } = useGameContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const fpsRef = useRef({ frames: 0, lastTime: performance.now(), fps: 0 });

  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ w: MIN_WIDTH, h: 600 });

  const isDev = import.meta.env.DEV;

  const getEnemyPositions = useCallback(
    (w: number, h: number): { x: number; y: number }[] => {
      const cx = w / 2;
      const cy = h * 0.3;
      const count = battleState.enemies.length;
      if (count === 0) return [];
      const spacing = 160;
      const startX = cx - ((count - 1) * spacing) / 2;
      return battleState.enemies.map((_, i) => ({
        x: startX + i * spacing,
        y: cy,
      }));
    },
    [battleState.enemies.length]
  );

  const getCardLayout = useCallback(
    (index: number, total: number) => {
      const cx = canvasSize.w / 2;
      const baseY = canvasSize.h - CARD_H - 20;
      const mid = (total - 1) / 2;
      const offset = index - mid;
      const angle = (offset * FAN_SPREAD) * (Math.PI / 180);
      const x = cx + Math.sin(angle) * FAN_RADIUS - CARD_W / 2;
      const y = baseY - (FAN_RADIUS - Math.cos(angle) * FAN_RADIUS);
      const rotation = offset * FAN_SPREAD;
      return { x, y, rotation };
    },
    [canvasSize]
  );

  const hitTestEnemy = useCallback(
    (mx: number, my: number): number => {
      const positions = getEnemyPositions(canvasSize.w, canvasSize.h);
      for (let i = 0; i < positions.length; i++) {
        const dx = mx - positions[i].x;
        const dy = my - positions[i].y;
        if (dx * dx + dy * dy < 40 * 40) return i;
      }
      return -1;
    },
    [canvasSize, getEnemyPositions]
  );

  const hitTestCard = useCallback(
    (mx: number, my: number): number => {
      const total = battleState.hand.length;
      for (let i = total - 1; i >= 0; i--) {
        const layout = getCardLayout(i, total);
        if (
          mx >= layout.x &&
          mx <= layout.x + CARD_W &&
          my >= layout.y &&
          my <= layout.y + CARD_H
        ) {
          return i;
        }
      }
      return -1;
    },
    [battleState.hand.length, getCardLayout]
  );

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({
          w: Math.max(MIN_WIDTH, rect.width),
          h: Math.max(600, rect.height),
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const { w, h } = canvasSize;
      canvas.width = w;
      canvas.height = h;

      drawBackground(ctx, w, h);
      drawPlatform(ctx, w / 2, h * 0.3);
      drawPlayerInfo(ctx, battleState.playerHP, battleState.playerMaxHP, battleState.playerShield, battleState.round);

      const positions = getEnemyPositions(w, h);
      battleState.enemies.forEach((enemy, i) => {
        drawEnemy(ctx, enemy, positions[i].x, positions[i].y);
      });

      if (isDragging && selectedCardIndex !== null) {
        const layout = getCardLayout(selectedCardIndex, battleState.hand.length);
        const fromX = layout.x + CARD_W / 2;
        const fromY = layout.y + CARD_H / 2;
        drawTrajectoryLine(ctx, fromX, fromY, mousePos.x, mousePos.y);
      }

      if (isDev) {
        fpsRef.current.frames++;
        const now = performance.now();
        if (now - fpsRef.current.lastTime >= 1000) {
          fpsRef.current.fps = fpsRef.current.frames;
          fpsRef.current.frames = 0;
          fpsRef.current.lastTime = now;
        }
        ctx.fillStyle = '#FFD700';
        ctx.font = '12px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`FPS: ${fpsRef.current.fps}`, w - 10, 20);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [canvasSize, battleState, isDragging, selectedCardIndex, mousePos, getEnemyPositions, getCardLayout, isDev]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const cardIdx = hitTestCard(mx, my);
      if (cardIdx >= 0 && battleState.phase === 'playerTurn') {
        setSelectedCardIndex(cardIdx);
        setIsDragging(true);
        setMousePos({ x: mx, y: my });
      }
    },
    [hitTestCard, battleState.phase]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || selectedCardIndex === null) {
        setIsDragging(false);
        setSelectedCardIndex(null);
        return;
      }

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const enemyIdx = hitTestEnemy(mx, my);
      const card = battleState.hand[selectedCardIndex];

      if (enemyIdx >= 0 && card.type === 'attack') {
        playCard(selectedCardIndex, enemyIdx);
      } else if (card.type === 'defense' || card.type === 'skill') {
        playCard(selectedCardIndex, 0);
      }

      setIsDragging(false);
      setSelectedCardIndex(null);
    },
    [isDragging, selectedCardIndex, hitTestEnemy, battleState.hand, playCard]
  );

  const handleClickCard = useCallback(
    (index: number) => {
      if (battleState.phase !== 'playerTurn') return;
      const card = battleState.hand[index];
      if (card.type === 'defense' || card.type === 'skill') {
        playCard(index, 0);
      }
    },
    [battleState.phase, battleState.hand, playCard]
  );

  return (
    <>
      <style>{breathAnimation()}</style>
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ minWidth: MIN_WIDTH, height: '100vh' }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none" style={{ height: CARD_H + 60 }}>
          {battleState.hand.map((card, i) => {
            const layout = getCardLayout(i, battleState.hand.length);
            const isSelected = selectedCardIndex === i;
            return (
              <div
                key={card.id}
                className="absolute pointer-events-auto cursor-pointer select-none"
                style={{
                  left: layout.x,
                  top: layout.y,
                  width: CARD_W,
                  height: CARD_H,
                  transform: `rotate(${layout.rotation}deg) ${isSelected ? 'translateY(-30px)' : ''}`,
                  transition: cardHoverTransition(),
                  zIndex: isSelected ? 100 : i,
                }}
                onClick={() => handleClickCard(i)}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (battleState.phase === 'playerTurn') {
                    setSelectedCardIndex(i);
                    setIsDragging(true);
                  }
                }}
              >
                <div
                  className="w-full h-full rounded-lg border-2 flex flex-col items-center p-2"
                  style={{
                    backgroundColor: '#2d1b4e',
                    borderColor: isSelected ? TYPE_COLORS[card.type] : '#4a3075',
                    boxShadow: isSelected ? `0 0 12px ${TYPE_COLORS[card.type]}` : 'none',
                  }}
                >
                  <div className="w-full h-0.5 mb-1" style={{ backgroundColor: TYPE_COLORS[card.type] }} />
                  <span className="text-white text-sm font-bold text-center leading-tight">{card.name}</span>
                  <span className="text-3xl font-bold mt-2" style={{ color: TYPE_COLORS[card.type] }}>
                    {card.value}
                  </span>
                  <span className="text-white/60 text-xs text-center mt-auto leading-tight">{card.description}</span>
                </div>
              </div>
            );
          })}
        </div>

        {battleState.phase === 'playerTurn' && (
          <button
            className="absolute bottom-4 right-8 px-6 py-2 rounded-lg font-bold text-white pointer-events-auto"
            style={{
              backgroundColor: '#4a3075',
              animation: 'breath 2s ease-in-out infinite',
            }}
            onClick={endTurn}
          >
            结束回合
          </button>
        )}

        {battleState.phase === 'defeat' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-red-400 mb-4">战败</h2>
              <button
                className="px-8 py-3 rounded-lg text-white font-bold"
                style={{ backgroundColor: '#4a3075' }}
                onClick={startGame}
              >
                重新开始
              </button>
            </div>
          </div>
        )}

        {battleState.enemies.length === 0 && battleState.hand.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <button
              className="px-10 py-4 rounded-xl text-white text-xl font-bold"
              style={{
                backgroundColor: '#4a3075',
                animation: 'breath 2s ease-in-out infinite',
              }}
              onClick={startGame}
            >
              开始战斗
            </button>
          </div>
        )}
      </div>
    </>
  );
}
