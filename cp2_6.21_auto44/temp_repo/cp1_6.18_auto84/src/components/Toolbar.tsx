import { useState } from 'react';
import { useAppStore } from '../store/appStore';

export function Toolbar() {
  const [showConfirm, setShowConfirm] = useState(false);
  const clearAll = useAppStore(state => state.clearAll);
  const exportWhitepaper = useAppStore(state => state.exportWhitepaper);
  const ideas = useAppStore(state => state.ideas);
  const triggerRecluster = useAppStore(state => state.triggerRecluster);

  const handleExport = () => {
    const content = exportWhitepaper();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `灵感白皮书_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    clearAll();
    setShowConfirm(false);
  };

  return (
    <>
      <div
        style={{
          height: 60,
          background: '#0D0D2B',
          borderTop: '1px solid #2A2A44',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: '0 24px',
          boxShadow: '0 -2px 20px rgba(0, 0, 0, 0.3)'
        }}
      >
        <button
          onClick={handleExport}
          disabled={ideas.length === 0}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            background: ideas.length > 0 ? '#FF6B6B' : '#4A3A3A',
            color: '#FFFFFF',
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: ideas.length > 0 ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            boxShadow: ideas.length > 0 ? '0 2px 15px rgba(255, 107, 107, 0.3)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
          onMouseEnter={e => {
            if (ideas.length > 0) {
              e.currentTarget.style.background = '#FF8585';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = ideas.length > 0 ? '#FF6B6B' : '#4A3A3A';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          📄 导出白皮书
        </button>

        <button
          onClick={triggerRecluster}
          disabled={ideas.length === 0}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            background: ideas.length > 0 ? '#45B7D1' : '#3A4A5A',
            color: '#FFFFFF',
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: ideas.length > 0 ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            boxShadow: ideas.length > 0 ? '0 2px 15px rgba(69, 183, 209, 0.3)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
          onMouseEnter={e => {
            if (ideas.length > 0) {
              e.currentTarget.style.background = '#5CC8E0';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = ideas.length > 0 ? '#45B7D1' : '#3A4A5A';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          🔄 重新聚类
        </button>

        <button
          onClick={() => setShowConfirm(true)}
          disabled={ideas.length === 0}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            background: ideas.length > 0 ? '#4A4A6A' : '#3A3A4A',
            color: '#FFFFFF',
            border: 'none',
            fontSize: 14,
            fontWeight: 600,
            cursor: ideas.length > 0 ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
          onMouseEnter={e => {
            if (ideas.length > 0) {
              e.currentTarget.style.background = '#5A5A7A';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = ideas.length > 0 ? '#4A4A6A' : '#3A3A4A';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          🗑️ 清空星群
        </button>
      </div>

      {showConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1A1A2E',
              borderRadius: 12,
              padding: 32,
              minWidth: 360,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
              border: '1px solid #2A2A44'
            }}
          >
            <h3
              style={{
                color: '#FFFFFF',
                fontSize: 18,
                margin: 0,
                marginBottom: 12,
                fontWeight: 600
              }}
            >
              ⚠️ 确认清空星群
            </h3>
            <p
              style={{
                color: '#8888AA',
                fontSize: 14,
                margin: 0,
                marginBottom: 24,
                lineHeight: 1.6
              }}
            >
              此操作将永久删除所有灵感碎片和星群数据，且无法恢复。确定要继续吗？
            </p>
            <div
              style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'flex-end'
              }}
            >
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  padding: '10px 24px',
                  borderRadius: 8,
                  background: '#2D2D44',
                  color: '#AAAAAA',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#3D3D54';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#2D2D44';
                }}
              >
                取消
              </button>
              <button
                onClick={handleClear}
                style={{
                  padding: '10px 24px',
                  borderRadius: 8,
                  background: '#FF6B6B',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 10px rgba(255, 107, 107, 0.3)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#FF8585';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#FF6B6B';
                }}
              >
                确认清空
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
