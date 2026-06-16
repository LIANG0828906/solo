import { useEffect, useRef } from 'react';
import { useCombatStore, CharacterType } from './store';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRID_SIZE = 40;

export default function FightStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const scanlineXRef = useRef<number>(0);
  const gridCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    swordsman,
    mage,
    fighting,
    winner,
    winnerTimer,
    particles,
    projectiles,
    slashEffects,
    swordsmanLunge,
    mageChargeTime,
    processTick,
  } = useCombatStore((state) => state);

  useEffect(() => {
    const offscreen = document.createElement('canvas');
    offscreen.width = CANVAS_WIDTH;
    offscreen.height = CANVAS_HEIGHT;
    const offCtx = offscreen.getContext('2d');
    if (offCtx) {
      offCtx.fillStyle = '#2C2C2C';
      offCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      offCtx.strokeStyle = '#A0A0A0';
      offCtx.lineWidth = 1;
      for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
        offCtx.beginPath();
        offCtx.moveTo(x, 0);
        offCtx.lineTo(x, CANVAS_HEIGHT);
        offCtx.stroke();
        offCtx.beginPath();
        offCtx.moveTo(x + 2, 0);
        offCtx.lineTo(x + 2, CANVAS_HEIGHT);
        offCtx.stroke();
      }
      for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
        offCtx.beginPath();
        offCtx.moveTo(0, y);
        offCtx.lineTo(CANVAS_WIDTH, y);
        offCtx.stroke();
        offCtx.beginPath();
        offCtx.moveTo(0, y + 2);
        offCtx.lineTo(CANVAS_WIDTH, y + 2);
        offCtx.stroke();
      }
    }
    gridCanvasRef.current = offscreen;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawCharacter = (
      type: CharacterType,
      x: number,
      y: number,
      hp: number,
      maxHp: number,
      scale: number = 1,
      rotation: number = 0
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.scale(scale, scale);

      const bodyColor = type === 'swordsman' ? '#4A90D9' : '#E91E63';
      const accentColor = type === 'swordsman' ? '#00BFFF' : '#FF4080';

      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(0, -20, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFE0BD';
      ctx.beginPath();
      ctx.arc(0, -45, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(-5, -47, 2, 0, Math.PI * 2);
      ctx.arc(5, -47, 2, 0, Math.PI * 2);
      ctx.fill();

      if (type === 'swordsman') {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-3, -62, 6, 12);
        ctx.fillStyle = '#B8860B';
        ctx.fillRect(-8, -52, 16, 3);

        ctx.fillStyle = '#C0C0C0';
        ctx.fillRect(15, -35, 4, 45);
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(13, 8, 8, 6);
      } else {
        ctx.fillStyle = '#4A148C';
        ctx.beginPath();
        ctx.moveTo(-16, -58);
        ctx.lineTo(0, -75);
        ctx.lineTo(16, -58);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#8B4513';
        ctx.fillRect(18, -50, 4, 55);
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.arc(20, -55, 8, 0, Math.PI * 2);
        ctx.fill();

        if (mageChargeTime > 0 && fighting && !winner) {
          const chargeProgress = 1 - mageChargeTime / 0.5;
          ctx.strokeStyle = accentColor;
          ctx.lineWidth = 3;
          ctx.globalAlpha = 0.5 + chargeProgress * 0.5;
          ctx.beginPath();
          ctx.arc(20, -55, 12 + chargeProgress * 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }

      ctx.restore();

      const hpBarWidth = 80;
      const hpBarHeight = 8;
      const hpX = x - hpBarWidth / 2;
      const hpY = y - 90;

      ctx.fillStyle = '#333';
      ctx.fillRect(hpX - 2, hpY - 2, hpBarWidth + 4, hpBarHeight + 4);

      ctx.fillStyle = '#1A1A1A';
      ctx.fillRect(hpX, hpY, hpBarWidth, hpBarHeight);

      const hpPercent = Math.max(0, hp / maxHp);
      const hpColor = hpPercent > 0.5 ? '#4CAF50' : hpPercent > 0.25 ? '#FFC107' : '#F44336';
      ctx.fillStyle = hpColor;
      ctx.fillRect(hpX, hpY, hpBarWidth * hpPercent, hpBarHeight);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.ceil(hp)}/${maxHp}`, x, hpY - 6);

      const nameText = type === 'swordsman' ? '剑士' : '法师';
      ctx.fillStyle = accentColor;
      ctx.font = 'bold 14px "Noto Sans SC", sans-serif';
      ctx.fillText(nameText, x, hpY - 22);
    };

    const drawAura = (x: number, y: number, color: string, time: number) => {
      const pulse = 0.3 + 0.5 * Math.abs(Math.sin((time * Math.PI * 2) / 0.5));
      const gradient = ctx.createRadialGradient(x, y, 20, x, y, 70);
      gradient.addColorStop(0, color + Math.floor(pulse * 200).toString(16).padStart(2, '0'));
      gradient.addColorStop(0.5, color + Math.floor(pulse * 128).toString(16).padStart(2, '0'));
      gradient.addColorStop(1, color + '00');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 70, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawScanline = (_time: number) => {
      if (!fighting || winner) return;

      const scanSpeed = CANVAS_WIDTH * 0.8;
      scanlineXRef.current = (scanlineXRef.current + scanSpeed * (1 / 60)) % (CANVAS_WIDTH + 100);

      const gradient = ctx.createLinearGradient(
        scanlineXRef.current - 50,
        0,
        scanlineXRef.current + 50,
        0
      );
      gradient.addColorStop(0, 'rgba(0, 191, 255, 0)');
      gradient.addColorStop(0.5, 'rgba(0, 191, 255, 0.15)');
      gradient.addColorStop(1, 'rgba(0, 191, 255, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(scanlineXRef.current - 50, 0, 100, CANVAS_HEIGHT);
    };

    const drawSlashEffect = (effect: typeof slashEffects[0]) => {
      const { x, y, progress, direction } = effect;
      const alpha = 1 - progress;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';

      const startAngle = direction * Math.PI * 0.75;
      const endAngle = direction * Math.PI * 0.25;
      const currentAngle = startAngle + (endAngle - startAngle) * progress;

      ctx.beginPath();
      ctx.arc(x, y, 50, currentAngle - 0.3, currentAngle + 0.3);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(x, y, 50, currentAngle - 0.2, currentAngle + 0.2);
      ctx.stroke();

      ctx.restore();
    };

    const drawProjectile = (proj: typeof projectiles[0]) => {
      const currentX = proj.x + (proj.targetX - proj.x) * proj.progress;
      const currentY = proj.y + (proj.targetY - proj.y) * proj.progress;

      ctx.save();

      const glowGradient = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, 25);
      glowGradient.addColorStop(0, proj.color);
      glowGradient.addColorStop(0.5, proj.color + '80');
      glowGradient.addColorStop(1, proj.color + '00');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(currentX, currentY, 25, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(currentX, currentY, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = proj.color;
      ctx.beginPath();
      ctx.arc(currentX, currentY, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const drawParticle = (particle: typeof particles[0]) => {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawWinnerScreen = (winnerType: CharacterType, timer: number) => {
      const flashAlpha = 0.3 + 0.7 * Math.abs(Math.sin(timer * Math.PI * 4));

      ctx.fillStyle = `rgba(0, 0, 0, ${0.6 + flashAlpha * 0.2})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const scale = 1.5;
      const rotation = (timer / 3) * Math.PI * 2;
      const char = winnerType === 'swordsman' ? swordsman : mage;

      drawCharacter(winnerType, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, char.hp, char.maxHp, scale, rotation);

      ctx.save();
      ctx.textAlign = 'center';

      const gradient = ctx.createLinearGradient(0, 100, CANVAS_WIDTH, 100);
      gradient.addColorStop(0, '#00BFFF');
      gradient.addColorStop(0.5, '#FF4080');
      gradient.addColorStop(1, '#00BFFF');

      ctx.fillStyle = gradient;
      ctx.font = 'bold 56px "Noto Sans SC", sans-serif';
      ctx.shadowColor = winnerType === 'swordsman' ? '#00BFFF' : '#FF4080';
      ctx.shadowBlur = 30;

      const winnerText = winnerType === 'swordsman' ? '剑士胜利!' : '法师胜利!';
      ctx.fillText(winnerText, CANVAS_WIDTH / 2, 120);

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#E0E0E0';
      ctx.font = '20px "JetBrains Mono", monospace';
      ctx.fillText(`战斗在 ${timer.toFixed(1)} 秒后重置`, CANVAS_WIDTH / 2, 160);

      ctx.restore();

      ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.1})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    };

    const animate = (currentTime: number) => {
      const deltaTime = lastTimeRef.current ? Math.min((currentTime - lastTimeRef.current) / 1000, 0.1) : 0;
      lastTimeRef.current = currentTime;

      if (fighting) {
        processTick(deltaTime);
      }

      const time = currentTime / 1000;

      if (gridCanvasRef.current) {
        ctx.drawImage(gridCanvasRef.current, 0, 0);
      }

      drawScanline(time);

      if (!winner) {
        drawAura(200, 300, '#00BFFF', time);
        drawAura(600, 300, '#FF4080', time);

        const swordsmanX = swordsmanLunge > 0 ? 200 + (1 - swordsmanLunge / 0.2) * 80 : 200;
        drawCharacter('swordsman', swordsmanX, 300, swordsman.hp, swordsman.maxHp);
        drawCharacter('mage', 600, 300, mage.hp, mage.maxHp);

        slashEffects.forEach(drawSlashEffect);
        projectiles.forEach(drawProjectile);
        particles.forEach(drawParticle);

        if (fighting) {
          ctx.fillStyle = '#E0E0E0';
          ctx.font = 'bold 18px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`回合 ${useCombatStore.getState().round}`, CANVAS_WIDTH / 2, 35);
        }
      } else {
        drawWinnerScreen(winner, winnerTimer);
      }

      if (!fighting && !winner) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#E0E0E0';
        ctx.font = 'bold 32px "Noto Sans SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('决斗场模拟器', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

        ctx.font = '18px "JetBrains Mono", monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('配置角色属性，点击 START 开始战斗', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [
    fighting,
    winner,
    winnerTimer,
    swordsman,
    mage,
    particles,
    projectiles,
    slashEffects,
    swordsmanLunge,
    mageChargeTime,
    processTick,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{
        display: 'block',
        border: '2px solid #444',
        borderRadius: '4px 4px 0 0',
        boxShadow: '0 0 30px rgba(0, 191, 255, 0.15)',
      }}
    />
  );
}
