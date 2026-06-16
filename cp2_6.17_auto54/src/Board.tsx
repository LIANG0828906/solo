import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from './gameStore';
import { getHexCorners } from './gameStore';
import { HexCoord, Position, MAX_PARTICLES } from './types';

const hexToPixelBoard = (hex: HexCoord, hexSize: number, centerX: number, centerY: number): Position => {
  const x = hexSize * (Math.sqrt(3) * hex.q + (Math.sqrt(3) / 2) * hex.r);
  const y = hexSize * ((3 / 2) * hex.r);
  return { x: x + centerX, y: y + centerY };
};

const drawFlatTopHexagon = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  fill?: string,
  stroke?: string,
  lineWidth: number = 0.2
) => {
  const corners = getHexCorners(x, y, size);

  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < 6; i++) {
    ctx.lineTo(corners[i].x, corners[i].y);
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

  const corners = getHexCorners(x, y, radius);
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < 6; i++) {
    ctx.lineTo(corners[i].x, corners[i].y);
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
    ctx.arc(x, y, size * 0.75, 0, Math.PI * 2);
    ctx.strokeStyle = '#3498DB';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = `${size * 0.4}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#3498DB';
    ctx.fillText('❄️', x, y - size * 0.85);
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
  width: number = 44,
  height: number = 5
) => {
  const ratio = Math.max(0, hp / maxHp);

  ctx.fillStyle = 'rgba(26, 37, 47, 0.9)';
  ctx.fillRect(x - width / 2, y - 34, width, height);

  const color = ratio > 0.5 ? '#2ECC71' : ratio > 0.25 ? '#F39C12' : '#E74C3C';
  ctx.fillStyle = color;
  ctx.fillRect(x - width / 2, y - 34, width * ratio, height);

  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - width / 2, y - 34, width, height);

  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.lineWidth = 2;
  const hpText = `${Math.ceil(hp)}/${maxHp}`;
  ctx.strokeText(hpText, x, y - 37);
  ctx.fillText(hpText, x, y - 37);
};

const drawParticle = (
  ctx: CanvasRenderingContext2D,
  particle: {
    x: number;
    y: number;
    size: number;
    color: string;
    life: number;
    maxLife: number;
  }
) => {
  const alpha = Math.max(0, Math.min(1, particle.life / particle.maxLife));

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = particle.color;
  ctx.shadowColor = particle.color;
  ctx.shadowBlur = 8 * alpha;

  ctx.beginPath();
  ctx.arc(particle.x, particle.y, Math.max(0.1, particle.size), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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

  const render = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = '#2C3E50';
      ctx.fillRect(0, 0, boardSize, boardSize);

      const centerX = boardSize / 2;
      const centerY = boardSize / 2;

      const gridRange = 8;
      for (let q = -gridRange; q <= gridRange; q++) {
        for (let r = -gridRange; r <= gridRange; r++) {
          const hex = { q, r };
          const pos = hexToPixelBoard(hex, hexRadius, centerX, centerY);

          if (
            pos.x < -hexRadius * 2 ||
            pos.x > boardSize + hexRadius * 2 ||
            pos.y < -hexRadius * 2 ||
            pos.y > boardSize + hexRadius * 2
          )
            continue;

          drawFlatTopHexagon(
            ctx,
            pos.x,
            pos.y,
            hexRadius - 1,
            undefined,
            'rgba(255,255,255,0.2)',
            0.2
          );
        }
      }

      for (const obs of obstacles) {
        const pos = hexToPixelBoard(obs.position, hexRadius, centerX, centerY);
        drawHexStone(ctx, pos.x, pos.y, obs.radius, obs.color);
      }

      for (const proj of projectiles) {
        const currentX =
          proj.startPos.x + (proj.endPos.x - proj.startPos.x) * proj.progress;
        const currentY =
          proj.startPos.y + (proj.endPos.y - proj.startPos.y) * proj.progress;

        const tailLength = 0.35;
        const tailStartProg = Math.max(0, proj.progress - tailLength);
        const tailStartX =
          proj.startPos.x + (proj.endPos.x - proj.startPos.x) * tailStartProg;
        const tailStartY =
          proj.startPos.y + (proj.endPos.y - proj.startPos.y) * tailStartProg;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.shadowColor = proj.color;
        ctx.shadowBlur = 25;

        const gradient = ctx.createLinearGradient(
          tailStartX,
          tailStartY,
          currentX,
          currentY
        );
        gradient.addColorStop(0, `${proj.color}00`);
        gradient.addColorStop(0.5, proj.color);
        gradient.addColorStop(1, '#FFFFFF');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = proj.width;
        ctx.globalAlpha = 0.9;

        ctx.beginPath();
        ctx.moveTo(tailStartX, tailStartY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();

        ctx.globalAlpha = 1;
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(currentX, currentY, proj.width * 0.7, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      const sortedPlayers = [...players].sort((a, b) => {
        if (a.id === currentPlayerId) return 1;
        if (b.id === currentPlayerId) return -1;
        return a.displayPosition.y - b.displayPosition.y;
      });

      for (const player of sortedPlayers) {
        if (player.hp <= 0) continue;

        const pos = player.displayPosition;
        const isCurrentPlayer = player.id === currentPlayerId;
        const isSlowed = player.slowedUntil > Date.now();

        drawEmoji(ctx, pos.x, pos.y, player.emoji, 40, isCurrentPlayer, isSlowed);
        drawHealthBar(ctx, pos.x, pos.y, player.hp, player.maxHp);

        if (isCurrentPlayer) {
          ctx.save();
          ctx.globalAlpha = 0.3 + 0.1 * Math.sin(Date.now() / 200);
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, hexRadius * 1.8, 0, Math.PI * 2);
          ctx.strokeStyle = '#1ABC9C';
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 6]);
          ctx.stroke();
          ctx.restore();
        }
      }

      const limitedParticles = particles.slice(0, MAX_PARTICLES);
      for (const particle of limitedParticles) {
        drawParticle(ctx, particle);
      }

      if (gameStatus === 'ended') {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, boardSize, boardSize);

        const winner = players.find((p) => p.hp > 0);

        ctx.shadowColor = '#1ABC9C';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#1ABC9C';
        ctx.font = 'bold 56px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏆 游戏结束 🏆', boardSize / 2, boardSize / 2 - 80);

        ctx.shadowBlur = 0;
        if (winner) {
          ctx.font = '120px Arial';
          ctx.fillText(winner.emoji, boardSize / 2, boardSize / 2 + 10);
        }

        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 10;
        ctx.fillText(
          winner ? `${winner.name} 获胜！` : '平局',
          boardSize / 2,
          boardSize / 2 + 110
        );
        ctx.restore();
      }
    },
    [boardSize, hexRadius, obstacles, players, currentPlayerId, particles, projectiles, gameStatus]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    lastTimeRef.current = performance.now();

    const gameLoop = (timestamp: number) => {
      const deltaTime = Math.min(timestamp - lastTimeRef.current, 50);
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
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    handleClick(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

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
        maxWidth: '100%',
        maxHeight: '100%',
      }}
    />
  );
}
