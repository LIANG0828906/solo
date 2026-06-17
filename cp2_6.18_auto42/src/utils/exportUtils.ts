import { toPng } from 'html-to-image';
import type { CardColors } from '@/constants/templates';

export async function exportCardAsPng(node: HTMLElement | null): Promise<void> {
  if (!node) {
    throw new Error('卡片元素不存在');
  }

  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    cacheBust: true,
  });

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
