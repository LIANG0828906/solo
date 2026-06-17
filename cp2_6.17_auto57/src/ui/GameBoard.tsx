import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

export function GameBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  const {
    setCanvasSize,
    startAiming,
    updateAiming,
    shoot,
    updateGame,
    balls,
    aimData,
    particles,
    ripples,
    tableConfig,
    pockets,
    cueStickProgress,
    gamePhase,
  } = useGameStore();

  const stateRef = useRef({
    balls,
    aimData,
    particles,
    ripples,
    tableConfig,
    pockets,
    cueStickProgress,
    gamePhase,
    updateGame,
  });

  useEffect(() => {
    stateRef.current = {
      balls,
      aimData,
      particles,
      ripples,
      tableConfig,
      pockets,
      cueStickProgress,
      gamePhase,
      updateGame,
    };
  }, [balls, aimData, particles, ripples, tableConfig, pockets, cueStickProgress, gamePhase, updateGame]);

  useEffect(() => {
    const handleResize = () => {
      setCanvasSize(window.innerWidth, window.innerHeight);
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setCanvasSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.033);
      lastTimeRef.current = timestamp;

      stateRef.current.updateGame(dt);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        render(ctx, canvas.width, canvas.height);
      }

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const render = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const state = stateRef.current;
    const {
      balls: stateBalls,
      aimData: stateAimData,
      particles: stateParticles,
      ripples: stateRipples,
      tableConfig: stateTableConfig,
      pockets: statePockets,
      cueStickProgress: stateCueStickProgress,
      gamePhase: stateGamePhase,
    } = state;

    ctx.clearRect(0, 0, width, height);

    drawWoodBackground(ctx, width, height);

    if (stateTableConfig) {
      drawTable(ctx, stateTableConfig);
      drawPockets(ctx, statePockets);
      drawRipples(ctx, stateRipples);
      drawTrails(ctx, stateBalls);
      drawBalls(ctx, stateBalls);
      drawParticles(ctx, stateParticles);

      if (stateGamePhase === 'aiming') {
        drawAimLine(ctx, stateBalls, stateAimData, stateTableConfig);
        drawCueStick(ctx, stateBalls, stateAimData, stateCueStickProgress, stateTableConfig);
        drawPowerBar(ctx, stateAimData, stateTableConfig);
      }
    }
  };

  const drawWoodBackground = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = '#3E2723';
    ctx.fillRect(0, 0, w, h);

    for (let y = 0; y < h; y += 4) {
      const brightness = 40 + Math.random() * 20;
      ctx.fillStyle = `rgba(${brightness + 20}, ${brightness - 10}, ${brightness - 20}, 0.3)`;
      ctx.fillRect(0, y, w, 2);
    }

    for (let i = 0; i < 8; i++) {
      const y = Math.random() * h;
      const gradient = ctx.createLinearGradient(0, y, w, y);
      gradient.addColorStop(0, 'rgba(139, 69, 19, 0)');
      gradient.addColorStop(0.5, 'rgba(139, 69, 19, 0.1)');
      gradient.addColorStop(1, 'rgba(139, 69, 19, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, y - 10, w, 20);
    }
  };

  const drawTable = (
    ctx: CanvasRenderingContext2D,
    table: {
      offsetX: number;
      offsetY: number;
      innerWidth: number;
      innerHeight: number;
      borderWidth: number;
    }
  ) => {
    const bx = table.offsetX - table.borderWidth;
    const by = table.offsetY - table.borderWidth;
    const bw = table.innerWidth + table.borderWidth * 2;
    const bh = table.innerHeight + table.borderWidth * 2;

    ctx.fillStyle = '#8B4513';
    ctx.fillRect(bx, by, bw, bh);

    const feltGradient = ctx.createRadialGradient(
      table.offsetX + table.innerWidth / 2,
      table.offsetY + table.innerHeight / 2,
      0,
      table.offsetX + table.innerWidth / 2,
      table.offsetY + table.innerHeight / 2,
      table.innerWidth / 2
    );
    feltGradient.addColorStop(0, 'rgba(50, 160, 50, 1)');
    feltGradient.addColorStop(1, 'rgba(0, 100, 0, 1)');
    ctx.fillStyle = feltGradient;
    ctx.fillRect(table.offsetX, table.offsetY, table.innerWidth, table.innerHeight);

    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 3;
    ctx.strokeRect(bx + 2, by + 2, bw - 4, bh - 4);

    const cornerSize = table.borderWidth * 0.6;
    ctx.fillStyle = '#D4AF37';

    const cornerRadius = 5;
    ctx.beginPath();
    ctx.arc(bx + cornerSize, by + cornerSize, cornerRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(bx + bw - cornerSize, by + cornerSize, cornerRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(bx + cornerSize, by + bh - cornerSize, cornerRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(bx + bw - cornerSize, by + bh - cornerSize, cornerRadius, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawPockets = (
    ctx: CanvasRenderingContext2D,
    pocketList: { x: number; y: number; radius: number }[]
  ) => {
    for (const pocket of pocketList) {
      ctx.fillStyle = '#2C1810';
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, pocket.radius, 0, Math.PI * 2);
      ctx.fill();

      const gradient = ctx.createRadialGradient(
        pocket.x - 3,
        pocket.y - 3,
        0,
        pocket.x,
        pocket.y,
        pocket.radius
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
      gradient.addColorStop(1, 'rgba(44, 24, 16, 1)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(pocket.x, pocket.y, pocket.radius - 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawBalls = (
    ctx: CanvasRenderingContext2D,
    ballList: {
      x: number;
      y: number;
      radius: number;
      color: string;
      number: number;
      pocketed: boolean;
    }[]
  ) => {
    for (const ball of ballList) {
      if (ball.pocketed) continue;

      const gradient = ctx.createRadialGradient(
        ball.x - ball.radius * 0.3,
        ball.y - ball.radius * 0.3,
        0,
        ball.x,
        ball.y,
        ball.radius
      );
      gradient.addColorStop(0, lightenColor(ball.color, 0.4));
      gradient.addColorStop(0.7, ball.color);
      gradient.addColorStop(1, darkenColor(ball.color, 0.3));

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(
        ball.x - ball.radius * 0.35,
        ball.y - ball.radius * 0.35,
        ball.radius * 0.25,
        0,
        Math.PI * 2
      );
      ctx.fill();

      if (ball.number > 0 && ball.number <= 15) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.font = `bold ${ball.radius * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ball.number.toString(), ball.x, ball.y);
      }
    }
  };

  const drawTrails = (
    ctx: CanvasRenderingContext2D,
    ballList: {
      number: number;
      trail: { x: number; y: number }[];
      radius: number;
    }[]
  ) => {
    for (const ball of ballList) {
      if (ball.number !== 0 || ball.trail.length < 2) continue;

      for (let i = 0; i < ball.trail.length; i++) {
        const alpha = (i / ball.trail.length) * 0.5;
        const size = (i / ball.trail.length) * ball.radius * 0.8;

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(ball.trail[i].x, ball.trail[i].y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const drawAimLine = (
    ctx: CanvasRenderingContext2D,
    ballList: { number: number; x: number; y: number; radius: number }[],
    aim: { isAiming: boolean; startX: number; startY: number; currentX: number; currentY: number },
    table: { offsetX: number; offsetY: number }
  ) => {
    if (!aim.isAiming || !table) return;

    const cueBall = ballList.find((b) => b.number === 0);
    if (!cueBall) return;

    const dx = aim.currentX - aim.startX;
    const dy = aim.currentY - aim.startY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) return;

    const angle = Math.atan2(dy, dx);
    const lineLength = 200;

    const startX = cueBall.x + Math.cos(angle) * (cueBall.radius + 5);
    const startY = cueBall.y + Math.sin(angle) * (cueBall.radius + 5);
    const endX = cueBall.x + Math.cos(angle) * (cueBall.radius + lineLength);
    const endY = cueBall.y + Math.sin(angle) * (cueBall.radius + lineLength);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const drawCueStick = (
    ctx: CanvasRenderingContext2D,
    ballList: { number: number; x: number; y: number; radius: number; vx: number; vy: number }[],
    aim: { isAiming: boolean; startX: number; startY: number; currentX: number; currentY: number; power: number },
    progress: number,
    table: { offsetX: number; offsetY: number }
  ) => {
    if (!table) return;

    const cueBall = ballList.find((b) => b.number === 0);
    if (!cueBall) return;

    let angle = 0;
    let power = 0;

    if (aim.isAiming) {
      const dx = aim.currentX - aim.startX;
      const dy = aim.currentY - aim.startY;
      angle = Math.atan2(dy, dx);
      power = aim.power;
    } else if (progress > 0) {
      angle = Math.atan2(cueBall.vy, cueBall.vx) + Math.PI;
      power = progress;
    } else {
      return;
    }

    const stickLength = 200;
    const tailWidth = 8;
    const tipWidth = 2;
    const pullBack = power * 50;

    const baseX = cueBall.x + Math.cos(angle + Math.PI) * (cueBall.radius + 10 + pullBack);
    const baseY = cueBall.y + Math.sin(angle + Math.PI) * (cueBall.radius + 10 + pullBack);

    const tipX = baseX + Math.cos(angle) * stickLength;
    const tipY = baseY + Math.sin(angle) * stickLength;

    const perpAngle = angle + Math.PI / 2;

    ctx.fillStyle = '#D4A76A';
    ctx.beginPath();
    ctx.moveTo(
      baseX + Math.cos(perpAngle) * tailWidth,
      baseY + Math.sin(perpAngle) * tailWidth
    );
    ctx.lineTo(
      baseX - Math.cos(perpAngle) * tailWidth,
      baseY - Math.sin(perpAngle) * tailWidth
    );
    ctx.lineTo(
      tipX - Math.cos(perpAngle) * tipWidth,
      tipY - Math.sin(perpAngle) * tipWidth
    );
    ctx.lineTo(
      tipX + Math.cos(perpAngle) * tipWidth,
      tipY + Math.sin(perpAngle) * tipWidth
    );
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#F5DEB3';
    ctx.save();
    ctx.translate(tipX, tipY);
    ctx.rotate(perpAngle);
    ctx.fillRect(-4, -tipWidth, 8, tipWidth * 2);
    ctx.restore();
  };

  const drawPowerBar = (
    ctx: CanvasRenderingContext2D,
    aim: { isAiming: boolean; power: number },
    table: { offsetX: number; offsetY: number; innerWidth: number; innerHeight: number }
  ) => {
    if (!aim.isAiming || !table) return;

    const barWidth = 80;
    const barHeight = 10;
    const x = table.offsetX + table.innerWidth - barWidth - 20;
    const y = table.offsetY + 20;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, barWidth, barHeight);

    const fillHeight = barHeight * aim.power;
    const gradient = ctx.createLinearGradient(x, y + barHeight, x, y);
    gradient.addColorStop(0, '#FF0000');
    gradient.addColorStop(1, '#FFFF00');

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y + barHeight - fillHeight, barWidth, fillHeight);

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);
  };

  const drawParticles = (
    ctx: CanvasRenderingContext2D,
    particleList: { x: number; y: number; size: number; opacity: number; color: string }[]
  ) => {
    for (const p of particleList) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const drawRipples = (
    ctx: CanvasRenderingContext2D,
    rippleList: { x: number; y: number; radius: number; opacity: number }[]
  ) => {
    for (const r of rippleList) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${r.opacity})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  const lightenColor = (color: string, amount: number): string => {
    if (color.startsWith('rgb')) {
      return color;
    }
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + 255 * amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + 255 * amount);
    const b = Math.min(255, (num & 0xff) + 255 * amount);
    return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
  };

  const darkenColor = (color: string, amount: number): string => {
    if (color.startsWith('rgb')) {
      return color;
    }
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, ((num >> 16) & 0xff) * (1 - amount));
    const g = Math.max(0, ((num >> 8) & 0xff) * (1 - amount));
    const b = Math.max(0, (num & 0xff) * (1 - amount));
    return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    startAiming(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    updateAiming(x, y);
  };

  const handleMouseUp = () => {
    shoot();
  };

  const handleMouseLeave = () => {
    shoot();
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{
        display: 'block',
        cursor: gamePhase === 'aiming' ? 'crosshair' : 'default',
      }}
    />
  );
}
