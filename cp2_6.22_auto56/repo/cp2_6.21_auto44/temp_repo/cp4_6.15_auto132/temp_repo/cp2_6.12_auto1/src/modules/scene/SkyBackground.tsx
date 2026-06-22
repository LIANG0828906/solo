import { useMemo } from 'react';
import * as THREE from 'three';
import type { WeatherMode } from '../../types';

interface SkyBackgroundProps {
  weather: WeatherMode;
  sunAltitude: number;
}

export function SkyBackground({ weather, sunAltitude }: SkyBackgroundProps) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);

    if (weather === 'sunny') {
      const dayFactor = Math.max(0, Math.min(1, (sunAltitude + 5) / 30));
      const topR = Math.floor(135 * dayFactor + 80 * (1 - dayFactor));
      const topG = Math.floor(206 * dayFactor + 100 * (1 - dayFactor));
      const topB = Math.floor(235 * dayFactor + 120 * (1 - dayFactor));
      gradient.addColorStop(0, `rgb(${topR}, ${topG}, ${topB})`);
      gradient.addColorStop(0.6, '#B0E0E6');
      gradient.addColorStop(1, '#FFFDE7');
    } else if (weather === 'cloudy') {
      gradient.addColorStop(0, '#78909C');
      gradient.addColorStop(0.5, '#B0BEC5');
      gradient.addColorStop(1, '#CFD8DC');
    } else {
      gradient.addColorStop(0, '#546E7A');
      gradient.addColorStop(0.5, '#78909C');
      gradient.addColorStop(1, '#90A4AE');
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (weather === 'sunny' && sunAltitude > 0) {
      const sunY = canvas.height * 0.7 - (sunAltitude / 60) * canvas.height * 0.5;
      const sunRadius = 30;
      const sunGradient = ctx.createRadialGradient(
        canvas.width / 2,
        sunY,
        0,
        canvas.width / 2,
        sunY,
        sunRadius * 2
      );
      sunGradient.addColorStop(0, 'rgba(255, 255, 230, 1)');
      sunGradient.addColorStop(0.3, 'rgba(255, 240, 180, 0.8)');
      sunGradient.addColorStop(1, 'rgba(255, 220, 150, 0)');
      ctx.fillStyle = sunGradient;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, sunY, sunRadius * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (weather === 'cloudy' || weather === 'overcast') {
      ctx.globalAlpha = weather === 'overcast' ? 0.6 : 0.4;
      for (let i = 0; i < 8; i++) {
        const cx = Math.random() * canvas.width;
        const cy = Math.random() * canvas.height * 0.6;
        const r = 40 + Math.random() * 60;
        const cloudGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        cloudGrad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        cloudGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = cloudGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    return tex;
  }, [weather, sunAltitude]);

  return <primitive object={texture} attach="background" />;
}
