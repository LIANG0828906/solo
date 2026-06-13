import type { CanvasComponent, Connection } from '../types';

interface GenerateOptions {
  projectName: string;
  components: CanvasComponent[];
  connections: Connection[];
  editorUrl?: string;
}

export function generatePrototypeHTML({
  projectName,
  components,
  connections,
  editorUrl = 'http://localhost:5173'
}: GenerateOptions): string {
  const componentsJSON = JSON.stringify(components);
  const connectionsJSON = JSON.stringify(connections);
  const safeProjectName = JSON.stringify(projectName);
  const safeEditorUrl = JSON.stringify(editorUrl);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(projectName)} - ProtoFlow 原型预览</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
        'Hiragino Sans GB', 'Microsoft YaHei', Roboto, sans-serif;
      background-color: #f8f9fa;
      color: #1f2937;
      font-size: 14px;
      line-height: 1.5;
      overflow: hidden;
    }
    .topbar {
      height: 48px;
      background: #ffffff;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .topbar-title {
      font-size: 15px;
      font-weight: 600;
      color: #1f2937;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .topbar-title::before {
      content: '';
      width: 4px;
      height: 18px;
      background: #3b82f6;
      border-radius: 2px;
    }
    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 16px;
      background: #3b82f6;
      color: white;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      transition: background 0.2s;
      border: none;
      cursor: pointer;
    }
    .back-btn:hover { background: #2563eb; }
    .back-btn svg { width: 14px; height: 14px; }
    .canvas-wrapper {
      width: 100vw;
      height: calc(100vh - 48px);
      position: relative;
      overflow: auto;
    }
    .page-canvas {
      position: relative;
      min-width: 100%;
      min-height: 100%;
      padding: 40px;
      transition: opacity 0.3s ease;
    }
    .page-canvas.fade-out { opacity: 0; }
    .proto-component {
      position: absolute;
      user-select: none;
      overflow: hidden;
      transform-origin: center center;
    }
    .proto-component.clickable {
      cursor: pointer;
    }
    .proto-component.clickable:hover {
      filter: brightness(0.98);
      box-shadow: 0 0 0 2px rgba(59,130,246,0.3) !important;
    }
    .proto-text {
      display: flex;
      align-items: center;
      padding: 4px 6px;
      word-break: break-word;
      white-space: pre-wrap;
      pointer-events: none;
    }
    .proto-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      pointer-events: none;
    }
    .connection-hint {
      position: fixed;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      padding: 8px 16px;
      background: rgba(31,41,55,0.85);
      color: white;
      border-radius: 8px;
      font-size: 12px;
      animation: hintFade 2.5s ease forwards;
      pointer-events: none;
      z-index: 9999;
    }
    @keyframes hintFade {
      0%, 80% { opacity: 0; transform: translate(-50%, 10px); }
      10%, 70% { opacity: 1; transform: translate(-50%, 0); }
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #9ca3af;
      gap: 8px;
      font-size: 13px;
    }
    .empty-state svg { width: 48px; height: 48px; opacity: 0.5; }
  </style>
</head>
<body>
  <div class="topbar">
    <div class="topbar-title">
      ${escapeHtml(projectName)}</div>
    <button class="back-btn" onclick="goBack()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
      返回编辑器
    </button>
  </div>
  <div class="canvas-wrapper" id="canvasWrapper">
    <div class="page-canvas" id="pageCanvas"></div>
  </div>
  <script>
    const COMPONENTS = ${componentsJSON};
    const CONNECTIONS = ${connectionsJSON};
    const PROJECT_NAME = ${safeProjectName};
    const EDITOR_URL = ${safeEditorUrl};

    const clickableIds = new Set(CONNECTIONS.map(c => c.fromComponentId));

    function goBack() {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = EDITOR_URL;
      }
    }

    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    function buildPage() {
      const canvas = document.getElementById('pageCanvas');
      canvas.innerHTML = '';

      if (COMPONENTS.length === 0) {
        canvas.innerHTML = '<div class="empty-state" style="position:absolute;inset:0;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <div>暂无组件，返回编辑器添加内容</div>
        </div>';
        return;
      }

      const sorted = [...COMPONENTS].sort((a, b) => a.zIndex - b.zIndex);

      sorted.forEach(comp => {
        const el = document.createElement('div');
        el.className = 'proto-component';
        el.dataset.id = comp.id;
        if (clickableIds.has(comp.id)) {
          el.classList.add('clickable');
        }

        el.style.left = comp.x + 'px';
        el.style.top = comp.y + 'px';
        el.style.width = comp.width + 'px';
        el.style.height = comp.height + 'px';
        el.style.transform = 'rotate(' + comp.rotation + 'deg)';
        el.style.zIndex = String(comp.zIndex);
        el.style.opacity = String(comp.style.opacity ?? 1);

        const style = comp.style;
        if (comp.type !== 'text') {
          if (style.backgroundColor) el.style.backgroundColor = style.backgroundColor;
          if (style.borderColor && style.borderWidth) {
            el.style.border = style.borderWidth + 'px solid ' + style.borderColor;
          }
          if (style.borderRadius != null) el.style.borderRadius = style.borderRadius + 'px';
          if (comp.type === 'circle') el.style.borderRadius = '50%';
        }

        if (comp.type === 'text') {
          el.classList.add('proto-text');
          el.style.color = style.color || '#1f2937';
          el.style.fontSize = (style.fontSize || 14) + 'px';
          el.style.fontWeight = String(style.fontWeight || 400);
          el.textContent = comp.content || '';
        } else if (comp.type === 'image') {
          if (style.src && style.src.startsWith('data:') || style.src && style.src.startsWith('http')) {
            el.innerHTML = '<img class="proto-image" src="' + style.src + '" alt="" />';
          } else {
            el.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:12px;">图片</div>';
          }
        } else {
          if (comp.content) {
            el.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:8px;color:' + (style.color || '#1f2937') + ';font-size:' + (style.fontSize || 14) + 'px;font-weight:' + (style.fontWeight || 400) + ';overflow:hidden;word-break:break-word;">' + escapeHtml(comp.content) + '</div>';
          }
        }

        if (clickableIds.has(comp.id)) {
          el.addEventListener('click', () => handleJump(comp.id));
        }

        canvas.appendChild(el);
      });
    }

    function showHint(text) {
      const existing = document.querySelector('.connection-hint');
      if (existing) existing.remove();
      const hint = document.createElement('div');
      hint.className = 'connection-hint';
      hint.textContent = text;
      document.body.appendChild(hint);
      setTimeout(() => hint.remove(), 2600);
    }

    function handleJump(fromId) {
      const targetConn = CONNECTIONS.find(c => c.fromComponentId === fromId);
      if (!targetConn) return;

      const toComp = COMPONENTS.find(c => c.id === targetConn.toComponentId);
      if (!toComp) return;

      const canvas = document.getElementById('pageCanvas');
      canvas.classList.add('fade-out');

      setTimeout(() => {
        const wrapper = document.getElementById('canvasWrapper');
        const targetX = Math.max(0, toComp.x - 40);
        const targetY = Math.max(0, toComp.y - 80);
        wrapper.scrollTo({ left: targetX, top: targetY, behavior: 'smooth' });

        if (targetConn.label) {
          showHint(targetConn.label);
        }

        setTimeout(() => {
          canvas.classList.remove('fade-out');
        }, 150);
      }, 150);
    }

    buildPage();
  </script>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function previewInNewWindow(html: string): void {
  const win = window.open('', '_blank');
  if (!win) {
    alert('请允许弹出窗口以预览原型');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

export function downloadHTML(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.html') ? filename : `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
