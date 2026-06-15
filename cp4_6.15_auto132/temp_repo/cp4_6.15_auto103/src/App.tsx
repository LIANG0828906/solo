import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import axios from 'axios';
import ImageUploader from './modules/imageUploader/ImageUploader';
import LayerManager from './modules/layerManager/LayerManager';
import SvgCanvas from './modules/svgCanvas/SvgCanvas';
import useSketchStore from './store/useSketchStore';
import type { Layer } from './types';

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    layerGroups,
    selectedLayerId,
    isProcessing,
    isExporting,
    setExporting,
    zoom,
    resetView,
    originalImageUrl,
  } = useSketchStore();

  const [leftWidth, setLeftWidth] = useState<number>(320);
  const [rightWidth, setRightWidth] = useState<number>(300);
  const [isResizingLeft, setIsResizingLeft] = useState<boolean>(false);
  const [isResizingRight, setIsResizingRight] = useState<boolean>(false);
  const [showExportDialog, setShowExportDialog] = useState<boolean>(false);
  const [exportMode, setExportMode] = useState<'all' | 'selected'>('all');
  const [exportPreview, setExportPreview] = useState<string>('');
  const [isGeneratingExport, setIsGeneratingExport] = useState<boolean>(false);
  const [downloadComplete, setDownloadComplete] = useState<boolean>(false);
  const [svgFileName, setSvgFileName] = useState<string>('');

  const allLayers = useMemo(() => {
    const layers: Layer[] = [];
    layerGroups.forEach((group) => {
      group.layers.forEach((layer) => layers.push(layer));
    });
    return layers;
  }, [layerGroups]);

  const imageDimensions = useMemo(() => {
    const firstLayer = allLayers[0];
    if (firstLayer) {
      if (firstLayer.width && firstLayer.height) {
        return { width: firstLayer.width + 200, height: firstLayer.height + 200 };
      }
    }
    return { width: 1200, height: 900 };
  }, [allLayers]);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();

      if (isResizingLeft) {
        const newWidth = e.clientX - containerRect.left;
        const minWidth = 240;
        const maxWidth = containerRect.width * 0.4;
        setLeftWidth(Math.max(minWidth, Math.min(newWidth, maxWidth)));
      }

      if (isResizingRight) {
        const newWidth = containerRect.right - e.clientX;
        const minWidth = 240;
        const maxWidth = containerRect.width * 0.35;
        setRightWidth(Math.max(minWidth, Math.min(newWidth, maxWidth)));
      }
    },
    [isResizingLeft, isResizingRight]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizingLeft(false);
    setIsResizingRight(false);
  }, []);

  useEffect(() => {
    if (isResizingLeft || isResizingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizingLeft, isResizingRight, handleMouseMove, handleMouseUp]);

  const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    const rect = button.getBoundingClientRect();
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - rect.left - radius}px`;
    circle.style.top = `${e.clientY - rect.top - radius}px`;
    circle.style.position = 'absolute';
    circle.style.borderRadius = '50%';
    circle.style.background = 'rgba(255, 255, 255, 0.4)';
    circle.style.transform = 'scale(0)';
    circle.style.animation = 'ripple 600ms ease-out forwards';
    circle.style.pointerEvents = 'none';
    circle.style.zIndex = '1';

    const existingRipple = button.querySelector('.ripple-effect');
    if (existingRipple) {
      existingRipple.remove();
    }
    circle.classList.add('ripple-effect');
    button.appendChild(circle);

    setTimeout(() => circle.remove(), 600);
  };

  const handleExportClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    handleRipple(e);
    if (allLayers.length === 0) return;
    setShowExportDialog(true);
    setExportMode('all');
    setDownloadComplete(false);
    setExportPreview('');
  };

  const generateExportPreview = useCallback(async () => {
    if (allLayers.length === 0) return;

    setIsGeneratingExport(true);
    const startTime = Date.now();

    try {
      const layersToExport =
        exportMode === 'all'
          ? allLayers
          : allLayers.filter((l) => l.id === selectedLayerId);

      const response = await axios.post('/api/export', {
        layers: layersToExport,
        selectedIds: exportMode === 'selected' && selectedLayerId ? [selectedLayerId] : undefined,
        exportAll: exportMode === 'all',
        imageWidth: imageDimensions.width,
        imageHeight: imageDimensions.height,
      });

      if (response.data.success && response.data.data) {
        setExportPreview(response.data.data.svgContent);
        setSvgFileName(response.data.data.fileName);
      }
    } catch (error) {
      console.error('导出预览失败:', error);
    } finally {
      setIsGeneratingExport(false);
      const elapsed = Date.now() - startTime;
      if (elapsed < 300) {
        await new Promise((resolve) => setTimeout(resolve, 300 - elapsed));
      }
    }
  }, [allLayers, exportMode, selectedLayerId, imageDimensions]);

  useEffect(() => {
    if (showExportDialog) {
      generateExportPreview();
    }
  }, [showExportDialog, exportMode, generateExportPreview]);

  const handleConfirmExport = async () => {
    if (!exportPreview) return;

    setExporting(true);

    try {
      const blob = new Blob([exportPreview], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = svgFileName || `sketch-export-${Date.now()}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadComplete(true);
      setTimeout(() => {
        setShowExportDialog(false);
        setDownloadComplete(false);
      }, 1500);
    } catch (error) {
      console.error('导出失败:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleResetView = (e: React.MouseEvent<HTMLButtonElement>) => {
    handleRipple(e);
    resetView();
  };

  const hasContent = allLayers.length > 0 || originalImageUrl;

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: 'var(--color-warm-gray)',
      }}
    >
      <style>{`
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(123, 198, 126, 0.5), 0 2px 8px rgba(123, 198, 126, 0.3);
          }
          50% {
            box-shadow: 0 0 0 12px rgba(123, 198, 126, 0), 0 2px 8px rgba(123, 198, 126, 0.3);
          }
        }
        .pulse-glow {
          animation: pulseGlow 1.5s ease-in-out infinite;
        }
        .nav-item {
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          color: var(--color-text);
        }
        .nav-item:hover {
          background: rgba(123, 198, 126, 0.15);
        }
        .toolbar-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--color-text);
          font-size: 18px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .toolbar-btn:hover {
          background: rgba(123, 198, 126, 0.1);
        }
        .toolbar-btn.active {
          background: var(--color-primary);
          color: white;
        }
      `}</style>

      {/* 顶部导航栏 - 毛玻璃效果 */}
      <nav
        className="glass"
        style={{
          height: 'var(--navbar-height)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          borderBottom: '1px solid rgba(123, 198, 126, 0.2)',
          animation: 'fadeIn 0.5s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background:
                'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '20px',
              fontFamily: 'var(--font-handwriting)',
              boxShadow: '0 4px 12px rgba(123, 198, 126, 0.35)',
            }}
          >
            S
          </div>
          <span
            className="handwriting"
            style={{
              fontSize: '22px',
              fontWeight: 600,
              color: 'var(--color-text)',
              letterSpacing: '0.5px',
            }}
          >
            草图智能矢量化
          </span>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--color-text-light)',
              background: 'rgba(123, 198, 126, 0.1)',
              padding: '2px 8px',
              borderRadius: '10px',
              border: '1px solid rgba(123, 198, 126, 0.2)',
            }}
          >
            v1.0
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div className="nav-item">文件</div>
          <div className="nav-item">编辑</div>
          <div className="nav-item">视图</div>
          <div className="nav-item">工具</div>
          <div className="nav-item">帮助</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="btn-ripple"
            onClick={handleResetView}
            disabled={!hasContent}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--color-warm-gray-dark)',
              background: 'white',
              color: 'var(--color-text)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: hasContent ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              opacity: hasContent ? 1 : 0.5,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            🔄 重置视图
          </button>
          <button
            className={`btn-ripple ${downloadComplete ? 'pulse-glow' : ''}`}
            onClick={handleExportClick}
            disabled={!hasContent || isProcessing}
            style={{
              padding: '10px 22px',
              borderRadius: '10px',
              border: 'none',
              background: downloadComplete
                ? 'var(--color-primary-dark)'
                : 'var(--color-primary)',
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              cursor: hasContent && !isProcessing ? 'pointer' : 'not-allowed',
              transition: 'all 0.25s ease',
              boxShadow: '0 4px 12px rgba(123, 198, 126, 0.35)',
              position: 'relative',
              overflow: 'hidden',
              opacity: hasContent && !isProcessing ? 1 : 0.5,
            }}
            onMouseEnter={(e) => {
              if (hasContent && !isProcessing) {
                e.currentTarget.style.background = 'var(--color-primary-dark)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow =
                  '0 6px 16px rgba(123, 198, 126, 0.45)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = downloadComplete
                ? 'var(--color-primary-dark)'
                : 'var(--color-primary)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(123, 198, 126, 0.35)';
            }}
          >
            {isProcessing ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    display: 'inline-block',
                  }}
                />
                处理中...
              </span>
            ) : downloadComplete ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✓ 下载完成
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                📤 导出 SVG
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* 主内容区 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* 左侧上传预览区 */}
        <aside
          className="animate-slide-left"
          style={{
            width: `${leftWidth}px`,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--color-white)',
            borderRight: '1px solid var(--color-warm-gray-dark)',
            position: 'relative',
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          <ImageUploader />

          {/* 左侧拖拽调整手柄 */}
          <div
            className="resize-handle resize-handle-horizontal"
            style={{
              right: '-2px',
              top: 0,
            }}
            onMouseDown={() => setIsResizingLeft(true)}
          />
        </aside>

        {/* 中间SVG画布 */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
            background: '#FAFAFA',
          }}
        >
          {/* 工具栏 */}
          <div
            className="glass-dark"
            style={{
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderBottom: '1px solid rgba(123, 198, 126, 0.1)',
              zIndex: 20,
            }}
          >
            <div style={{ display: 'flex', gap: '2px' }}>
              {['🖱️', '✏️', '🔍', '🖌️', '🧹'].map((icon, i) => (
                <button
                  key={i}
                  className={`btn-ripple toolbar-btn ${i === 0 ? 'active' : ''}`}
                  style={{ position: 'relative', overflow: 'hidden' }}
                >
                  {icon}
                </button>
              ))}
            </div>

            <div
              style={{
                width: '1px',
                height: '24px',
                background: 'var(--color-warm-gray-dark)',
                margin: '0 4px',
              }}
            />

            <div style={{ display: 'flex', gap: '2px' }}>
              {['撤销', '重做'].map((label, i) => (
                <button
                  key={label}
                  className="btn-ripple toolbar-btn"
                  style={{
                    width: 'auto',
                    padding: '0 14px',
                    fontSize: '13px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1 }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className="btn-ripple toolbar-btn"
                onClick={(e) => {
                  handleRipple(e);
                  const { zoom, setZoom, panX, panY, setPan } = useSketchStore.getState();
                  const newZoom = Math.max(0.1, zoom * 0.9);
                  setZoom(newZoom);
                }}
                style={{ position: 'relative', overflow: 'hidden' }}
              >
                ➖
              </button>
              <span
                style={{
                  fontSize: '13px',
                  color: 'var(--color-text)',
                  minWidth: '55px',
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  fontWeight: 500,
                }}
              >
                {Math.round(zoom * 100)}%
              </span>
              <button
                className="btn-ripple toolbar-btn"
                onClick={(e) => {
                  handleRipple(e);
                  const { zoom, setZoom } = useSketchStore.getState();
                  const newZoom = Math.min(20, zoom * 1.1);
                  setZoom(newZoom);
                }}
                style={{ position: 'relative', overflow: 'hidden' }}
              >
                ➕
              </button>
            </div>
          </div>

          {/* SVG画布区域 */}
          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <SvgCanvas />
          </div>
        </main>

        {/* 右侧图层面板 */}
        <aside
          className="animate-slide-right"
          style={{
            width: `${rightWidth}px`,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--color-white)',
            borderLeft: '1px solid var(--color-warm-gray-dark)',
            position: 'relative',
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          <LayerManager />

          {/* 右侧拖拽调整手柄 */}
          <div
            className="resize-handle resize-handle-horizontal"
            style={{
              left: '-2px',
              top: 0,
            }}
            onMouseDown={() => setIsResizingRight(true)}
          />
        </aside>
      </div>

      {/* 导出对话框 */}
      {showExportDialog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={() => !isGeneratingExport && setShowExportDialog(false)}
        >
          <div
            style={{
              background: 'var(--color-white)',
              borderRadius: '16px',
              boxShadow: '0 16px 64px rgba(0, 0, 0, 0.25)',
              width: '560px',
              maxWidth: '90vw',
              maxHeight: '85vh',
              overflow: 'hidden',
              animation: 'flyIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--color-warm-gray-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #7BC67E 0%, #A8D8AA 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '18px',
                  }}
                >
                  📤
                </div>
                <div>
                  <h3
                    className="handwriting"
                    style={{
                      fontSize: '18px',
                      color: 'var(--color-text)',
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    导出 SVG
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-light)', margin: '2px 0 0 0' }}>
                    生成可编辑的矢量图形文件
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExportDialog(false)}
                disabled={isGeneratingExport}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--color-warm-gray)',
                  color: 'var(--color-text-light)',
                  fontSize: '18px',
                  cursor: isGeneratingExport ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    fontSize: '13px',
                    color: 'var(--color-text)',
                    fontWeight: 500,
                    display: 'block',
                    marginBottom: '8px',
                  }}
                >
                  导出范围
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    className="btn-ripple"
                    onClick={() => setExportMode('all')}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: exportMode === 'all' ? '2px solid var(--color-primary)' : '2px solid var(--color-warm-gray-dark)',
                      background: exportMode === 'all' ? 'rgba(123, 198, 126, 0.1)' : 'var(--color-warm-gray)',
                      color: 'var(--color-text)',
                      fontSize: '14px',
                      fontWeight: exportMode === 'all' ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      justifyContent: 'center',
                    }}
                  >
                    📄 全部图层 ({allLayers.length})
                  </button>
                  <button
                    className="btn-ripple"
                    onClick={() => setExportMode('selected')}
                    disabled={!selectedLayerId}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: exportMode === 'selected' ? '2px solid var(--color-primary)' : '2px solid var(--color-warm-gray-dark)',
                      background:
                        exportMode === 'selected'
                          ? 'rgba(123, 198, 126, 0.1)'
                          : 'var(--color-warm-gray)',
                      color: selectedLayerId ? 'var(--color-text)' : 'var(--color-text-light)',
                      fontSize: '14px',
                      fontWeight: exportMode === 'selected' ? 600 : 400,
                      cursor: selectedLayerId ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      opacity: selectedLayerId ? 1 : 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      justifyContent: 'center',
                    }}
                  >
                    🎯 仅选中图层
                  </button>
                </div>
              </div>

              <div
                style={{
                  border: '1px solid var(--color-warm-gray-dark)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background:
                    'linear-gradient(45deg, #E8E0D8 25%, transparent 25%), linear-gradient(-45deg, #E8E0D8 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #E8E0D8 75%), linear-gradient(-45deg, transparent 75%, #E8E0D8 75%)',
                  backgroundSize: '10px 10px',
                  backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
                  backgroundColor: '#F5F0EB',
                }}
              >
                <div
                  style={{
                    height: '240px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  {isGeneratingExport ? (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          border: '3px solid rgba(123, 198, 126, 0.2)',
                          borderTopColor: 'var(--color-primary)',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                        }}
                      />
                      <p style={{ color: 'var(--color-text-light)', fontSize: '13px' }}>
                        正在生成预览...
                      </p>
                    </div>
                  ) : exportPreview ? (
                    <div
                      style={{
                        width: '90%',
                        height: '90%',
                        background: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      dangerouslySetInnerHTML={{ __html: exportPreview }}
                    />
                  ) : (
                    <p style={{ color: 'var(--color-text-light)', fontSize: '13px' }}>
                      无法生成预览
                    </p>
                  )}
                </div>
              </div>

              <div
                style={{
                  marginTop: '12px',
                  padding: '10px 14px',
                  background: 'rgba(123, 198, 126, 0.08)',
                  borderRadius: '8px',
                  border: '1px solid rgba(123, 198, 126, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span style={{ fontSize: '16px' }}>ℹ️</span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>
                  SVG 文件可在 Adobe Illustrator、Figma、Sketch 等设计软件中继续编辑
                </span>
              </div>
            </div>

            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--color-warm-gray-dark)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
              }}
            >
              <button
                className="btn-ripple"
                onClick={() => setShowExportDialog(false)}
                disabled={isGeneratingExport}
                style={{
                  padding: '10px 24px',
                  borderRadius: '10px',
                  border: '1px solid var(--color-warm-gray-dark)',
                  background: 'transparent',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: isGeneratingExport ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                取消
              </button>
              <button
                className={`btn-ripple ${downloadComplete ? 'pulse-glow' : ''}`}
                onClick={handleConfirmExport}
                disabled={isGeneratingExport || !exportPreview || isExporting}
                style={{
                  padding: '10px 28px',
                  borderRadius: '10px',
                  border: 'none',
                  background: downloadComplete
                    ? 'var(--color-primary-dark)'
                    : 'var(--color-primary)',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor:
                    isGeneratingExport || !exportPreview || isExporting
                      ? 'not-allowed'
                      : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(123, 198, 126, 0.35)',
                  position: 'relative',
                  overflow: 'hidden',
                  opacity: isGeneratingExport || !exportPreview || isExporting ? 0.6 : 1,
                }}
              >
                {isExporting ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: 'white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        display: 'inline-block',
                      }}
                    />
                    生成中...
                  </span>
                ) : downloadComplete ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ✓ 下载完成
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    💾 确认下载
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 全局加载遮罩 */}
      {isProcessing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '20px',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              border: '4px solid rgba(123, 198, 126, 0.15)',
              borderTopColor: 'var(--color-primary)',
              borderRightColor: 'var(--color-primary-light)',
              borderRadius: '50%',
              animation: 'spin 1.2s linear infinite',
            }}
          />
          <div style={{ textAlign: 'center' }}>
            <p
              className="handwriting"
              style={{
                fontSize: '18px',
                color: 'var(--color-text)',
                fontWeight: 600,
                marginBottom: '4px',
              }}
            >
              正在智能识别草图...
            </p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-light)' }}>
              边缘检测 · 轮廓提取 · 连通域分析
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
