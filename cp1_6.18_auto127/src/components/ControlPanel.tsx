import { useState, useRef } from 'react';
import { useAppStore } from '@/stores/appStore';
import { processImage } from '@/engine/imageProcessor';
import './ControlPanel.css';

export function ControlPanel() {
  const {
    selectedSpecies,
    density,
    thickness,
    showLabels,
    setSelectedSpecies,
    setDensity,
    setThickness,
    setShowLabels,
    setPointCloudData,
    setIsLoading,
    setUploadedImage,
    resetModel,
  } = useAppStore();

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.type.match('image/png') && !file.type.match('image/jpeg')) {
      alert('只支持 PNG 和 JPG 格式的图片');
      return;
    }

    setIsLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      const points = await processImage(file);
      setPointCloudData(points);
    } catch (error) {
      console.error('图片处理失败:', error);
      alert('图片处理失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleSpeciesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSpecies(e.target.value);
    resetModel();
  };

  return (
    <div className="control-panel">
      <h2 className="panel-title">形态分析仪</h2>

      <div className="panel-section">
        <label className="section-label">模型选择</label>
        <select
          className="species-select"
          value={selectedSpecies}
          onChange={handleSpeciesChange}
        >
          <option value="bird">鸟类</option>
          <option value="fish">鱼类</option>
          <option value="mammal">哺乳类</option>
        </select>
      </div>

      <div className="panel-section">
        <div className="slider-row">
          <label className="section-label">点云密度</label>
          <span className="slider-value">{density}</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={density}
          onChange={(e) => setDensity(Number(e.target.value))}
          className="slider"
        />
      </div>

      <div className="panel-section">
        <div className="slider-row">
          <label className="section-label">骨骼粗细</label>
          <span className="slider-value">{thickness.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={thickness}
          onChange={(e) => setThickness(Number(e.target.value))}
          className="slider"
        />
      </div>

      <div className="panel-section">
        <div className="toggle-row">
          <label className="section-label">显示骨骼名称</label>
          <button
            className={`toggle-switch ${showLabels ? 'active' : ''}`}
            onClick={() => setShowLabels(!showLabels)}
          >
            <span className="toggle-thumb"></span>
          </button>
        </div>
      </div>

      <div className="panel-section">
        <label className="section-label">图片上传生成</label>
        <div
          className={`upload-area ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
          <div className="upload-content">
            <svg
              className="upload-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="upload-text">拖入图片或点击上传</p>
            <p className="upload-hint">支持 PNG、JPG 格式</p>
          </div>
        </div>
      </div>
    </div>
  );
}
