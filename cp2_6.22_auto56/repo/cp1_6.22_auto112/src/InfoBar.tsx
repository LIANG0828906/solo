import React, { useState } from 'react';
import { useApp } from './App';

export default function InfoBar() {
  const { state, dispatch } = useApp();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(state.roomCode);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = state.roomCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    dispatch({ type: 'SET_COPIED_TIP', payload: true });
  };

  const handleExport = () => {
    const fn = (window as any).__whiteboardExport as (() => HTMLCanvasElement | null) | undefined;
    if (!fn) return;
    const canvas = fn();
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    const ts = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
    a.download = `whiteboard_${state.roomCode}_${ts}.png`;
    a.href = dataUrl;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      style={{
        height: 48,
        backgroundColor: '#EAEAEA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        flexShrink: 0,
        borderBottom: '1px solid #ddd'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'white',
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #ddd'
          }}
        >
          <span style={{ fontSize: 12, color: '#888' }}>房间码</span>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 15,
              fontWeight: 600,
              color: '#333',
              letterSpacing: 2
            }}
          >
            {state.roomCode}
          </span>
          <button
            onClick={handleCopy}
            title="复制房间码"
            style={{
              padding: '4px 10px',
              borderRadius: 4,
              backgroundColor: '#4A90D9',
              color: 'white',
              fontSize: 12,
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#3a7bc8')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#4A90D9')}
          >
            复制
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: 'white',
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #ddd'
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#666"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span style={{ fontSize: 13, color: '#555', fontWeight: 500 }}>
            {state.onlineCount}
          </span>
        </div>

        <button
          onClick={handleExport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 6,
            backgroundColor: '#333',
            color: 'white',
            fontSize: 13,
            fontWeight: 500,
            transition: 'background-color 0.2s, transform 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#444';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#333';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          导出为PNG
        </button>
      </div>
    </div>
  );
}
