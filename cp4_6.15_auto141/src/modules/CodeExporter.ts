import { saveAs } from 'file-saver';
import type { LayoutParams } from './LayoutEngine';

export class CodeExporter {
  generateFullHTML(params: LayoutParams, _css: string): string {
    const fontFamily = params.fontFamily.includes(' ') 
      ? `"${params.fontFamily}"` 
      : params.fontFamily;

    const escapedText = this.escapeHtml(params.text);

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Typography Preview - ${params.fontFamily}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(params.fontFamily).replace(/%20/g, '+')}:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f7f9fc;
      padding: 40px 20px;
      font-family: ${fontFamily}, sans-serif;
    }

    .container {
      max-width: 900px;
      width: 100%;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      padding: 60px;
    }

    .typography-preview {
      font-family: ${fontFamily}, sans-serif;
      font-size: ${params.fontSize}px;
      line-height: ${params.lineHeight};
      letter-spacing: ${params.letterSpacing}em;
      color: ${params.color};
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .info-panel {
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1px solid #e8edf3;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .info-title {
      font-size: 14px;
      font-weight: 600;
      color: #1e3a5f;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-label {
      font-size: 12px;
      color: #6b7c93;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .info-value {
      font-size: 16px;
      font-weight: 500;
      color: #4a6fa5;
    }
  </style>
</head>
<body>
  <div class="container">
    <p class="typography-preview">${escapedText}</p>
    <div class="info-panel">
      <div class="info-title">Typography Properties</div>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Font Family</span>
          <span class="info-value">${params.fontFamily}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Font Size</span>
          <span class="info-value">${params.fontSize}px</span>
        </div>
        <div class="info-item">
          <span class="info-label">Line Height</span>
          <span class="info-value">${params.lineHeight}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Letter Spacing</span>
          <span class="info-value">${params.letterSpacing}em</span>
        </div>
        <div class="info-item">
          <span class="info-label">Text Color</span>
          <span class="info-value">${params.color}</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  generateCSSOnly(css: string): string {
    return `/* Typography CSS */
${css}

/* Usage:
<p class="typography-preview">Your text here</p>
*/`;
  }

  generateHTMLSnippet(params: LayoutParams): string {
    const escapedText = this.escapeHtml(params.text);
    return `<p class="typography-preview">${escapedText}</p>`;
  }

  async downloadHTML(params: LayoutParams, css: string): Promise<void> {
    const html = this.generateFullHTML(params, css);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const timestamp = this.generateTimestamp();
    saveAs(blob, `typography-${timestamp}.html`);
  }

  async copyToClipboard(content: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(content);
      return true;
    } catch {
      return this.fallbackCopy(content);
    }
  }

  private fallbackCopy(content: string): boolean {
    const textArea = document.createElement('textarea');
    textArea.value = content;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch {
      document.body.removeChild(textArea);
      return false;
    }
  }

  private generateTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
