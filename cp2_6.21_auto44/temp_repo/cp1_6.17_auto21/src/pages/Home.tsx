import React from 'react';
import CanvasPreview from '@/CanvasPreview';
import FilterControls from '@/FilterControls';
import LayerPanel from '@/LayerPanel';
import useStore, { PLATFORM_CONFIGS, PlatformType } from '@/store';
import { Download, Loader2, Image as ImageIcon } from 'lucide-react';

export default function Home() {
  const {
    platform,
    layers,
    downloading,
    toastMessage,
    setCanvasSize,
    setDownloading,
    showToast,
    hideToast,
  } = useStore();

  const [toastVisible, setToastVisible] = React.useState(false);
  const [toastFadingOut, setToastFadingOut] = React.useState(false);

  React.useEffect(() => {
    if (toastMessage) {
      setToastVisible(true);
      setToastFadingOut(false);
      const fadeOutTimer = setTimeout(() => {
        setToastFadingOut(true);
      }, 2700);
      const hideTimer = setTimeout(() => {
        hideToast();
        setToastVisible(false);
        setToastFadingOut(false);
      }, 3000);
      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [toastMessage, hideToast]);

  const handleDownload = async () => {
    const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const base64Data = canvas.toDataURL('image/png');
    setDownloading(true);

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: base64Data,
          filename: `product-${Date.now()}.png`,
        }),
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `product-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast('图片下载成功！');
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCanvasSize(e.target.value as PlatformType);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <div
        className="flex items-center justify-between px-6 flex-shrink-0"
        style={{ height: '56px', backgroundColor: '#1976D2', color: 'white' }}
      >
        <div className="flex items-center gap-3">
          <span style={{ fontWeight: 600, fontSize: '16px' }}>主图生成工具</span>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={platform}
            onChange={handlePlatformChange}
            style={{
              backgroundColor: 'white',
              color: '#1976D2',
              borderRadius: '4px',
              padding: '4px 12px',
              border: 'none',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {Object.entries(PLATFORM_CONFIGS).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label} ({config.width}x{config.height})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="btn-hover flex items-center gap-2"
          style={{
            border: '1px solid white',
            color: 'white',
            borderRadius: '20px',
            padding: '6px 16px',
            backgroundColor: 'transparent',
            cursor: downloading ? 'not-allowed' : 'pointer',
          }}
        >
          {downloading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>下载中...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>下载合成图片</span>
            </>
          )}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-shrink-0 overflow-y-auto scrollbar-thin bg-panel-bg" style={{ width: '280px' }}>
          <FilterControls />
        </div>

        <div
          className="checker-bg flex-1 flex items-center justify-center overflow-hidden"
          style={{ padding: '24px' }}
        >
          {layers.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-neutral">
              <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
              <span className="text-lg">上传商品图片开始创作</span>
            </div>
          ) : (
            <div style={{ maxWidth: '900px', width: '100%', height: '100%' }}>
              <CanvasPreview />
            </div>
          )}
        </div>

        <div className="flex-shrink-0 overflow-y-auto scrollbar-thin bg-panel-bg" style={{ width: '300px' }}>
          <LayerPanel />
        </div>
      </div>

      {toastVisible && (
        <div
          className={`fixed top-20 right-8 px-4 py-2 rounded shadow-lg text-white ${
            toastFadingOut ? 'animate-fade-out' : 'animate-fade-in'
          }`}
          style={{ backgroundColor: '#4CAF50', zIndex: 1000 }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
