import { useState } from 'react';
import { useMapStore } from '../stores/useMapStore';
import { ExportManager } from '../modules/export/ExportManager';
import { generateShortLink } from '../api/shortlinkApi';
import './Toolbar.css';

export function Toolbar() {
  const toggleSidebar = useMapStore((state) => state.toggleSidebar);
  const showSidebar = useMapStore((state) => state.showSidebar);
  const markers = useMapStore((state) => state.markers);
  const mapCenter = useMapStore((state) => state.mapCenter);
  const mapZoom = useMapStore((state) => state.mapZoom);

  const [isExporting, setIsExporting] = useState(false);
  const [shortLink, setShortLink] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const mapElement = document.querySelector('.map-container') as HTMLElement;
      let mapImageDataUrl: string | undefined;

      if (mapElement) {
        mapImageDataUrl = await ExportManager.captureMapScreenshot(mapElement);
      }

      const today = new Date();
      const dateStr = today.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const blob = await ExportManager.generatePDF({
        markers,
        mapImageDataUrl,
        title: '我的旅行攻略',
        exportDate: dateStr,
      });

      const fileName = `旅行攻略_${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}.pdf`;
      ExportManager.downloadPDF(blob, fileName);
    } catch (error) {
      console.error('PDF导出失败:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    setShowShareModal(true);
    setShortLink(null);

    if (markers.length === 0) {
      return;
    }

    setIsGeneratingLink(true);
    try {
      const result = await generateShortLink({
        markers,
        center: mapCenter,
        zoom: mapZoom,
      });
      setShortLink(result.shortUrl);
    } catch (error) {
      console.error('生成短链接失败:', error);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyToClipboard = () => {
    if (shortLink) {
      navigator.clipboard.writeText(shortLink).then(() => {
        alert('链接已复制到剪贴板');
      });
    }
  };

  const closeShareModal = () => {
    setShowShareModal(false);
    setShortLink(null);
  };

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-left">
          <div className="logo">
            <span className="logo-icon">🗺</span>
            <span className="logo-text">旅行攻略地图</span>
          </div>
        </div>

        <div className="toolbar-right">
          <button
            className="toolbar-btn share-btn"
            onClick={handleShare}
            title="分享攻略"
          >
            <span className="btn-icon">🔗</span>
          </button>

          <button
            className="toolbar-btn export-btn"
            onClick={handleExport}
            disabled={isExporting}
            title="导出PDF攻略"
          >
            <span className="btn-icon">{isExporting ? '⏳' : '⬇'}</span>
          </button>

          <button
            className={`toolbar-btn collection-btn ${showSidebar ? 'active' : ''}`}
            onClick={toggleSidebar}
            title="我的收藏"
          >
            <span className="btn-icon">⭐</span>
          </button>
        </div>
      </div>

      {showShareModal && (
        <div className="share-modal-overlay" onClick={closeShareModal}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-modal-header">
              <h3>分享攻略</h3>
              <button className="share-close" onClick={closeShareModal}>
                ✕
              </button>
            </div>

            <div className="share-modal-content">
              {markers.length === 0 ? (
                <div className="share-empty">
                  <div className="share-empty-icon">📍</div>
                  <p>当前地图上还没有标记</p>
                  <span>添加一些地点后再分享吧</span>
                </div>
              ) : (
                <>
                  <div className="share-info">
                    <span>共 {markers.length} 个标记点</span>
                  </div>

                  {isGeneratingLink ? (
                    <div className="generating-link">
                      <div className="spinner" />
                      <span>正在生成短链接...</span>
                    </div>
                  ) : shortLink ? (
                    <div className="short-link-section">
                      <div className="short-link-input">
                        <input type="text" value={shortLink} readOnly />
                        <button className="copy-btn" onClick={copyToClipboard}>
                          复制
                        </button>
                      </div>
                      <p className="link-hint">
                        链接有效期 7 天，分享给好友即可查看攻略
                      </p>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
