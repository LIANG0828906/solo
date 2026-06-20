import React, { useRef, useState } from 'react';
import { useStore, getFilterString } from './store';
import { PLATFORM_CONFIGS } from './types';
import CanvasPreview from './CanvasPreview';
import FilterControls from './FilterControls';
import LayerPanel from './LayerPanel';
import { Download, Upload, ImageIcon, CheckCircle, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const canvas = useStore((state) => state.canvas);
  const layers = useStore((state) => state.layers);
  const isUploading = useStore((state) => state.isUploading);
  const uploadProgress = useStore((state) => state.uploadProgress);
  const isDownloading = useStore((state) => state.isDownloading);
  const addLayer = useStore((state) => state.addLayer);
  const setCanvasSize = useStore((state) => state.setCanvasSize);
  const setUploading = useStore((state) => state.setUploading);
  const setDownloading = useStore((state) => state.setDownloading);

  const showToast = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith('image/') && !file.name.endsWith('.zip')) {
      showToast('请上传图片文件或ZIP压缩包');
      return;
    }

    setUploading(true, 0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploading(true, progress);
        }
      });

      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error('Upload failed'));
          }
        });
        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);

      const response = await uploadPromise;

      if (response.success) {
        const { url, width, height } = response.data;
        
        const img = new Image();
        img.onload = () => {
          const canvasWidth = canvas.width;
          const canvasHeight = canvas.height;
          
          const scaleX = (canvasWidth * 0.8) / width;
          const scaleY = (canvasHeight * 0.8) / height;
          const scale = Math.min(scaleX, scaleY, 1);
          
          addLayer({
            type: 'image',
            name: file.name.replace(/\.[^/.]+$/, ''),
            x: canvasWidth / 2,
            y: canvasHeight / 2,
            width: width * scale,
            height: height * scale,
            scale: 1,
            rotation: 0,
            opacity: 1,
            visible: true,
            filterConfig: {
              brightness: 0,
              contrast: 0,
              hue: 0,
              saturation: 0,
              preset: null,
            },
            imageSrc: url,
          });
          
          setUploading(false, 0);
          showToast('图片上传成功');
        };
        img.src = url;
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const canvasWidth = canvas.width;
          const canvasHeight = canvas.height;
          
          const scaleX = (canvasWidth * 0.8) / img.width;
          const scaleY = (canvasHeight * 0.8) / img.height;
          const scale = Math.min(scaleX, scaleY, 1);
          
          addLayer({
            type: 'image',
            name: file.name.replace(/\.[^/.]+$/, ''),
            x: canvasWidth / 2,
            y: canvasHeight / 2,
            width: img.width * scale,
            height: img.height * scale,
            scale: 1,
            rotation: 0,
            opacity: 1,
            visible: true,
            filterConfig: {
              brightness: 0,
              contrast: 0,
              hue: 0,
              saturation: 0,
              preset: null,
            },
            imageSrc: dataUrl,
          });
          
          setUploading(false, 0);
          showToast('图片上传成功');
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = async () => {
    if (layers.length === 0) {
      showToast('请先添加图层');
      return;
    }

    setDownloading(true);

    try {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;
      const ctx = exportCanvas.getContext('2d')!;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

      for (const layer of sortedLayers) {
        if (!layer.visible) continue;

        ctx.save();
        ctx.translate(layer.x, layer.y);
        ctx.rotate((layer.rotation * Math.PI) / 180);
        ctx.scale(layer.scale, layer.scale);
        ctx.globalAlpha = layer.opacity;

        if (layer.type === 'image' && layer.imageSrc) {
          const img = await loadImage(layer.imageSrc);
          const filter = getFilterString(layer.filterConfig);
          if (filter !== 'none') {
            ctx.filter = filter;
          }
          ctx.drawImage(
            img,
            -layer.width / 2,
            -layer.height / 2,
            layer.width,
            layer.height
          );
        } else if (layer.type === 'text' && layer.textStyle) {
          const { textStyle } = layer;
          ctx.rotate((textStyle.rotation * Math.PI) / 180);
          ctx.font = `${textStyle.fontWeight} ${textStyle.fontSize}px ${textStyle.fontFamily}`;
          ctx.fillStyle = textStyle.color;
          ctx.textAlign = textStyle.align;
          ctx.textBaseline = 'middle';
          
          const lines = textStyle.content.split('\n');
          const lineHeight = textStyle.fontSize * 1.2;
          const totalHeight = lines.length * lineHeight;
          const startY = -totalHeight / 2 + lineHeight / 2;
          
          lines.forEach((line, index) => {
            ctx.fillText(line, 0, startY + index * lineHeight);
          });
        }

        ctx.restore();
      }

      const dataUrl = exportCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `主图_${PLATFORM_CONFIGS[canvas.platform].name}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      setDownloading(false);
      showToast('图片下载成功');
    } catch (error) {
      console.error('Download error:', error);
      setDownloading(false);
      showToast('下载失败，请重试');
    }
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
      <header
        className="h-14 flex items-center justify-between px-6 border-b flex-shrink-0"
        style={{ backgroundColor: '#FFFFFF', borderColor: '#E0E0E0' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: '#1976D2' }}
          >
            <ImageIcon size={18} style={{ color: '#FFFFFF' }} />
          </div>
          <h1 className="text-lg font-bold" style={{ color: '#1976D2' }}>
            电商主图生成工具
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm" style={{ color: '#616161' }}>画布尺寸：</label>
            <select
              value={canvas.platform}
              onChange={(e) => setCanvasSize(e.target.value)}
              className="px-3 py-1.5 text-sm rounded transition-all duration-300 hover:opacity-80 focus:outline-none focus:ring-2"
              style={{
                border: '1px solid #E0E0E0',
                backgroundColor: '#FFFFFF',
                color: '#333333',
              }}
            >
              {Object.entries(PLATFORM_CONFIGS).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.name} ({config.width}×{config.height})
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:opacity-80 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
              style={{
                backgroundColor: '#1976D2',
                color: '#FFFFFF',
                minWidth: '140px',
                justifyContent: 'center',
              }}
            >
              {isDownloading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Download size={16} />
                  下载合成图片
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <button
              onClick={handleUploadClick}
              disabled={isUploading}
              className="flex items-center justify-center gap-2 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:opacity-80 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
              style={{
                width: '120px',
                backgroundColor: '#1976D2',
                color: '#FFFFFF',
              }}
            >
              {isUploading ? (
                <div className="relative w-5 h-5">
                  <svg className="animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px]">
                    {uploadProgress}%
                  </span>
                </div>
              ) : (
                <>
                  <Upload size={16} />
                  上传图片
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.zip"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <FilterControls />
        <CanvasPreview />
        <LayerPanel />
      </div>

      {showSuccess && (
        <div
          className="fixed top-20 left-1/2 transform -translate-x-1/2 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg z-50 animate-bounce"
          style={{
            backgroundColor: '#4CAF50',
            color: '#FFFFFF',
            animation: 'slideDown 0.3s ease-out',
          }}
        >
          <CheckCircle size={18} />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #1976D2;
          cursor: pointer;
          transition: transform 0.2s;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #1976D2;
          cursor: pointer;
          border: none;
        }
        
        select:focus {
          outline: none;
          border-color: #1976D2;
          box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
        }
        
        textarea:focus, input[type="number"]:focus {
          outline: none;
          border-color: #1976D2;
          box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
        }
      `}</style>
    </div>
  );
};

export default App;
