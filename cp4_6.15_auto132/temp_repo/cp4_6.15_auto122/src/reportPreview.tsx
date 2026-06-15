import { useRef, useEffect, useCallback } from 'react';
import { useOceanStore } from './store';
import jsPDF from 'jspdf';

const glassPanel: React.CSSProperties = {
  background: 'rgba(10, 22, 40, 0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(0, 229, 255, 0.15)',
  boxShadow: '0 0 20px rgba(0, 229, 255, 0.08)',
  borderRadius: '12px',
};

function HeatMap({ forecastData }: { forecastData: import('./types').MonthForecast[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !forecastData.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = 280;
    const height = 150;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const species = [...new Set(forecastData.flatMap((f) => f.speciesData.map((s) => s.speciesId)))];
    const cellW = (width - 40) / 12;
    const cellH = (height - 30) / Math.min(species.length, 8);
    const startX = 35;
    const startY = 5;

    const months = ['1','2','3','4','5','6','7','8','9','10','11','12'];
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '8px "Noto Sans SC"';
    ctx.textAlign = 'center';
    for (let m = 0; m < 12; m++) {
      ctx.fillText(months[m], startX + m * cellW + cellW / 2, height - 5);
    }

    const topSpecies = species.slice(0, 8);
    for (let si = 0; si < topSpecies.length; si++) {
      const spId = topSpecies[si];
      const spName = forecastData[0].speciesData.find((s) => s.speciesId === spId)?.name || spId;
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '7px "Noto Sans SC"';
      ctx.textAlign = 'right';
      ctx.fillText(spName.substring(0, 4), startX - 3, startY + si * cellH + cellH / 2 + 3);

      for (let m = 0; m < 12; m++) {
        const monthData = forecastData[m].speciesData.find((s) => s.speciesId === spId);
        const abundance = monthData?.abundance || 0;
        const r = Math.floor(abundance * 255);
        const g = Math.floor((1 - Math.abs(abundance - 0.5) * 2) * 180);
        const b = Math.floor((1 - abundance) * 200);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
        ctx.fillRect(startX + m * cellW, startY + si * cellH, cellW - 1, cellH - 1);
      }
    }
  }, [forecastData]);

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
}

function MigrationMap({ forecastData }: { forecastData: import('./types').MonthForecast[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !forecastData.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = 280;
    const height = 120;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const categories = ['shallow', 'mid', 'deep'] as const;
    const catLabels = ['浅海', '中层', '深海'];
    const catColors = ['#ff6b35', '#7b68ee', '#00b4d8'];

    ctx.strokeStyle = 'rgba(0, 229, 255, 0.1)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 3; i++) {
      const y = 10 + (100 / 3) * i;
      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.lineTo(width - 10, y);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '9px "Noto Sans SC"';
    ctx.textAlign = 'right';
    for (let i = 0; i < 3; i++) {
      ctx.fillText(catLabels[i], 30, 10 + (100 / 3) * i + (100 / 3) / 2 + 3);
    }

    for (let ci = 0; ci < categories.length; ci++) {
      const cat = categories[ci];
      ctx.strokeStyle = catColors[ci];
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let m = 0; m < 12; m++) {
        const catData = forecastData[m].speciesData.filter((s) => s.category === cat);
        const avgDepth = catData.length > 0
          ? catData.reduce((a, b) => a + b.depth, 0) / catData.length
          : 0;
        const x = 35 + m * ((width - 45) / 11);
        const y = 10 + (avgDepth / 2000) * 100;
        if (m === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }, [forecastData]);

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
}

export default function ReportPreview() {
  const showReport = useOceanStore((s) => s.showReport);
  const forecastData = useOceanStore((s) => s.forecastData);
  const setShowReport = useOceanStore((s) => s.setShowReport);
  const envParams = useOceanStore((s) => s.envParams);

  const handleExportPDF = useCallback(() => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Ocean Ecosystem Simulation Report', 20, 25);
    doc.setFontSize(10);
    doc.text(`Parameters: Temp=${envParams.temperature}°C, Salinity=${envParams.salinity}ppt, Light=${envParams.lightPenetration}m`, 20, 35);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 42);

    let y = 55;
    doc.setFontSize(14);
    doc.text('Key Findings', 20, y);
    y += 8;
    doc.setFontSize(10);

    if (forecastData) {
      for (const fc of forecastData) {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(`Month ${fc.month}: ${fc.summary}`, 20, y);
        y += 7;
      }
    }

    y += 10;
    doc.setFontSize(14);
    doc.text('Migration Trends', 20, y);
    y += 8;
    doc.setFontSize(10);
    doc.text('Shallow species expand deeper in warm months, deep species shift upward in cold months.', 20, y);

    doc.save('ocean-ecosystem-report.pdf');
  }, [forecastData, envParams]);

  if (!showReport || !forecastData) return null;

  const shallowSpecies = forecastData[0].speciesData.filter((s) => s.category === 'shallow');
  const deepSpecies = forecastData[0].speciesData.filter((s) => s.category === 'deep');
  const warmActive = shallowSpecies.filter((s) => s.abundance > 0.5).length;
  const coldActive = deepSpecies.filter((s) => s.abundance > 0.5).length;

  return (
    <div
      style={{
        ...glassPanel,
        width: '360px',
        padding: '24px',
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 110,
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '13px', color: '#00e5ff', letterSpacing: '1px', textTransform: 'uppercase' }}>
          模拟报告
        </h3>
        <button
          onClick={() => setShowReport(false)}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            color: 'rgba(255,255,255,0.5)',
            width: '28px',
            height: '28px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#00e5ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ ...glassPanel, padding: '12px 16px', borderRadius: '8px', marginBottom: '16px' }}>
        <h4 style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          关键发现
        </h4>
        <ul style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, paddingLeft: '16px' }}>
          <li>浅海暖水物种活跃数：<span style={{ color: '#ff9a3c' }}>{warmActive} 种</span></li>
          <li>深海冷水物种活跃数：<span style={{ color: '#00b4d8' }}>{coldActive} 种</span></li>
          <li>温度设定 {envParams.temperature}°C 下，物种整体分布呈{envParams.temperature > 20 ? '向深层扩散' : '向浅层收缩'}趋势</li>
          <li>盐度 {envParams.salinity}ppt 对中层物种影响最为显著</li>
        </ul>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          物种迁徙路径
        </h4>
        <MigrationMap forecastData={forecastData} />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          月丰度变化热力图
        </h4>
        <HeatMap forecastData={forecastData} />
      </div>

      <button
        onClick={handleExportPDF}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid rgba(255, 154, 60, 0.3)',
          background: 'linear-gradient(135deg, rgba(255, 154, 60, 0.2), rgba(255, 107, 53, 0.15))',
          color: '#ff9a3c',
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '1px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          textTransform: 'uppercase',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 0 25px rgba(255, 154, 60, 0.3)';
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 154, 60, 0.3), rgba(255, 107, 53, 0.25))';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 154, 60, 0.2), rgba(255, 107, 53, 0.15))';
        }}
      >
        导出 PDF 报告
      </button>
    </div>
  );
}
