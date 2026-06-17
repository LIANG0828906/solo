import type { Block } from '../stores/editorStore';

export function generateExportHTML(blocks: Block[]): string {
  const blocksHTML = blocks
    .map((block) => {
      const style = `
        position: absolute;
        left: ${block.x}px;
        top: ${block.y}px;
        width: ${block.width}px;
        height: ${block.height}px;
        box-sizing: border-box;
      `;

      if (block.type === 'title') {
        return `<div style="${style} font-size: 32px; font-weight: bold; color: #111827; line-height: 1.3; display: flex; align-items: center;">${escapeHTML(block.content)}</div>`;
      } else if (block.type === 'text') {
        return `<div style="${style} font-size: 14px; color: #374151; line-height: 1.6; white-space: pre-wrap; overflow: hidden;">${escapeHTML(block.content)}</div>`;
      } else if (block.type === 'image') {
        if (block.content) {
          return `<img src="${block.content}" style="${style} object-fit: cover;" alt="" />`;
        }
        return `<div style="${style} background: #F3F4F6; border: 2px dashed #D1D5DB; display: flex; align-items: center; justify-content: center; color: #9CA3AF; font-size: 14px;">图片占位</div>`;
      }
      return '';
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>导出简报</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #E5E7EB;
      display: flex;
      justify-content: center;
      padding: 40px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .page {
      position: relative;
      width: 794px;
      min-height: 1123px;
      background: #ffffff;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }
    @media print {
      body { background: white; padding: 0; }
      .page { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    ${blocksHTML}
  </div>
</body>
</html>`;
}

function escapeHTML(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function downloadHTML(html: string, filename: string = '简报.html'): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function openPreviewInNewTab(html: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

export function exportToHTML(blocks: Block[]): { html: string; preview: () => void; download: () => void } {
  const html = generateExportHTML(blocks);
  return {
    html,
    preview: () => openPreviewInNewTab(html),
    download: () => downloadHTML(html),
  };
}
