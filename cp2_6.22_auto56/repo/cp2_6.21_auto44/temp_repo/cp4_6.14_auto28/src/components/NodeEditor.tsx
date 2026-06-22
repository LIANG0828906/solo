import React, { useState, useEffect } from 'react';
import { MindMapNode, PRESET_COLORS, EMOJI_ICONS } from '../types';

interface NodeEditorProps {
  node: MindMapNode | null;
  onUpdate: (nodeId: string, updates: Partial<MindMapNode>) => void;
  isDarkBackground?: (color: string) => boolean;
}

export const NodeEditor: React.FC<NodeEditorProps> = ({ node, onUpdate }) => {
  const [localTitle, setLocalTitle] = useState('');
  const [localSubtitle, setLocalSubtitle] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    if (node) {
      setLocalTitle(node.title);
      setLocalSubtitle(node.subtitle || '');
    }
  }, [node?.id]);

  if (!node) {
    return (
      <div
        style={{
          padding: 20,
          color: '#8888aa',
          fontSize: 13,
          textAlign: 'center',
          backgroundColor: 'rgba(255,255,255,0.02)',
          borderRadius: 8,
          border: '1px dashed rgba(255,255,255,0.1)'
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>📋</div>
        <div style={{ marginBottom: 6, fontWeight: 500, color: '#aaaacc' }}>选择一个节点</div>
        <div style={{ fontSize: 12, lineHeight: 1.6 }}>
          点击画布上的节点进行编辑<br />
          或使用快捷键快速操作
        </div>
      </div>
    );
  }

  const getLuminance = (hex: string): number => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };

  const textColor = getLuminance(node.color) > 0.5 ? '#1a1a2e' : '#ffffff';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        padding: 16,
        borderRadius: 12,
        backgroundColor: node.color,
        border: `2px solid ${node.borderStyle === 'double' ? 'transparent' : 'rgba(255,255,255,0.2)'}`,
        borderStyle: node.borderStyle === 'dashed' ? 'dashed' : node.borderStyle === 'double' ? 'double' : 'solid',
        borderWidth: node.borderStyle === 'double' ? 4 : 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        color: textColor,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: node.subtitle ? 6 : 0 }}>
          {node.icon && <span style={{ fontSize: node.fontSize * 1.2 }}>{node.icon}</span>}
          <span style={{ fontWeight: 600, fontSize: node.fontSize }}>
            {node.title || '（无标题）'}
          </span>
        </div>
        {node.subtitle && (
          <div style={{
            fontSize: node.fontSize * 0.75,
            opacity: 0.7,
            paddingLeft: node.icon ? node.fontSize * 1.2 + 10 : 0
          }}>
            {node.subtitle}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#8888aa', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          标题
        </label>
        <input
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={() => onUpdate(node.id, { title: localTitle })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder="输入节点标题..."
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1.5px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: '#e0e0e0',
            fontSize: 14,
            outline: 'none',
            transition: 'all 0.2s',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#4fc3f7';
            e.target.style.boxShadow = '0 0 0 3px rgba(79,195,247,0.15)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255,255,255,0.1)';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#8888aa', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          副标题 / 备注
        </label>
        <textarea
          value={localSubtitle}
          onChange={(e) => setLocalSubtitle(e.target.value)}
          onBlur={() => onUpdate(node.id, { subtitle: localSubtitle })}
          placeholder="添加备注说明..."
          rows={3}
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1.5px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            color: '#e0e0e0',
            fontSize: 13,
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit',
            transition: 'all 0.2s',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#4fc3f7';
            e.target.style.boxShadow = '0 0 0 3px rgba(79,195,247,0.15)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255,255,255,0.1)';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#8888aa', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          背景颜色
        </label>
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setShowColorPicker(!showColorPicker)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1.5px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = '#4fc3f7';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.1)';
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                backgroundColor: node.color,
                border: '2px solid rgba(255,255,255,0.2)'
              }}
            />
            <span style={{ color: '#e0e0e0', fontSize: 13 }}>{node.color}</span>
            <span style={{ marginLeft: 'auto', color: '#8888aa', fontSize: 12 }}>▼</span>
          </div>
          {showColorPicker && (
            <div
              onClick={() => setShowColorPicker(false)}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                zIndex: 100,
                padding: 12,
                backgroundColor: '#2a2a3e',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: 8
              }}
            >
              {PRESET_COLORS.map((color) => (
                <div
                  key={color}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdate(node.id, { color });
                    setShowColorPicker(false);
                  }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: color,
                    border: node.color === color ? '2px solid #4fc3f7' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    transform: node.color === color ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: node.color === color ? '0 0 0 2px rgba(79,195,247,0.3)' : 'none'
                  }}
                  onMouseOver={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.15)';
                  }}
                  onMouseOut={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = node.color === color ? 'scale(1.1)' : 'scale(1)';
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#8888aa', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          图标
        </label>
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1.5px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.2s',
              minHeight: 44
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = '#4fc3f7';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.1)';
            }}
          >
            <span style={{ fontSize: 20 }}>{node.icon || '❌'}</span>
            <span style={{ color: '#e0e0e0', fontSize: 13 }}>{node.icon ? '当前图标' : '无图标'}</span>
            <span style={{ marginLeft: 'auto', color: '#8888aa', fontSize: 12 }}>▼</span>
          </div>
          {showEmojiPicker && (
            <div
              onClick={() => setShowEmojiPicker(false)}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                zIndex: 100,
                padding: 10,
                backgroundColor: '#2a2a3e',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: 4
              }}
            >
              {EMOJI_ICONS.map((emoji) => (
                <div
                  key={emoji}
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdate(node.id, { icon: emoji });
                    setShowEmojiPicker(false);
                  }}
                  style={{
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    borderRadius: 8,
                    backgroundColor: node.icon === emoji ? 'rgba(79,195,247,0.2)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseOver={(e) => {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,255,255,0.1)';
                    (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.2)';
                  }}
                  onMouseOut={(e) => {
                    (e.currentTarget as HTMLDivElement).style.backgroundColor = node.icon === emoji ? 'rgba(79,195,247,0.2)' : 'transparent';
                    (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                  }}
                >
                  {emoji}
                </div>
              ))}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdate(node.id, { icon: undefined });
                  setShowEmojiPicker(false);
                }}
                style={{
                  gridColumn: 'span 6',
                  padding: '8px',
                  textAlign: 'center',
                  fontSize: 12,
                  color: '#8888aa',
                  cursor: 'pointer',
                  borderRadius: 6,
                  marginTop: 4,
                  borderTop: '1px solid rgba(255,255,255,0.05)'
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLDivElement).style.color = '#ff6b6b';
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLDivElement).style.color = '#8888aa';
                }}
              >
                清除图标
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#8888aa', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          边框样式
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['solid', 'dashed', 'double'] as const).map((style) => (
            <button
              key={style}
              onClick={() => onUpdate(node.id, { borderStyle: style })}
              style={{
                flex: 1,
                padding: '10px 8px',
                backgroundColor: node.borderStyle === style ? 'rgba(79,195,247,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${node.borderStyle === style ? '#4fc3f7' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 8,
                color: node.borderStyle === style ? '#4fc3f7' : '#aaaacc',
                fontSize: 12,
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative'
              }}
              onMouseOver={(e) => {
                if (node.borderStyle !== style) {
                  (e.target as HTMLButtonElement).style.borderColor = 'rgba(79,195,247,0.5)';
                  (e.target as HTMLButtonElement).style.color = '#ccccdd';
                }
              }}
              onMouseOut={(e) => {
                if (node.borderStyle !== style) {
                  (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)';
                  (e.target as HTMLButtonElement).style.color = '#aaaacc';
                }
              }}
            >
              <div style={{
                width: '80%',
                height: 3,
                margin: '0 auto 6px',
                backgroundColor: node.borderStyle === style ? '#4fc3f7' : '#666688',
                borderStyle: style,
                borderBottomWidth: style === 'dashed' ? 3 : style === 'double' ? 5 : 3,
                background: style !== 'solid' ? 'transparent' : undefined
              }} />
              <div>{style === 'solid' ? '实线' : style === 'dashed' ? '虚线' : '双线'}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#8888aa',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>字体大小</span>
          <span style={{ color: '#4fc3f7' }}>{node.fontSize}px</span>
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="range"
            min={12}
            max={24}
            step={1}
            value={node.fontSize}
            onChange={(e) => onUpdate(node.id, { fontSize: parseInt(e.target.value) })}
            style={{
              flex: 1,
              height: 4,
              WebkitAppearance: 'none',
              appearance: 'none',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 2,
              outline: 'none',
              cursor: 'pointer'
            }}
          />
          <span style={{
            minWidth: 40,
            textAlign: 'right',
            fontSize: 12,
            color: '#8888aa',
            fontFamily: 'monospace'
          }}>
            {node.fontSize}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#555577' }}>
          <span>12px</span>
          <span>24px</span>
        </div>
      </div>
    </div>
  );
};
