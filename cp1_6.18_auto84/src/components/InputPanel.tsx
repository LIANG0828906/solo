import { useState } from 'react';
import { useAppStore } from '../store/appStore';

interface InputPanelProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function InputPanel({ collapsed, onToggle }: InputPanelProps) {
  const [text, setText] = useState('');
  const addIdea = useAppStore(state => state.addIdea);

  const handleAdd = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    addIdea(trimmed);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div
      style={{
        width: collapsed ? 48 : 300,
        height: '100%',
        background: '#1A1A2E',
        borderRadius: 16,
        borderLeft: '3px solid #4ECDC4',
        boxShadow: '0 0 20px rgba(78, 205, 196, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.3s ease',
        position: 'relative'
      }}
    >
      <button
        onClick={onToggle}
        style={{
          position: 'absolute',
          top: 16,
          right: collapsed ? 12 : 8,
          width: 24,
          height: 24,
          borderRadius: 6,
          background: '#2D2D44',
          border: 'none',
          color: '#4ECDC4',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          transition: 'all 0.2s ease'
        }}
      >
        {collapsed ? '→' : '←'}
      </button>

      {!collapsed && (
        <>
          <div
            style={{
              padding: '24px 20px 16px',
              borderBottom: '1px solid #2A2A44'
            }}
          >
            <h2
              style={{
                color: '#4ECDC4',
                fontSize: 16,
                fontWeight: 600,
                margin: 0,
                marginBottom: 4,
                letterSpacing: 1
              }}
            >
              ✦ 灵感输入
            </h2>
            <p
              style={{
                color: '#8888AA',
                fontSize: 12,
                margin: 0
              }}
            >
              记录你的每一个灵感碎片
            </p>
          </div>

          <div
            style={{
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入你的灵感..."
              style={{
                width: '100%',
                minHeight: 80,
                padding: 12,
                borderRadius: 8,
                background: '#2D2D44',
                border: '1px solid #3D3D5A',
                color: '#FFFFFF',
                fontSize: 14,
                resize: 'none',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
              onFocus={e => {
                e.target.style.borderColor = '#4ECDC4';
                e.target.style.boxShadow = '0 0 10px rgba(78, 205, 196, 0.2)';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#3D3D5A';
                e.target.style.boxShadow = 'none';
              }}
            />

            <button
              onClick={handleAdd}
              disabled={!text.trim()}
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: 8,
                background: text.trim() ? '#6BCB77' : '#3D5A45',
                color: '#FFFFFF',
                border: 'none',
                fontSize: 14,
                fontWeight: 600,
                cursor: text.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                boxShadow: text.trim() ? '0 2px 10px rgba(107, 203, 119, 0.3)' : 'none'
              }}
              onMouseEnter={e => {
                if (text.trim()) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              + 添加灵感
            </button>
          </div>

          <div
            style={{
              padding: '0 16px 16px',
              flex: 1,
              overflowY: 'auto'
            }}
          >
            <div
              style={{
                color: '#666688',
                fontSize: 11,
                textAlign: 'center',
                padding: 12,
                borderTop: '1px solid #2A2A44'
              }}
            >
              提示：按 Enter 快速添加
            </div>
          </div>
        </>
      )}

      {collapsed && (
        <div
          style={{
            padding: '50px 12px 16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#4ECDC4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0A0A2E',
              fontSize: 18,
              fontWeight: 700
            }}
          >
            ✦
          </div>
        </div>
      )}
    </div>
  );
}
