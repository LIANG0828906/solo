import { useRef, useEffect, useCallback } from 'react';
import { useOceanStore } from './store';
import type { RenderableSpecies } from './types';

const glassPanel: React.CSSProperties = {
  background: 'rgba(10, 22, 40, 0.6)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(0, 229, 255, 0.15)',
  boxShadow: '0 0 20px rgba(0, 229, 255, 0.08), inset 0 0 20px rgba(0, 229, 255, 0.03)',
  borderRadius: '12px',
};

function AbundanceBarChart({ species }: { species: RenderableSpecies }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = 320;
    const height = 160;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const store = useOceanStore.getState();
    const allSamples = store.speciesList
      .filter((s) => s.id === species.speciesId)
      .flatMap((s) => s.samplePoints);

    const seasons = ['spring', 'summer', 'autumn', 'winter'];
    const seasonLabels = ['春', '夏', '秋', '冬'];
    const seasonColors = ['#4ecdc4', '#ff6b35', '#ffd166', '#0077b6'];
    const barWidth = 50;
    const gap = 25;
    const startX = 30;
    const maxBarHeight = 100;

    for (let i = 0; i < seasons.length; i++) {
      const seasonSamples = allSamples.filter((sp) => sp.season === seasons[i]);
      const avgAbundance = seasonSamples.length > 0
        ? seasonSamples.reduce((a, b) => a + b.abundance, 0) / seasonSamples.length
        : 0;

      const targetHeight = avgAbundance * maxBarHeight;
      const currentHeight = targetHeight * Math.min(1, animRef.current / 30);
      const x = startX + i * (barWidth + gap);
      const y = height - 30 - currentHeight;

      const gradient = ctx.createLinearGradient(x, y, x, height - 30);
      gradient.addColorStop(0, seasonColors[i]);
      gradient.addColorStop(1, seasonColors[i] + '40');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, currentHeight, [4, 4, 0, 0]);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '10px "Noto Sans SC"';
      ctx.textAlign = 'center';
      ctx.fillText(seasonLabels[i], x + barWidth / 2, height - 12);

      ctx.fillStyle = seasonColors[i];
      ctx.font = '11px "Orbitron"';
      ctx.fillText((avgAbundance * 100).toFixed(0) + '%', x + barWidth / 2, y - 6);
    }

    if (animRef.current < 30) {
      animRef.current++;
      requestAnimationFrame(draw);
    }
  }, [species]);

  useEffect(() => {
    animRef.current = 0;
    draw();
  }, [species, draw]);

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
}

function AbundanceLineChart({ species }: { species: RenderableSpecies }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = 320;
    const height = 120;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const store = useOceanStore.getState();
    const sp = store.speciesList.find((s) => s.id === species.speciesId);
    if (!sp) return;

    const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    const data: number[] = months.map((_, i) => {
      const seasonFactor = Math.sin(((i - 3) / 12) * Math.PI * 2) * 0.3;
      return Math.max(0.1, Math.min(1, sp.samplePoints[0]?.abundance || 0.5 + seasonFactor + (Math.random() - 0.5) * 0.1));
    });

    const padding = { top: 15, right: 15, bottom: 25, left: 35 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    ctx.strokeStyle = 'rgba(0, 229, 255, 0.1)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = padding.left + (chartW / (data.length - 1)) * i;
      const y = padding.top + chartH - data[i] * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
    gradient.addColorStop(0, 'rgba(0, 229, 255, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = padding.left + (chartW / (data.length - 1)) * i;
      const y = padding.top + chartH - data[i] * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(padding.left + chartW, padding.top + chartH);
    ctx.lineTo(padding.left, padding.top + chartH);
    ctx.closePath();
    ctx.fill();

    for (let i = 0; i < data.length; i++) {
      const x = padding.left + (chartW / (data.length - 1)) * i;
      const y = padding.top + chartH - data[i] * chartH;
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '9px "Noto Sans SC"';
    ctx.textAlign = 'center';
    for (let i = 0; i < months.length; i += 2) {
      const x = padding.left + (chartW / (months.length - 1)) * i;
      ctx.fillText(months[i], x, height - 8);
    }
  }, [species]);

  return <canvas ref={canvasRef} style={{ display: 'block', marginTop: '16px' }} />;
}

export default function SpeciesDetail() {
  const selectedSpecies = useOceanStore((s) => s.selectedSpecies);
  const setSelectedSpecies = useOceanStore((s) => s.setSelectedSpecies);

  if (!selectedSpecies) return null;

  const tempBand =
    selectedSpecies.preferredTemp[0] >= 20
      ? '暖水种'
      : selectedSpecies.preferredTemp[0] >= 10
      ? '温水种'
      : '冷水种';

  return (
    <div
      style={{
        ...glassPanel,
        width: '360px',
        padding: '24px',
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 100,
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: selectedSpecies.color, marginBottom: '4px' }}>
            {selectedSpecies.name}
          </h3>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
            {selectedSpecies.latinName}
          </p>
        </div>
        <button
          onClick={() => setSelectedSpecies(null)}
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
            e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <InfoCard label="当前深度" value={`${selectedSpecies.depth.toFixed(0)} m`} />
        <InfoCard label="丰度" value={`${(selectedSpecies.abundance * 100).toFixed(1)}%`} />
        <InfoCard label="温度偏好" value={tempBand} />
        <InfoCard label="分类" value={selectedSpecies.category === 'shallow' ? '浅海' : selectedSpecies.category === 'mid' ? '中层' : '深海'} />
      </div>

      <div style={{ marginBottom: '4px' }}>
        <h4 style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>
          季节丰度分布
        </h4>
        <AbundanceBarChart species={selectedSpecies} />
      </div>

      <div>
        <h4 style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', letterSpacing: '1px', textTransform: 'uppercase' }}>
          年度丰度趋势
        </h4>
        <AbundanceLineChart species={selectedSpecies} />
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        ...glassPanel,
        padding: '10px 12px',
        borderRadius: '8px',
      }}
    >
      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
      <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '14px', color: '#00e5ff', fontWeight: 600 }}>
        {value}
      </div>
    </div>
  );
}
