import 'blueimp-canvas-to-blob';

export async function exportToPng(
  svgElement: SVGSVGElement,
  scale: number = 2
): Promise<void> {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  
  try {
    const img = await loadImage(url);
    const width = svgElement.viewBox.baseVal.width || svgElement.clientWidth;
    const height = svgElement.viewBox.baseVal.height || svgElement.clientHeight;
    
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    ctx.fillStyle = '#FAFAFA';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, width, height);
    
    const blob = await canvasToBlob(canvas, 'image/png', 0.95);
    if (!blob) {
      throw new Error('Failed to convert canvas to blob');
    }
    
    downloadBlob(blob, 'signature.png');
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load SVG image'));
    img.src = src;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (canvas.toBlob) {
      canvas.toBlob(resolve, type, quality);
    } else {
      const dataUrl = canvas.toDataURL(type, quality);
      const blob = dataURLtoBlob(dataUrl);
      resolve(blob);
    }
  });
}

function dataURLtoBlob(dataurl: string): Blob | null {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) return null;
  
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
