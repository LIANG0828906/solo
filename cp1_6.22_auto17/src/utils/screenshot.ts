import html2canvas from 'html2canvas';

export async function captureDashboard(): Promise<string | null> {
  const el = document.getElementById('dashboard-grid');
  if (!el) return null;

  const canvas = await html2canvas(el, {
    backgroundColor: '#0a0e17',
    scale: 2,
    useCORS: true,
    logging: false,
  });

  return canvas.toDataURL('image/png');
}

export function downloadScreenshot(dataUrl: string, filename = 'cyberpunk-dashboard.png') {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
