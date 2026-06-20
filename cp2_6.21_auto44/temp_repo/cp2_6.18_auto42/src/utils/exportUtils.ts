import { toPng } from 'html-to-image';
import type { CardColors } from '@/constants/templates';

export async function generateThumbnail(
  node: HTMLElement,
  width: number = 160,
  height: number = 120
): Promise<string> {
  const dataUrl = await toPng(node, {
    pixelRatio: 1,
    width,
    height,
    cacheBust: true,
  });
  return dataUrl;
}

async function waitForFontsWithTimeout(timeoutMs: number = 3000): Promise<void> {
  if (!('fonts' in document)) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return;
  }

  try {
    const fontsReady = document.fonts.ready;
    const timeout = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('Font loading timed out')), timeoutMs);
    });

    try {
      await Promise.race([fontsReady, timeout]);
    } catch (fontErr) {
      console.warn('[exportCardAsPng] 字体加载超时或失败，使用系统字体降级导出:', fontErr);

      const testCanvas = document.createElement('canvas');
      testCanvas.width = 1;
      testCanvas.height = 1;
      const ctx = testCanvas.getContext('2d');
      if (ctx) {
        const fontFamilies = [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'PingFang SC',
          'Microsoft YaHei',
          'sans-serif',
        ].join(', ');
        ctx.font = `16px ${fontFamilies}`;
        void ctx.measureText('test').width;
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  } catch (err) {
    console.warn('[exportCardAsPng] 字体API异常，使用降级方案:', err);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

export async function exportCardAsPng(node: HTMLElement | null): Promise<void> {
  if (!node) {
    throw new Error('卡片元素不存在');
  }

  await waitForFontsWithTimeout(3000);

  void node.offsetHeight;

  let dataUrl: string;
  try {
    dataUrl = await toPng(node, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: undefined,
      skipFonts: false,
      style: {
        transform: 'none',
        animation: 'none',
        transition: 'none',
        textRendering: 'geometricPrecision',
      } as any,
    });
  } catch (renderErr) {
    console.warn('[exportCardAsPng] 主渲染失败，尝试无字体模式:', renderErr);
    dataUrl = await toPng(node, {
      pixelRatio: 2,
      cacheBust: true,
      skipFonts: true,
      backgroundColor: undefined,
      style: {
        transform: 'none',
        animation: 'none',
        transition: 'none',
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
      },
    });
  }

  if (!dataUrl || dataUrl.length < 100) {
    throw new Error('导出图片数据为空，请重试');
  }

  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const fileName = `card_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.png`;

  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export interface CardHtmlParams {
  title: string;
  body: string;
  emoji: string;
  colors: CardColors;
  fontFamily: string;
  width?: number;
  height?: number;
}

export function generateCardHtml(params: CardHtmlParams): string {
  const { title, body, emoji, colors, fontFamily, width = 400, height = 300 } = params;
  const indent = '  ';
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>知识卡片</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: ${fontFamily}; }
    .card {
      width: ${width}px;
      height: ${height}px;
      background: ${colors.background};
      border: 1px solid ${colors.accent};
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      gap: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
      font-family: ${fontFamily};
      transition: background-color 0.4s ease-out;
    }
    .emoji {
      width: 60px;
      height: 60px;
      font-size: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      margin-top: 4px;
    }
    .title {
      color: ${colors.title};
      font-size: 28px;
      font-weight: 700;
      text-align: center;
      line-height: 1.3;
      max-width: 100%;
      word-break: break-word;
    }
    .body {
      color: ${colors.body};
      font-size: 14px;
      line-height: 1.6;
      text-indent: 2em;
      text-align: justify;
      max-width: 100%;
      word-break: break-word;
    }
  </style>
</head>
<body>
${indent}<div class="card">
${indent}${indent}<div class="emoji">${emoji}</div>
${indent}${indent}<div class="title">${title}</div>
${indent}${indent}<div class="body">${body}</div>
${indent}</div>
</body>
</html>`;
}

export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
  } else {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } finally {
      textArea.remove();
    }
  }
}
