import type { CanvasComponent, ComponentStyle } from '@/types'

function styleToCSS(style: ComponentStyle): string {
  return [
    `background-color: ${style.backgroundColor}`,
    `color: ${style.color}`,
    `font-size: ${style.fontSize}px`,
    `border-color: ${style.borderColor}`,
    `border-width: ${style.borderWidth}px`,
    `border-style: solid`,
    `border-radius: ${style.borderRadius}px`,
    `box-shadow: ${style.boxShadow}`,
    `padding: ${style.padding}px`,
  ].join('; ')
}

function buildComponentHTML(comp: CanvasComponent): string {
  const positionStyle = `position: absolute; left: ${comp.x}px; top: ${comp.y}px; width: ${comp.width}px; height: ${comp.height}px; z-index: ${comp.zIndex}; box-sizing: border-box;`
  const styleAttr = `${positionStyle} ${styleToCSS(comp.style)}`

  switch (comp.type) {
    case 'button':
      return `<button style="${styleAttr}">${comp.content ?? '按钮'}</button>`
    case 'input':
      return `<input type="text" placeholder="${comp.placeholder ?? ''}" style="${styleAttr}; outline: none;" />`
    case 'text':
      return `<div style="${styleAttr}; display: flex; align-items: center;">${comp.content ?? ''}</div>`
    case 'image':
      return `<img src="${comp.src ?? ''}" alt="" style="${styleAttr}; object-fit: cover;" />`
    case 'container': {
      const childrenHTML = comp.children?.map(buildComponentHTML).join('\n') ?? ''
      return `<div style="${styleAttr}; overflow: hidden;">\n${childrenHTML}\n</div>`
    }
    default:
      return ''
  }
}

export function generateHTML(components: CanvasComponent[]): string {
  const bodyContent = components.map(buildComponentHTML).join('\n')

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>设计工坊导出</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    body {
      background: #ffffff;
      min-height: 100vh;
    }
    .canvas {
      position: relative;
      width: 100%;
      min-height: 100vh;
    }
  </style>
</head>
<body>
  <div class="canvas">
${bodyContent}
  </div>
</body>
</html>`

  return html
}

export function generatePreviewHTML(components: CanvasComponent[]): string {
  const exportedHTML = generateHTML(components)
  const encodedHTML = btoa(unescape(encodeURIComponent(exportedHTML)))

  const previewHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>预览 - 迷你设计工坊</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    body {
      background: #0F172A;
      color: #F8FAFC;
      min-height: 100vh;
    }
    .header {
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      background: #1E293B;
      border-bottom: 1px solid #334155;
    }
    .header h1 {
      font-size: 18px;
      font-weight: 600;
      color: #F8FAFC;
    }
    .copy-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: #3B82F6;
      color: #FFFFFF;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    .copy-btn:hover {
      background: #2563EB;
    }
    .copy-btn.copied {
      background: #10B981;
    }
    .content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 24px;
    }
    .preview-section,
    .code-section {
      background: #1E293B;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #334155;
    }
    .section-title {
      padding: 14px 20px;
      font-size: 14px;
      font-weight: 600;
      color: #94A3B8;
      background: #334155;
      border-bottom: 1px solid #475569;
    }
    .preview-frame {
      width: 100%;
      min-height: 600px;
      border: none;
      background: #FFFFFF;
      display: block;
    }
    .code-wrapper {
      position: relative;
      max-height: 500px;
      overflow: auto;
    }
    pre {
      margin: 0;
      padding: 20px;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.6;
      color: #E2E8F0;
      background: #0F172A;
      white-space: pre;
      overflow-x: auto;
    }
    code {
      font-family: inherit;
    }
    .toast {
      position: fixed;
      top: 24px;
      right: 24px;
      padding: 12px 20px;
      background: #10B981;
      color: #FFFFFF;
      border-radius: 8px;
      font-size: 14px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      opacity: 0;
      transform: translateY(-20px);
      transition: all 0.3s ease;
      z-index: 1000;
      pointer-events: none;
    }
    .toast.show {
      opacity: 1;
      transform: translateY(0);
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>HTML 预览</h1>
    <button class="copy-btn" id="copyBtn">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <span id="copyText">复制代码</span>
    </button>
  </div>
  <div class="content">
    <div class="preview-section">
      <div class="section-title">渲染预览</div>
      <iframe class="preview-frame" id="previewFrame" srcdoc=""></iframe>
    </div>
    <div class="code-section">
      <div class="section-title">HTML 源代码</div>
      <div class="code-wrapper">
        <pre><code id="codeBlock"></code></pre>
      </div>
    </div>
  </div>
  <div class="toast" id="toast">复制成功！</div>
  <script>
    (function() {
      const encoded = '${encodedHTML}';
      const html = decodeURIComponent(escape(atob(encoded)));
      document.getElementById('previewFrame').srcdoc = html;
      document.getElementById('codeBlock').textContent = html;

      const btn = document.getElementById('copyBtn');
      const text = document.getElementById('copyText');
      const toast = document.getElementById('toast');

      btn.addEventListener('click', function() {
        navigator.clipboard.writeText(html).then(function() {
          btn.classList.add('copied');
          text.textContent = '已复制';
          toast.classList.add('show');
          setTimeout(function() {
            btn.classList.remove('copied');
            text.textContent = '复制代码';
            toast.classList.remove('show');
          }, 1500);
        }).catch(function() {
          const ta = document.createElement('textarea');
          ta.value = html;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          btn.classList.add('copied');
          text.textContent = '已复制';
          toast.classList.add('show');
          setTimeout(function() {
            btn.classList.remove('copied');
            text.textContent = '复制代码';
            toast.classList.remove('show');
          }, 1500);
        });
      });
    })();
  </script>
</body>
</html>`

  return previewHTML
}
