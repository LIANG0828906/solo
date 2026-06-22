import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Recipe,
  DyeMaterial,
  blendDyeColors,
  ColorResult,
  rgbToHex,
  findClosestPantone,
  pantoneMap,
} from './data/recipes';

interface ColorCardProps {
  recipe: Recipe | null;
  materials: DyeMaterial[];
  onShowDetail?: (color: ColorResult) => void;
}

function addRipple(e: React.MouseEvent<HTMLElement>) {
  const target = e.currentTarget;
  const rect = target.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  target.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

function shadeAdjust(r: number, g: number, b: number, factor: number) {
  const adj = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c + (factor > 0 ? (255 - c) * factor : c * factor))));
  return { r: adj(r), g: adj(g), b: adj(b) };
}

const ColorCard: React.FC<ColorCardProps> = ({ recipe, materials, onShowDetail }) => {
  const colorResult: ColorResult = useMemo(
    () => blendDyeColors(recipe?.steps || [], materials),
    [recipe?.steps, materials]
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [exporting, setExporting] = useState(false);

  const gradientStyle = useMemo(() => {
    const { r, g, b } = colorResult.mainColor;
    const { r: sr, g: sg, b: sb } = colorResult.secondaryColor;
    const light = shadeAdjust(r, g, b, 0.2);
    const dark = shadeAdjust(r, g, b, -0.2);
    const center = `rgb(${Math.round((sr + r) / 2)}, ${Math.round((sg + g) / 2)}, ${Math.round((sb + b) / 2)})`;
    return `radial-gradient(circle at 50% 50%, ${center} 0%, rgb(${r},${g},${b}) 45%, rgb(${light.r},${light.g},${light.b}) 70%, rgb(${dark.r},${dark.g},${dark.b}) 100%)`;
  }, [colorResult]);

  const swatches = useMemo(() => {
    const { r, g, b } = colorResult.mainColor;
    return [
      shadeAdjust(r, g, b, -0.4),
      shadeAdjust(r, g, b, -0.2),
      colorResult.mainColor,
      shadeAdjust(r, g, b, 0.2),
      shadeAdjust(r, g, b, 0.4),
    ];
  }, [colorResult.mainColor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !recipe || exporting) return;
  }, [recipe, exporting]);

  const exportPNG = async () => {
    if (!recipe) return;
    setExporting(true);
    await new Promise((r) => setTimeout(r, 50));
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 800, 600);

    const { r, g, b } = colorResult.mainColor;
    const { r: sr, g: sg, b: sb } = colorResult.secondaryColor;
    const light = shadeAdjust(r, g, b, 0.2);
    const dark = shadeAdjust(r, g, b, -0.2);
    const center = `rgb(${Math.round((sr + r) / 2)}, ${Math.round((sg + g) / 2)}, ${Math.round((sb + b) / 2)})`;

    const gradient = ctx.createRadialGradient(400, 300, 0, 400, 300, 500);
    gradient.addColorStop(0, center);
    gradient.addColorStop(0.45, `rgb(${r},${g},${b})`);
    gradient.addColorStop(0.7, `rgb(${light.r},${light.g},${light.b})`);
    gradient.addColorStop(1, `rgb(${dark.r},${dark.g},${dark.b})`);
    ctx.fillStyle = gradient;

    const radius = 24;
    const x = 0,
      y = 0,
      w = 800,
      h = 600;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillRect(0, 480, 800, 120);
    ctx.fillStyle = '#3D3530';
    ctx.font = 'bold 28px -apple-system, sans-serif';
    ctx.fillText(recipe.name, 40, 520);
    ctx.font = '14px monospace';
    ctx.fillText(colorResult.hex, 40, 548);
    ctx.fillText(colorResult.pantoneApprox, 40, 570);
    ctx.fillText(`RGB(${r}, ${g}, ${b})`, 300, 548);
    ctx.font = '14px -apple-system, sans-serif';
    ctx.fillStyle = '#8B8378';
    ctx.fillText(`面料：${recipe.fabricType}    类型：${
      recipe.dyeType === 'direct' ? '直接染' : recipe.dyeType === 'mordant' ? '媒染' : '还原染'
    }`, 300, 570);

    const link = document.createElement('a');
    link.download = `${recipe.name}-色卡.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setExporting(false);
  };

  const pantoneEntry = useMemo(() => {
    const p = pantoneMap.find((x) => x.code === colorResult.pantoneApprox);
    return p || pantoneMap[0];
  }, [colorResult.pantoneApprox]);

  if (!recipe) {
    return (
      <div className="panel color-card-panel">
        <div className="panel-header">
          <span className="panel-title">色卡预览</span>
        </div>
        <div className="empty-state" style={{ padding: '60px 20px' }}>
          <div className="empty-state-icon">🌈</div>
          <div className="empty-state-title">暂无色卡预览</div>
          <div className="empty-state-desc">选择一个配方以查看染色效果和色卡详情</div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel color-card-panel">
      <div className="panel-header">
        <span className="panel-title">色卡预览</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-ghost"
            onClick={(e) => {
              addRipple(e);
              exportPNG();
            }}
          >
            {exporting ? '导出中...' : '⬇ 导出PNG'}
          </button>
          <button
            className="btn btn-ghost"
            onClick={(e) => {
              addRipple(e);
              onShowDetail?.(colorResult);
            }}
          >
            🔍 查看详情
          </button>
        </div>
      </div>

      <div className="color-card-wrap">
        <div
          className="color-card"
          style={{ background: gradientStyle }}
          onClick={() => onShowDetail?.(colorResult)}
          title="点击查看详细色值"
        >
          <div className="color-card-info">
            <div className="color-card-name">{recipe.name}</div>
            <div className="color-card-hex">{colorResult.hex}</div>
          </div>
        </div>
      </div>

      <div className="color-details">
        <div className="color-detail-item">
          <div className="color-detail-label">HEX</div>
          <div className="color-detail-value">{colorResult.hex}</div>
        </div>
        <div className="color-detail-item">
          <div className="color-detail-label">RGB</div>
          <div className="color-detail-value">
            {colorResult.mainColor.r},{colorResult.mainColor.g},{colorResult.mainColor.b}
          </div>
        </div>
        <div className="color-detail-item">
          <div className="color-detail-label">CMYK</div>
          <div className="color-detail-value" style={{ fontSize: '11px' }}>
            {(
              ({ r, g, b }) => {
                const rp = r / 255,
                  gp = g / 255,
                  bp = b / 255;
                const k = 1 - Math.max(rp, gp, bp);
                const c = k === 1 ? 0 : (1 - rp - k) / (1 - k);
                const m = k === 1 ? 0 : (1 - gp - k) / (1 - k);
                const y = k === 1 ? 0 : (1 - bp - k) / (1 - k);
                return `${Math.round(c * 100)} ${Math.round(m * 100)} ${Math.round(
                  y * 100
                )} ${Math.round(k * 100)}`;
              }
            )(colorResult.mainColor)}
          </div>
        </div>
      </div>

      <div className="color-palette">
        {swatches.map((c, i) => (
          <div
            key={i}
            className="color-swatch"
            style={{ background: `rgb(${c.r},${c.g},${c.b})` }}
            title={rgbToHex(c.r, c.g, c.b)}
            onClick={() => {
              const hex = rgbToHex(c.r, c.g, c.b);
              navigator.clipboard?.writeText(hex);
            }}
          >
            <span className="color-swatch-label">{rgbToHex(c.r, c.g, c.b)}</span>
          </div>
        ))}
      </div>

      <div className="pantone-box">
        <div className="pantone-color" style={{ background: pantoneEntry.hex }} />
        <div className="pantone-info">
          <div className="pantone-code">{colorResult.pantoneApprox}</div>
          <div className="pantone-name">近似 PANTONE 色号 · {pantoneEntry.name}</div>
        </div>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default ColorCard;
