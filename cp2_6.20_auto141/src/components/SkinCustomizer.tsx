import { useRef, useEffect } from 'react';
import { useSkinStore } from '@/store/useSkinStore';

const COLOR_PALETTE = [
  '#00d9ff', '#00f5d4', '#ff006e', '#b5179e',
  '#ffbe0b', '#fb5607', '#8338ec', '#3a86ff',
  '#06ffa5', '#ff006e', '#7209b7', '#f72585',
  '#4cc9f0', '#4895ef', '#4361ee', '#3f37c9',
];

const ACCESSORY_OPTIONS = {
  glasses: [
    { value: null, label: '无' },
    { value: 'style1', label: '圆形' },
    { value: 'style2', label: '方形' },
    { value: 'style3', label: '猫眼' },
  ],
  helmet: [
    { value: null, label: '无' },
    { value: 'style1', label: '安全帽' },
    { value: 'style2', label: '牛角盔' },
    { value: 'style3', label: '皇冠' },
  ],
  cape: [
    { value: null, label: '无' },
    { value: 'style1', label: '短披风' },
    { value: 'style2', label: '长披风' },
    { value: 'style3', label: '翼状披风' },
  ],
};

export default function SkinCustomizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { skin, playerName, setColor, setAccessory, setPlayerName, loadFromStorage } = useSkinStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawCharacter(ctx, skin.color, skin.accessory);
  }, [skin]);

  const drawCharacter = (
    ctx: CanvasRenderingContext2D,
    color: string,
    accessory: { glasses: string | null; helmet: string | null; cape: string | null }
  ) => {
    const width = 120;
    const height = 160;
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const headSize = 28;
    const headY = 35;

    const bodyW = 40;
    const bodyH = 50;
    const bodyY = headY + headSize + 5;

    if (accessory.cape) {
      drawCape(ctx, centerX, bodyY, bodyW, bodyH, color, accessory.cape);
    }

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.arc(centerX, headY, headSize / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillRect(centerX - bodyW / 2, bodyY, bodyW, bodyH);

    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(centerX - 7, headY - 4, 4, 4);
    ctx.fillRect(centerX + 3, headY - 4, 4, 4);

    const legW = 10;
    const legH = 30;
    ctx.fillStyle = color;
    ctx.fillRect(centerX - bodyW / 2 + 5, bodyY + bodyH, legW, legH);
    ctx.fillRect(centerX + bodyW / 2 - 15, bodyY + bodyH, legW, legH);

    const armW = 8;
    const armH = 25;
    ctx.fillRect(centerX - bodyW / 2 - armW - 2, bodyY + 8, armW, armH);
    ctx.fillRect(centerX + bodyW / 2 + 2, bodyY + 8, armW, armH);

    if (accessory.glasses) {
      drawGlasses(ctx, centerX, headY, accessory.glasses);
    }

    if (accessory.helmet) {
      drawHelmet(ctx, centerX, headY, headSize, accessory.helmet);
    }
  };

  const drawGlasses = (ctx: CanvasRenderingContext2D, cx: number, cy: number, style: string) => {
    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f5d4';
    ctx.shadowBlur = 5;

    if (style === 'style1') {
      ctx.beginPath();
      ctx.arc(cx - 7, cy - 2, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + 7, cy - 2, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 1, cy - 2);
      ctx.lineTo(cx + 1, cy - 2);
      ctx.stroke();
    } else if (style === 'style2') {
      ctx.strokeRect(cx - 13, cy - 7, 12, 10);
      ctx.strokeRect(cx + 1, cy - 7, 12, 10);
      ctx.beginPath();
      ctx.moveTo(cx - 1, cy - 2);
      ctx.lineTo(cx + 1, cy - 2);
      ctx.stroke();
    } else if (style === 'style3') {
      ctx.beginPath();
      ctx.moveTo(cx - 13, cy - 2);
      ctx.lineTo(cx - 5, cy - 7);
      ctx.lineTo(cx - 2, cy - 2);
      ctx.lineTo(cx - 8, cy + 3);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 13, cy - 2);
      ctx.lineTo(cx + 5, cy - 7);
      ctx.lineTo(cx + 2, cy - 2);
      ctx.lineTo(cx + 8, cy + 3);
      ctx.closePath();
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
  };

  const drawHelmet = (ctx: CanvasRenderingContext2D, cx: number, cy: number, headSize: number, style: string) => {
    const helmetColor = '#8338ec';
    ctx.fillStyle = helmetColor;
    ctx.shadowColor = helmetColor;
    ctx.shadowBlur = 8;

    if (style === 'style1') {
      ctx.beginPath();
      ctx.arc(cx, cy - 2, headSize / 2 + 3, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(cx - headSize / 2 - 3, cy - 2, headSize + 6, 6);
    } else if (style === 'style2') {
      ctx.beginPath();
      ctx.arc(cx, cy - 2, headSize / 2 + 3, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(cx - headSize / 2 - 3, cy - 2, headSize + 6, 6);

      ctx.fillStyle = '#ff006e';
      ctx.beginPath();
      ctx.moveTo(cx - headSize / 2 - 2, cy - headSize / 2);
      ctx.lineTo(cx - headSize / 2 - 8, cy - headSize / 2 - 12);
      ctx.lineTo(cx - headSize / 2 + 2, cy - headSize / 2 - 3);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + headSize / 2 + 2, cy - headSize / 2);
      ctx.lineTo(cx + headSize / 2 + 8, cy - headSize / 2 - 12);
      ctx.lineTo(cx + headSize / 2 - 2, cy - headSize / 2 - 3);
      ctx.closePath();
      ctx.fill();
    } else if (style === 'style3') {
      ctx.fillStyle = '#ffbe0b';
      ctx.shadowColor = '#ffbe0b';
      ctx.beginPath();
      ctx.moveTo(cx - headSize / 2, cy - 2);
      ctx.lineTo(cx - headSize / 2, cy - headSize / 2 - 5);
      ctx.lineTo(cx - headSize / 4, cy - headSize / 2 + 2);
      ctx.lineTo(cx, cy - headSize / 2 - 10);
      ctx.lineTo(cx + headSize / 4, cy - headSize / 2 + 2);
      ctx.lineTo(cx + headSize / 2, cy - headSize / 2 - 5);
      ctx.lineTo(cx + headSize / 2, cy - 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fb5607';
      ctx.beginPath();
      ctx.arc(cx, cy - headSize / 2 - 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
  };

  const drawCape = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    bodyY: number,
    bodyW: number,
    bodyH: number,
    color: string,
    style: string
  ) => {
    const capeColor = '#7209b7';
    ctx.fillStyle = capeColor;
    ctx.shadowColor = capeColor;
    ctx.shadowBlur = 5;

    if (style === 'style1') {
      ctx.beginPath();
      ctx.moveTo(cx - bodyW / 2 - 5, bodyY + 5);
      ctx.lineTo(cx - bodyW / 2 - 10, bodyY + bodyH + 10);
      ctx.lineTo(cx + bodyW / 2 + 10, bodyY + bodyH + 10);
      ctx.lineTo(cx + bodyW / 2 + 5, bodyY + 5);
      ctx.closePath();
      ctx.fill();
    } else if (style === 'style2') {
      ctx.beginPath();
      ctx.moveTo(cx - bodyW / 2 - 5, bodyY + 5);
      ctx.lineTo(cx - bodyW / 2 - 15, bodyY + bodyH + 35);
      ctx.lineTo(cx + bodyW / 2 + 15, bodyY + bodyH + 35);
      ctx.lineTo(cx + bodyW / 2 + 5, bodyY + 5);
      ctx.closePath();
      ctx.fill();
    } else if (style === 'style3') {
      ctx.beginPath();
      ctx.moveTo(cx - bodyW / 2 - 5, bodyY + 10);
      ctx.lineTo(cx - bodyW / 2 - 25, bodyY + bodyH - 5);
      ctx.lineTo(cx - bodyW / 2 - 15, bodyY + bodyH + 15);
      ctx.lineTo(cx + bodyW / 2 + 15, bodyY + bodyH + 15);
      ctx.lineTo(cx + bodyW / 2 + 25, bodyY + bodyH - 5);
      ctx.lineTo(cx + bodyW / 2 + 5, bodyY + 10);
      ctx.closePath();
      ctx.fill();
    }

    ctx.shadowBlur = 0;
  };

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--neon-cyan)', textShadow: '0 0 10px rgba(0, 245, 212, 0.5)' }}>
        角色定制
      </h3>

      <div className="flex justify-center mb-6">
        <div
          className="rounded-lg p-4"
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(0, 245, 212, 0.3)',
            boxShadow: '0 0 20px rgba(0, 245, 212, 0.1)',
          }}
        >
          <canvas ref={canvasRef} width={120} height={160} className="animate-pulse" />
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
          玩家昵称
        </label>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-transparent border focus:outline-none transition-all"
          style={{
            borderColor: 'rgba(0, 245, 212, 0.3)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--neon-cyan)';
            e.target.style.boxShadow = '0 0 10px rgba(0, 245, 212, 0.3)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(0, 245, 212, 0.3)';
            e.target.style.boxShadow = 'none';
          }}
          maxLength={12}
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
          颜色选择
        </label>
        <div className="grid grid-cols-8 gap-2">
          {COLOR_PALETTE.map((color, index) => (
            <button
              key={index}
              onClick={() => setColor(color)}
              className="w-8 h-8 rounded-full transition-all hover:scale-110"
              style={{
                backgroundColor: color,
                boxShadow: skin.color === color ? `0 0 15px ${color}` : 'none',
                transform: skin.color === color ? 'scale(1.1)' : 'scale(1)',
                border: skin.color === color ? '2px solid #ffffff' : '2px solid transparent',
              }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            眼镜
          </label>
          <div className="grid grid-cols-4 gap-2">
            {ACCESSORY_OPTIONS.glasses.map((option) => (
              <button
                key={option.value || 'none'}
                onClick={() => setAccessory('glasses', option.value)}
                className="py-2 px-2 text-xs rounded-lg transition-all neon-button"
                style={{
                  background: skin.accessory.glasses === option.value
                    ? 'linear-gradient(135deg, rgba(0, 245, 212, 0.3), rgba(181, 23, 158, 0.3))'
                    : 'linear-gradient(135deg, rgba(0, 245, 212, 0.1), rgba(181, 23, 158, 0.1))',
                  color: skin.accessory.glasses === option.value ? 'var(--neon-cyan)' : 'var(--text-primary)',
                  boxShadow: skin.accessory.glasses === option.value ? '0 0 10px rgba(0, 245, 212, 0.5)' : 'none',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            头盔
          </label>
          <div className="grid grid-cols-4 gap-2">
            {ACCESSORY_OPTIONS.helmet.map((option) => (
              <button
                key={option.value || 'none'}
                onClick={() => setAccessory('helmet', option.value)}
                className="py-2 px-2 text-xs rounded-lg transition-all neon-button"
                style={{
                  background: skin.accessory.helmet === option.value
                    ? 'linear-gradient(135deg, rgba(0, 245, 212, 0.3), rgba(181, 23, 158, 0.3))'
                    : 'linear-gradient(135deg, rgba(0, 245, 212, 0.1), rgba(181, 23, 158, 0.1))',
                  color: skin.accessory.helmet === option.value ? 'var(--neon-cyan)' : 'var(--text-primary)',
                  boxShadow: skin.accessory.helmet === option.value ? '0 0 10px rgba(0, 245, 212, 0.5)' : 'none',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            披风
          </label>
          <div className="grid grid-cols-4 gap-2">
            {ACCESSORY_OPTIONS.cape.map((option) => (
              <button
                key={option.value || 'none'}
                onClick={() => setAccessory('cape', option.value)}
                className="py-2 px-2 text-xs rounded-lg transition-all neon-button"
                style={{
                  background: skin.accessory.cape === option.value
                    ? 'linear-gradient(135deg, rgba(0, 245, 212, 0.3), rgba(181, 23, 158, 0.3))'
                    : 'linear-gradient(135deg, rgba(0, 245, 212, 0.1), rgba(181, 23, 158, 0.1))',
                  color: skin.accessory.cape === option.value ? 'var(--neon-cyan)' : 'var(--text-primary)',
                  boxShadow: skin.accessory.cape === option.value ? '0 0 10px rgba(0, 245, 212, 0.5)' : 'none',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
