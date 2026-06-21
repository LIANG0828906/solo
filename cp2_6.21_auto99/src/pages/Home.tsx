import React from 'react';
import { useStore } from '../store';
import ImageUploader from '../components/ImageUploader';
import ColorPalette from '../components/ColorPalette';
import HarmonyChart from '../components/HarmonyChart';
import Recommendations from '../components/Recommendations';

const Home: React.FC = () => {
  const primaryColors = useStore((s) => s.primaryColors);
  const harmonyResult = useStore((s) => s.harmonyResult);

  const handleExportPNG = () => {
    if (primaryColors.length === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 200;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 800, 200);

    const swatchWidth = Math.floor(800 / primaryColors.length);
    primaryColors.forEach((c, i) => {
      ctx.fillStyle = c.hex;
      ctx.fillRect(i * swatchWidth, 0, swatchWidth, 140);

      const brightness = c.rgb[0] * 0.299 + c.rgb[1] * 0.587 + c.rgb[2] * 0.114;
      ctx.fillStyle = brightness > 128 ? '#333' : '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(c.hex, i * swatchWidth + swatchWidth / 2, 70);

      ctx.fillStyle = '#333';
      ctx.font = '12px sans-serif';
      ctx.fillText(c.name, i * swatchWidth + swatchWidth / 2, 160);
    });

    const link = document.createElement('a');
    link.download = 'color-palette.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleExportJSON = () => {
    if (primaryColors.length === 0) return;

    const data = {
      colors: primaryColors,
      score: harmonyResult?.score ?? null,
      harmonyType: harmonyResult?.harmonyType ?? null,
      description: harmonyResult?.description ?? null,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = 'color-palette.json';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const hasColors = primaryColors.length > 0;

  return (
    <div className="app-container">
      <h1 style={{ textAlign: 'center', margin: '16px 0 24px', fontSize: 28, fontWeight: 700, letterSpacing: 2 }}>
        🎨 色彩和谐度分析
      </h1>

      <div className="home-layout">
        <div className="left-panel">
          <ImageUploader />
          <ColorPalette />
        </div>

        <div className="right-panel">
          <HarmonyChart />
          <Recommendations />

          <div className="card">
            <h3>导出配色方案</h3>
            <div className="export-section">
              <button
                className="btn"
                onClick={handleExportPNG}
                disabled={!hasColors}
              >
                导出 PNG
              </button>
              <button
                className="btn"
                onClick={handleExportJSON}
                disabled={!hasColors}
              >
                导出 JSON
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
