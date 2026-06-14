import React, { useCallback, useRef, useState } from 'react';
import { Upload, Leaf, X, Loader2 } from 'lucide-react';
import { useAppStore } from '@/shared/store';
import { DiagnosisStatus } from '@/shared/types';

const statusBorders: Record<DiagnosisStatus | 'loading' | 'idle', string> = {
  healthy: '4px solid #4CAF50',
  diseased: '4px solid #E53935',
  nutrient_deficiency: '4px solid #FBC02D',
  loading: '4px solid transparent',
  idle: '4px solid transparent',
};

const statusGlow: Record<DiagnosisStatus | 'loading' | 'idle', string> = {
  healthy: '0 0 30px rgba(76, 175, 80, 0.5)',
  diseased: '0 0 30px rgba(229, 57, 53, 0.5)',
  nutrient_deficiency: '0 0 30px rgba(251, 192, 45, 0.5)',
  loading: '0 0 30px rgba(76, 175, 80, 0.3)',
  idle: 'none',
};

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function UploadZone() {
  const { state, dispatch, runDiagnosis } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        alert('请上传 jpg、png 或 webp 格式的图片');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        dispatch({ type: 'SET_CURRENT_IMAGE', payload: imageUrl });
        runDiagnosis(imageUrl);
      };
      reader.readAsDataURL(file);
    },
    [dispatch, runDiagnosis],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleClick = () => fileInputRef.current?.click();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClear = () => {
    dispatch({ type: 'CLEAR_CURRENT' });
  };

  const borderStatus: DiagnosisStatus | 'loading' | 'idle' = state.isDiagnosing
    ? 'loading'
    : state.currentRecord?.status ?? 'idle';

  return (
    <div className="upload-wrapper">
      {!state.currentImage ? (
        <div
          className={`upload-zone ${isDragging ? 'dragging' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <div className="upload-decoration">
            <Leaf className="leaf-icon leaf-1" size={28} />
            <Leaf className="leaf-icon leaf-2" size={20} />
            <Leaf className="leaf-icon leaf-3" size={24} />
          </div>
          <div className="upload-content">
            <div className="upload-icon-circle">
              <Upload size={36} />
            </div>
            <h2 className="upload-title">拖拽叶片图片到这里</h2>
            <p className="upload-subtitle">或点击选择文件</p>
            <p className="upload-formats">支持 JPG / PNG / WebP 格式</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div
          className="preview-container"
          style={{
            border: statusBorders[borderStatus],
            boxShadow: statusGlow[borderStatus],
          }}
        >
          <button className="clear-btn" onClick={handleClear} title="清除图片">
            <X size={18} />
          </button>
          <img src={state.currentImage} alt="预览" className="preview-image" />
          {state.isDiagnosing && (
            <div className="diagnosing-overlay">
              <Loader2 size={48} className="spinner" />
              <p className="diagnosing-text">正在诊断中...</p>
            </div>
          )}
          {borderStatus !== 'loading' && borderStatus !== 'idle' && (
            <div className={`status-badge status-${borderStatus}`}>
              {borderStatus === 'healthy' && '健康'}
              {borderStatus === 'diseased' && '病害'}
              {borderStatus === 'nutrient_deficiency' && '营养不足'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
