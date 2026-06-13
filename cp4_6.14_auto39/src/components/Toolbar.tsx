import React from 'react';
import type { ComponentType } from '../types';
import { Square, Circle, Type, Image as ImageIcon } from 'lucide-react';

interface Props {
  onAdd: (type: ComponentType) => void;
}

const items: { type: ComponentType; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  {
    type: 'rectangle',
    label: '矩形',
    desc: '卡片、容器、按钮',
    icon: <Square size={20} />,
    color: '#3b82f6'
  },
  {
    type: 'circle',
    label: '圆形',
    desc: '头像、图标、徽章',
    icon: <Circle size={20} />,
    color: '#8b5cf6'
  },
  {
    type: 'text',
    label: '文本',
    desc: '标题、说明、提示',
    icon: <Type size={20} />,
    color: '#10b981'
  },
  {
    type: 'image',
    label: '图片',
    desc: '截图、logo、插图',
    icon: <ImageIcon size={20} />,
    color: '#f59e0b'
  }
];

const Toolbar: React.FC<Props> = ({ onAdd }) => {
  return (
    <div className="scrollbar-thin" style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ marginBottom: 6, paddingLeft: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          基础组件
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>点击添加到画布</div>
      </div>

      {items.map(item => (
        <div
          key={item.type}
          onClick={() => onAdd(item.type)}
          title={`添加${item.label}`}
          style={{
            padding: 12,
            borderRadius: 10,
            background: '#fafafa',
            border: '1px solid #e5e7eb',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            transition: 'all 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLDivElement;
            el.style.background = '#ffffff';
            el.style.borderColor = item.color;
            el.style.boxShadow = `0 2px 8px ${item.color}22`;
            el.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLDivElement;
            el.style.background = '#fafafa';
            el.style.borderColor = '#e5e7eb';
            el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
            el.style.transform = 'translateY(0)';
          }}
          onMouseDown={e => {
            (e.currentTarget as HTMLDivElement).style.transform = 'scale(0.98)';
          }}
          onMouseUp={e => {
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: `${item.color}15`,
              color: item.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {item.icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1f2937', lineHeight: 1.3 }}>
              {item.label}
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#9ca3af',
                marginTop: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {item.desc}
            </div>
          </div>
        </div>
      ))}

      <div style={{ height: 24 }} />

      <div style={{ padding: 12, borderRadius: 10, background: 'linear-gradient(135deg,#eff6ff,#faf5ff)', border: '1px solid #e0e7ff' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#4f46e5', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          操作提示
        </div>
        <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.7 }}>
          <div>• 拖拽选中组件移动</div>
          <div>• 拖拽8个句柄调整大小</div>
          <div>• 拖拽顶部圆点旋转（15°吸附）</div>
          <div>• 从组件边沿拖到另一组件创建跳转</div>
          <div>• 双击连线编辑标签文字</div>
          <div>• Ctrl+Z 撤销，Ctrl+Shift+Z 重做</div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
