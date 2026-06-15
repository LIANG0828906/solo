import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useGalleryStore } from '../../store';

const ArtistUpload: React.FC = () => {
  const [formData, setFormData] = useState({
    title: '',
    artistName: '',
    year: new Date().getFullYear(),
    price: '',
    width: '',
    height: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addArtwork = useGalleryStore((state) => state.addArtwork);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (file: File) => {
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      if (file.size > 10 * 1024 * 1024) {
        alert('图片大小不能超过10MB');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      alert('请选择 JPEG 或 PNG 格式的图片');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('请选择要上传的画作');
      return;
    }
    if (!formData.title || !formData.artistName || !formData.price || !formData.width || !formData.height) {
      alert('请填写完整信息');
      return;
    }

    setUploading(true);
    setProgress(0);

    const data = new FormData();
    data.append('image', selectedFile);
    data.append('title', formData.title);
    data.append('artistName', formData.artistName);
    data.append('year', formData.year.toString());
    data.append('price', formData.price);
    data.append('width', formData.width);
    data.append('height', formData.height);

    try {
      const response = await axios.post('/api/artworks/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setProgress(percentCompleted);
        },
      });
      addArtwork(response.data);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      setFormData({
        title: '',
        artistName: '',
        year: new Date().getFullYear(),
        price: '',
        width: '',
        height: '',
      });
      setSelectedFile(null);
      setPreviewUrl('');
    } catch (error: any) {
      alert('上传失败：' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="page-container">
      {showSuccess && (
        <div className="success-toast" style={{ animation: 'successFadeInOut 2s ease forwards' }}>
          <span className="success-icon" style={{ animation: 'checkmarkPop 0.5s ease forwards' }}>✓</span>
          <span>上传成功，等待审核</span>
        </div>
      )}

      <div className="upload-container">
        <h1 className="page-title">艺术家上传画作</h1>

        <form onSubmit={handleSubmit}>
          <div
            className={`upload-area ${isDragging ? 'dragover' : ''}`}
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="预览"
                style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px' }}
              />
            ) : (
              <>
                <div className="upload-icon">🖼️</div>
                <div className="upload-text">点击或拖拽上传画作</div>
                <div className="upload-hint">支持 JPEG / PNG，最大 10MB</div>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
            />
          </div>

          {uploading && (
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${progress}%`,
                  background: '#3498db',
                  transition: 'width 0.3s linear'
                }}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">画作标题</label>
            <input
              type="text"
              name="title"
              className="form-input"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="请输入画作标题"
              disabled={uploading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">艺术家姓名</label>
            <input
              type="text"
              name="artistName"
              className="form-input"
              value={formData.artistName}
              onChange={handleInputChange}
              placeholder="请输入艺术家姓名"
              disabled={uploading}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">创作年份</label>
              <input
                type="number"
                name="year"
                className="form-input"
                value={formData.year}
                onChange={handleInputChange}
                min="1900"
                max="2100"
                disabled={uploading}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">售价 (元)</label>
              <input
                type="number"
                name="price"
                className="form-input"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                disabled={uploading}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">宽度 (cm)</label>
              <input
                type="number"
                name="width"
                className="form-input"
                value={formData.width}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                disabled={uploading}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">高度 (cm)</label>
              <input
                type="number"
                name="height"
                className="form-input"
                value={formData.height}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                disabled={uploading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={uploading}
          >
            {uploading ? '上传中...' : '提交上传'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ArtistUpload;
