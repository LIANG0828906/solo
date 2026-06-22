import { useRef, useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { getHeightDistribution, getBuildingCountByZone } from '../scene/DataParser';
import { ZONE_INFO, MIN_YEAR, MAX_YEAR } from '../types';
import type { BuildingZone } from '../types';
import styles from './DataPanel.module.css';

export const DataPanel = () => {
  const { year, compareYears, toggleCompare, isDataPanelOpen, setDataPanelOpen } = useAppStore();
  const histogramCanvasRef = useRef<HTMLCanvasElement>(null);
  const radarCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isDataPanelOpen) return;

    const drawHistogram = () => {
      const canvas = histogramCanvasRef.current;
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
      const padding = { top: 20, right: 20, bottom: 30, left: 30 };
      const chartWidth = width - padding.left - padding.right;
      const chartHeight = height - padding.top - padding.bottom;

      ctx.clearRect(0, 0, width, height);

      const currentData = getHeightDistribution(year, 15);
      const maxCount = Math.max(
        ...currentData,
        ...compareYears.flatMap((y) => getHeightDistribution(y, 15)),
        1
      );

      const barWidth = Math.max(6, chartWidth / 15 - 4);

      const compareColors = ['#FFD93D', '#FF6B6B'];

      compareYears.forEach((compYear, idx) => {
        const compData = getHeightDistribution(compYear, 15);
        ctx.fillStyle = compareColors[idx % compareColors.length];
        ctx.globalAlpha = 0.5;

        compData.forEach((count, i) => {
          const barHeight = (count / maxCount) * chartHeight;
          const x = padding.left + i * (chartWidth / 15) + (chartWidth / 15 - barWidth) / 2;
          const y = padding.top + chartHeight - barHeight;
          ctx.fillRect(x, y, barWidth, barHeight);
        });
      });

      ctx.globalAlpha = 1;

      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
      gradient.addColorStop(0, '#4D96FF');
      gradient.addColorStop(1, '#FF6B6B');

      ctx.fillStyle = gradient;
      currentData.forEach((count, i) => {
        const barHeight = (count / maxCount) * chartHeight;
        const x = padding.left + i * (chartWidth / 15) + (chartWidth / 15 - barWidth) / 2;
        const y = padding.top + chartHeight - barHeight;
        ctx.fillRect(x, y, barWidth, barHeight);
      });

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i;
        const value = Math.round(maxCount - (maxCount / 4) * i);
        ctx.fillText(value.toString(), padding.left - 8, y + 3);
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      for (let i = 0; i <= 3; i++) {
        const x = padding.left + (chartWidth / 3) * i;
        const heightLabel = Math.round(30 + (50 / 3) * i);
        ctx.fillText(`${heightLabel}m`, x, height - 10);
      }
    };

    const drawRadar = () => {
      const canvas = radarCanvasRef.current;
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
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(centerX, centerY) - 30;

      ctx.clearRect(0, 0, width, height);

      const zones: BuildingZone[] = ['cbd', 'oldtown', 'waterfront', 'newdistrict'];
      const zoneNames = zones.map((z) => ZONE_INFO[z].name);

      const maxBuildings = 15;

      for (let level = 1; level <= 3; level++) {
        const r = (radius / 3) * level;
        ctx.beginPath();
        for (let i = 0; i < zones.length; i++) {
          const angle = (Math.PI * 2 * i) / zones.length - Math.PI / 2;
          const x = centerX + r * Math.cos(angle);
          const y = centerY + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      for (let i = 0; i < zones.length; i++) {
        const angle = (Math.PI * 2 * i) / zones.length - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.stroke();
      }

      const drawData = (yearToDraw: number, color: string, alpha: number = 1) => {
        const counts = getBuildingCountByZone(yearToDraw);

        ctx.beginPath();
        for (let i = 0; i < zones.length; i++) {
          const angle = (Math.PI * 2 * i) / zones.length - Math.PI / 2;
          const value = counts[zones[i]];
          const r = (value / maxBuildings) * radius;
          const x = centerX + r * Math.cos(angle);
          const y = centerY + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha * 0.3;
        ctx.fill();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      };

      const compareColors = ['#FFD93D', '#FF6B6B'];
      compareYears.forEach((compYear, idx) => {
        drawData(compYear, compareColors[idx % compareColors.length], 0.7);
      });

      drawData(year, '#4ECDC4', 1);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      for (let i = 0; i < zones.length; i++) {
        const angle = (Math.PI * 2 * i) / zones.length - Math.PI / 2;
        const labelRadius = radius + 15;
        const x = centerX + labelRadius * Math.cos(angle);
        const y = centerY + labelRadius * Math.sin(angle);
        ctx.fillText(zoneNames[i], x, y + 4);
      }
    };

    const timer = setTimeout(() => {
      drawHistogram();
      drawRadar();
    }, 100);

    return () => clearTimeout(timer);
  }, [year, compareYears, isDataPanelOpen]);

  const isCompareActive = compareYears.includes(year);

  if (!isDataPanelOpen) {
    return (
      <button
        className={`${styles.toggleButton} ${isMobile ? styles.mobileToggle : ''}`}
        onClick={() => setDataPanelOpen(true)}
      >
        数据视图
      </button>
    );
  }

  return (
    <div className={`${styles.panel} ${isMobile ? styles.mobilePanel : ''}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>数据视图</h3>
        <button
          className={styles.closeButton}
          onClick={() => setDataPanelOpen(false)}
        >
          ×
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>建筑高度分布</h4>
          <div className={styles.chartContainer}>
            <canvas ref={histogramCanvasRef} className={styles.canvas} />
          </div>
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>区域密度雷达图</h4>
          <div className={styles.chartContainer}>
            <canvas ref={radarCanvasRef} className={styles.canvas} />
          </div>
        </div>

        <div className={styles.buttonSection}>
          <button
            className={`${styles.compareButton} ${isCompareActive ? styles.active : ''}`}
            onClick={toggleCompare}
          >
            {isCompareActive ? '取消对比' : '添加对比年代'}
          </button>

          {compareYears.length > 0 && (
            <div className={styles.compareList}>
              <span className={styles.compareLabel}>对比年代：</span>
              {compareYears.map((y) => (
                <span key={y} className={styles.compareTag}>
                  {y}年
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataPanel;
