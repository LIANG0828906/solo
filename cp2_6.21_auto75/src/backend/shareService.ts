import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { Panel, ScriptLine } from '../types';

interface ShareEntry {
  panels: Panel[];
  scriptLines: ScriptLine[];
  expireAt: number;
}

export const shareStore = new Map<string, ShareEntry>();

const DEFAULT_EXPIRE_HOURS = 24;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [token, entry] of shareStore) {
    if (entry.expireAt < now) {
      shareStore.delete(token);
    }
  }
}, CLEANUP_INTERVAL_MS);

export const handleCreateShare = (req: Request, res: Response): void => {
  try {
    const { panels, scriptLines, expireHours } = req.body as {
      panels: Panel[];
      scriptLines: ScriptLine[];
      expireHours?: number;
    };

    if (!Array.isArray(panels)) {
      res.status(400).json({ success: false, error: '缺少分镜数据 panels' });
      return;
    }

    const token = uuidv4().replace(/-/g, '').slice(0, 16);
    const hours = typeof expireHours === 'number' && expireHours > 0 ? expireHours : DEFAULT_EXPIRE_HOURS;
    const expireAt = Date.now() + hours * 60 * 60 * 1000;

    shareStore.set(token, { panels, scriptLines: scriptLines ?? [], expireAt });

    res.json({
      success: true,
      token,
      shareUrl: `/s/${token}`,
    });
  } catch (err) {
    console.error('[shareService] create error:', err);
    res.status(500).json({ success: false, error: (err as Error).message });
  }
};

export const handleGetShare = (req: Request, res: Response): void => {
  try {
    const { token } = req.params as { token: string };
    const entry = shareStore.get(token);

    if (!entry) {
      res.status(404).json({ valid: false, error: '分享链接不存在或已过期' });
      return;
    }
    if (entry.expireAt < Date.now()) {
      shareStore.delete(token);
      res.status(404).json({ valid: false, error: '分享链接已过期' });
      return;
    }

    res.json({
      valid: true,
      panels: entry.panels,
      scriptLines: entry.scriptLines,
    });
  } catch (err) {
    console.error('[shareService] get error:', err);
    res.status(500).json({ valid: false, error: (err as Error).message });
  }
};

export function handleGetSharePreview(token: string): ShareEntry | null {
  const entry = shareStore.get(token);
  if (!entry) return null;
  if (entry.expireAt < Date.now()) {
    shareStore.delete(token);
    return null;
  }
  return entry;
}

export function buildShareViewHtml(entry: ShareEntry): string {
  const panelsJson = JSON.stringify(entry.panels);
  const scriptLinesJson = JSON.stringify(entry.scriptLines);
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>分镜脚本 - 只读预览</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@400;500;700&family=ZCOOL+KuaiLe&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Noto Sans SC', system-ui, sans-serif; background: #f0f0f0; color: #2d2d2d; padding: 30px 20px; min-height: 100vh; }
    header { max-width: 1400px; margin: 0 auto 24px; display: flex; justify-content: space-between; align-items: center; }
    header h1 { font-size: 22px; font-weight: 700; }
    header .meta { font-size: 12px; color: #888; }
    .container { max-width: 1400px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .canvas-wrap { position: relative; width: 100%; overflow: auto; background-color: #f0f0f0;
      background-image: linear-gradient(rgba(208,208,208,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(208,208,208,0.5) 1px, transparent 1px);
      background-size: 20px 20px; border-radius: 8px; }
    .canvas-inner { position: relative; min-width: 3000px; min-height: 2000px; }
    .panel { position: absolute; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
    .panel-content { width: 100%; height: 100%; position: relative; }
    .layer { position: absolute; white-space: pre-wrap; word-break: break-word; transform-origin: top left; }
    .camera-icon { position: absolute; top: -10px; right: -10px; width: 40px; height: 40px; background: rgba(0,0,0,0.25); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; }
    .camera-note { position: absolute; left: 0; right: 0; top: 100%; margin-top: 6px; padding: 6px 10px; background: rgba(45,45,45,0.9); color: white; font-size: 12px; border-radius: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .script-section { margin-top: 30px; }
    .script-section h2 { font-size: 16px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
    .script-list { display: flex; flex-direction: column; gap: 8px; }
    .script-item { padding: 10px 12px; background: #fafafa; border: 1px solid #eee; border-radius: 6px; font-size: 13px; line-height: 1.5; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 24px; }
  </style>
</head>
<body>
  <header>
    <h1>🎬 分镜脚本 · 只读预览</h1>
    <div class="meta">${new Date(entry.expireAt).toLocaleString('zh-CN')} 前过期</div>
  </header>
  <div class="container">
    <div class="canvas-wrap">
      <div class="canvas-inner" id="canvas"></div>
    </div>
    <div class="script-section" id="scriptSection"></div>
  </div>
  <div class="footer">由「漫画分镜脚本编辑器」生成 · 仅协作者可查看</div>
  <script>
    const PANELS = ${panelsJson};
    const SCRIPT = ${scriptLinesJson};
    const cameraLabelMap = {fixed:'固定',push:'推',pull:'拉',pan:'摇',move:'移',follow:'跟',lowAngle:'仰拍',highAngle:'俯拍'};
    const canvas = document.getElementById('canvas');
    PANELS.forEach(p => {
      const el = document.createElement('div');
      el.className = 'panel';
      Object.assign(el.style, {
        left: p.x + 'px', top: p.y + 'px', width: p.width + 'px', height: p.height + 'px',
        borderRadius: (p.borderRadius||0) + 'px',
        backgroundColor: p.backgroundColor === 'transparent' ? 'transparent' : (p.backgroundColor || '#fff')
      });
      const content = document.createElement('div');
      content.className = 'panel-content';
      content.style.borderRadius = (p.borderRadius||0) + 'px';
      (p.layers||[]).forEach(layer => {
        if (layer.type !== 'text' || !layer.style) return;
        const l = document.createElement('div');
        l.className = 'layer';
        const fontMap = {'Noto Sans SC':"'Noto Sans SC'",'Noto Serif SC':"'Noto Serif SC'",'ZCOOL KuaiLe':"'ZCOOL KuaiLe'"};
        Object.assign(l.style, {
          left: layer.x + 'px', top: layer.y + 'px',
          transform: 'rotate(' + layer.rotation + 'deg) scale(' + layer.scale + ')',
          fontFamily: fontMap[layer.style.fontFamily] || "'Noto Sans SC'",
          fontSize: layer.style.fontSize + 'px',
          color: layer.style.color || '#2d2d2d',
          textAlign: layer.style.textAlign,
          maxWidth: (p.width - layer.x - 20) + 'px',
          lineHeight: 1.4
        });
        l.textContent = layer.content;
        content.appendChild(l);
      });
      el.appendChild(content);
      if (p.cameraType) {
        const icon = document.createElement('div');
        icon.className = 'camera-icon';
        icon.title = cameraLabelMap[p.cameraType] || '';
        icon.textContent = (cameraLabelMap[p.cameraType] || p.cameraType).slice(0,1);
        el.appendChild(icon);
        if (p.cameraNote) {
          const note = document.createElement('div');
          note.className = 'camera-note';
          note.textContent = p.cameraNote;
          el.appendChild(note);
        }
      }
      canvas.appendChild(el);
    });
    const sec = document.getElementById('scriptSection');
    if (SCRIPT && SCRIPT.length) {
      const h2 = document.createElement('h2');
      h2.textContent = '📝 剧本原文';
      sec.appendChild(h2);
      const list = document.createElement('div');
      list.className = 'script-list';
      SCRIPT.forEach((s, i) => {
        const it = document.createElement('div');
        it.className = 'script-item';
        it.innerHTML = '<span style="color:#4a90d9;font-weight:600;margin-right:6px;">' + (i+1) + '.</span>' + s.content;
        list.appendChild(it);
      });
      sec.appendChild(list);
    }
  </script>
</body>
</html>`;
}

