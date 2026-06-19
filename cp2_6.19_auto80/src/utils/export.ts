import type { Risk } from '@/types';
import { LEVEL_LABELS, STATUS_LABELS } from '@/types';

export const exportToCSV = (risks: Risk[]): void => {
  const headers = ['ID', '标题', '风险等级', '状态', '负责人', '创建日期', '预计解决日期', '影响范围'];
  const rows = risks.map((risk) => [
    risk.id,
    risk.title,
    LEVEL_LABELS[risk.level],
    STATUS_LABELS[risk.status],
    risk.owner,
    risk.createdAt,
    risk.expectedCloseDate,
    risk.impact,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `风险看板_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToPNG = async (elementId: string): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = element.getBoundingClientRect();
    const scale = 2;
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    ctx.scale(scale, scale);

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, rect.width, rect.height);

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="transform: scale(1); transform-origin: top left;">
            ${element.outerHTML}
          </div>
        </foreignObject>
      </svg>
    `;

    const img = new Image();
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve();
      };
      img.onerror = reject;
      img.src = url;
    });

    canvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      const pngUrl = URL.createObjectURL(blob);
      link.setAttribute('href', pngUrl);
      link.setAttribute('download', `风险看板快照_${new Date().toISOString().split('T')[0]}.png`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(pngUrl);
    }, 'image/png');
  } catch {
    const fallbackCanvas = document.createElement('canvas');
    const fallbackCtx = fallbackCanvas.getContext('2d');
    if (!fallbackCtx) return;
    
    fallbackCanvas.width = 800;
    fallbackCanvas.height = 600;
    fallbackCtx.fillStyle = '#1a1a2e';
    fallbackCtx.fillRect(0, 0, 800, 600);
    fallbackCtx.fillStyle = '#e0e0e0';
    fallbackCtx.font = '20px sans-serif';
    fallbackCtx.fillText('风险看板快照', 50, 50);
    fallbackCtx.font = '14px sans-serif';
    fallbackCtx.fillText(`风险总数: ${risks.length}`, 50, 100);
    fallbackCtx.fillText(`导出时间: ${new Date().toLocaleString()}`, 50, 130);
    
    fallbackCanvas.toBlob((blob) => {
      if (!blob) return;
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `风险看板快照_${new Date().toISOString().split('T')[0]}.png`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png');
  }
};
