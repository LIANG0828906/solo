import React, { useRef, useEffect } from 'react';
import { GalaxyParams } from '../types';
import { generateParticles } from '../utils/galaxyGenerators';
import { rgbToString } from '../utils/colorUtils';

interface MiniPreviewProps {
  params: GalaxyParams;
}

export const MiniPreview: React.FC<MiniPreviewProps> = ({ params }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previewCount = Math.min(200, Math.floor(params.particleCount / 15));
    const particles = generateParticles(params.type, previewCount, params.dispersionRange);

    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scale = canvas.width / 180;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    particles.forEach((p) => {
      const x = centerX + p.x * scale;
      const y = centerY + p.y * scale + p.z * scale * 0.3;
      
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.5, p.size * scale * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = rgbToString(p.color);
      ctx.fill();
    });
  }, [params]);

  return (
    <div className="preset-preview">
      <canvas
        ref={canvasRef}
        width={30}
        height={30}
      />
    </div>
  );
};
