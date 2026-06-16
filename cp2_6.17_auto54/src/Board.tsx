import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from './gameStore';
import { HexCoord, Position } from './types';

const hexToPixel = (hex: HexCoord, hexRadius: number, centerX: number, centerY: number): Position => {
  const x = hexRadius * (3 / 2) * hex.q;
  const y = hexRadius * (Math.sqrt(3) / 2 * hex.q + Math.sqrt(3) * hex.r);
  return { x: x + centerX, y: y + centerY };
};

const drawHexagon = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fill?: string,
  stroke?: string,
  lineWidth: number = 0.2
) => {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const px = x + radius * Math.cos(angle);
    const py = y + radius * Math.sin(angle);
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
};

const drawHexStone = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string
) => {
  ctx.save();
  
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const px = x + radius * Math.cos(angle);
    const py = y + radius * Math.sin(angle);
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  
  const gradient = ctx.createRadialGradient(
    x - radius * 0.3,
    y - radius * 0.3,
    0,
    x,
    y,
    radius
  );
  gradient.addColorStop(0, '#95A5A6');
  gradient.addColorStop(1, color);
  
  ctx.fillStyle = gradient;
  ctx.fill();
  
  ctx.strokeStyle = '#5D6D7E';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  ctx.restore();
};

const drawEmoji = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  emoji: string,
  size: number,
  isCurrentPlayer: boolean,
  isSlowed: boolean
) => {
  ctx.save();
  
  if (isCurrentPlayer) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
    ctx.strokeStyle = '#1ABC9C';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#1ABC9C';
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  if (isSlowed) {
    ctx.beginPath();
    ctx.arc(x, y, size * 0.7, 0, Math.PI * 2);
    ctx.strokeStyle = '#3498DB';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.font = `${size}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, x, y);
  
  ctx.restore();
};

const drawHealthBar = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  hp: number,
  maxHp: number,
  width: number = 40,
  height: number = 4
) => {
  const ratio = Math.max(0, hp / maxHp);
  
  ctx.fillStyle = '#1A252F';
  ctx.fillRect(x - width / 2, y - 30, width, height);
  
  ctx.fillStyle = ratio > 0.3 ? '#E74C3C' : '#C0392B';
  ctx.fillRect(x - width / 2, y - 30, width * ratio, height);
  
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - width / 2, y - 30, width, height);
};

export default function Board() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const {
    boardSize,
    hexRadius,
    obstacles,
    players,
    currentPlayerId,
    particles,
    projectiles,
    gameStatus,
    handleClick,
    setMousePos,
    update,
  } = useGameStore();

  const render = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#2C3E50';
    ctx.fillRect(0, 0, boardSize, boardSize);

    const centerX = boardSize / 2;
    const centerY = boardSize / 2;

    const gridRange = 7;
    for (let q = -gridRange; q <= gridRange; q++) {
      for (let r = -gridRange; r <= gridRange; r++) {
        const hex = { q, r };
        const pos = hexToPixel(hex, hexRadius, centerX, centerY);
        
        if (pos.x < 0 || pos.x > boardSize || pos.y < 0 || pos.y > boardSize) continue;
        
        drawHexagon(ctx, pos.x, pos.y, hexRadius - 1, undefined, 'rgba(255,255,255,0.2)', 0.2);
      }
    }

    for (const obs of obstacles) {
      const pos = hexToPixel(obs.position, hexRadius, centerX, centerY);
      drawHexStone(ctx, pos.x, pos.y, obs.radius, obs.color);
    }

    for (const proj of projectiles) {
      const currentX = proj.startPos.x + (proj.endPos.x - proj.startPos.x) * proj.progress;
      const currentY = proj.startPos.y + (proj.endPos.y - proj.startPos.y) * proj.progress;
      
      const tailLength = 0.3;
      const tailStartX = proj.startPos.x + (proj.endPos.x - proj.startPos.x) * Math.max(0, proj.progress - tailLength);
      const tailStartY = proj.startPos.y + (proj.endPos.y - proj.startPos.y) * Math.max(0, proj.progress - tailLength);
      
      ctx.save();
      ctx.strokeStyle = proj.color;
      ctx.lineWidth = proj.width;
      ctx.lineCap = 'round';
      ctx.shadowColor = proj.color;
      ctx.shadowBlur = 20;
      ctx.globalAlpha = 0.8;
      
      ctx.beginPath();
      ctx.moveTo(tailStartX, tailStartY);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();
      
      ctx.restore();
    }

    for (const player of players) {
      if (player.hp <= 0) continue;
      
      const pos = player.displayPosition;
      const isCurrentPlayer = player.id === currentPlayerId;
      const isSlowed = player.slowedUntil > Date.now();
      
      drawEmoji(ctx, pos.x, pos.y, player.emoji, 40, isCurrentPlayer, isSlowed);
      drawHealthBar(ctx, pos.x, pos.y, player.hp, player.maxHp);
    }

    for (const particle of particles) {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (gameStatus === 'ended') {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, boardSize, boardSize);
      
      const winner = players.find(p => p.hp > 0);
      ctx.fillStyle = '#1ABC9C';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#1ABC9C';
      ctx.shadowBlur = 20;
      ctx.fillText('游戏结束', boardSize / 2, boardSize / 2 - 40);
      
      ctx.font = '28px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(
        winner ? `${winner.name} 获胜！` : '平局',
        boardSize / 2,
        boardSize / 2 + 20
      );
      ctx.restore();
    }
  }, [boardSize, hexRadius, obstacles, players, currentPlayerId, particles, projectiles, gameStatus]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      update(deltaTime);
      render(ctx);

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [update, render]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    handleClick(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePos(x, y);
  };

  return (
    <canvas
      ref={canvasRef}
      width={boardSize}
      height={boardSize}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      style={{
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        cursor: 'pointer',
      }}
    />
  );
}
