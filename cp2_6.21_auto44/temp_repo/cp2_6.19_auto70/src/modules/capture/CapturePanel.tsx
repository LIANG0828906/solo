import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Check, ZoomIn, ZoomOut } from 'lucide-react';
import type { AspectRatio } from '@/types';
import useBoardStore from '@/store/boardStore';
import { fileToDataURL, captureViewport, cropImage, loadImage, validateFile } from '@/utils/imageUtils';
import { Modal } from '@/components/Modal';

interface CapturePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'select' | 'crop';

export function CapturePanel({ isOpen, onClose }: CapturePanelProps) {
  const [step, setStep] = useState<Step>('select');
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [zoom, setZoom] = useState(1);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addCard = useBoardStore(state => state.addCard);

  const resetState = useCallback(() => {
    setStep('select');
    setSourceImage(null);
    setZoom(1);
    setCropPosition({ x: 0, y: 0 });
    setError(null);
    setIsProcessing(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const handleCapture = useCallback(async () => {
    try {
      setError(null);
      const dataUrl = await captureViewport();
      setSourceImage(dataUrl);
      setStep('crop');
    } catch (err) {
      setError('截图失败，请重试');
    }
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error || '文件验证失败');
      return;
    }

    try {
      setError(null);
      const dataUrl = await fileToDataURL(file);
      setSourceImage(dataUrl);
      setStep('crop');
    } catch (err) {
      setError('文件加载失败，请重试');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, []);

  const getAspectRatioValues = (ratio: AspectRatio): { w: number; h: number } => {
    const [w, h] = ratio.split(':').map(Number);
    return { w, h };
  };

  const calculateCropArea = useCallback(() => {
    if (!sourceImage || !imageContainerRef.current) return null;

    const containerRect = imageContainerRef.current.getBoundingClientRect();
    const { w, h } = getAspectRatioValues(aspectRatio);
    const containerAspect = containerRect.width / containerRect.height;
    const targetAspect = w / h;

    let cropWidth: number;
    let cropHeight: number;

    if (containerAspect > targetAspect) {
      cropHeight = containerRect.height;
      cropWidth = cropHeight * targetAspect;
    } else {
      cropWidth = containerRect.width;
      cropHeight = cropWidth / targetAspect;
    }

    const baseX = (containerRect.width - cropWidth) / 2;
    const baseY = (containerRect.height - cropHeight) / 2;

    const maxOffsetX = (cropWidth * zoom - cropWidth) / 2;
    const maxOffsetY = (cropHeight * zoom - cropHeight) / 2;

    const clampedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, cropPosition.x));
    const clampedY = Math.max(-maxOffsetY, Math.min(maxOffsetY, cropPosition.y));

    return {
      cropX: baseX + clampedX,
      cropY: baseY + clampedY,
      cropWidth,
      cropHeight,
      baseX,
      baseY,
    };
  }, [sourceImage, aspectRatio, zoom, cropPosition]);

  const handleConfirm = useCallback(async () => {
    if (!sourceImage) return;

    const cropArea = calculateCropArea();
    if (!cropArea) return;

    setIsProcessing(true);
    try {
      const img = await loadImage(sourceImage);
      const { w, h } = getAspectRatioValues(aspectRatio);
      
      const scaleX = img.naturalWidth / imageContainerRef.current!.clientWidth;
      const scaleY = img.naturalHeight / imageContainerRef.current!.clientHeight;

      const targetWidth = 1600;
      const targetHeight = (targetWidth * h) / w;

      const { original, thumbnail } = await cropImage(
        sourceImage,
        cropArea.cropX * scaleX,
        cropArea.cropY * scaleY,
        cropArea.cropWidth * scaleX,
        cropArea.cropHeight * scaleY,
        targetWidth,
        targetHeight
      );

      addCard({
        imageUrl: original,
        thumbnailUrl: thumbnail,
        aspectRatio,
        width: targetWidth,
        height: targetHeight,
        caption: '',
        note: '',
        tags: [],
      });

      handleClose();
    } catch (err) {
      setError('处理图片失败，请重试');
    } finally {
      setIsProcessing(false);
    }
  }, [sourceImage, calculateCropArea, aspectRatio, addCard, handleClose]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (e.buttons !== 1) return;
    
    setCropPosition(prev => ({
      x: prev.x - e.movementX / zoom,
      y: prev.y - e.movementY / zoom,
    }));
  }, [zoom]);

  const cropArea = calculateCropArea();

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="采集素材">
      <div className="capture-panel">
        {error && (
          <div className="capture-error">
            {error}
            <button onClick={() => setError(null)} className="error-close">
              <X size={16} />
            </button>
          </div>
        )}

        {step === 'select' && (
          <div className="capture-select">
            <button className="capture-option" onClick={handleCapture}>
              <Camera size={48} className="option-icon" />
              <div className="option-title">截取当前页面</div>
              <div className="option-desc">模拟浏览器扩展功能</div>
            </button>
            
            <button className="capture-option" onClick={() => fileInputRef.current?.click()}>
              <Upload size={48} className="option-icon" />
              <div className="option-title">上传本地图片</div>
              <div className="option-desc">支持 JPG、PNG、WebP，最大 20MB</div>
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {step === 'crop' && sourceImage && (
          <div className="capture-crop">
            <div className="crop-controls">
              <div className="aspect-buttons">
                <button
                  className={`aspect-btn ${aspectRatio === '16:9' ? 'active' : ''}`}
                  onClick={() => setAspectRatio('16:9')}
                >
                  16:9
                </button>
                <button
                  className={`aspect-btn ${aspectRatio === '1:1' ? 'active' : ''}`}
                  onClick={() => setAspectRatio('1:1')}
                >
                  1:1
                </button>
              </div>
              
              <div className="zoom-controls">
                <button
                  className="zoom-btn"
                  onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                  disabled={zoom <= 0.5}
                >
                  <ZoomOut size={18} />
                </button>
                <span className="zoom-value">{Math.round(zoom * 100)}%</span>
                <button
                  className="zoom-btn"
                  onClick={() => setZoom(z => Math.min(2, z + 0.1))}
                  disabled={zoom >= 2}
                >
                  <ZoomIn size={18} />
                </button>
              </div>
            </div>
            
            <div
              ref={imageContainerRef}
              className="crop-container"
              onMouseDown={() => {}}
              onMouseMove={handleMouseMove}
            >
              <img
                src={sourceImage}
                alt="待裁剪"
                className="crop-image"
                style={{
                  transform: `translate(${cropPosition.x}px, ${cropPosition.y}px) scale(${zoom})`,
                }}
                draggable={false}
              />
              
              {cropArea && (
                <>
                  <div className="crop-overlay overlay-top" style={{ height: cropArea.cropY }} />
                  <div className="crop-overlay overlay-bottom" style={{ top: cropArea.cropY + cropArea.cropHeight }} />
                  <div className="crop-overlay overlay-left" style={{ 
                    width: cropArea.cropX, 
                    top: cropArea.cropY, 
                    height: cropArea.cropHeight 
                  }} />
                  <div className="crop-overlay overlay-right" style={{ 
                    left: cropArea.cropX + cropArea.cropWidth, 
                    top: cropArea.cropY, 
                    height: cropArea.cropHeight 
                  }} />
                  
                  <div className="crop-frame" style={{
                    left: cropArea.cropX,
                    top: cropArea.cropY,
                    width: cropArea.cropWidth,
                    height: cropArea.cropHeight,
                  }}>
                    <div className="grid-overlay">
                      {[...Array(3)].map((_, i) => (
                        <div key={`v-${i}`} className="grid-line vertical" style={{ left: `${(i + 1) * 33.33}%` }} />
                      ))}
                      {[...Array(3)].map((_, i) => (
                        <div key={`h-${i}`} className="grid-line horizontal" style={{ top: `${(i + 1) * 33.33}%` }} />
                      ))}
                    </div>
                    <div className="corner corner-tl" />
                    <div className="corner corner-tr" />
                    <div className="corner corner-bl" />
                    <div className="corner corner-br" />
                  </div>
                </>
              )}
            </div>
            
            <div className="crop-hint">拖拽图片调整位置，使用滑块缩放</div>
            
            <div className="crop-actions">
              <button className="btn-secondary" onClick={() => setStep('select')}>
                返回
              </button>
              <button 
                className="btn-primary" 
                onClick={handleConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? '处理中...' : (
                  <>
                    <Check size={18} />
                    确认保存
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
