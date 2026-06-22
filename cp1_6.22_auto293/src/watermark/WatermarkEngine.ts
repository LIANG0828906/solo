export interface WatermarkParams {
  text: string;
  opacity: number;
  angle: number;
  spacing: number;
  fontFamily: string;
  fontSize: number;
  color: string;
}

export interface DocumentMeta {
  title: string;
  author: string;
  createdAt: string;
}

export interface WatermarkResult {
  watermarkStyle: string;
  documentHtml: string;
  fullHtmlTemplate: string;
}

export class WatermarkEngine {
  static generateWatermarkStyle(params: WatermarkParams): string {
    const { text, opacity, angle, spacing, fontFamily, fontSize, color } = params;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${spacing}" height="${spacing}"><text x="50%" y="50%" fill="${color}" fill-opacity="${opacity}" font-family="${fontFamily}" font-size="${fontSize}" font-weight="500" text-anchor="middle" dominant-baseline="middle" transform="rotate(${angle} ${spacing / 2} ${spacing / 2})">${text}</text></svg>`;

    const encodedSvg = encodeURIComponent(svg)
      .replace(/'/g, '%27')
      .replace(/"/g, '%22');
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;

    return `
      background-image: url("${dataUrl}");
      background-repeat: repeat;
      background-size: ${spacing}px ${spacing}px;
      pointer-events: none;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10;
      transition: all 0.3s ease-in-out;
    `.trim();
  }

  static generateDocumentHtml(content: string, meta: DocumentMeta): string {
    return `
      <div class="document-page" style="
        position: relative;
        width: 100%;
        min-height: 100%;
        background: #ffffff;
        padding: 60px 72px;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        line-height: 1.8;
        color: #1F2937;
        overflow: hidden;
      ">
        <div class="document-header" style="
          border-bottom: 2px solid #E5E7EB;
          padding-bottom: 24px;
          margin-bottom: 32px;
        ">
          <h1 style="
            font-size: 28px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 8px;
          ">${meta.title}</h1>
          <div style="
            font-size: 14px;
            color: #6B7280;
            display: flex;
            gap: 24px;
          ">
            <span>作者：${meta.author}</span>
            <span>创建时间：${meta.createdAt}</span>
          </div>
        </div>
        <div class="document-body" style="
          font-size: 15px;
          color: #374151;
        ">
          ${content.split('\n').map(p => p.trim() ? `<p style="margin-bottom: 16px; text-indent: 2em;">${p}</p>` : '').join('')}
        </div>
      </div>
    `.trim();
  }

  static generateFullHtmlTemplate(
    content: string,
    meta: DocumentMeta,
    params: WatermarkParams
  ): string {
    const watermarkStyle = this.generateWatermarkStyle(params);

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${meta.title} - 带水印文档</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #f3f4f6;
      padding: 40px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .document-wrapper {
      position: relative;
      max-width: 800px;
      margin: 0 auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      border-radius: 4px;
      overflow: hidden;
    }
    .watermark-overlay {
      ${watermarkStyle}
    }
    .copyright-footer {
      margin-top: 24px;
      padding: 20px;
      background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
      border: 1px solid #D1D5DB;
      border-radius: 12px;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
      font-size: 13px;
      color: #4B5563;
    }
    .copyright-footer p { margin-bottom: 4px; }
    .copyright-footer strong { color: #1F2937; }
  </style>
</head>
<body>
  <div class="document-wrapper">
    ${this.generateDocumentHtml(content, meta)}
    <div class="watermark-overlay"></div>
  </div>
  <div class="copyright-footer">
    <p><strong>文档标题：</strong>${meta.title}</p>
    <p><strong>作　　者：</strong>${meta.author}</p>
    <p><strong>生成时间：</strong>${meta.createdAt}</p>
    <p><strong>水印文字：</strong>${params.text}</p>
    <p><strong>水印参数：</strong>透明度 ${(params.opacity * 100).toFixed(0)}% | 角度 ${params.angle}° | 间距 ${params.spacing}px | 字体 ${params.fontFamily}</p>
  </div>
</body>
</html>`;
  }
}
