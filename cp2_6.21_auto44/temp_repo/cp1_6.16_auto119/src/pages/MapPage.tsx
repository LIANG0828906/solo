import { useEffect, useRef, useState } from 'react';
import { useDiaryStore, CityEmotionData } from '../store';
import { getEmotionColor } from '../utils/emotionAnalyzer';

interface TooltipData {
  city: string;
  entries: { date: string; text: string; score: number; word: string }[];
  x: number;
  y: number;
}

const worldMapData = [
  { x: 60, y: 120, w: 80, h: 120 },
  { x: 70, y: 260, w: 60, h: 180 },
  { x: 220, y: 100, w: 140, h: 160 },
  { x: 240, y: 280, w: 100, h: 160 },
  { x: 420, y: 120, w: 200, h: 180 },
  { x: 480, y: 320, w: 120, h: 120 },
  { x: 680, y: 160, w: 100, h: 80 },
  { x: 700, y: 280, w: 60, h: 40 },
];

function latLngToXY(lat: number, lng: number, width: number, height: number) {
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
}

export default function MapPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const { cityEmotions } = useDiaryStore();
  const cityPointsRef = useRef<Map<string, { x: number; y: number; data: CityEmotionData }>>(new Map());

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const render = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.scale(dpr, dpr);
      const width = rect.width;
      const height = rect.height;

      ctx.fillStyle = '#ECEFF1';
      ctx.fillRect(0, 0, width, height);

      const scaleX = width / 800;
      const scaleY = height / 500;

      ctx.fillStyle = '#D7CCC8';
      ctx.strokeStyle = '#3E2723';
      ctx.lineWidth = 0.8;

      for (const land of worldMapData) {
        ctx.beginPath();
        ctx.roundRect(
          land.x * scaleX,
          land.y * scaleY,
          land.w * scaleX,
          land.h * scaleY,
          12
        );
        ctx.fill();
        ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(109, 76, 65, 0.1)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 8; i++) {
        const y = (height / 8) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      for (let i = 0; i <= 12; i++) {
        const x = (width / 12) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      cityPointsRef.current.clear();

      cityEmotions.forEach((cityData, cityName) => {
        const { x, y } = latLngToXY(cityData.lat, cityData.lng, width, height);
        cityPointsRef.current.set(cityName, { x, y, data: cityData });

        const color = getEmotionColor(cityData.avgScore);
        const isHovered = hoveredCity === cityName;
        const dotRadius = isHovered ? 10 : 7;
        const glowRadius = 25;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
        gradient.addColorStop(0, color.replace('rgb', 'rgba').replace(')', ', 0.35)'));
        gradient.addColorStop(1, color.replace('rgb', 'rgba').replace(')', ', 0)'));
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (isHovered) {
          ctx.fillStyle = '#3E2723';
          ctx.font = 'bold 12px Quicksand, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(cityName, x, y - dotRadius - 8);
        }
      });
    };

    render();

    const handleResize = () => render();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [cityEmotions, hoveredCity]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let foundCity: string | null = null;
    let foundData: CityEmotionData | null = null;
    let foundPoint = { x: 0, y: 0 };

    cityPointsRef.current.forEach((point, cityName) => {
      const dist = Math.sqrt((mouseX - point.x) ** 2 + (mouseY - point.y) ** 2);
      if (dist < 20) {
        foundCity = cityName;
        foundData = point.data;
        foundPoint = { x: point.x, y: point.y };
      }
    });

    if (foundCity && foundData) {
      setHoveredCity(foundCity);
      const recentEntries = foundData.entries.slice(0, 3).map((e) => ({
        date: e.date,
        text: e.text.length > 30 ? e.text.slice(0, 30) + '...' : e.text,
        score: e.emotion.score,
        word: e.emotion.dominantWord,
      }));

      setTooltip({
        city: foundCity,
        entries: recentEntries,
        x: foundPoint.x,
        y: foundPoint.y,
      });
    } else {
      setHoveredCity(null);
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCity(null);
    setTooltip(null);
  };

  return (
    <div className="map-page">
      <div className="map-header">🌍 全球情绪热力地图</div>
      <div className="map-legend">
        <span>😊 正面</span>
        <div className="legend-gradient" />
        <span>负面 😔</span>
      </div>
      <div className="map-canvas-wrapper" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="map-canvas"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        {tooltip && (
          <div
            className="map-tooltip"
            style={{
              left: tooltip.x,
              top: tooltip.y - 20,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="tooltip-city">📍 {tooltip.city}</div>
            <ul className="tooltip-entries">
              {tooltip.entries.map((entry, idx) => (
                <li key={idx}>
                  <span
                    className="emotion-score"
                    style={{ background: getEmotionColor(entry.score) }}
                  />
                  <strong>{entry.word}</strong> - {entry.text}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
