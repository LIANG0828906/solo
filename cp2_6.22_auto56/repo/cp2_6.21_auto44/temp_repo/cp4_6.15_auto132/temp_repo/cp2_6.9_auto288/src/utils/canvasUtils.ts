export const captureThumbnail = (
  element: HTMLElement | null,
  size: number = 200
): string => {
  if (!element) return '';
  
  try {
    const svgElement = element.querySelector('svg');
    if (svgElement) {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    const rect = element.getBoundingClientRect();
    const scale = size / Math.max(rect.width, rect.height);
    
    ctx.fillStyle = '#e8d5c4';
    ctx.fillRect(0, 0, size, size);
    
    ctx.save();
    ctx.scale(scale, scale);
    
    ctx.fillStyle = 'rgba(196, 163, 90, 0.6)';
    ctx.beginPath();
    ctx.arc(rect.width / 2, rect.height / 2, Math.min(rect.width, rect.height) / 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    return canvas.toDataURL('image/png');
  } catch {
    return generatePlaceholderThumbnail(size);
  }
};

export const generatePlaceholderThumbnail = (size: number = 200): string => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  ctx.fillStyle = '#e8d5c4';
  ctx.fillRect(0, 0, size, size);
  
  ctx.strokeStyle = '#a08060';
  ctx.lineWidth = 2;
  
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * size / 8);
    ctx.lineTo(size, i * size / 8);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(i * size / 8, 0);
    ctx.lineTo(i * size / 8, size);
    ctx.stroke();
  }
  
  ctx.fillStyle = '#c4a35a';
  ctx.fillRect(size / 4, size / 4, size / 2, size / 2);
  
  return canvas.toDataURL('image/png');
};

export const drawBambooIcon = (
  ctx: CanvasRenderingContext2D,
  color: string,
  size: number = 60
): void => {
  ctx.clearRect(0, 0, size, size);
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  
  ctx.beginPath();
  ctx.moveTo(size / 2, size);
  ctx.quadraticCurveTo(size / 2 - 5, size / 2, size / 2, 10);
  ctx.stroke();
  
  for (let i = 0; i < 4; i++) {
    const y = size - 10 - i * 12;
    ctx.beginPath();
    ctx.moveTo(size / 2 - 8, y);
    ctx.lineTo(size / 2 + 8, y);
    ctx.stroke();
  }
  
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(size / 2 + 10, size / 3, 8, 3, Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.ellipse(size / 2 - 12, size / 2, 8, 3, -Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.ellipse(size / 2 + 8, size / 1.5, 6, 2, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();
};
