import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, Platform, Coin, Spike, Goal, LevelData, EditorTool } from '../types';
import { getCoinY } from '../gameEngine';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PLATFORM_HEIGHT, COIN_RADIUS } from '../levels';

interface GameCanvasProps {
  gameState: GameState;
  onMouseDown?: (x: number, y: number, isRightClick?: boolean) => void;
  onMouseMove?: (x: number, y: number) => void;
  onMouseUp?: () => void;
  isEditor?: boolean;
  selectedTool?: EditorTool | null;
  editingLevel?: LevelData | null;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  isEditor = false,
  selectedTool = null,
  editingLevel = null,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const drawGame = useCallback((ctx: CanvasRenderingContext2D, state: GameState) => {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const platforms = isEditor && editingLevel ? editingLevel.platforms : state.platforms;
    const coins = isEditor && editingLevel ? editingLevel.coins : state.coins;
    const spikes = isEditor && editingLevel ? editingLevel.spikes : state.spikes;
    const goal = isEditor && editingLevel ? editingLevel.goal : state.goal;
    const player = state.player;

    for (const platform of platforms) {
      drawPlatform(ctx, platform);
    }

    for (const coin of coins) {
      if (!coin.collected || isEditor) {
        drawCoin(ctx, coin, state.animationFrame);
      }
    }

    for (const spike of spikes) {
      drawSpike(ctx, spike, state.animationFrame);
    }

    drawGoal(ctx, goal, state.animationFrame);

    if (!isEditor) {
      drawPlayer(ctx, player);
    }
  }, [isEditor, editingLevel]);

  const drawPlatform = (ctx: CanvasRenderingContext2D, platform: Platform) => {
    ctx.fillStyle = '#e0e0e0';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;

    const radius = 4;
    ctx.beginPath();
    ctx.roundRect(platform.x, platform.y, platform.width, platform.height, radius);
    ctx.fill();
    ctx.stroke();
  };

  const drawCoin = (ctx: CanvasRenderingContext2D, coin: Coin, animationFrame: number) => {
    const floatY = getCoinY(coin, animationFrame);
    let radius = coin.radius;

    if (coin.collectAnimation > 0) {
      radius = coin.radius * (1 + coin.collectAnimation);
      ctx.globalAlpha = coin.collectAnimation;
    }

    const gradient = ctx.createRadialGradient(
      coin.x - radius * 0.3,
      floatY - radius * 0.3,
      0,
      coin.x,
      floatY,
      radius
    );
    gradient.addColorStop(0, '#ffd700');
    gradient.addColorStop(1, '#ffaa00');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(coin.x, floatY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#cc8800';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.globalAlpha = 1;
  };

  const drawSpike = (ctx: CanvasRenderingContext2D, spike: Spike, animationFrame: number) => {
    const flicker = Math.sin(animationFrame * 0.1) * 0.3 + 0.7;

    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(spike.x, spike.y + spike.height);
    ctx.lineTo(spike.x + spike.width / 2, spike.y);
    ctx.lineTo(spike.x + spike.width, spike.y + spike.height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = `rgba(255, 255, 255, ${flicker * 0.5})`;
    ctx.beginPath();
    ctx.moveTo(spike.x + spike.width / 2 - 2, spike.y + 4);
    ctx.lineTo(spike.x + spike.width / 2, spike.y);
    ctx.lineTo(spike.x + spike.width / 2 + 2, spike.y + 4);
    ctx.closePath();
    ctx.fill();
  };

  const drawGoal = (ctx: CanvasRenderingContext2D, goal: Goal, animationFrame: number) => {
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(goal.x + goal.width / 2 - 2, goal.y, 4, goal.height);

    const wave = Math.sin(animationFrame * 0.08) * 3;
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.moveTo(goal.x + goal.width / 2 + 2, goal.y + 5);
    ctx.quadraticCurveTo(
      goal.x + goal.width / 2 + 20 + wave,
      goal.y + 15,
      goal.x + goal.width / 2 + 2,
      goal.y + 25
    );
    ctx.lineTo(goal.x + goal.width / 2 + 2, goal.y + 5);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, player: GameState['player']) => {
    if (player.isJumping || !player.isGrounded) {
      ctx.shadowColor = '#ff6b35';
      ctx.shadowBlur = 15;
    }

    ctx.fillStyle = '#ff6b35';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(player.x, player.y, player.width, player.height);

    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(player.x + 7, player.y + 8, 5, 5);
    ctx.fillRect(player.x + 18, player.y + 8, 5, 5);

    ctx.fillStyle = '#000000';
    ctx.fillRect(player.x + 9, player.y + 10, 2, 2);
    ctx.fillRect(player.x + 20, player.y + 10, 2, 2);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawGame(ctx, gameState);
  }, [gameState, drawGame]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const windowWidth = window.innerWidth;
      let scale = 1;
      if (windowWidth < 900) {
        scale = Math.min(1, (windowWidth - 40) / CANVAS_WIDTH);
      }
      canvas.style.width = `${CANVAS_WIDTH * scale}px`;
      canvas.style.height = `${CANVAS_HEIGHT * scale}px`;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEditor || !onMouseDown) return;
    const { x, y } = getCanvasCoords(e);
    const isRightClick = e.button === 2;
    onMouseDown(x, y, isRightClick);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEditor || !onMouseMove) return;
    const { x, y } = getCanvasCoords(e);
    onMouseMove(x, y);
  };

  const handleMouseUp = () => {
    if (!isEditor || !onMouseUp) return;
    onMouseUp();
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEditor) return;
    e.preventDefault();
    const { x, y } = getCanvasCoords(e);
    if (onMouseDown) {
      onMouseDown(x, y, true);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        style={{
          border: '3px solid #333',
          borderRadius: '8px',
          cursor: isEditor && selectedTool ? 'crosshair' : 'default',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
};

export default GameCanvas;
