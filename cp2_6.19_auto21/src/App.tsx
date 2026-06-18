import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Spot, SPOTS, CATEGORY_COLORS, getThemeColor, calcTotalDuration, calcCalories } from './data';
import { useRouteStore } from './store';
import SpotLibrary from './SpotLibrary';
import RoutePlanner from './RoutePlanner';

function generateShareCard(
  items: { spot: Spot; uid: string }[],
  themeColor: string,
  onDone: (dataUrl: string) => void
) {
  const canvas = document.createElement('canvas');
  const dpr = 2;
  const w = 400;
  const h = 500;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  const gradient = ctx.createLinearGradient(0, 0, 0, 140);
  gradient.addColorStop(0, themeColor);
  gradient.addColorStop(1, '#2c3e50');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, 140);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('我的旅行路线', w / 2, 55);

  ctx.font = '13px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  const dur = calcTotalDuration(items);
  const cal = calcCalories(items);
  ctx.fillText(`总时长 ${Math.floor(dur / 60)}h${dur % 60}m · 约${cal}千卡`, w / 2, 85);

  const spotNames = items.map((i) => i.spot.name).join(' → ');
  ctx.font = '12px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  const truncated = spotNames.length > 40 ? spotNames.slice(0, 40) + '...' : spotNames;
  ctx.fillText(truncated, w / 2, 115);

  ctx.fillStyle = '#faf9f6';
  ctx.fillRect(0, 140, w, h - 140);

  const gridSize = 20;
  ctx.strokeStyle = '#e8e4dc';
  ctx.lineWidth = 0.3;
  for (let x = 20; x < w - 20; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 155);
    ctx.lineTo(x, 280);
    ctx.stroke();
  }
  for (let y = 155; y < 280; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(w - 20, y);
    ctx.stroke();
  }

  if (items.length > 0) {
    const lngs = items.map((i) => i.spot.lng);
    const lats = items.map((i) => i.spot.lat);
    const minLng = Math.min(...lngs) - 0.01;
    const maxLng = Math.max(...lngs) + 0.01;
    const minLat = Math.min(...lats) - 0.01;
    const maxLat = Math.max(...lats) + 0.01;
    const mapPad = 30;
    const mapW = w - mapPad * 2;
    const mapH = 110;

    const points = items.map((item) => ({
      x: mapPad + ((item.spot.lng - minLng) / (maxLng - minLng || 1)) * mapW,
      y: 160 + ((maxLat - item.spot.lat) / (maxLat - minLat || 1)) * mapH,
    }));

    if (points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    points.forEach((p, idx) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = CATEGORY_COLORS[items[idx].spot.category];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }

  ctx.fillStyle = '#333';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('景点列表', 24, 305);

  ctx.strokeStyle = '#e8e4dc';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(24, 312);
  ctx.lineTo(w - 24, 312);
  ctx.stroke();

  items.forEach((item, idx) => {
    const y = 330 + idx * 22;
    if (y > h - 40) return;
    ctx.fillStyle = CATEGORY_COLORS[item.spot.category];
    ctx.beginPath();
    ctx.arc(34, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.font = '12px sans-serif';
    ctx.fillText(`${idx + 1}. ${item.spot.name}`, 46, y + 4);
    ctx.fillStyle = '#aaa';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${item.spot.visitDuration}min`, w - 30, y + 4);
    ctx.textAlign = 'left';
  });

  ctx.fillStyle = '#ccc';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('虚拟旅游路线规划', w / 2, h - 12);

  onDone(canvas.toDataURL('image/png'));
}

export default function App() {
  const { items, addItem, loadFromStorage, themeColor } = useRouteStore();
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [shareText, setShareText] = useState('');
  const [copied, setCopied] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isNarrow = windowWidth <= 768;

  const handleDragStart = useCallback((e: React.DragEvent, spot: Spot) => {
    e.dataTransfer.setData('application/spot', JSON.stringify(spot));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      try {
        const data = e.dataTransfer.getData('application/spot');
        if (data) {
          const spot: Spot = JSON.parse(data);
          addItem(spot);
        }
      } catch {}
    },
    [addItem]
  );

  const handleGenerateShare = useCallback(() => {
    const color = themeColor();
    generateShareCard(items, color, (dataUrl) => {
      setShareImage(dataUrl);
      const spotList = items.map((i, idx) => `${idx + 1}. ${i.spot.name}`).join('\n');
      setShareText(`我的旅行路线\n${spotList}`);
      setShowShareModal(true);
    });
  }, [items, themeColor]);

  const handleCopyText = useCallback(() => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [shareText]);

  const handleDownload = useCallback(() => {
    if (!shareImage) return;
    const a = document.createElement('a');
    a.href = shareImage;
    a.download = 'travel-route.png';
    a.click();
  }, [shareImage]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f2eb' }}>
      <header
        style={{
          padding: '12px 24px',
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isNarrow && (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              style={{
                background: 'none',
                border: '1px solid #ddd',
                borderRadius: 6,
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              {sidebarCollapsed ? '☰' : '✕'}
            </button>
          )}
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#333' }}>
            🗺️ 虚拟旅游路线规划
          </h1>
        </div>
        <span style={{ fontSize: 12, color: '#aaa' }}>拖拽景点 · 规划路线 · 一键分享</span>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <div
          style={{
            width: isNarrow ? (sidebarCollapsed ? 0 : '100%') : '50%',
            minWidth: isNarrow ? 0 : 320,
            background: '#faf9f6',
            overflow: 'hidden',
            transition: 'width 0.3s ease',
            position: isNarrow && !sidebarCollapsed ? 'absolute' : 'relative',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: isNarrow && !sidebarCollapsed ? 5 : 0,
            boxShadow: isNarrow && !sidebarCollapsed ? '4px 0 12px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          <SpotLibrary onDragStart={handleDragStart} />
        </div>

        {!isNarrow && (
          <div
            style={{
              width: 1,
              background: '#e0dcd4',
              flexShrink: 0,
            }}
          />
        )}

        <div
          style={{
            flex: 1,
            background: '#faf9f6',
            overflow: 'hidden',
          }}
        >
          <RoutePlanner onDragOver={handleDragOver} onDrop={handleDrop} />
        </div>
      </div>

      <button
        onClick={handleGenerateShare}
        disabled={items.length === 0}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          padding: '12px 24px',
          border: 'none',
          borderRadius: 24,
          background: items.length === 0 ? '#ccc' : 'linear-gradient(135deg, #4a90d9, #8e44ad)',
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          cursor: items.length === 0 ? 'not-allowed' : 'pointer',
          boxShadow: items.length === 0 ? 'none' : '0 4px 14px rgba(74,144,217,0.3)',
          transition: 'all 0.3s ease',
          zIndex: 20,
        }}
        onMouseEnter={(e) => {
          if (items.length > 0) {
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(74,144,217,0.4)';
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLElement).style.boxShadow = items.length === 0 ? 'none' : '0 4px 14px rgba(74,144,217,0.3)';
        }}
      >
        生成分享卡
      </button>

      {showShareModal && (
        <div
          onClick={() => setShowShareModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 14,
              padding: 24,
              maxWidth: 440,
              width: '90%',
              boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>
              分享路线卡片
            </h3>
            {shareImage && (
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <img
                  src={shareImage}
                  alt="分享卡片"
                  style={{ maxWidth: '100%', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={handleDownload}
                style={{
                  padding: '8px 20px',
                  border: 'none',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #4a90d9, #8e44ad)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                下载图片
              </button>
              <button
                onClick={handleCopyText}
                style={{
                  padding: '8px 20px',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  background: '#fff',
                  color: '#333',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {copied ? '✓ 已复制' : '复制文本'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
