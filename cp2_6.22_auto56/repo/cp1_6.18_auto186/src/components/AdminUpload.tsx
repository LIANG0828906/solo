import { useRef, useState, useEffect } from 'react';
import { useStore } from '../stores/useStore';
import { Upload, Trash2, Image, Loader, AlertCircle, CheckCircle } from 'lucide-react';

const categories = [
  { key: 'portrait', label: '人像' },
  { key: 'landscape', label: '风光' },
  { key: 'still_life', label: '静物' }
];

const categoryLabel: Record<string, string> = {
  portrait: '人像',
  landscape: '风光',
  still_life: '静物'
};

export default function AdminUpload() {
  const { photos, fetchPhotos, uploadPhotos, deletePhoto } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [category, setCategory] = useState('portrait');
  const [title, setTitle] = useState('未命名作品');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPhotos('all');
  }, [fetchPhotos]);

  useEffect(() => {
    return () => previewUrls.forEach(url => URL.revokeObjectURL(url));
  }, [previewUrls]);

  const addFiles = (files: File[]) => {
    const valid: File[] = [];
    let err = '';

    for (const f of files) {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
        err = `${f.name} 格式不支持，仅接受 JPG/PNG`;
        continue;
      }
      if (f.size > 10 * 1024 * 1024) {
        err = `${f.name} 超过10MB限制`;
        continue;
      }
      valid.push(f);
    }

    if (err) setError(err);
    setSelectedFiles(prev => [...prev, ...valid]);

    const newUrls = valid.map(f => URL.createObjectURL(f));
    setPreviewUrls(prev => [...prev, ...newUrls]);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
  };

  const removeFile = (idx: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('请先选择要上传的照片');
      return;
    }
    setError('');
    setSuccess('');
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('category', category);
    formData.append('title', title);
    selectedFiles.forEach(f => formData.append('photos', f));

    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + 5, 90));
    }, 100);

    const result = await uploadPhotos(formData);

    clearInterval(progressInterval);
    setProgress(100);

    setTimeout(() => {
      setUploading(false);
      setProgress(0);
      if (result.success) {
        setSuccess(`成功上传 ${selectedFiles.length} 张照片`);
        setSelectedFiles([]);
        setPreviewUrls(prev => {
          prev.forEach(url => URL.revokeObjectURL(url));
          return [];
        });
      } else {
        setError(result.error || '上传失败');
      }
    }, 500);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这张照片吗？')) return;
    await deletePhoto(id);
  };

  return (
    <div className="upload-page page">
      <div className="container">
        <h1 className="page-title">作品管理</h1>
        <p className="page-subtitle">上传、管理您的摄影作品</p>

        <div className="upload-section glass-card">
          <h2 className="section-title">批量上传照片</h2>

          <div className="form-grid-sm">
            <div>
              <label className="label">作品分类</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="input-field">
                {categories.map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">作品名称</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="input-field"
                placeholder="输入作品名称"
              />
            </div>
          </div>

          <div
            className="drop-zone"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); }}
            onDrop={e => {
              e.preventDefault();
              const dt = e.dataTransfer;
              const files = Array.from(dt.files);
              addFiles(files);
            }}
          >
            <Upload size={40} color="#D4AF37" />
            <p className="drop-title">点击或拖拽照片到此处上传</p>
            <p className="drop-hint">支持 JPG / PNG 格式，单张最大 10MB，最多 20 张</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          {previewUrls.length > 0 && (
            <div className="preview-grid">
              {previewUrls.map((url, idx) => (
                <div key={idx} className="preview-item">
                  <img src={url} alt="" />
                  <button className="remove-btn" onClick={() => removeFile(idx)} aria-label="移除">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploading && (
            <div className="progress-wrap">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="progress-text">{progress}%</span>
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="alert alert-success">
              <CheckCircle size={18} />
              <span>{success}</span>
            </div>
          )}

          <button
            className="btn btn-primary upload-btn"
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
          >
            {uploading ? <Loader size={18} className="spin-inline" /> : <Upload size={18} />}
            {uploading ? '上传中...' : `上传 ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`}
          </button>
        </div>

        <div className="list-section">
          <h2 className="section-title">已有作品 ({photos.length})</h2>
          {photos.length === 0 ? (
            <div className="empty-state">
              <Image size={48} color="#ccc" />
              <p>暂无作品，开始上传您的第一张照片吧</p>
            </div>
          ) : (
            <div className="photo-list">
              {photos.map(photo => (
                <div key={photo.id} className="photo-item glass-card">
                  <img src={photo.thumbnailUrl} alt={photo.title} loading="lazy" />
                  <div className="photo-meta">
                    <span className="photo-cat-tag">{categoryLabel[photo.category]}</span>
                    <h4 className="photo-name">{photo.title}</h4>
                  </div>
                  <button className="delete-btn" onClick={() => handleDelete(photo.id)} aria-label="删除">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .upload-section {
          padding: 32px;
          margin-bottom: 40px;
        }
        .section-title {
          font-size: 22px;
          margin-bottom: 20px;
          color: var(--color-primary);
        }
        .form-grid-sm {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 16px;
          margin-bottom: 20px;
        }
        .drop-zone {
          border: 2px dashed var(--color-border-input);
          border-radius: var(--radius-md);
          padding: 48px 24px;
          text-align: center;
          cursor: pointer;
          transition: all var(--transition);
          background: rgba(255, 255, 255, 0.3);
        }
        .drop-zone:hover {
          border-color: var(--color-accent);
          background: rgba(212, 175, 55, 0.05);
        }
        .drop-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-primary);
          margin: 12px 0 4px;
        }
        .drop-hint {
          font-size: 13px;
          color: #999;
        }
        .preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 12px;
          margin: 20px 0;
        }
        .preview-item {
          position: relative;
          border-radius: var(--radius-sm);
          overflow: hidden;
          aspect-ratio: 1;
        }
        .preview-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .remove-btn {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(231, 76, 60, 0.9);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform var(--transition);
        }
        .remove-btn:hover { transform: scale(1.1); }
        .progress-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0;
        }
        .progress-bar {
          flex: 1;
          height: 8px;
          background: #eee;
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: var(--color-accent);
          border-radius: 4px;
          transition: width 0.2s ease;
        }
        .progress-text {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-accent);
          min-width: 45px;
        }
        .upload-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 32px;
          font-size: 15px;
        }
        .spin-inline {
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .alert {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          margin-bottom: 16px;
          font-size: 14px;
        }
        .alert-error {
          background: rgba(231, 76, 60, 0.1);
          color: #e74c3c;
          border: 1px solid rgba(231, 76, 60, 0.2);
        }
        .alert-success {
          background: rgba(39, 174, 96, 0.1);
          color: #27ae60;
          border: 1px solid rgba(39, 174, 96, 0.2);
        }
        .list-section { margin-top: 32px; }
        .empty-state {
          text-align: center;
          padding: 60px 24px;
          color: #999;
        }
        .empty-state p { margin-top: 12px; }
        .photo-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }
        .photo-item {
          position: relative;
          overflow: hidden;
          padding: 0;
        }
        .photo-item img {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
        }
        .photo-meta {
          padding: 12px;
        }
        .photo-cat-tag {
          display: inline-block;
          padding: 2px 8px;
          background: var(--color-accent);
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          border-radius: 20px;
          margin-bottom: 6px;
        }
        .photo-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-primary);
        }
        .delete-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.95);
          color: #e74c3c;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-sm);
          transition: all var(--transition);
        }
        .delete-btn:hover {
          background: #e74c3c;
          color: #fff;
          transform: scale(1.05);
        }
        .form-grid-sm { @media (max-width: 600px) { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
