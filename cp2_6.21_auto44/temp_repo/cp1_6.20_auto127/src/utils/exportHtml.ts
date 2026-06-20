import type { CanvasElement, ImageElement, TextElement, ButtonElement, DividerElement } from '../types';

function placeholderImageBase64(width: number, height: number, color: string = '#e0e0e0'): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <pattern id="pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="2" fill="${color}" opacity="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="#f5f5f5"/>
      <rect width="100%" height="100%" fill="url(#pattern)"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#999" font-family="Arial, sans-serif" font-size="14">
        图片占位
      </text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg.trim())))}`;
}

function elementToStyle(el: CanvasElement): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    left: `${el.x}px`,
    top: `${el.y}px`,
    width: `${el.width}px`,
    height: `${el.height}px`,
    boxSizing: 'border-box',
    overflow: 'hidden',
  };

  switch (el.type) {
    case 'image': {
      const imgEl = el as ImageElement;
      return {
        ...base,
        backgroundColor: imgEl.backgroundColor || '#e0e0e0',
        borderRadius: `${imgEl.borderRadius || 0}px`,
      };
    }
    case 'text': {
      const txtEl = el as TextElement;
      return {
        ...base,
        fontSize: `${txtEl.fontSize}px`,
        fontFamily: txtEl.fontFamily,
        color: txtEl.color,
        fontWeight: txtEl.fontWeight,
        textAlign: txtEl.textAlign,
        lineHeight: txtEl.lineHeight,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: txtEl.textAlign === 'center' ? 'center' : txtEl.textAlign === 'right' ? 'flex-end' : 'flex-start',
        border: '1px dashed #ccc',
        padding: '4px',
      };
    }
    case 'button': {
      const btnEl = el as ButtonElement;
      return {
        ...base,
        backgroundColor: btnEl.backgroundColor,
        color: btnEl.textColor,
        fontSize: `${btnEl.fontSize}px`,
        borderRadius: `${btnEl.borderRadius}px`,
        border: `${btnEl.borderWidth}px solid ${btnEl.borderColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 500,
        cursor: 'pointer',
        userSelect: 'none',
      };
    }
    case 'divider': {
      const divEl = el as DividerElement;
      return {
        ...base,
        borderTop: `${divEl.thickness}px ${divEl.style} ${divEl.color}`,
        height: 'auto',
      };
    }
    default:
      return base;
  }
}

export function generateHTML(
  elements: CanvasElement[],
  canvasWidth: number,
  canvasHeight: number,
  title: string = '作品集'
): string {
  const elementsHtml = elements
    .map((el) => {
      const style = elementToStyle(el);
      const styleStr = Object.entries(style)
        .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`)
        .join('; ');

      switch (el.type) {
        case 'image': {
          const imgEl = el as ImageElement;
          const src = imgEl.src || placeholderImageBase64(el.width, el.height, imgEl.backgroundColor);
          return `<div style="${styleStr}"><img src="${src}" alt="${imgEl.alt || ''}" style="width: 100%; height: 100%; object-fit: cover; display: block;"/></div>`;
        }
        case 'text': {
          const txtEl = el as TextElement;
          return `<div style="${styleStr}">${txtEl.content.replace(/\n/g, '<br>')}</div>`;
        }
        case 'button': {
          const btnEl = el as ButtonElement;
          return `<button style="${styleStr}">${btnEl.text}</button>`;
        }
        case 'divider':
          return `<div style="${styleStr}"></div>`;
        default:
          return '';
      }
    })
    .join('\n      ');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background-color: #f5f5f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .canvas {
      position: relative;
      width: ${canvasWidth}px;
      height: ${canvasHeight}px;
      background-color: #ffffff;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
  </style>
</head>
<body>
  <div class="canvas">
      ${elementsHtml}
  </div>
</body>
</html>`;
}

export function downloadHTML(html: string, filename: string = 'portfolio.html'): void {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
