import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Cropper, { Area } from 'react-easy-crop';
import { v4 as uuidv4 } from 'uuid';
import { savePhoto } from './storageService';
import { usePhotoStore } from '../../store';
import type { Photo, CropAspect } from '../../types';

type Step = 'select' | 'crop' | 'complete';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const addPhoto = usePhotoStore((s) => s.addPhoto);

  const [step, setStep] = useState<Step>('select');
  const [isDragging, setIsDragging] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [title, setTitle] = useState('');
  const [aspect, setAspect] = useState<CropAspect>(16 / 9);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploadedPhoto, setUploadedPhoto] = useState<Photo | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    setFileName(file.name);
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    setTitle(nameWithoutExt);

    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
      setStep('crop');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const getCroppedImg = useCallback((imageSrc: string, pixelCrop: Area): Promise<{ fullUrl: string; thumbnailUrl: string; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.src = imageSrc;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法获取画布上下文'));
          return;
        }

        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;

        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        );

        const fullUrl = canvas.toDataURL('image/jpeg', 0.9);

        const thumbCanvas = document.createElement('canvas');
        const thumbCtx = thumbCanvas.getContext('2d');
        if (!thumbCtx) {
          reject(new Error('无法获取缩略图画布上下文'));
          return;
        }

        const thumbWidth = 400;
        const thumbHeight = Math.round((thumbWidth / pixelCrop.width) * pixelCrop.height);
        thumbCanvas.width = thumbWidth;
        thumbCanvas.height = thumbHeight;
        thumbCtx.drawImage(canvas, 0, 0, thumbWidth, thumbHeight);
        const thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.8);

        resolve({
          fullUrl,
          thumbnailUrl,
          width: pixelCrop.width,
          height: pixelCrop.height
        });
      };
      image.onerror = reject;
    });
  }, []);

  const handleConfirmCrop = async () => {
    if (!originalImage || !croppedAreaPixels) return;

    try {
      const { fullUrl, thumbnailUrl, width, height } = await getCroppedImg(originalImage, croppedAreaPixels);

      const now = Date.now();
      const date = new Date(now);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      const photo: Photo = {
        id: uuidv4(),
        title: title || fileName || '未命名照片',
        date: dateStr,
        thumbnailUrl,
        fullUrl,
        width,
        height,
        createdAt: now
      };

      await savePhoto(photo);
      addPhoto(photo);
      setUploadedPhoto(photo);
      setStep('complete');
    } catch (err) {
      console.error('裁剪图片失败:', err);
      alert('处理图片时出错，请重试');
    }
  };

  const handleCopyLink = async () => {
    if (!uploadedPhoto) return;
    const link = `${window.location.origin}/#/photo/${uploadedPhoto.id}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('复制失败，请手动复制：' + link);
    }
  };

  const handleBack = () => {
    setStep('select');
    setOriginalImage(null);
    setFileName('');
    setTitle('');
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1A1A2E' }}>
      <header style={{
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
          <span style={{ color: '#6C63FF' }}>Photo</span>Vault
        </h1>
        <Link
          to="/"
          style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '14px',
            fontWeight: 500,
            padding: '8px 16px',
            borderRadius: '6px',
            transition: 'background-color 0.2s ease-out'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          ← 返回图库
        </Link>
      </header>

      <main style={{ padding: '32px 24px', maxWidth: '960px', margin: '0 auto' }}>
        {step === 'select' && (
          <>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
              上传照片
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '32px' }}>
              选择一张图片上传，支持 JPG、PNG、GIF 等格式
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              style={{
                border: isDragging ? '2px solid #6C63FF' : '2px dashed #4A4A6E',
                borderRadius: '12px',
                backgroundColor: isDragging ? '#2D2D4E' : '#1E1E2E',
                padding: '64px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease-out',
                marginBottom: '24px'
              }}
            >
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>📤</div>
              <p style={{ fontSize: '16px', fontWeight: 500, color: '#ffffff', marginBottom: '8px' }}>
                {isDragging ? '释放文件以上传' : '点击或拖拽图片到此处'}
              </p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                支持 JPG、PNG、GIF、WebP 格式
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                style={{ display: 'none' }}
              />
            </div>
          </>
        )}

        {step === 'crop' && originalImage && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>
                  裁剪照片
                </h2>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                  调整裁剪区域和缩放比例
                </p>
              </div>
              <button
                onClick={handleBack}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease-out'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
              >
                返回
              </button>
            </div>

            <div style={{
              position: 'relative',
              height: '480px',
              backgroundColor: '#1E1E2E',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '24px'
            }}>
              <Cropper
                image={originalImage}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.8)', marginBottom: '12px' }}>
                裁剪比例
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {([
                  { label: '1:1', value: 1 / 1 },
                  { label: '4:3', value: 4 / 3 },
                  { label: '16:9', value: 16 / 9 }
                ] as const).map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => setAspect(opt.value)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: aspect === opt.value ? '2px solid #6C63FF' : '2px solid transparent',
                      backgroundColor: aspect === opt.value ? 'rgba(108,99,255,0.2)' : '#2D2D3F',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-out'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}>
                缩放: {Math.round(zoom * 100)}%
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: '#6C63FF'
                }}
              />
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.8)', marginBottom: '8px' }}>
                照片标题
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入照片标题"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: '#2D2D3F',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease-out'
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#6C63FF'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
              />
            </div>

            <button
              onClick={handleConfirmCrop}
              style={{
                width: '100%',
                padding: '14px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#6C63FF',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s ease-out'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#5A52E0'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#6C63FF'; }}
            >
              确认并上传
            </button>
          </>
        )}

        {step === 'complete' && uploadedPhoto && (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: 'rgba(34,197,94,0.2)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              marginBottom: '24px'
            }}>
              ✓
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
              上传成功！
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '32px' }}>
              照片已保存到您的相册
            </p>

            <img
              src={uploadedPhoto.thumbnailUrl}
              alt={uploadedPhoto.title}
              style={{
                maxWidth: '100%',
                maxHeight: '320px',
                borderRadius: '12px',
                marginBottom: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
              }}
            />

            <div style={{
              backgroundColor: '#2D2D3F',
              borderRadius: '10px',
              padding: '20px',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <p style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                分享链接
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <code style={{
                  flex: 1,
                  padding: '10px 14px',
                  backgroundColor: '#1E1E2E',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#6C63FF',
                  wordBreak: 'break-all',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {`${window.location.origin}/#/photo/${uploadedPhoto.id}`}
                </code>
                <button
                  onClick={handleCopyLink}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: copied ? 'rgba(34,197,94,0.8)' : '#6C63FF',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease-out',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {copied ? '已复制！' : '复制链接'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => navigate('/')}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease-out'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
              >
                返回图库
              </button>
              <button
                onClick={handleBack}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#6C63FF',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease-out'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#5A52E0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#6C63FF'; }}
              >
                再上传一张
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UploadPage;
