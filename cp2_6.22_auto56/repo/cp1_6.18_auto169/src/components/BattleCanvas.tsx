import { useEffect, useRef, useState } from 'react';
import { PetInstance } from '@/data/petData';
import { BattleResult } from '@/engine/battleEngine';

interface Props {
  myPet: PetInstance;
  opponentPet: PetInstance;
  result: BattleResult;
  onFinish: () => void;
}

export default function BattleCanvas({ myPet, opponentPet, result, onFinish }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'fighting' | 'result'>('fighting');
  const resultShownRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = 2;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;

    let frameId = 0;
    const startTime = performance.now();
    const fightDuration = 3000;

    const myX = W * 0.2;
    const oppX = W * 0.8;
    const petY = H * 0.5;

    interface Orb {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
    }

    interface Burst {
      x: number;
      y: number;
      startTime: number;
      duration: number;
    }

    const orbs: Orb[] = [];
    const bursts: Burst[] = [];
    let lastOrbTime = 0;
    const orbInterval = 400;
    let iWon = result.winnerUid === myPet.uid;

    const animate = () => {
      const now = performance.now();
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / fightDuration);

      ctx.clearRect(0, 0, W, H);

      ctx.fillStyle = '#121212';
      ctx.fillRect(0, 0, W, H);

      const myBob = Math.sin(now / 300) * 3;
      const oppBob = Math.sin(now / 300 + 1) * 3;

      drawPetSprite(ctx, myX, petY + myBob, '#667eea', myPet.name);
      drawPetSprite(ctx, oppX, petY + oppBob, '#f5576c', opponentPet.name);

      if (progress < 1) {
        if (now - lastOrbTime > orbInterval) {
          lastOrbTime = now;
          const fromMySide = Math.random() > 0.5;
          orbs.push({
            x: fromMySide ? myX + 30 : oppX - 30,
            y: petY + (Math.random() - 0.5) * 20,
            vx: fromMySide ? 4 : -4,
            vy: (Math.random() - 0.5) * 1.5,
            color: fromMySide ? '#667eea' : '#f5576c',
            size: 12,
          });
        }

        for (let i = orbs.length - 1; i >= 0; i--) {
          const orb = orbs[i];
          orb.x += orb.vx;
          orb.y += orb.vy;

          const targetX = orb.vx > 0 ? oppX - 30 : myX + 30;
          if ((orb.vx > 0 && orb.x >= targetX) || (orb.vx < 0 && orb.x <= targetX)) {
            bursts.push({ x: orb.x, y: orb.y, startTime: now, duration: 500 });
            orbs.splice(i, 1);
            continue;
          }

          ctx.beginPath();
          ctx.arc(orb.x, orb.y, orb.size, 0, Math.PI * 2);
          ctx.fillStyle = orb.color;
          ctx.shadowColor = orb.color;
          ctx.shadowBlur = 15;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        const bElapsed = now - b.startTime;
        const bProgress = bElapsed / b.duration;
        if (bProgress >= 1) {
          bursts.splice(i, 1);
          continue;
        }
        const alpha = 1 - bProgress;
        const radius = 12 + bProgress * 30;
        ctx.beginPath();
        ctx.arc(b.x, b.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.5})`;
        ctx.fill();
      }

      if (progress >= 1 && phase === 'fighting') {
        setPhase('result');
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [myPet, opponentPet, result, phase]);

  useEffect(() => {
    if (phase === 'result' && !resultShownRef.current) {
      resultShownRef.current = true;
    }
  }, [phase]);

  const iWon = result.winnerUid === myPet.uid;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

      {phase === 'result' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)',
          }}
        >
          <div
            className={iWon ? 'winner-glow' : ''}
            style={{
              fontSize: 36,
              fontWeight: 900,
              fontFamily: 'Orbitron, sans-serif',
              color: iWon ? '#FFD700' : '#FF6B6B',
              textShadow: iWon
                ? '0 0 20px rgba(255,215,0,0.6), 0 0 40px rgba(255,215,0,0.3)'
                : '0 0 10px rgba(255,107,107,0.4)',
              marginBottom: 12,
            }}
          >
            {iWon ? '🎉 胜利!' : result.isDraw ? '🤝 平局' : '💔 落败'}
          </div>
          <div style={{ color: '#aaa', fontSize: 14, marginBottom: 8 }}>
            {iWon ? `获得 ${result.rewardPoints} 积分` : `获得 ${result.rewardPoints} 安慰积分`}
          </div>
          <button
            onClick={onFinish}
            style={{
              padding: '10px 28px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'transform 0.1s',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            返回展柜
          </button>
        </div>
      )}
    </div>
  );
}

function drawPetSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  name: string
) {
  ctx.save();

  ctx.shadowColor = color;
  ctx.shadowBlur = 10;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y - 18, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(x, y + 8, 14, 18, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x - 6, y - 20, 4, 0, Math.PI * 2);
  ctx.arc(x + 6, y - 20, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(x - 6, y - 20, 2, 0, Math.PI * 2);
  ctx.arc(x + 6, y - 20, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ccc';
  ctx.font = '11px "Noto Sans SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(name, x, y + 40);

  ctx.restore();
}
