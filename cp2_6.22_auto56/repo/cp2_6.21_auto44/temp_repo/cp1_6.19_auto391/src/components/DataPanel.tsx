import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useRootStore } from '../store/rootStore';

export const DataPanel: React.FC = () => {
  const { totalLength, branchCount, maxDepth, waterAbsorptionRate, waterHistory } =
    useRootStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [branchFlash, setBranchFlash] = useState(false);
  const prevBranchCount = useRef(branchCount);

  useEffect(() => {
    if (branchCount > prevBranchCount.current) {
      setBranchFlash(true);
      setTimeout(() => setBranchFlash(false), 600);
    }
    prevBranchCount.current = branchCount;
  }, [branchCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    if (waterHistory.length === 0) return;

    const maxVal = Math.max(...waterHistory) * 1.2 || 1;
    const minVal = 0;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 2; i++) {
      const y = (height / 3) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(66, 165, 245, 0.8)');
    gradient.addColorStop(1, 'rgba(66, 165, 245, 0.1)');

    ctx.beginPath();
    ctx.moveTo(0, height);

    for (let i = 0; i < waterHistory.length; i++) {
      const x = (i / (waterHistory.length - 1)) * width;
      const normalized = (waterHistory[i] - minVal) / (maxVal - minVal);
      const y = height - normalized * height;

      if (i === 0) {
        ctx.lineTo(x, y);
      } else {
        const prevX = ((i - 1) / (waterHistory.length - 1)) * width;
        const prevNormalized = (waterHistory[i - 1] - minVal) / (maxVal - minVal);
        const prevY = height - prevNormalized * height;
        const cpx = (prevX + x) / 2;
        ctx.quadraticCurveTo(prevX, prevY, cpx, (prevY + y) / 2);
      }
    }

    const lastX = width;
    const lastNormalized =
      (waterHistory[waterHistory.length - 1] - minVal) / (maxVal - minVal);
    const lastY = height - lastNormalized * height;
    ctx.lineTo(lastX, lastY);

    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, height - (waterHistory[0] / maxVal) * height);
    for (let i = 1; i < waterHistory.length; i++) {
      const x = (i / (waterHistory.length - 1)) * width;
      const y = height - (waterHistory[i] / maxVal) * height;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#42A5F5';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [waterHistory]);

  return (
    <motion.div
      className="data-panel"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
    >
      <div className="data-panel-title">根系数据</div>

      <div className="data-item">
        <div className="data-label">总根长</div>
        <div className="data-value">
          {totalLength.toFixed(1)}
          <span className="data-unit">单位</span>
        </div>
      </div>

      <div className="data-item">
        <div className="data-label">分支数量</div>
        <div className={`data-value ${branchFlash ? 'flash' : ''}`}>
          {branchCount}
          <span className="data-unit">个</span>
        </div>
      </div>

      <div className="data-item">
        <div className="data-label">最深深度</div>
        <div className="data-value">
          {maxDepth.toFixed(1)}
          <span className="data-unit">单位</span>
        </div>
      </div>

      <div className="data-item">
        <div className="data-label">水分吸收速率</div>
        <div className="waveform-container">
          <canvas ref={canvasRef} className="waveform-canvas" />
        </div>
        <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
          {waterAbsorptionRate.toFixed(2)} /s
        </div>
      </div>
    </motion.div>
  );
};
