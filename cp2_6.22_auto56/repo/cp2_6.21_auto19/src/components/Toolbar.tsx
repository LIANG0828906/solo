import React, { useState } from 'react';
import { useMindmapStore } from '../store/mindmapStore';
import { mindmapApi } from '../api/mindmapApi';

interface ToolbarProps {
  isMobile: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({ isMobile }) => {
  const { nodes, tasks, clearAll, setSaving, showSaveToast, isSaving } = useMindmapStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const htmlToImage = await import('html-to-image');
      const canvasElement = document.querySelector('.react-flow') as HTMLElement;
      if (canvasElement) {
        const dataUrl = await htmlToImage.toPng(canvasElement, {
          backgroundColor: '#1e1e2e',
          quality: 1,
        });
        const link = document.createElement('a');
        link.download = `mindmap-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setTimeout(() => setExportLoading(false), 1000);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await mindmapApi.saveMindmap(nodes, tasks);
      showSaveToast();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setShowClearConfirm(true);
    if (isMobile) setMobileMenuOpen(false);
  };

  const confirmClear = () => {
    clearAll();
    setShowClearConfirm(false);
  };

  const toolbarContent = (
    <>
      <button
        onClick={handleExport}
        disabled={exportLoading || isSaving}
        style={{
          padding: '8px 16px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.2)',
          backgroundColor: 'rgba(255,255,255,0.05)',
          color: '#fff',
          cursor: exportLoading || isSaving ? 'not-allowed' : 'pointer',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s ease',
          opacity: exportLoading || isSaving ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (!exportLoading && !isSaving) {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.1)';
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.05)';
        }}
      >
        {exportLoading ? '导出中...' : '📥 导出PNG'}
      </button>

      <button
        onClick={handleSave}
        disabled={isSaving}
        style={{
          padding: '8px 16px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: '#3b82f6',
          color: '#fff',
          cursor: isSaving ? 'not-allowed' : 'pointer',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s ease',
          opacity: isSaving ? 0.7 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isSaving) {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
      >
        {isSaving ? '保存中...' : '💾 保存'}
      </button>

      <button
        onClick={handleClear}
        style={{
          padding: '8px 16px',
          borderRadius: '8px',
          border: '1px solid rgba(255,77,79,0.5)',
          backgroundColor: 'transparent',
          color: '#ff4d4f',
          cursor: 'pointer',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,77,79,0.1)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
        }}
      >
        🗑️ 清空
      </button>
    </>
  );

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 50,
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
        }}
      >
        {isMobile ? (
          <>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: 'rgba(30,30,46,0.9)',
                backdropFilter: 'blur(12px)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ☰
            </button>
            {mobileMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '54px',
                  right: 0,
                  backgroundColor: 'rgba(30,30,46,0.95)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  minWidth: '160px',
                }}
              >
                {toolbarContent}
              </div>
            )}
          </>
        ) : (
          toolbarContent
        )}
      </div>

      {showClearConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
          }}
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            style={{
              backgroundColor: '#2a2a3e',
              color: '#fff',
              padding: '28px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.2)',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '18px' }}>确认清空？</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '24px', fontSize: '14px' }}>
              此操作将删除所有节点和任务，且无法撤销。
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowClearConfirm(false)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                }}
              >
                取消
              </button>
              <button
                onClick={confirmClear}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#ff4d4f',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
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
};

export default Toolbar;
