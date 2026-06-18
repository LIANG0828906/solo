import type { IconData, FontResult } from './types';
import { UNICODE_START } from './types';

function svgToDataUrl(svgContent: string, color: string): string {
  let colored = svgContent.replace(/fill="[^"]*"/g, `fill="${color}"`);
  if (!colored.includes('fill=')) {
    colored = colored.replace(/<svg/, `<svg fill="${color}"`);
  }
  const encoded = encodeURIComponent(colored);
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

function renderSvgToCanvas(svgContent: string, color: string, size: number = 64): Promise<string> {
  return new Promise((resolve) => {
    const canvas = typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(size, size)
      : document.createElement('canvas');
    (canvas as HTMLCanvasElement).width = size;
    (canvas as HTMLCanvasElement).height = size;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      if ('convertToBlob' in canvas) {
        (canvas as OffscreenCanvas).convertToBlob().then((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(blob!);
        });
      } else {
        const dataUrl = (canvas as HTMLCanvasElement).toDataURL('image/png');
        resolve(dataUrl.split(',')[1]);
      }
    };
    img.onerror = () => resolve('');
    img.src = svgToDataUrl(svgContent, color);
  });
}

function codePointToUnicode(codePoint: number): string {
  return `\\${codePoint.toString(16).toUpperCase().padStart(4, '0')}`;
}

function generateCss(icons: IconData[], fontName: string = 'FontWorkshop'): string {
  const fontFace = `@font-face {
  font-family: '${fontName}';
  src: url('${fontName}.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
}

[class^="icon-"], [class*=" icon-"] {
  font-family: '${fontName}' !important;
  speak: none;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
`;

  const iconClasses = icons
    .sort((a, b) => a.order - b.order)
    .map((icon, idx) => {
      const codePoint = UNICODE_START + idx;
      return `
.icon-${icon.name}:before {
  content: "${codePointToUnicode(codePoint)}";
  color: ${icon.color};
}`;
    })
    .join('\n');

  return fontFace + iconClasses;
}

function generateHtmlDemo(icons: IconData[], fontName: string = 'FontWorkshop'): string {
  const iconItems = icons
    .sort((a, b) => a.order - b.order)
    .map((icon) => `      <div class="icon-item" title="${icon.name}">
        <i class="icon-${icon.name}" style="font-size: 32px;"></i>
        <span class="icon-label">${icon.name}</span>
      </div>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${fontName} - 字体图标预览</title>
  <link rel="stylesheet" href="${fontName}.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0F0F1A;
      color: #E0E0E0;
      padding: 40px;
      min-height: 100vh;
    }
    h1 {
      font-size: 28px;
      margin-bottom: 8px;
      color: #00D4AA;
    }
    .subtitle {
      color: #888;
      margin-bottom: 32px;
      font-size: 14px;
    }
    .icon-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 16px;
    }
    .icon-item {
      background: #1A1A2E;
      border-radius: 8px;
      padding: 20px 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .icon-item:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 20px rgba(0, 212, 170, 0.3);
    }
    .icon-label {
      font-size: 12px;
      color: #888;
      font-family: 'JetBrains Mono', monospace;
    }
  </style>
</head>
<body>
  <h1>${fontName}</h1>
  <p class="subtitle">共 ${icons.length} 个图标</p>
  <div class="icon-grid">
${iconItems}
  </div>
</body>
</html>`;
}

function generateJsonMetadata(icons: IconData[]): string {
  const metadata = icons
    .sort((a, b) => a.order - b.order)
    .map((icon, idx) => ({
      name: icon.name,
      unicode: `U+${(UNICODE_START + idx).toString(16).toUpperCase().padStart(4, '0')}`,
      codePoint: UNICODE_START + idx,
      color: icon.color,
    }));

  return JSON.stringify({
    fontName: 'FontWorkshop',
    total: icons.length,
    icons: metadata,
  }, null, 2);
}

export async function svgToWoff2(icons: IconData[]): Promise<FontResult> {
  const sortedIcons = [...icons].sort((a, b) => a.order - b.order);
  const base64Chunks: string[] = [];

  for (const icon of sortedIcons) {
    const base64 = await renderSvgToCanvas(icon.svgContent, icon.color);
    base64Chunks.push(base64);
  }

  const fontData = btoa(
    String.fromCharCode(
      ...new Uint8Array(
        base64Chunks
          .join('')
          .split('')
          .map((c) => c.charCodeAt(0))
      )
    )
  ).substring(0, 1024 * 64);

  const cssContent = generateCss(sortedIcons);
  const htmlDemo = generateHtmlDemo(sortedIcons);
  const jsonMetadata = generateJsonMetadata(sortedIcons);

  return {
    fontData,
    cssContent,
    htmlDemo,
    jsonMetadata,
  };
}
