import { useState } from 'react';
import { Hotspot, PALETTE, LABEL_OPTIONS, ANIMATION_PRESETS } from '../types';

interface HotspotPanelProps {
  hotspot: Hotspot | null;
  onUpdate: (updates: Partial<Hotspot>) => void;
  onDelete: () => void;
  isMobile?: boolean;
}

function AccordionSection({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  return (
    <div style={{ borderBottom: '1px solid #E8E8E8' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'none',
          border: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          color: '#2D3436',
        }}
      >
        <span>{title}</span>
        <span
          style={{
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            fontSize: 10,
            color: '#B2BEC3',
          }}
        >
          ▼
        </span>
      </button>
      {open && <div style={{ padding: '4px 16px 16px' }}>{children}</div>}
    </div>
  );
}

function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const insertFormat = (prefix: string, suffix: string) => {
    onChange(value + prefix + suffix);
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 6,
        }}
      >
        <button
          onClick={() => insertFormat('<b>', '</b>')}
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid #E0E0E0',
            background: '#FFF',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            color: '#2D3436',
          }}
          title="加粗"
        >
          B
        </button>
        <button
          onClick={() => insertFormat('<i>', '</i>')}
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid #E0E0E0',
            background: '#FFF',
            fontSize: 13,
            fontStyle: 'italic',
            cursor: 'pointer',
            color: '#2D3436',
          }}
          title="斜体"
        >
          I
        </button>
        <button
          onClick={() => insertFormat('<br/>', '')}
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid #E0E0E0',
            background: '#FFF',
            fontSize: 13,
            cursor: 'pointer',
            color: '#2D3436',
          }}
          title="换行"
        >
          ↵
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="输入弹窗文本内容...&#10;使用 B/I/↵ 按钮插入格式"
        rows={4}
        style={{
          width: '100%',
          padding: '8px 10px',
          borderRadius: 8,
          border: '1px solid #E0E0E0',
          fontSize: 13,
          resize: 'vertical',
          lineHeight: 1.6,
          color: '#2D3436',
        }}
      />
      {value && (
        <div
          style={{
            marginTop: 8,
            padding: '8px 10px',
            borderRadius: 8,
            background: '#FFF',
            border: '1px solid #EEE',
            fontSize: 13,
            lineHeight: 1.6,
            color: '#636E72',
          }}
          dangerouslySetInnerHTML={{
            __html: value
              .replace(/<b>/g, '<strong>')
              .replace(/<\/b>/g, '</strong>')
              .replace(/<i>/g, '<em>')
              .replace(/<\/i>/g, '</em>')
              .replace(/<br\/>/g, '<br/>'),
          }}
        />
      )}
    </div>
  );
}

export default function HotspotPanel({ hotspot, onUpdate, onDelete, isMobile }: HotspotPanelProps) {
  if (!hotspot) {
    return (
      <div
        style={{
          width: isMobile ? '100%' : 280,
          background: '#F9F9F9',
          borderLeft: isMobile ? 'none' : '1px solid #E0E0E0',
          borderTop: isMobile ? '1px solid #E0E0E0' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#B2BEC3',
          fontSize: 14,
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
          <p>在画布上拖拽绘制矩形</p>
          <p>创建交互热点区域</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: isMobile ? '100%' : 280,
        background: '#F9F9F9',
        borderLeft: isMobile ? 'none' : '1px solid #E0E0E0',
        borderTop: isMobile ? '1px solid #E0E0E0' : 'none',
        overflowY: 'auto',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid #E8E8E8',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#2D3436',
          }}
        >
          🎯 热点配置
        </h3>
        <button
          className="btn-danger"
          style={{ padding: '4px 12px', fontSize: 12 }}
          onClick={onDelete}
        >
          删除
        </button>
      </div>

      <AccordionSection title="📐 区域与标签" defaultOpen={true}>
        <div style={{ marginBottom: 10 }}>
          <label
            style={{
              display: 'block',
              fontSize: 12,
              color: '#636E72',
              marginBottom: 4,
            }}
          >
            标签
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {LABEL_OPTIONS.map((label) => (
              <button
                key={label}
                onClick={() => onUpdate({ label })}
                style={{
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontSize: 12,
                  border: hotspot.label === label ? 'none' : '1px solid #E0E0E0',
                  background: hotspot.label === label ? hotspot.color : '#FFF',
                  color: hotspot.label === label ? '#FFF' : '#636E72',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontWeight: 500,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label
            style={{
              display: 'block',
              fontSize: 12,
              color: '#636E72',
              marginBottom: 4,
            }}
          >
            区域颜色
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {PALETTE.map((c) => (
              <div
                key={c}
                onClick={() => onUpdate({ color: c })}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: c,
                  cursor: 'pointer',
                  border: hotspot.color === c ? '3px solid #2D3436' : '3px solid transparent',
                  transition: 'all 0.2s',
                  transform: hotspot.color === c ? 'scale(1.1)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label style={{ fontSize: 12, color: '#636E72' }}>X</label>
            <input
              type="number"
              value={hotspot.x}
              onChange={(e) => onUpdate({ x: Number(e.target.value) })}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid #E0E0E0',
                fontSize: 13,
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#636E72' }}>Y</label>
            <input
              type="number"
              value={hotspot.y}
              onChange={(e) => onUpdate({ y: Number(e.target.value) })}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid #E0E0E0',
                fontSize: 13,
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#636E72' }}>宽度</label>
            <input
              type="number"
              value={hotspot.width}
              min={20}
              onChange={(e) => onUpdate({ width: Math.max(20, Number(e.target.value)) })}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid #E0E0E0',
                fontSize: 13,
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#636E72' }}>高度</label>
            <input
              type="number"
              value={hotspot.height}
              min={20}
              onChange={(e) => onUpdate({ height: Math.max(20, Number(e.target.value)) })}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 6,
                border: '1px solid #E0E0E0',
                fontSize: 13,
              }}
            />
          </div>
        </div>
      </AccordionSection>

      <AccordionSection title="⚡ 触发动作" defaultOpen={true}>
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: 'block',
              fontSize: 12,
              color: '#636E72',
              marginBottom: 6,
            }}
          >
            动作类型
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => onUpdate({ actionType: 'popup' })}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 10,
                border: hotspot.actionType === 'popup' ? 'none' : '1px solid #E0E0E0',
                background: hotspot.actionType === 'popup' ? '#4ECDC4' : '#FFF',
                color: hotspot.actionType === 'popup' ? '#FFF' : '#636E72',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              💬 弹窗文本
            </button>
            <button
              onClick={() => onUpdate({ actionType: 'animation' })}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 10,
                border: hotspot.actionType === 'animation' ? 'none' : '1px solid #E0E0E0',
                background: hotspot.actionType === 'animation' ? '#45B7D1' : '#FFF',
                color: hotspot.actionType === 'animation' ? '#FFF' : '#636E72',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              ✨ CSS动画
            </button>
          </div>
        </div>

        {hotspot.actionType === 'popup' && (
          <RichTextEditor
            value={hotspot.popupText}
            onChange={(popupText) => onUpdate({ popupText })}
          />
        )}

        {hotspot.actionType === 'animation' && (
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                color: '#636E72',
                marginBottom: 6,
              }}
            >
              动画预设
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(Object.keys(ANIMATION_PRESETS) as Array<keyof typeof ANIMATION_PRESETS>).map(
                (key) => (
                  <button
                    key={key}
                    onClick={() => onUpdate({ animationType: key })}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border:
                        hotspot.animationType === key ? 'none' : '1px solid #E0E0E0',
                      background:
                        hotspot.animationType === key ? '#4ECDC4' : '#FFF',
                      color: hotspot.animationType === key ? '#FFF' : '#636E72',
                      fontSize: 13,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{ANIMATION_PRESETS[key].name}</span>
                    <span style={{ fontSize: 11, opacity: 0.7 }}>
                      {ANIMATION_PRESETS[key].duration}
                    </span>
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </AccordionSection>
    </div>
  );
}
