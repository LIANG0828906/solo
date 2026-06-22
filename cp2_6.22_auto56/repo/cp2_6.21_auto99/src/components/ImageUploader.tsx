import React, { useRef, useCallback, useState } from 'react';
import axios from 'axios';
import { useStore } from '../store';

const ImageUploader: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  const setImage = useStore((s) => s.setImage);
  const setIsExtracting = useStore((s) => s.setIsExtracting);
  const setIsAnalyzing = useStore((s) => s.setIsAnalyzing);
  const setPrimaryColors = useStore((s) => s.setPrimaryColors);
  const setSecondaryColors = useStore((s) => s.setSecondaryColors);
  const setHarmonyResult = useStore((s) => s.setHarmonyResult);
  const isExtracting = useStore((s) => s.isExtracting);
  const isAnalyzing = useStore((s) => s.isAnalyzing);

  const processImage = useCallback(
    (file: File) => {
      if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataURL = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current!;
          const ctx = canvas.getContext('2d')!;

          let w = img.width;
          let h = img.height;
          const max = 500;
          if (w > max || h > max) {
            const ratio = Math.min(max / w, max / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }
          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(img, 0, 0, w, h);
          const base64 = canvas.toDataURL('image/png');

          setThumbnail(base64);
          setImage(base64);
          setIsExtracting(true);

          axios
            .post('/api/extract-colors', { image_base64: base64 })
            .then((res) => {
              const primary = res.data.primary_colors;
              const secondary = res.data.secondary_colors;
              setPrimaryColors(primary);
              setSecondaryColors(secondary);

              setIsAnalyzing(true);
              return axios.post('/api/analyze-harmony', {
                primary_colors: primary.map((c: any) => c.rgb),
                secondary_colors: secondary.map((c: any) => c.rgb),
              });
            })
            .then((res) => {
              setHarmonyResult(res.data);
              setIsExtracting(false);
              setIsAnalyzing(false);
            })
            .catch(() => {
              setIsExtracting(false);
              setIsAnalyzing(false);
            });
        };
        img.src = dataURL;
      };
      reader.readAsDataURL(file);
    },
    [setImage, setIsExtracting, setIsAnalyzing, setPrimaryColors, setSecondaryColors, setHarmonyResult]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processImage(file);
    },
    [processImage]
  );

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processImage(file);
    },
    [processImage]
  );

  const isLoading = isExtracting || isAnalyzing;

  return (
    <div className="card" style={{ position: 'relative' }}>
      <h3>图片上传</h3>
      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(44,44,44,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          zIndex: 10,
        }}>
          <div style={{ textAlign: 'center', color: '#f0f0f0' }}>
            <div className="loader" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: 13 }}>{isExtracting ? '正在提取色彩...' : '正在分析和谐度...'}</div>
          </div>
        </div>
      )}

      {thumbnail ? (
        <div style={{ textAlign: 'center', position: 'relative' }}>
          <img
            src={thumbnail}
            alt="preview"
            style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, display: 'block', margin: '0 auto' }}
          />
          <div
            onClick={handleClick}
            style={{
              marginTop: 8,
              fontSize: 12,
              color: '#4a90d9',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            重新上传
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            minHeight: 200,
            border: `2px dashed ${isDragOver ? '#4a90d9' : '#555'}`,
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 36 }}>📁</span>
          <span style={{ color: '#888', fontSize: 14 }}>拖拽或点击上传图片</span>
          <span style={{ color: '#555', fontSize: 12 }}>支持 PNG / JPG 格式</span>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
