import React from 'react';
import { useStore } from '../store';

const TEMPLATE_META: { name: string; label: string; icon: string; desc: string; color: string }[] = [
  { name: 'bounce', label: '弹跳', icon: '⬆', desc: '上下弹跳效果', color: '#ff6b6b' },
  { name: 'shake', label: '抖动', icon: '↔', desc: '左右抖动效果', color: '#4ecdc4' },
  { name: 'blink', label: '闪烁', icon: '✦', desc: '透明度闪烁效果', color: '#ffe66d' },
  { name: 'spin', label: '旋转', icon: '⟳', desc: '360度旋转效果', color: '#95e1d3' },
  { name: 'fade', label: '渐变', icon: '◐', desc: '缩放渐变效果', color: '#a29bfe' },
];

function TemplateLibrary() {
  const loadTemplate = useStore((s) => s.loadTemplate);

  return (
    <div className="panel-card">
      <div className="panel-title">模板库</div>
      <div className="template-panel">
        {TEMPLATE_META.map((t) => (
          <div
            key={t.name}
            className="template-item"
            onClick={() => loadTemplate(t.name)}
          >
            <div
              className="template-icon"
              style={{ background: t.color + '22', color: t.color }}
            >
              {t.icon}
            </div>
            <div>
              <div className="template-name">{t.label}</div>
              <div className="template-desc">{t.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TemplateLibrary;
