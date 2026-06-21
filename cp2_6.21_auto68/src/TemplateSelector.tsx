import React, { useRef, useEffect } from 'react';
import type { BackgroundTemplate } from './CanvasRenderer';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './CanvasRenderer';

interface TemplateSelectorProps {
  selected: BackgroundTemplate;
  onChange: (template: BackgroundTemplate) => void;
}

const TEMPLATES: { id: BackgroundTemplate; name: string }[] = [
  { id: 'gradient-linear', name: '纯色渐变' },
  { id: 'gradient-radial', name: '径向渐变' },
  { id: 'stripes', name: '斜向条纹' },
  { id: 'polygons', name: '多边形几何' },
  { id: 'grain', name: '颗粒纹理' },
];

function drawTemplatePreview(ctx: CanvasRenderingContext2D, template: BackgroundTemplate, w: number, h: number) {
  switch (template) {
    case 'gradient-linear': {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#667eea');
      g.addColorStop(1, '#764ba2');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case 'gradient-radial': {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 2);
      g.addColorStop(0, '#ffecd2');
      g.addColorStop(1, '#fcb69f');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case 'stripes': {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(45 * Math.PI / 180);
      const sw = 8;
      const diag = Math.sqrt(w * w + h * h);
      ctx.fillStyle = '#f0f0f0';
      for (let i = -diag; i < diag; i += sw * 2) {
        ctx.fillRect(i, -diag, sw, diag * 2);
      }
      ctx.restore();
      break;
    }
    case 'polygons': {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d'];
      const tris = [
        { x: 0.2, y: 0.3, s: 0.3, c: 0, r: 15 },
        { x: 0.8, y: 0.35, s: 0.25, c: 1, r: -20 },
        { x: 0.5, y: 0.75, s: 0.35, c: 2, r: 30 },
      ];
      tris.forEach((t) => {
        ctx.save();
        ctx.translate(t.x * w, t.y * h);
        ctx.rotate((t.r * Math.PI) / 180);
        ctx.fillStyle = colors[t.c] + '4D';
        const sz = t.s * Math.min(w, h);
        ctx.beginPath();
        ctx.moveTo(0, -sz / 2);
        ctx.lineTo(sz / 2, sz / 2);
        ctx.lineTo(-sz / 2, sz / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
      break;
    }
    case 'grain': {
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const grain = (Math.random() - 0.5) * 30;
        data[i] = Math.max(0, Math.min(255, data[i] + grain));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain));
      }
      ctx.putImageData(imgData, 0, 0);
      break;
    }
  }
}

const TemplateThumb: React.FC<{
  template: BackgroundTemplate;
  name: string;
  isSelected: boolean;
  onClick: () => void;
}> = ({ template, name, isSelected, onClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    drawTemplatePreview(ctx, template, w, h);
  }, [template]);

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: '80px',
          height: '60px',
          borderRadius: '8px',
          overflow: 'hidden',
          border: isSelected ? '2px solid #74b9ff' : '2px solid transparent',
          boxShadow: isSelected ? '0 2px 8px rgba(116, 185, 255, 0.4)' : '0 1px 3px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
          }
        }}
      >
        <canvas
          ref={canvasRef}
          width={80}
          height={60}
          style={{ display: 'block', width: '100%', height: '100%' }}
        />
      </div>
      <span style={{ fontSize: '11px', color: isSelected ? '#0984e3' : '#6c757d', fontWeight: isSelected ? 600 : 400 }}>
        {name}
      </span>
    </div>
  );
};

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ selected, onChange }) => {
  return (
    <div>
      <div style={{
        backgroundColor: '#f1f3f5',
        borderRadius: '8px',
        padding: '8px 12px',
        fontWeight: 600,
        fontSize: '14px',
        color: '#495057',
        marginBottom: '12px'
      }}>
        背景模板
      </div>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {TEMPLATES.map((t) => (
          <TemplateThumb
            key={t.id}
            template={t.id}
            name={t.name}
            isSelected={selected === t.id}
            onClick={() => onChange(t.id)}
          />
        ))}
      </div>
    </div>
  );
};
