import React, { useState, useRef } from 'react';
import './UploadModal.css';

interface UploadModalProps {
  onClose: () => void;
  onUpload: (file: File, note: string, mood: string) => Promise<void>;
  uploadProgress: number | null;
  showCheckmark: boolean;
}

const moodOptions = [
  { value: '', label: '选择心情' },
  { value: '😊 开心', label: '😊 开心' },
  { value: '🌱 期待', label: '🌱 期待' },
  { value: '💪 加油', label: '💪 加油' },
  { value: '🥰 喜爱', label: '🥰 喜爱' },
  { value: '☀️ 阳光', label: '☀️ 阳光' },
  { value: '🌿 平静', label: '🌿 平静' },
  { value: '🤗 满足', label: '🤗 满足' },
  { value: '✨ 惊喜', label: '✨ 惊喜' }
];

const UploadModal: React.FC<UploadModalProps> = ({ onClose, onUpload, uploadProgress, showCheckmark }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [mood, setMood] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

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
    if (!selectedFile) return;
    await onUpload(selectedFile, note, mood);
  };

  const isUploading = uploadProgress !== null;

  return (
    <div className="modal-overlay" onClick={!isUploading ? onClose : undefined}>
      <div 
        className="modal-content glass-card animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title handwriting">📷 添加记录</h3>
          {!isUploading && (
            <button className="modal-close" onClick={onClose} aria-label="关闭">
              ×
            </button>
          )}
        </div>

        {isUploading ? (
          <div className="upload-progress">
            {showCheckmark ? (
              <div className="checkmark-container">
                <svg className="checkmark-svg" viewBox="0 0 52 52">
                  <circle 
                    className="checkmark-circle" 
                    cx="26" cy="26" r="25" fill="none"
                  />
                  <path 
                    className="checkmark-check" 
                    fill="none" d="M14 27l7 7 16-16"
                  />
                </svg>
                <p className="success-text">上传成功！</p>
              </div>
            ) : (
              <div className="progress-content">
                <div className="progress-icon animate-pulse">📤</div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="progress-text">正在上传... {uploadProgress}%</p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div 
              className={`upload-area ${isDragging ? 'dragging' : ''} ${previewUrl ? 'has-preview' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="预览" className="preview-image" />
              ) : (
                <div className="upload-placeholder">
                  <div className="upload-icon">📸</div>
                  <p className="upload-text">点击或拖拽照片到这里</p>
                  <p className="upload-hint">支持 JPG、PNG 格式</p>
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

            <div className="form-group">
              <label className="form-label">心情标签</label>
              <select 
                className="form-select"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
              >
                {moodOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">备注</label>
              <textarea
                className="form-textarea"
                placeholder="记录今天的观察和心情..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </div>

            <button 
              type="submit" 
              className="pill-btn pill-btn-primary submit-btn"
              disabled={!selectedFile}
            >
              <span>✨</span>
              保存记录
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default UploadModal;
