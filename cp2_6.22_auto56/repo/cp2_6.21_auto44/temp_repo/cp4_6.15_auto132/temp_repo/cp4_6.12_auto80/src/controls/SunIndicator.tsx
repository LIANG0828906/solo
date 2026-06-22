import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/store';

export default function SunIndicator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sunPosition = useAppStore((state) => state.sunPosition);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 60;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 4;

    ctx.clearRect(0, 0, size, size);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.66, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.33, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX - radius, centerY);
    ctx.lineTo(centerX + radius, centerY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius);
    ctx.lineTo(centerX, centerY + radius);
    ctx.stroke();

    const { azimuth, altitude } = sunPosition;
    const normalizedAltitude = Math.max(0, altitude) / 90;
    const sunRadius = radius * (1 - normalizedAltitude * 0.8);

    const azimuthRad = (azimuth - 90) * (Math.PI / 180);
    const sunX = centerX + sunRadius * Math.cos(azimuthRad);
    const sunY = centerY + sunRadius * Math.sin(azimuthRad);

    if (altitude > 0) {
      const gradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 8);
      gradient.addColorStop(0, 'rgba(255, 255, 0, 1)');
      gradient.addColorStop(0.5, 'rgba(255, 200, 0, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 150, 0, 0)');

      ctx.beginPath();
      ctx.arc(sunX, sunY, 8, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(sunX, sunY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffff00';
      ctx.fill();
    } else {
      ctx.font = '10px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.textAlign = 'center';
      ctx.fillText('太阳在地平线下', centerX, centerY + 4);
    }

    ctx.font = '9px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('N', centerX, centerY - radius + 10);
    ctx.fillText('S', centerX, centerY + radius - 2);
    ctx.fillText('E', centerX + radius - 8, centerY + 3);
    ctx.fillText('W', centerX - radius + 8, centerY + 3);

  }, [sunPosition]);

  return (
    <div className="sun-indicator">
      <canvas
        ref={canvasRef}
        width={60}
        height={60}
        className="sun-indicator-canvas"
      />
      <div className="sun-indicator-label">
        方位: {sunPosition.azimuth.toFixed(0)}°<br />
        高度: {sunPosition.altitude.toFixed(1)}°
      </div>
    </div>
  );
}
