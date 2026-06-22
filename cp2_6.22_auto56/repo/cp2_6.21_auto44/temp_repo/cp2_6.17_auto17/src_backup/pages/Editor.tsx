import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/useProjectStore';
import CanvasView from '../components/CanvasView';
import HotspotPanel from '../components/HotspotPanel';
import ThumbnailBar from '../components/ThumbnailBar';
import { Hotspot } from '../types';

const SAMPLE_IMAGES = [
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=watercolor%20illustration%20cute%20forest%20animals%20storybook%20page%20soft%20colors%20children%20book%20art&image_size=landscape_4_3',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=watercolor%20painting%20little%20girl%20reading%20book%20under%20tree%20storybook%20illustration%20pastel&image_size=landscape_4_3',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=watercolor%20cute%20bunny%20rabbit%20in%20garden%20flowers%20children%20storybook%20soft%20pastel&image_size=landscape_4_3',
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=watercolor%20magical%20castle%20fairytale%20storybook%20illustration%20children%20book%20dreamy&image_size=landscape_4_3',
];

export default function Editor() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const {
    currentProject,
    currentPageIndex,
    selectedHotspotId,
    isPlaying,
    playbackDuration,
    sidebarOpen,
    isMobilePanelOpen,
    openProject,
    closeProject,
    setCurrentPageIndex,
    addPage,
    removePage,
    setPageImage,
    addHotspot,
    updateHotspot,
    removeHotspot,
    setSelectedHotspotId,
    setIsPlaying,
    setPlaybackDuration,
    setSidebarOpen,
    setIsMobilePanelOpen,
    reorderPages,
  } = useProjectStore();

  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<'canvas' | 'config'>('canvas');
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewPageIndex, setPreviewPageIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [isSliding, setIsSliding] = useState(false);
  const [popupContent, setPopupContent] = useState<{ hotspot: Hotspot; x: number; y: number } | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (projectId) {
      openProject(projectId);
    }
    return () => {
      closeProject();
    };
  }, [projectId]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  if (!currentProject) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FFF8F0',
        }}
      >
        <p style={{ color: '#B2BEC3' }}>加载中...</p>
      </div>
    );
  }

  const currentPage = currentProject.pages[currentPageIndex];
  const selectedHotspot = currentPage?.hotspots.find((h) => h.id === selectedHotspotId) || null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentPage) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        setPageImage(currentPage.id, ev.target?.result as string, img.naturalWidth, img.naturalHeight);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    setShowImageDialog(false);
  };

  const handleSampleImage = (url: string) => {
    if (!currentPage) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setPageImage(currentPage.id, url, img.naturalWidth, img.naturalHeight);
    };
    img.onerror = () => {
      setPageImage(currentPage.id, url, 800, 600);
    };
    img.src = url;
    setShowImageDialog(false);
  };

  const handleAddHotspot = (x: number, y: number, w: number, h: number) => {
    if (!currentPage) return;
    addHotspot(currentPage.id, x, y, w, h);
  };

  const handleUpdateHotspot = (id: string, updates: Partial<Hotspot>) => {
    if (!currentPage) return;
    updateHotspot(currentPage.id, id, updates);
  };

  const handleDeleteHotspot = () => {
    if (!currentPage || !selectedHotspotId) return;
    removeHotspot(currentPage.id, selectedHotspotId);
  };

  const startPreview = () => {
    setPreviewPageIndex(0);
    setShowPreviewModal(true);
    setIsPlaying(true);
  };

  const stopPreview = () => {
    setShowPreviewModal(false);
    setIsPlaying(false);
    setPopupContent(null);
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    if (slideTimerRef.current) clearTimeout(slideTimerRef.current);
  };

  const goToNextPreviewPage = useCallback(() => {
    if (!currentProject) return;
    const totalPages = currentProject.pages.length;
    setPreviewPageIndex((prev) => {
      const next = prev + 1;
      if (next >= totalPages) {
        stopPreview();
        return prev;
      }
      setSlideDirection('right');
      setIsSliding(true);
      setTimeout(() => setIsSliding(false), 400);
      return next;
    });
  }, [currentProject]);

  useEffect(() => {
    if (!showPreviewModal) return;
    previewTimerRef.current = setTimeout(goToNextPreviewPage, playbackDuration * 1000);
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
  }, [showPreviewModal, previewPageIndex, playbackDuration, goToNextPreviewPage]);

  const handlePreviewHotspotClick = (hotspot: Hotspot) => {
    if (hotspot.actionType === 'popup' && hotspot.popupText) {
      setPopupContent({ hotspot, x: hotspot.x + hotspot.width / 2, y: hotspot.y });
    }
  };

  const editorContent = (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#FFF8F0',
      }}
    >
      <nav
        style={{
          height: 88,
          background: 'linear-gradient(135deg, #FFD6A5, #FFC3A0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          flexShrink: 0,
          boxShadow: '0 2px 12px rgba(255, 195, 160, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'rgba(255,255,255,0.6)',
              border: 'none',
              borderRadius: 10,
              padding: '6px 14px',
              fontSize: 14,
              cursor: 'pointer',
              color: '#2D3436',
              transition: 'all 0.2s',
            }}
          >
            ← 返回
          </button>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#2D3436',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 200,
            }}
          >
            {currentProject.name}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="btn-secondary"
            onClick={() => setShowImageDialog(true)}
            style={{ fontSize: isMobile ? 12 : 13, padding: isMobile ? '6px 10px' : '8px 16px' }}
          >
            🖼 导入
          </button>
          <button
            className="btn-primary"
            onClick={startPreview}
            style={{ fontSize: isMobile ? 12 : 13, padding: isMobile ? '6px 10px' : '8px 16px' }}
          >
            ▶ 预览
          </button>
          {isMobile && (
            <button
              className="btn-secondary"
              onClick={() => setIsMobilePanelOpen(!isMobilePanelOpen)}
              style={{ fontSize: 13, padding: '8px 14px' }}
            >
              {isMobilePanelOpen ? '🎨 画布' : '⚙️ 配置'}
            </button>
          )}
        </div>
      </nav>

      {isMobile && isMobilePanelOpen && (
        <div style={{ padding: '8px 12px', background: '#FFF', display: 'flex', gap: 8, borderBottom: '1px solid #E0E0E0' }}>
          <button
            className="btn-secondary"
            onClick={() => setShowImageDialog(true)}
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            🖼 导入插图
          </button>
          <button
            className="btn-primary"
            onClick={startPreview}
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            ▶ 预览播放
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
            <span style={{ fontSize: 11, color: '#636E72' }}>停留</span>
            <input
              type="range"
              min={3}
              max={10}
              value={playbackDuration}
              onChange={(e) => setPlaybackDuration(Number(e.target.value))}
              style={{ width: 60 }}
            />
            <span style={{ fontSize: 11, color: '#636E72' }}>{playbackDuration}s</span>
          </div>
        </div>
      )}

      {isMobile && isMobilePanelOpen ? (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <HotspotPanel
            hotspot={selectedHotspot}
            onUpdate={(updates) => selectedHotspotId && handleUpdateHotspot(selectedHotspotId, updates)}
            onDelete={handleDeleteHotspot}
            isMobile
          />
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ flex: 1, display: 'flex', position: 'relative' }}>
              {currentPage && (
                <CanvasView
                  pageId={currentPage.id}
                  imageUrl={currentPage.imageUrl}
                  imageWidth={currentPage.imageWidth}
                  imageHeight={currentPage.imageHeight}
                  hotspots={currentPage.hotspots}
                  selectedHotspotId={selectedHotspotId}
                  onSelectHotspot={setSelectedHotspotId}
                  onAddHotspot={handleAddHotspot}
                  onUpdateHotspot={handleUpdateHotspot}
                />
              )}

              {popupContent && (
                <div
                  style={{
                    position: 'absolute',
                    left: Math.min(popupContent.x, 600),
                    top: Math.min(popupContent.y, 300),
                    background: '#FFF',
                    borderRadius: 12,
                    padding: 16,
                    maxWidth: 300,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    zIndex: 100,
                    border: `2px solid ${popupContent.hotspot.color}`,
                  }}
                >
                  <div
                    style={{ fontSize: 13, lineHeight: 1.7, color: '#2D3436' }}
                    dangerouslySetInnerHTML={{
                      __html: popupContent.hotspot.popupText
                        .replace(/<b>/g, '<strong>')
                        .replace(/<\/b>/g, '</strong>')
                        .replace(/<i>/g, '<em>')
                        .replace(/<\/i>/g, '</em>')
                        .replace(/<br\/>/g, '<br/>'),
                    }}
                  />
                  <button
                    onClick={() => setPopupContent(null)}
                    style={{
                      marginTop: 10,
                      padding: '4px 14px',
                      borderRadius: 10,
                      border: '1px solid #E0E0E0',
                      background: '#FFF',
                      fontSize: 12,
                      cursor: 'pointer',
                      color: '#636E72',
                    }}
                  >
                    关闭
                  </button>
                </div>
              )}

              {isPlaying && !showPreviewModal && (
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    background: 'rgba(78,205,196,0.9)',
                    borderRadius: 8,
                    padding: '6px 14px',
                    fontSize: 13,
                    color: '#FFF',
                    fontWeight: 600,
                  }}
                >
                  ▶ 预览模式 - 点击热点交互
                </div>
              )}
            </div>

            {!isPlaying && (
              <div
                style={{
                  height: 36,
                  background: '#FFF',
                  borderTop: '1px solid #F0F0F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 16,
                  padding: '0 20px',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: '#636E72' }}>停留时间</span>
                  <input
                    type="range"
                    min={3}
                    max={10}
                    value={playbackDuration}
                    onChange={(e) => setPlaybackDuration(Number(e.target.value))}
                    style={{
                      width: 100,
                      accentColor: '#4ECDC4',
                    }}
                  />
                  <span style={{ fontSize: 12, color: '#4ECDC4', fontWeight: 600, minWidth: 24 }}>
                    {playbackDuration}s
                  </span>
                </div>
                {currentPage && (
                  <span style={{ fontSize: 11, color: '#B2BEC3' }}>
                    第 {currentPage.pageNumber} 页 · {currentPage.hotspots.length} 个热点
                  </span>
                )}
              </div>
            )}
          </div>

          {!isMobile && sidebarOpen && (
            <HotspotPanel
              hotspot={selectedHotspot}
              onUpdate={(updates) => selectedHotspotId && handleUpdateHotspot(selectedHotspotId, updates)}
              onDelete={handleDeleteHotspot}
            />
          )}

          {!isMobile && !sidebarOpen && selectedHotspot && (
            <div
              onClick={() => setSidebarOpen(true)}
              style={{
                width: 36,
                background: '#F9F9F9',
                borderLeft: '1px solid #E0E0E0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#4ECDC4',
                fontSize: 18,
                transition: 'all 0.2s',
              }}
            >
              ‹
            </div>
          )}
        </div>
      )}

      {!isPlaying && (
        <ThumbnailBar
          pages={currentProject.pages}
          currentPageIndex={currentPageIndex}
          onSelectPage={setCurrentPageIndex}
          onAddPage={addPage}
          onRemovePage={removePage}
          onReorderPages={reorderPages}
        />
      )}
    </div>
  );

  const previewPage = currentProject.pages[previewPageIndex];

  const previewModal = showPreviewModal && (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#1A1A2E',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 10,
        }}
      >
        <button
          onClick={stopPreview}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '50%',
            width: 40,
            height: 40,
            color: '#FFF',
            fontSize: 20,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.3)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.2)';
          }}
        >
          ✕
        </button>
      </div>

      <div
        style={{
          position: 'relative',
          width: '80vw',
          maxWidth: 800,
          height: '60vh',
          maxHeight: 600,
          borderRadius: 16,
          overflow: 'hidden',
          background: '#FFF',
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            transition: isSliding ? 'transform 0.4s ease, opacity 0.4s ease' : 'none',
            transform: isSliding
              ? slideDirection === 'right'
                ? 'translateX(-30px)'
                : 'translateX(30px)'
              : 'translateX(0)',
            opacity: isSliding ? 0 : 1,
          }}
        >
          {previewPage?.imageUrl ? (
            <img
              src={previewPage.imageUrl}
              alt={`第${previewPageIndex + 1}页`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                background: '#FFF8F0',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#FFF8F0',
                color: '#B2BEC3',
                fontSize: 18,
              }}
            >
              📄 第 {previewPageIndex + 1} 页 - 未导入插图
            </div>
          )}
          {previewPage?.hotspots.map((hotspot) => (
            <div
              key={hotspot.id}
              onClick={() => handlePreviewHotspotClick(hotspot)}
              style={{
                position: 'absolute',
                left: `${(hotspot.x / Math.max(previewPage.imageWidth || 800, 1)) * 100}%`,
                top: `${(hotspot.y / Math.max(previewPage.imageHeight || 600, 1)) * 100}%`,
                width: `${(hotspot.width / Math.max(previewPage.imageWidth || 800, 1)) * 100}%`,
                height: `${(hotspot.height / Math.max(previewPage.imageHeight || 600, 1)) * 100}%`,
                background: `${hotspot.color}33`,
                border: `2px solid ${hotspot.color}`,
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'all 0.2s ease-out',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = `${hotspot.color}55`;
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = `${hotspot.color}33`;
                (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
              }}
            >
              <span
                className="badge"
                style={{
                  position: 'absolute',
                  top: 2,
                  left: 2,
                  background: hotspot.color,
                  fontSize: 10,
                }}
              >
                {hotspot.label}
              </span>
            </div>
          ))}
        </div>

        {popupContent && (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '40%',
              transform: 'translate(-50%, -50%)',
              background: '#FFF',
              borderRadius: 14,
              padding: 20,
              maxWidth: 320,
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              border: `2px solid ${popupContent.hotspot.color}`,
              zIndex: 50,
            }}
          >
            <div
              style={{ fontSize: 14, lineHeight: 1.8, color: '#2D3436' }}
              dangerouslySetInnerHTML={{
                __html: popupContent.hotspot.popupText
                  .replace(/<b>/g, '<strong>')
                  .replace(/<\/b>/g, '</strong>')
                  .replace(/<i>/g, '<em>')
                  .replace(/<\/i>/g, '</em>')
                  .replace(/<br\/>/g, '<br/>'),
              }}
            />
            <button
              onClick={() => setPopupContent(null)}
              style={{
                marginTop: 12,
                padding: '6px 18px',
                borderRadius: 12,
                border: '1px solid #E0E0E0',
                background: '#FFF',
                fontSize: 13,
                cursor: 'pointer',
                color: '#636E72',
              }}
            >
              关闭
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          marginTop: 28,
          alignItems: 'center',
        }}
      >
        {currentProject.pages.map((_, index) => (
          <div
            key={index}
            style={{
              width: index === previewPageIndex ? 12 : 8,
              height: index === previewPageIndex ? 12 : 8,
              borderRadius: '50%',
              background: index === previewPageIndex ? '#FF6B6B' : '#DDDDDD',
              transition: 'all 0.3s',
              transform: index === previewPageIndex ? 'scale(1.2)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      <div
        style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: 13,
          marginTop: 16,
        }}
      >
        {previewPageIndex + 1} / {currentProject.pages.length} · 每页 {playbackDuration} 秒
      </div>
    </div>
  );

  const imageDialog = showImageDialog && (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={() => setShowImageDialog(false)}
    >
      <div
        style={{
          background: '#FFF',
          borderRadius: 20,
          padding: 28,
          width: 460,
          maxWidth: '90vw',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 20,
            color: '#2D3436',
          }}
        >
          🖼 导入插图
        </h3>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: 'block',
              padding: '24px',
              borderRadius: 12,
              border: '2px dashed #D0D0D0',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: '#FAFAFA',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLLabelElement).style.borderColor = '#4ECDC4';
              (e.currentTarget as HTMLLabelElement).style.background = '#F0FFFE';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLLabelElement).style.borderColor = '#D0D0D0';
              (e.currentTarget as HTMLLabelElement).style.background = '#FAFAFA';
            }}
          >
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
            <div style={{ fontSize: 14, color: '#636E72' }}>
              点击上传 PNG / JPG 图片
            </div>
          </label>
        </div>

        <div>
          <p
            style={{
              fontSize: 13,
              color: '#636E72',
              marginBottom: 12,
              fontWeight: 500,
            }}
          >
            或选择示例插图：
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {SAMPLE_IMAGES.map((url, i) => (
              <div
                key={i}
                onClick={() => handleSampleImage(url)}
                style={{
                  borderRadius: 10,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '2px solid #E0E0E0',
                  transition: 'all 0.2s ease-out',
                  height: 80,
                  background: `url(${url}) center/cover`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#4ECDC4';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = '#E0E0E0';
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ marginTop: 20, textAlign: 'right' }}>
          <button
            className="btn-secondary"
            onClick={() => setShowImageDialog(false)}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {editorContent}
      {previewModal}
      {imageDialog}
    </>
  );
}
