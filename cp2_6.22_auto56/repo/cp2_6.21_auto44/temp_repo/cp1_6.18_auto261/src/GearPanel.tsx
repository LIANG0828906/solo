import React, { useRef } from 'react';
import { useGearStore } from './store';

interface GearTemplate {
  radius: number;
  teeth: number;
  name: string;
}

const gearTemplates: GearTemplate[] = [
  { radius: 20, teeth: 8, name: '小型齿轮 (8齿)' },
  { radius: 25, teeth: 10, name: '小型齿轮 (10齿)' },
  { radius: 30, teeth: 12, name: '中型齿轮 (12齿)' },
  { radius: 35, teeth: 12, name: '中型齿轮 (12齿)' },
  { radius: 40, teeth: 14, name: '大型齿轮 (14齿)' },
  { radius: 50, teeth: 16, name: '大型齿轮 (16齿)' },
];

const GearPanel: React.FC = () => {
  const { addGear, startEngine, stopEngine, isRunning } = useGearStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent, template: GearTemplate) => {
    e.dataTransfer.setData('gearData', JSON.stringify(template));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('gearData');
    if (data) {
      const template = JSON.parse(data) as GearTemplate;
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        addGear({
          x,
          y,
          radius: template.radius,
          teeth: template.teeth
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const drawMiniGear = (ctx: CanvasRenderingContext2D, radius: number, teeth: number) => {
    const centerX = 35;
    const centerY = 35;
    const toothHeight = radius * 0.15;
    const innerRadius = radius - toothHeight;
    const angleStep = (Math.PI * 2) / teeth;

    ctx.clearRect(0, 0, 70, 70);

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, '#A0845C');
    gradient.addColorStop(1, '#7B5B3A');

    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
      const angle = i * angleStep;
      const nextAngle = (i + 1) * angleStep;
      const midAngle = angle + angleStep / 2;

      const innerX1 = centerX + Math.cos(angle) * innerRadius;
      const innerY1 = centerY + Math.sin(angle) * innerRadius;
      const outerX = centerX + Math.cos(midAngle) * radius;
      const outerY = centerY + Math.sin(midAngle) * radius;
      const innerX2 = centerX + Math.cos(nextAngle) * innerRadius;
      const innerY2 = centerY + Math.sin(nextAngle) * innerRadius;

      if (i === 0) {
        ctx.moveTo(innerX1, innerY1);
      }
      ctx.lineTo(outerX, outerY);
      ctx.lineTo(innerX2, innerY2);
    }
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#5C4033';
    ctx.fill();
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = '#DAA520';
    ctx.fill();
  };

  const canvasRefs = useRef<Map<number, HTMLCanvasElement | null>>(new Map());

  React.useEffect(() => {
    gearTemplates.forEach((template, index) => {
      const canvas = canvasRefs.current.get(index);
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawMiniGear(ctx, template.radius, template.teeth);
        }
      }
    });
  }, []);

  return (
    <div
      style={{
        width: '200px',
        height: '100%',
        background: 'linear-gradient(180deg, #2A1810 0%, #1C1109 100%)',
        borderRight: '3px solid #8B5A2B',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'inset -4px 0 8px rgba(0, 0, 0, 0.5)',
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div
        style={{
          padding: '16px 12px',
          borderBottom: '2px solid #8B5A2B',
          background: 'linear-gradient(90deg, #3D2817 0%, #2A1810 100%)',
        }}
      >
          <h2
            style={{
              margin: 0,
              color: '#DAA520',
              fontSize: '18px',
              fontFamily: 'serif',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
              textAlign: 'center',
              letterSpacing: '2px',
            }}
          >
            ⚙ 齿轮库
          </h2>
      </div>

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {gearTemplates.map((template, index) => (
          <div
          // eslint-disable-next-line
            key={index}
            draggable
            onDragStart={(e) => handleDragStart(e, template)}
            style={{
              background: 'linear-gradient(135deg, #3D2817 0%, #2A1810 100%)',
              border: '2px solid #8B5A2B',
              borderRadius: '8px',
              padding: '10px',
              cursor: 'grab',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transition: 'all 0.2s ease',
              boxShadow: '2px 2px 8px rgba(0, 0, 0, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(218, 165, 32, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '2px 2px 8px rgba(0, 0, 0, 0.3)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.cursor = 'grabbing';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.cursor = 'grab';
            }}
          >
            <canvas
              ref={(el) => {
                canvasRefs.current.set(index, el);
              }}
              width={70}
              height={70}
              style={{ marginBottom: '8px' }}
            />
            <span
              style={{
                color: '#C9A96E',
                fontSize: '12px',
                fontFamily: 'serif',
                textAlign: 'center',
              }}
            >
              {template.name}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: '16px 12px',
          borderTop: '2px solid #8B5A2B',
          background: 'linear-gradient(90deg, #2A1810 0%, #3D2817 100%)',
        }}
      >
        <button
          onClick={isRunning ? stopEngine : startEngine}
          style={{
            width: '100%',
            padding: '14px 20px',
            background: isRunning
              ? 'linear-gradient(180deg, #A0522D 0%, #8B4513 100%)'
              : 'linear-gradient(180deg, #CD853F 0%, #8B5A2B 100%)',
            border: '3px solid #C9A96E',
            borderRadius: '8px',
            color: '#F5F5DC',
            fontSize: '16px',
            fontWeight: 'bold',
            fontFamily: 'serif',
            cursor: 'pointer',
            letterSpacing: '2px',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
            transition: 'all 0.1s ease',
            boxShadow: isRunning
              ? 'inset 0 4px 8px rgba(0, 0, 0, 0.4)'
              : '0 4px 8px rgba(0, 0, 0, 0.4)',
            transform: isRunning ? 'translateY(4px)' : 'translateY(0)',
          }}
          onMouseDown={(e) => {
            if (!isRunning) {
              e.currentTarget.style.transform = 'translateY(4px)';
              e.currentTarget.style.boxShadow = 'inset 0 4px 8px rgba(0, 0, 0, 0.4)';
            }
          }}
          onMouseUp={(e) => {
            if (!isRunning) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isRunning) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.4)';
            }
          }}
        >
          {isRunning ? '⏹ 停止' : '▶ 启动'}
        </button>
      </div>
    </div>
  );
};

export default GearPanel;
