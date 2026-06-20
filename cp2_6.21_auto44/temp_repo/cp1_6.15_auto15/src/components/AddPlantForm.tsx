import React, { useState, useRef } from 'react';
import { useAppContext } from '../App';
import { compressImage } from '../utils/storage';
import { getTodayString } from '../utils/dateUtils';
import type { HealthStatus } from '../types';
import './AddPlantForm.css';

const healthOptions: { value: HealthStatus; label: string; emoji: string }[] = [
  { value: 'healthy', label: '健康', emoji: '💚' },
  { value: 'normal', label: '一般', emoji: '💛' },
  { value: 'attention', label: '需要关注', emoji: '🧡' }
];

const AddPlantForm: React.FC = () => {
  const { navigate, addPlant, addPhoto } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    variety: '',
    plantDate: getTodayString(),
    healthStatus: 'healthy' as HealthStatus,
    isFavorite: false
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [initialNote, setInitialNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.variety.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      let coverPhoto = '';
      
      if (selectedFile) {
        coverPhoto = await compressImage(selectedFile);
      } else {
        const encoded = encodeURIComponent(`a ${formData.variety} plant, potted houseplant, natural light`);
        coverPhoto = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encoded}&image_size=square`;
      }
      
      await new Promise<string>((resolve) => {
        const tempId = crypto.randomUUID();
        addPlant({
          name: formData.name.trim(),
          variety: formData.variety.trim(),
          plantDate: new Date(formData.plantDate).toISOString(),
          coverPhoto,
          healthStatus: formData.healthStatus,
          isFavorite: formData.isFavorite
        });
        
        if (selectedFile && initialNote.trim()) {
          addPhoto({
            plantId: tempId,
            imageUrl: coverPhoto,
            date: new Date().toISOString(),
            note: initialNote.trim(),
            mood: '🌱 期待'
          });
        }
        
        resolve(tempId);
      });
      
      setTimeout(() => {
        navigate('home');
      }, 500);
      
    } catch (error) {
      console.error('创建失败:', error);
      alert('创建失败，请重试');
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.name.trim() && formData.variety.trim();

  return (
    <div className="page-container add-page">
      <header className="detail-header">
        <button 
          className="back-btn"
          onClick={() => navigate('home')}
        >
          ← 返回
        </button>
      </header>

      <div className="form-container glass-card animate-fade-in-up">
        <h1 className="form-title handwriting">🌱 添加新植物</h1>
        <p className="form-subtitle">记录一株新的植物伙伴</p>

        <form onSubmit={handleSubmit} className="plant-form">
          <div 
            className={`upload-area ${isDragging ? 'dragging' : ''} ${previewUrl ? 'has-preview' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <div className="preview-wrapper">
                <img src={previewUrl} alt="预览" className="preview-image" />
                <button 
                  type="button"
                  className="remove-preview"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">📷</div>
                <p className="upload-text">点击或拖拽上传初始照片</p>
                <p className="upload-hint">可选，不上传将使用默认图片</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">植物名称 *</label>
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="给它起个名字吧"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">品种 *</label>
              <input
                type="text"
                name="variety"
                className="form-input"
                placeholder="例如：绿萝、多肉"
                value={formData.variety}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">种植日期</label>
              <input
                type="date"
                name="plantDate"
                className="form-input"
                value={formData.plantDate}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">健康状态</label>
              <select
                name="healthStatus"
                className="form-select"
                value={formData.healthStatus}
                onChange={handleInputChange}
              >
                {healthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.emoji} {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">初始备注</label>
            <textarea
              className="form-textarea"
              placeholder="写下种植时的心情和期待..."
              value={initialNote}
              onChange={(e) => setInitialNote(e.target.value)}
              rows={2}
            />
          </div>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="isFavorite"
              checked={formData.isFavorite}
              onChange={handleInputChange}
            />
            <span className="checkbox-custom" />
            <span className="checkbox-text">设为收藏 ⭐</span>
          </label>

          <div className="form-actions">
            <button
              type="button"
              className="pill-btn pill-btn-secondary"
              onClick={() => navigate('home')}
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="pill-btn pill-btn-primary submit-btn"
              disabled={!isFormValid || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-pulse">⏳</span>
                  创建中...
                </>
              ) : (
                <>
                  <span>✨</span>
                  创建植物
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPlantForm;
