import { useRef, useEffect, useCallback } from 'react';
import { useBattleStore } from '../store/battleStore';
import { TYPE_COLORS, CARD_DEFINITIONS } from '../engine/types';
import { CardType } from '../engine/types';

function drawCurveChart(
  canvas: HTMLCanvasElement,
  data: { turn: number; playerValue: number; enemyValue: number }[],
  title: string,
  maxValue: number
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const padLeft = 40;
  const padRight = 16;
  const padTop = 28;
  const padBottom = 24;
  const chartW = w - padLeft - padRight;
  const chartH = h - padTop - padBottom;

  ctx.fillStyle = '#2c2c2c';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#888';
  ctx.font = '11px "Noto Sans SC", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(title, padLeft, 16);

  if (data.length < 2) return;

  const maxTurn = data[data.length - 1].turn;
  const minVal = 0;
  const range = maxValue - minVal;

  ctx.strokeStyle = '#55555588';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const y = padTop + (chartH * i) / 4;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(padLeft + chartW, y);
    ctx.stroke();

    const val = Math.round(maxValue - (range * i) / 4);
    ctx.fillStyle = '#999';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(String(val), padLeft - 4, y + 3);
  }

  for (let i = 0; i < data.length; i++) {
    const x = padLeft + (data[i].turn / maxTurn) * chartW;
    ctx.strokeStyle = '#55555544';
    ctx.beginPath();
    ctx.moveTo(x, padTop);
    ctx.lineTo(x, padTop + chartH);
    ctx.stroke();

    ctx.fillStyle = '#777';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(data[i].turn), x, padTop + chartH + 14);
  }

  const drawLine = (
    key: 'playerValue' | 'enemyValue',
    color: string
  ) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((point, i) => {
      const x = padLeft + (point.turn / maxTurn) * chartW;
      const y = padTop + chartH - ((point[key] - minVal) / range) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    data.forEach((point) => {
      const x = padLeft + (point.turn / maxTurn) * chartW;
      const y = padTop + chartH - ((point[key] - minVal) / range) * chartH;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  drawLine('playerValue', '#42A5F5');
  drawLine('enemyValue', '#EF5350');

  ctx.fillStyle = '#42A5F5';
  ctx.fillRect(padLeft + chartW - 100, 6, 8, 8);
  ctx.fillStyle = '#aaa';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('玩家', padLeft + chartW - 88, 14);

  ctx.fillStyle = '#EF5350';
  ctx.fillRect(padLeft + chartW - 50, 6, 8, 8);
  ctx.fillStyle = '#aaa';
  ctx.fillText('AI', padLeft + chartW - 38, 14);
}

function SkillStats() {
  const skillUsage = useBattleStore((s) => s.skillUsage);
  const entries = Object.entries(skillUsage).sort((a, b) => b[1] - a[1]);
  const maxUsage = entries.length > 0 ? entries[0][1] : 1;

  const getSkillType = (name: string): CardType => {
    const def = CARD_DEFINITIONS.find((d) => d.name === name);
    return def?.type ?? 'attack';
  };

  return (
    <div style={{ padding: '0 16px 16px' }}>
      <div style={{
        fontFamily: "'Orbitron', sans-serif",
        fontSize: '12px',
        color: '#888',
        letterSpacing: '1px',
        marginBottom: '10px',
      }}>
        SKILL STATS
      </div>
      {entries.length === 0 ? (
        <div style={{ color: '#555', fontSize: '12px', textAlign: 'center', padding: '16px' }}>
          暂无数据
        </div>
      ) : (
        entries.map(([name, count]) => {
          const skillType = getSkillType(name);
          const color = TYPE_COLORS[skillType];
          return (
            <div key={name} style={{
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px',
            }}>
              <div style={{
                width: '60px',
                fontSize: '11px',
                color: '#ccc',
                textAlign: 'right',
                flexShrink: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {name}
              </div>
              <div style={{
                flex: 1,
                height: '16px',
                background: '#444',
                borderRadius: '4px',
                overflow: 'hidden',
                position: 'relative',
              }}>
                <div style={{
                  width: `${(count / maxUsage) * 100}%`,
                  height: '100%',
                  background: color,
                  borderRadius: '4px',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <div style={{
                width: '24px',
                fontSize: '11px',
                color: '#aaa',
                textAlign: 'center',
                flexShrink: 0,
              }}>
                {count}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default function StatPanel() {
  const hpHistory = useBattleStore((s) => s.hpHistory);
  const mpHistory = useBattleStore((s) => s.mpHistory);
  const attackHistory = useBattleStore((s) => s.attackHistory);

  const hpCanvasRef = useRef<HTMLCanvasElement>(null);
  const mpCanvasRef = useRef<HTMLCanvasElement>(null);
  const atkCanvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<{ x: number; y: number; text: string } | null>(null);
  const hoverCanvasRef = useRef<HTMLCanvasElement>(null);

  const drawAll = useCallback(() => {
    if (hpCanvasRef.current) drawCurveChart(hpCanvasRef.current, hpHistory, 'HP', 100);
    if (mpCanvasRef.current) drawCurveChart(mpCanvasRef.current, mpHistory, 'MP', 20);
    if (atkCanvasRef.current) drawCurveChart(atkCanvasRef.current, attackHistory, 'ATK', 30);
  }, [hpHistory, mpHistory, attackHistory]);

  useEffect(() => {
    drawAll();
  }, [drawAll]);

  useEffect(() => {
    const handleResize = () => drawAll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawAll]);

  const handleCanvasHover = (
    e: React.MouseEvent<HTMLCanvasElement>,
    data: { turn: number; playerValue: number; enemyValue: number }[]
  ) => {
    if (!hoverCanvasRef.current || data.length < 2) return;
    const canvas = hoverCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padLeft = 40;
    const padRight = 16;
    const chartW = rect.width - padLeft - padRight;

    const maxTurn = data[data.length - 1].turn;
    const ratio = (x - padLeft) / chartW;
    const turnIdx = Math.round(ratio * maxTurn);
    const point = data.find((d) => d.turn === turnIdx);
    if (point) {
      tooltipRef.current = {
        x: e.clientX,
        y: e.clientY,
        text: `T${point.turn} | 玩家: ${Math.round(point.playerValue)} | AI: ${Math.round(point.enemyValue)}`,
      };
    } else {
      tooltipRef.current = null;
    }
  };

  return (
    <div style={{
      padding: '20px 0',
      height: '100%',
      overflow: 'auto',
    }}>
      <div style={{
        fontFamily: "'Orbitron', sans-serif",
        fontSize: '14px',
        fontWeight: 700,
        color: '#e0e0e0',
        letterSpacing: '2px',
        textAlign: 'center',
        marginBottom: '20px',
        textShadow: '0 0 10px rgba(66,165,245,0.3)',
      }}>
        BATTLE ANALYTICS
      </div>

      <div style={{ padding: '0 16px', marginBottom: '12px' }}>
        <canvas
          ref={hpCanvasRef}
          style={{
            width: '100%',
            height: '160px',
            borderRadius: '6px',
            display: 'block',
          }}
          onMouseMove={(e) => handleCanvasHover(e, hpHistory)}
        />
      </div>

      <div style={{ padding: '0 16px', marginBottom: '12px' }}>
        <canvas
          ref={mpCanvasRef}
          style={{
            width: '100%',
            height: '120px',
            borderRadius: '6px',
            display: 'block',
          }}
          onMouseMove={(e) => handleCanvasHover(e, mpHistory)}
        />
      </div>

      <div style={{ padding: '0 16px', marginBottom: '16px' }}>
        <canvas
          ref={atkCanvasRef}
          style={{
            width: '100%',
            height: '120px',
            borderRadius: '6px',
            display: 'block',
          }}
          onMouseMove={(e) => handleCanvasHover(e, attackHistory)}
        />
      </div>

      <canvas
        ref={hoverCanvasRef}
        style={{ position: 'fixed', pointerEvents: 'none', zIndex: -1, width: 0, height: 0 }}
      />

      {tooltipRef.current && (
        <div style={{
          position: 'fixed',
          left: tooltipRef.current.x + 10,
          top: tooltipRef.current.y - 30,
          background: '#333',
          color: '#fff',
          fontSize: '11px',
          padding: '4px 8px',
          borderRadius: '4px',
          pointerEvents: 'none',
          zIndex: 1000,
          whiteSpace: 'nowrap',
        }}>
          {tooltipRef.current.text}
        </div>
      )}

      <SkillStats />
    </div>
  );
}
