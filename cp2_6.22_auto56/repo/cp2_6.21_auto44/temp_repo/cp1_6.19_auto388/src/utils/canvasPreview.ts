import { WorkbenchFlower } from '../store';

export interface PackagingStyle {
  id: string;
  name: string;
  bgColor: string;
  borderColor: string;
  gradient?: string;
}

export const packagingStyles: PackagingStyle[] = [
  {
    id: 'kraft',
    name: '牛皮纸',
    bgColor: '#C49A6C',
    borderColor: '#8D6E63',
  },
  {
    id: 'glass',
    name: '透明玻璃纸',
    bgColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: '#90CAF9',
  },
  {
    id: 'ribbon',
    name: '丝带蝴蝶结',
    bgColor: '#FF80AB',
    borderColor: '#F06292',
    gradient: 'linear-gradient(135deg, #FF80AB 0%, #FF4081 100%)',
  },
];

export function generateCanvasPreview(
  flowers: WorkbenchFlower[],
  packagingStyle: string,
  width: number = 700,
  height: number = 500
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width * 2;
  canvas.height = height * 2;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  ctx.scale(2, 2);
  
  const style = packagingStyles.find((s) => s.id === packagingStyle) || packagingStyles[0];
  
  const radius = Math.min(width, height) * 0.4;
  const centerX = width / 2;
  const centerY = height / 2;
  
  ctx.fillStyle = '#FFF8E1';
  ctx.fillRect(0, 0, width, height);
  
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  for (let i = 0; i < width; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, height);
    ctx.stroke();
  }
  for (let i = 0; i < height; i += 40) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(width, i);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  
  if (style.id === 'ribbon' && style.gradient) {
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, '#FFDEE9');
    gradient.addColorStop(0.7, '#FF80AB');
    gradient.addColorStop(1, '#FF4081');
    ctx.fillStyle = gradient;
  } else {
    ctx.fillStyle = style.bgColor;
  }
  
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.strokeStyle = style.borderColor;
  ctx.lineWidth = 4;
  ctx.stroke();
  
  if (style.id === 'ribbon') {
    ctx.strokeStyle = '#F06292';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(centerX - radius * 0.3, centerY + radius * 0.85);
    ctx.quadraticCurveTo(centerX, centerY + radius * 1.1, centerX + radius * 0.3, centerY + radius * 0.85);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(centerX, centerY + radius * 0.78, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#FF4081';
    ctx.fill();
  }
  
  flowers.forEach((flower) => {
    const x = flower.position.x;
    const y = flower.position.y;
    const flowerRadius = 20 + flower.quantity * 2;
    
    const gradient = ctx.createRadialGradient(x - 5, y - 5, 0, x, y, flowerRadius);
    gradient.addColorStop(0, lightenColor(flower.color, 30));
    gradient.addColorStop(0.7, flower.color);
    gradient.addColorStop(1, darkenColor(flower.color, 20));
    
    ctx.beginPath();
    ctx.arc(x, y, flowerRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.strokeStyle = darkenColor(flower.color, 30);
    ctx.lineWidth = 2;
    ctx.stroke();
    
    if (flower.quantity > 1) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Quicksand, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`×${flower.quantity}`, x, y);
    }
  });
  
  return canvas.toDataURL('image/png');
}

function lightenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

function darkenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}
