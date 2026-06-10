import html2canvas from 'html2canvas';

export async function exportAsImage(): Promise<void> {
  const element = document.getElementById('loom-canvas');
  if (!element) throw new Error('Canvas element not found');

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#4a3b2c',
    logging: false
  });

  const link = document.createElement('a');
  link.download = `时光裁缝_${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export function getEraProgress(): number {
  return Math.min(100, Math.floor(Math.random() * 100));
}
