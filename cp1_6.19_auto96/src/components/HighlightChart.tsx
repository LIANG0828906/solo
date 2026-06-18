import { useEffect, useRef } from 'react';
import { useJointStore } from '../store/useJointStore';
import { getJointConfig, JOINTS, JointKey } from '../utils/anatomyData';

const WIDTH = 240;
const HEIGHT = 160;
const PADDING = { top: 20, right: 12, bottom: 24, left: 36 };

export function HighlightChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { selectedJoint, history, angles } = useJointStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    ctx.scale(dpr, dpr);

    const chartWidth = WIDTH - PADDING.left - PADDING.right;
    const chartHeight = HEIGHT - PADDING.top - PADDING.bottom;
    const now = Date.now();
    const timeSpan = 30000;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = '#2C2C2C';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const jointConfig = getJointConfig(selectedJoint);
    const jointHistory = history[selectedJoint] || [];
    const jointRange = jointConfig.range;

    const rangePadding = Math.abs(jointRange.max - jointRange.min) * 0.1;
    const yMin = jointRange.min - rangePadding;
    const yMax = jointRange.max + rangePadding;
    const yRange = yMax - yMin;

    const getX = (timestamp: number) => {
      const normalized = Math.max(0, (now - timestamp) / timeSpan);
      return PADDING.left + (1 - normalized) * chartWidth;
    };

    const getY = (angle: number) => {
      const normalized = (angle - yMin) / yRange;
      return PADDING.top + (1 - normalized) * chartHeight;
    };

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;

    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const y = PADDING.top + (i / yTicks) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(PADDING.left + chartWidth, y);
      ctx.stroke();

      const value = yMax - (i / yTicks) * yRange;
      ctx.fillStyle = '#9e9e9e';
      ctx.font = '10px Consolas, monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${value.toFixed(0)}°`, PADDING.left - 4, y);
    }

    const xTicks = 6;
    for (let i = 0; i <= xTicks; i++) {
      const x = PADDING.left + (i / xTicks) * chartWidth;
      const secondsAgo = (1 - i / xTicks) * 30;
      ctx.fillStyle = '#9e9e9e';
      ctx.font = '9px Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`${secondsAgo.toFixed(0)}s`, x, PADDING.top + chartHeight + 4);
    }

    ctx.strokeStyle = 'rgba(76, 175, 80, 0.3)';
    ctx.lineWidth = 1;
    const safeMinY = getY(jointRange.safeMin);
    const safeMaxY = getY(jointRange.safeMax);
    ctx.beginPath();
    ctx.moveTo(PADDING.left, safeMinY);
    ctx.lineTo(PADDING.left + chartWidth, safeMinY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(PADDING.left, safeMaxY);
    ctx.lineTo(PADDING.left + chartWidth, safeMaxY);
    ctx.stroke();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(PADDING.left, PADDING.top);
    ctx.lineTo(PADDING.left, PADDING.top + chartHeight);
    ctx.lineTo(PADDING.left + chartWidth, PADDING.top + chartHeight);
    ctx.stroke();

    if (jointHistory.length > 1) {
      ctx.strokeStyle = jointConfig.color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();

      jointHistory.forEach((point, idx) => {
        const x = getX(point.timestamp);
        const y = getY(point.angle);
        if (idx === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      const lastPoint = jointHistory[jointHistory.length - 1];
      const lastX = getX(lastPoint.timestamp);
      const lastY = getY(lastPoint.angle);
      ctx.fillStyle = jointConfig.color;
      ctx.beginPath();
      ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    const currentAngle = angles[selectedJoint];
    const currentY = getY(currentAngle);
    ctx.fillStyle = jointConfig.color;
    ctx.beginPath();
    ctx.arc(PADDING.left + chartWidth, currentY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${jointConfig.name} 角度变化`, PADDING.left, 6);

    const allJointLabels = JOINTS
      .map((j) => `${j.name}: ${angles[j.key as JointKey].toFixed(0)}°`)
      .join(' | ');
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '9px Consolas, monospace';
    ctx.fillText(allJointLabels, PADDING.left, HEIGHT - 12);

    return () => {};
  }, [selectedJoint, history, angles]);

  return (
    <div className="chart-overlay">
      <canvas ref={canvasRef} />
    </div>
  );
}

export default HighlightChart;
