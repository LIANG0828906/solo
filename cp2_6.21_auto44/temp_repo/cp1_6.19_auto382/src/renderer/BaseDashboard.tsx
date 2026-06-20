import React, { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, RESOURCE_NAMES } from '@/store/gameStore';
import { isOverflowActive } from '@/core/resourceFlow';

const AnimatedValue: React.FC<{ value: number; label: string; color: string; icon: string }> = ({
  value,
  label,
  color,
  icon,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <span style={{ fontSize: 16 }}>{icon}</span>
    <div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>{label}</div>
      <motion.div
        key={value}
        initial={{ scale: 1.05, opacity: 0.8 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        style={{ color, fontWeight: 700, fontSize: 18, fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </motion.div>
    </div>
  </div>
);

const TrendChart: React.FC = React.memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const productionHistory = useGameStore((s) => s.productionHistory);
  const warningFlashActive = useGameStore((s) => s.warningFlashActive);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 300;
    const H = 100;
    canvas.width = W * 2;
    canvas.height = H * 2;
    ctx.scale(2, 2);
    ctx.clearRect(0, 0, W, H);

    if (warningFlashActive) {
      ctx.fillStyle = 'rgba(255,0,0,0.1)';
      ctx.fillRect(0, 0, W, H);
    }

    const data = productionHistory;
    if (data.length < 2) return;

    const maxVal = Math.max(
      10,
      Math.ceil(Math.max(...data.map((d) => Math.max(d.energy, d.mineral))) / 10) * 10
    );

    const xStep = W / Math.max(1, data.length - 1);

    const drawLine = (values: number[], color: string) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      for (let i = 0; i < values.length; i++) {
        const x = i * xStep;
        const y = H - (values[i] / maxVal) * (H - 10);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    drawLine(data.map((d) => d.energy), '#42A5F5');
    drawLine(data.map((d) => d.mineral), '#8D6E63');

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '8px monospace';
    ctx.fillText(`${maxVal}`, 2, 10);
    ctx.fillText('0', 2, H - 2);

    if (data.length > 1) {
      const totalTime = data[data.length - 1].timestamp - data[0].timestamp;
      const step = Math.max(1, Math.floor(totalTime / 6));
      for (let t = data[0].timestamp; t <= data[data.length - 1].timestamp; t += step) {
        const idx = data.findIndex((d) => d.timestamp >= t);
        if (idx >= 0) {
          const x = idx * xStep;
          const secs = Math.floor(t / 1000);
          ctx.fillText(`${secs % 60}s`, x, H - 1);
        }
      }
    }
  }, [productionHistory, warningFlashActive]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: 300, height: 100, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.2)' }}
    />
  );
});
TrendChart.displayName = 'TrendChart';

const BaseDashboard: React.FC = React.memo(() => {
  const resources = useGameStore((s) => s.resources);
  const totalProduction = useGameStore((s) => s.totalProduction);
  const warehouseCapacity = useGameStore((s) => s.warehouseCapacity);
  const overflow = isOverflowActive();

  const totalStored = resources.energy + resources.mineral + resources.processedGoods;

  const panelStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.18)',
    backdropFilter: 'blur(12px)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
  };

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 12 }}>
        <AnimatedValue value={resources.energy} label={RESOURCE_NAMES.energy} color="#42A5F5" icon="⚡" />
        <AnimatedValue value={resources.mineral} label={RESOURCE_NAMES.mineral} color="#8D6E63" icon="🪨" />
        <AnimatedValue value={resources.population} label={RESOURCE_NAMES.population} color="#E0E0E0" icon="👤" />
        <AnimatedValue value={resources.processedGoods} label={RESOURCE_NAMES.processedGoods} color="#66BB6A" icon="⚙" />
        <AnimatedValue value={totalProduction} label="总生产" color="#FFD54F" icon="📦" />
      </div>

      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>仓库</span>
        <div
          style={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            backgroundColor: 'rgba(255,255,255,0.1)',
            overflow: 'hidden',
          }}
        >
          <motion.div
            animate={{ width: `${Math.min(100, (totalStored / warehouseCapacity) * 100)}%` }}
            transition={{ duration: 0.3 }}
            style={{
              height: '100%',
              borderRadius: 3,
              backgroundColor: overflow ? '#F44336' : '#66BB6A',
            }}
          />
        </div>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>
          {totalStored}/{warehouseCapacity}
        </span>
      </div>

      <TrendChart />
    </div>
  );
});
BaseDashboard.displayName = 'BaseDashboard';

export default BaseDashboard;
