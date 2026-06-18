import React, { useRef, useState } from 'react';
import { useExhibitionStore } from '@/store/useExhibitionStore';
import { WorkCard } from './WorkCard';
import { fileToDataUrl, getImageDimensions } from '@/utils/storage';

export const MaterialPanel: React.FC = () => {
  const { currentExhibitionId, getWorksByExhibition, addWorkMaterial, removeWorkMaterial } = useExhibitionStore();
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const works = currentExhibitionId ? getWorksByExhibition(currentExhibitionId) : [];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError('');
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        const dataUrl = await fileToDataUrl(file);
        const dims = await getImageDimensions(dataUrl);
        addWorkMaterial({
          title: file.name.replace(/\.[^/.]+$/, ''),
          author: '',
          size: `${dims.width}×${dims.height}`,
          medium: '',
          price: 0,
          imageUrl: dataUrl,
          originalWidth: dims.width,
          originalHeight: dims.height,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : '文件上传失败');
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUrlUpload = async () => {
    if (!urlInput.trim()) return;
    setError('');
    setUploading(true);
    try {
      const dims = await getImageDimensions(urlInput.trim());
      addWorkMaterial({
        title: 'URL作品',
        author: '',
        size: `${dims.width}×${dims.height}`,
        medium: '',
        price: 0,
        imageUrl: urlInput.trim(),
        originalWidth: dims.width,
        originalHeight: dims.height,
      });
      setUrlInput('');
      setShowUrlInput(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '图片URL加载失败');
    }
    setUploading(false);
  };

  return (
    <div
      className="scroll-container"
      style={{
        width: '100%',
        height: '100%',
        background: '#1E293B',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        borderRight: '1px solid #334155',
      }}
    >
      <div>
        <h3 className="section-title">素材上传</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn-gradient"
            style={{ flex: 1, padding: '10px 12px', fontSize: 13 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={!currentExhibitionId || uploading}
          >
            {uploading ? '上传中...' : '📁 本地上传'}
          </button>
          <button
            className="btn-secondary"
            style={{ padding: '10px 12px', fontSize: 13 }}
            onClick={() => setShowUrlInput(!showUrlInput)}
            disabled={!currentExhibitionId}
          >
            🔗 URL
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        {showUrlInput && (
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <input
              type="text"
              className="input-field"
              style={{ flex: 1, fontSize: 12, padding: '8px 10px' }}
              placeholder="粘贴图片URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlUpload()}
            />
            <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: 12 }} onClick={handleUrlUpload}>
              添加
            </button>
          </div>
        )}
        <div style={{ fontSize: 11, color: '#64748B', marginTop: 8 }}>
          支持JPG/PNG，单张最大5MB
        </div>
        {error && (
          <div style={{ fontSize: 12, color: '#F87171', marginTop: 8, padding: '8px 10px', background: 'rgba(239,68,68,0.1)', borderRadius: 6 }}>
            {error}
          </div>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <h3 className="section-title">
          作品素材 <span style={{ color: '#64748B', fontWeight: 400, fontSize: 12 }}>({works.length})</span>
        </h3>
        {works.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: '#64748B',
              fontSize: 13,
              border: '2px dashed #475569',
              borderRadius: 12,
              background: 'rgba(71, 85, 105, 0.1)',
            }}
          >
            {currentExhibitionId ? (
              <>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🖼️</div>
                暂无作品<br />
                <span style={{ fontSize: 11 }}>上传作品后拖拽至墙面</span>
              </>
            ) : (
              <>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🏛️</div>
                请先创建展览
              </>
            )}
          </div>
        ) : (
          <div
            className="scroll-container"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12,
              maxHeight: '100%',
              paddingRight: 4,
            }}
          >
            {works.map((work) => (
              <WorkCard key={work.id} work={work} onRemove={() => removeWorkMaterial(work.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
