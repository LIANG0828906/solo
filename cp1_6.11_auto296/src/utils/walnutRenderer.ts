
import { seededRandom } from './gradeCalculator';

export interface RenderOptions {
  rotationY: number;
  rotationX: number;
  scale: number;
  textureSeed: number;
  size?: number;
}

const BASE_COLOR = '#D2B48C';
const TEXTURE_COLOR = '#5D3A1A';
const HIGHLIGHT_COLOR = '#E8D5B7';
const SHADOW_COLOR = '#8B7355';

export function drawWalnut(ctx: CanvasRenderingContext2D, options: RenderOptions): void {
  const { rotationY, rotationX, scale, textureSeed, size = 200 } = options;
  const centerX = ctx.canvas.width / 2;
  const centerY = ctx.canvas.height / 2;
  const radius = (size / 2) * scale;

  const random = seededRandom(textureSeed);

  ctx.save();
  ctx.translate(centerX, centerY);

  const gradient = ctx.createRadialGradient(
    -radius * 0.3, -radius * 0.3, radius * 0.1,
    0, 0, radius
  );
  gradient.addColorStop(0, HIGHLIGHT_COLOR);
  gradient.addColorStop(0.3, BASE_COLOR);
  gradient.addColorStop(0.7, SHADOW_COLOR);
  gradient.addColorStop(1, '#4A3728');

  ctx.beginPath();
  ctx.ellipse(
    0,
    Math.sin(rotationX * Math.PI / 180) * radius * 0.1,
    radius,
    radius * (0.85 + Math.sin(rotationX * Math.PI / 180) * 0.15),
    0, 0, Math.PI * 2
  );
  ctx.fillStyle = gradient;
  ctx.fill();

  const textureCount = Math.floor(40 + random() * 30);
  const textures: { x: number; y: number; r: number; depth: number }[] = [];
  
  for (let i = 0; i < textureCount; i++) {
    const angle = random() * Math.PI * 2;
    const dist = random() * radius * 0.85;
    textures.push({
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      r: 3 + random() * 8,
      depth: 0.3 + random() * 0.7,
    });
  }

  textures.forEach((tex) => {
    const rotatedX = tex.x * Math.cos(rotationY * Math.PI / 180);
    const rotatedY = tex.y;
    const depthFactor = Math.cos(rotationY * Math.PI / 180);
    
    if (rotatedX > -radius * 0.9 && rotatedX < radius * 0.9) {
      const yFactor = 1 - (rotatedY * rotatedY) / (radius * radius);
      const xFactor = 1 - (rotatedX * rotatedX) / (radius * radius);
      const visibility = Math.max(0, Math.min(1, xFactor * yFactor));
      
      if (visibility > 0.1) {
        const depth = tex.depth * visibility * (0.5 + depthFactor * 0.5);
        
        ctx.beginPath();
        ctx.ellipse(
          rotatedX,
          rotatedY * (0.85 + Math.sin(rotationX * Math.PI / 180) * 0.15),
          tex.r * (0.5 + depth * 0.5),
          tex.r * 0.6 * (0.5 + depth * 0.5),
          0, 0, Math.PI * 2
        );
        
        const texGradient = ctx.createRadialGradient(
          rotatedX - tex.r * 0.3,
          rotatedY - tex.r * 0.3,
          0,
          rotatedX,
          rotatedY,
          tex.r
        );
        texGradient.addColorStop(0, `rgba(93, 58, 26, ${0.3 + depth * 0.5})`);
        texGradient.addColorStop(0.5, `rgba(139, 90, 43, ${0.2 + depth * 0.3})`);
        texGradient.addColorStop(1, `rgba(210, 180, 140, 0)`);
        
        ctx.fillStyle = texGradient;
        ctx.fill();
      }
    }
  });

  const dotCount = Math.floor(100 + random() * 80);
  for (let i = 0; i < dotCount; i++) {
    const angle = random() * Math.PI * 2;
    const dist = random() * radius * 0.9;
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    
    const rotatedX = x * Math.cos(rotationY * Math.PI / 180);
    
    if (Math.abs(rotatedX) < radius * 0.92) {
      const yFactor = 1 - (y * y) / (radius * radius);
      const xFactor = 1 - (rotatedX * rotatedX) / (radius * radius);
      const visibility = Math.max(0, Math.min(1, xFactor * yFactor));
      
      if (visibility > 0.2) {
        const dotSize = 0.5 + random() * 1.5;
        ctx.beginPath();
        ctx.arc(
          rotatedX,
          y * (0.85 + Math.sin(rotationX * Math.PI / 180) * 0.15),
          dotSize * visibility,
          0, Math.PI * 2
        );
        ctx.fillStyle = `rgba(101, 67, 33, ${0.2 + visibility * 0.4})`;
        ctx.fill();
      }
    }
  }

  const highlightGradient = ctx.createRadialGradient(
    -radius * 0.4, -radius * 0.4, 0,
    -radius * 0.2, -radius * 0.2, radius * 0.6
  );
  highlightGradient.addColorStop(0, 'rgba(255, 245, 225, 0.4)');
  highlightGradient.addColorStop(0.5, 'rgba(255, 240, 210, 0.15)');
  highlightGradient.addColorStop(1, 'rgba(255, 230, 190, 0)');

  ctx.beginPath();
  ctx.ellipse(
    0,
    Math.sin(rotationX * Math.PI / 180) * radius * 0.1,
    radius,
    radius * (0.85 + Math.sin(rotationX * Math.PI / 180) * 0.15),
    0, 0, Math.PI * 2
  );
  ctx.fillStyle = highlightGradient;
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(
    0,
    Math.sin(rotationX * Math.PI / 180) * radius * 0.1,
    radius + 2,
    radius * (0.85 + Math.sin(rotationX * Math.PI / 180) * 0.15) + 2,
    0, 0, Math.PI * 2
  );
  ctx.strokeStyle = 'rgba(74, 55, 40, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

export function drawWalnutPair(ctx: CanvasRenderingContext2D, options: RenderOptions & { spacing?: number }): void {
  const { spacing = 30, ...rest } = options;
  const size = rest.size || 200;
  
  ctx.save();
  ctx.translate(-spacing / 2, 0);
  drawWalnut(ctx, { ...rest, size: size * 0.75, rotationY: rest.rotationY - 15 });
  ctx.restore();
  
  ctx.save();
  ctx.translate(spacing / 2, 0);
  drawWalnut(ctx, { ...rest, size: size * 0.75, rotationY: rest.rotationY + 15 });
  ctx.restore();
}
