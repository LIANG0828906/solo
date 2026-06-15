import React, { useState, useRef, useCallback } from 'react';
import axios, { AxiosProgressEvent } from 'axios';
import useSketchStore from '../../store/useSketchStore';
import type { LayerGroup, Layer } from '../../types';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ImageUploader: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const { isProcessing, setOriginalImage, addLayerGroups, setProcessing } = useSketchStore();

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return '仅支持 jpg、png、webp 格式的图片';
    }
    if (file.size > MAX_FILE_SIZE) {
      return '图片大小不能超过 10MB';
    }
    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    setErrorMessage(null);
    setImageLoaded(false);

    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    simulateUploadProgress();
  }, [previewUrl]);

  const simulateUploadProgress = () => {
    setIsUploading(true);
    setUploadProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setIsUploading(false);
      }
      setUploadProgress(progress);
    }, 150);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

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

  const handleRecognize = async (e: React.MouseEvent<HTMLButtonElement>) => {
    handleRipple(e);

    if (!previewUrl || isProcessing || isUploading) return;

    setProcessing(true);

    try {
      const file = await urlToFile(previewUrl, 'upload.png');

      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });

      if (response.data.success && response.data.data) {
        const { strokes, shapes, text } = response.data.data;

        const strokeLayers: Layer[] = strokes.map((s: any) => ({
          id: s.id,
          name: s.name,
          type: 'stroke' as const,
          visible: s.visible,
          locked: false,
          opacity: s.opacity ?? 1,
          strokeColor: s.strokeColor,
          strokeWidth: s.strokeWidth,
          fillColor: 'transparent',
          fillOpacity: 0,
          points: s.points,
          confidence: s.confidence,
        }));

        const shapeLayers: Layer[] = shapes.map((s: any) => ({
          id: s.id,
          name: s.name,
          type: 'shape' as const,
          visible: s.visible,
          locked: false,
          opacity: s.opacity ?? 1,
          strokeColor: s.stroke,
          strokeWidth: s.strokeWidth,
          fillColor: s.fill,
          fillOpacity: s.fill === 'transparent' ? 0 : 1,
          shapeType: s.shapeType,
          x: s.x,
          y: s.y,
          width: s.width,
          height: s.height,
          rotation: s.rotation ?? 0,
          confidence: s.confidence,
        }));

        const textLayers: Layer[] = text.map((t: any) => ({
          id: t.id,
          name: t.name,
          type: 'text' as const,
          visible: t.visible,
          locked: false,
          opacity: t.opacity ?? 1,
          strokeColor: 'transparent',
          strokeWidth: 0,
          fillColor: t.color,
          fillOpacity: 1,
          x: t.x,
          y: t.y,
          width: t.width,
          height: t.height,
          text: t.text,
          confidence: t.confidence,
        }));

        const layerGroups: LayerGroup[] = [
          {
            id: 'group-strokes',
            name: '笔触线条',
            type: 'stroke' as const,
            layers: strokeLayers,
            expanded: true,
          },
          {
            id: 'group-shapes',
            name: '几何形状',
            type: 'shape' as const,
            layers: shapeLayers,
            expanded: true,
          },
          {
            id: 'group-text',
            name: '文字区域',
            type: 'text' as const,
            layers: textLayers,
            expanded: true,
          },
        ];

        setOriginalImage(previewUrl);
        addLayerGroups(layerGroups);
      } else {
        setErrorMessage(response.data.message || '识别失败，请重试');
      }
    } catch (error: any) {
      console.error('识别请求失败:', error);
      setErrorMessage(error.response?.data?.message || '网络错误，请稍后重试');
    } finally {
      setProcessing(false);
    }
  };

  const urlToFile = async (url: string, filename: string): Promise<File> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type });
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
        @keyframes borderGlow {
          0%, 100% {
            box-shadow: 0 0 8px #7BC67E, inset 0 0 8px rgba(123, 198, 126, 0.2);
          }
          50% {
            box-shadow: 0 0 20px #7BC67E, inset 0 0 20px rgba(123, 198, 126, 0.4);
          }
        }
        @keyframes progressShine {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        @keyframes flyInElastic {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.3);
            transform-origin: top left;
          }
          55% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.08);
            transform-origin: top left;
          }
          70% {
            transform: translate(-50%, -50%) scale(0.96);
            transform-origin: top left;
          }
          85% {
            transform: translate(-50%, -50%) scale(1.02);
            transform-origin: top left;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            transform-origin: top left;
          }
        }
        .image-fly-in {
          animation: flyInElastic 0.7s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }
        .drag-active {
          border-style: solid !important;
          animation: borderGlow 0.8s ease-in-out infinite;
        }
        .progress-bar-shine {
          background: linear-gradient(
            90deg,
            #7BC67E 0%,
            #A8D8AA 25%,
            #7BC67E 50%,
            #A8D8AA 75%,
            #7BC67E 100%
          );
          background-size: 200% 100%;
          animation: progressShine 1.5s linear infinite;
        }
      `}</style>

      <h2 style={styles.title}>图片上传</h2>

      {!previewUrl ? (
        <div
          className={isDragging ? 'drag-active' : ''}
          style={{
            ...styles.uploadZone,
            borderColor: isDragging ? '#7BC67E' : '#A8D8AA',
            background: isDragging ? 'rgba(123, 198, 126, 0.08)' : '#F5F0EB',
          }}
          onClick={handleClickUpload}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            style={styles.cloudIcon}
          >
            <path
              d="M20 44h24a8 8 0 0 0 1-15.94A12 12 0 0 0 22 26.6 10 10 0 0 0 20 44z"
              stroke="#7BC67E"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="rgba(123, 198, 126, 0.1)"
            />
            <path
              d="M32 20v18M32 38l-7-7M32 38l7-7"
              stroke="#7BC67E"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p style={styles.uploadHint}>点击或拖拽图片到此处上传</p>
          <p style={styles.uploadSubHint}>支持 JPG、PNG、WEBP 格式，最大 10MB</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handleInputChange}
          />
        </div>
      ) : (
        <div style={styles.previewContainer}>
          <div style={styles.previewArea}>
            <img
              src={previewUrl}
              alt="预览"
              className={imageLoaded ? 'image-fly-in' : ''}
              style={{
                ...styles.previewImage,
                opacity: imageLoaded ? 1 : 0,
              }}
              onLoad={handleImageLoad}
            />
          </div>

          {(isUploading || uploadProgress < 100) && uploadProgress > 0 && (
            <div style={styles.progressWrapper}>
              <div style={styles.progressBarOuter}>
                <div
                  className="progress-bar-shine"
                  style={{
                    ...styles.progressBarInner,
                    width: `${Math.min(uploadProgress, 100)}%`,
                  }}
                />
              </div>
              <span style={styles.progressText}>{Math.round(uploadProgress)}%</span>
            </div>
          )}

          <button
            style={{
              ...styles.recognizeBtn,
              background: isProcessing || isUploading ? '#A8D8AA' : '#7BC67E',
              cursor: isProcessing || isUploading ? 'not-allowed' : 'pointer',
            }}
            onClick={handleRecognize}
            disabled={isProcessing || isUploading}
          >
            {isProcessing ? (
              <span style={styles.btnContent}>
                <span style={styles.spinner} />
                <span>识别中...</span>
              </span>
            ) : (
              '开始识别'
            )}
          </button>

          <button style={styles.reuploadBtn} onClick={handleClickUpload}>
            重新上传
          </button>
        </div>
      )}

      {errorMessage && (
        <div style={styles.errorBox}>
          <span style={styles.errorIcon}>⚠️</span>
          <span style={styles.errorText}>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    fontFamily: "'Comic Sans MS', 'Marker Felt', 'Bradley Hand', cursive",
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#2D3436',
    margin: 0,
  },
  uploadZone: {
    width: '100%',
    padding: '40px 20px',
    borderRadius: '12px',
    border: '2px dashed #A8D8AA',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box',
  },
  cloudIcon: {
    marginBottom: '4px',
  },
  uploadHint: {
    fontSize: '15px',
    color: '#2D3436',
    margin: 0,
    fontWeight: 500,
  },
  uploadSubHint: {
    fontSize: '12px',
    color: '#636E72',
    margin: 0,
  },
  previewContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  previewArea: {
    width: '100%',
    height: '280px',
    borderRadius: '10px',
    background: `
      linear-gradient(45deg, #E8E0D8 25%, transparent 25%),
      linear-gradient(-45deg, #E8E0D8 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #E8E0D8 75%),
      linear-gradient(-45deg, transparent 75%, #E8E0D8 75%)
    `,
    backgroundSize: '10px 10px',
    backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
    backgroundColor: '#F5F0EB',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    maxWidth: '95%',
    maxHeight: '95%',
    objectFit: 'contain',
    borderRadius: '4px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
    transition: 'opacity 0.1s ease',
  },
  progressWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
  },
  progressBarOuter: {
    flex: 1,
    height: '10px',
    borderRadius: '5px',
    backgroundColor: '#E8E0D8',
    overflow: 'hidden',
  },
  progressBarInner: {
    height: '100%',
    borderRadius: '5px',
    transition: 'width 0.2s ease',
  },
  progressText: {
    fontSize: '13px',
    color: '#2D3436',
    minWidth: '42px',
    textAlign: 'right',
    fontWeight: 600,
  },
  recognizeBtn: {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    padding: '12px 20px',
    borderRadius: '10px',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '15px',
    fontWeight: 600,
    fontFamily: "'Comic Sans MS', 'Marker Felt', 'Bradley Hand', cursive",
    boxShadow: '0 4px 12px rgba(123, 198, 126, 0.3)',
    transition: 'all 0.25s ease',
  },
  btnContent: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2.5px solid rgba(255, 255, 255, 0.35)',
    borderTopColor: '#FFFFFF',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  reuploadBtn: {
    width: '100%',
    padding: '10px 20px',
    borderRadius: '10px',
    border: '2px solid #7BC67E',
    background: 'transparent',
    color: '#7BC67E',
    fontSize: '14px',
    fontWeight: 500,
    fontFamily: "'Comic Sans MS', 'Marker Felt', 'Bradley Hand', cursive",
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '8px',
    background: 'rgba(255, 107, 107, 0.1)',
    border: '1px solid rgba(255, 107, 107, 0.3)',
  },
  errorIcon: {
    fontSize: '16px',
  },
  errorText: {
    fontSize: '13px',
    color: '#E74C3C',
    fontWeight: 500,
  },
};

export default ImageUploader;
