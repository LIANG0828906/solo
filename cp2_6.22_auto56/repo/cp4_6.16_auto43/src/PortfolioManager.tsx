import { useState, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from './store';
import type { Portfolio, Photo } from './types';
import { generateThumbnail, fileToDataURL, validateImage, formatFileSize } from './utils';

function SortablePhoto({
  photo,
  isCover,
  onDelete,
  onSetCover,
}: {
  photo: Photo;
  isCover: boolean;
  onDelete: () => void;
  onSetCover: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 1,
    transformOrigin: 'center center',
  };

  return (
    <div
      ref={setNodeRef}
      className="photo-item-hover"
      style={{ ...styles.photoItem, ...style, ...(isCover ? styles.photoCover : {}) }}
      {...attributes}
      {...listeners}
    >
      <img src={photo.thumbnail} alt={photo.name} style={styles.photoImg} draggable={false} />
      {isCover && <div style={styles.coverBadge}>封面</div>}
      <div className="photo-overlay" style={styles.photoOverlay}>
        <div style={styles.photoActions}>
          {!isCover && (
            <button style={styles.photoActionBtn} onClick={(e) => { e.stopPropagation(); onSetCover(); }} title="设为封面">
              ⭐
            </button>
          )}
          <button style={{ ...styles.photoActionBtn, background: 'rgba(255,107,107,0.85)' }}
            onClick={(e) => { e.stopPropagation(); onDelete(); }} title="删除">
            ✕
          </button>
        </div>
        <div style={styles.photoInfo}>
          <span style={styles.photoName}>{photo.name}</span>
          <span style={styles.photoSize}>{formatFileSize(photo.size)}</span>
        </div>
      </div>
    </div>
  );
}

function PortfolioCard({
  portfolio,
  index,
  onOpen,
}: {
  portfolio: Portfolio;
  index: number;
  onOpen: () => void;
}) {
  const coverPhoto = portfolio.photos.find((p) => p.id === portfolio.coverPhotoId);

  return (
    <div
      onClick={onOpen}
      className="portfolio-card-hover"
      style={{
        ...styles.portfolioCard,
        animation: `cardFadeIn 0.5s ease ${index * 0.08}s both`,
      }}
    >
      <div style={styles.cardCover}>
        {coverPhoto ? (
          <img src={coverPhoto.url} alt={portfolio.name} style={styles.coverImg} />
        ) : (
          <div style={styles.coverPlaceholder}>
            <span style={styles.placeholderIcon}>🖼️</span>
            <span style={styles.placeholderText}>暂无作品</span>
          </div>
        )}
        <div style={styles.cardPhotoCount}>
          📷 {portfolio.photos.length} 张
        </div>
      </div>
      <div style={styles.cardBody}>
        <h3 style={styles.cardTitle}>{portfolio.name}</h3>
        <p style={styles.cardDesc}>{portfolio.description}</p>
        {portfolio.tags.length > 0 && (
          <div style={styles.tagList}>
            {portfolio.tags.map((tag) => (
              <span key={tag} style={styles.tag}>{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PortfolioManager() {
  const portfolios = useStore((s) => s.portfolios);
  const addPortfolio = useStore((s) => s.addPortfolio);
  const deletePortfolio = useStore((s) => s.deletePortfolio);
  const addPhoto = useStore((s) => s.addPhoto);
  const deletePhoto = useStore((s) => s.deletePhoto);
  const reorderPhotos = useStore((s) => s.reorderPhotos);
  const setCoverPhoto = useStore((s) => s.setCoverPhoto);

  const [showCreate, setShowCreate] = useState(false);
  const [activePortfolioId, setActivePortfolioId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTags, setNewTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activePortfolio = portfolios.find((p) => p.id === activePortfolioId) || null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleCreate = () => {
    if (!newName.trim()) {
      showToast('请输入作品集名称');
      return;
    }
    const tags = newTags.split(/[,，\s]+/).map((t) => t.trim()).filter(Boolean);
    void addPortfolio(newName.trim(), newDesc.trim(), tags);
    setNewName('');
    setNewDesc('');
    setNewTags('');
    setShowCreate(false);
    showToast('作品集创建成功');
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || !activePortfolioId) return;
    setUploading(true);
    let count = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateImage(file);
      if (!validation.valid) {
        showToast(`${file.name}: ${validation.error}`);
        continue;
      }
      try {
        const startTime = performance.now();
        const [url, thumbnail] = await Promise.all([
          fileToDataURL(file),
          generateThumbnail(file, 200),
        ]);
        console.log(`缩略图生成耗时: ${(performance.now() - startTime).toFixed(0)}ms`);
        void addPhoto(activePortfolioId, { url, thumbnail, name: file.name, size: file.size });
        count++;
      } catch {
        showToast(`${file.name} 上传失败`);
      }
    }

    setUploading(false);
    if (count > 0) showToast(`成功上传 ${count} 张照片`);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id || !activePortfolio) return;
    const ids = activePortfolio.photos.map((p) => p.id);
    const oldIdx = ids.indexOf(String(active.id));
    const newIdx = ids.indexOf(String(over.id));
    const newIds = arrayMove(ids, oldIdx, newIdx);
    void reorderPhotos(activePortfolio.id, newIds);
  };

  const handleDeletePortfolio = () => {
    if (!activePortfolioId) return;
    if (confirm('确定删除该作品集吗？所有照片将一并删除。')) {
      void deletePortfolio(activePortfolioId);
      setActivePortfolioId(null);
      showToast('作品集已删除');
    }
  };

  const sortedPhotos = activePortfolio
    ? [...activePortfolio.photos].sort((a, b) => a.order - b.order)
    : [];

  if (activePortfolio) {
    return (
      <div style={styles.container}>
        {toast && <div style={styles.toast}>{toast}</div>}

        <div style={styles.header}>
          <div>
            <button style={styles.backBtn} onClick={() => setActivePortfolioId(null)}>
              ← 返回列表
            </button>
            <h1 style={styles.title}>{activePortfolio.name}</h1>
            <p style={styles.subtitle}>{activePortfolio.description}</p>
          </div>
          <div style={styles.headerActions}>
            <button
              style={styles.primaryBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? '⏳ 上传中...' : '📤 上传照片'}
            </button>
            <button style={styles.dangerBtn} onClick={handleDeletePortfolio}>
              🗑️ 删除作品集
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => handleUpload(e.target.files)}
        />

        <div style={styles.dropzoneHint}>
          💡 支持拖拽排序 · 每张图片不超过 8MB · 上传后自动生成 200x200 缩略图
        </div>

        {sortedPhotos.length === 0 ? (
          <div
            className="empty-upload-hover"
            style={styles.emptyUpload}
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={styles.emptyUploadIcon}>☁️</div>
            <p style={styles.emptyUploadText}>点击或拖拽上传照片</p>
            <p style={styles.emptyUploadSub}>支持 JPG / PNG · 每张 ≤ 8MB</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedPhotos.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="photo-grid" style={styles.photoGrid}>
                {sortedPhotos.map((photo) => (
                  <SortablePhoto
                    key={photo.id}
                    photo={photo}
                    isCover={photo.id === activePortfolio.coverPhotoId}
                    onDelete={() => {
                      void deletePhoto(activePortfolio.id, photo.id);
                      showToast('照片已删除');
                    }}
                    onSetCover={() => {
                      void setCoverPhoto(activePortfolio.id, photo.id);
                      showToast('已设为封面');
                    }}
                  />
                ))}
                <div
                  className="photo-upload-tile-hover"
                  style={styles.photoUploadTile}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span style={styles.uploadPlus}>+</span>
                  <span style={styles.uploadText}>添加照片</span>
                </div>
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {toast && <div style={styles.toast}>{toast}</div>}

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>作品集管理</h1>
          <p style={styles.subtitle}>共 {portfolios.length} 个作品集 · {portfolios.reduce((s, p) => s + p.photos.length, 0)} 张照片</p>
        </div>
        <button style={styles.primaryBtn} onClick={() => setShowCreate(true)}>
          + 新建作品集
        </button>
      </div>

      {showCreate && (
        <div style={styles.modalOverlay} onClick={() => setShowCreate(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>新建作品集</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>作品集名称 *</label>
              <input
                style={styles.input}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="如：婚纱摄影"
                maxLength={50}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>简介</label>
              <textarea
                style={styles.textarea}
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="描述这个作品集的定位和特点..."
                maxLength={200}
                rows={3}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>标签（逗号分隔）</label>
              <input
                style={styles.input}
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="复古风, 极简, 自然光"
              />
            </div>
            <div style={styles.modalActions}>
              <button style={styles.secondaryBtn} onClick={() => setShowCreate(false)}>
                取消
              </button>
              <button style={styles.primaryBtn} onClick={handleCreate}>
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="portfolio-grid" style={styles.portfolioGrid}>
        {portfolios.map((p, idx) => (
          <PortfolioCard
            key={p.id}
            portfolio={p}
            index={idx}
            onOpen={() => setActivePortfolioId(p.id)}
          />
        ))}
        <div
          className="add-card-hover"
          style={styles.addCard}
          onClick={() => setShowCreate(true)}
        >
          <div style={styles.addIcon}>+</div>
          <p style={styles.addText}>新建作品集</p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    position: 'relative',
  },
  toast: {
    position: 'fixed',
    top: 80,
    right: 28,
    zIndex: 9999,
    background: 'linear-gradient(135deg, #252547, #16213e)',
    color: '#eee',
    padding: '12px 20px',
    borderRadius: 12,
    border: '1px solid #4facfe',
    boxShadow: '0 8px 32px rgba(79, 172, 254, 0.25)',
    fontSize: 14,
    fontWeight: 500,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#eee',
    marginBottom: 6,
    marginTop: 8,
  },
  subtitle: {
    color: '#a0a0b8',
    fontSize: 14,
  },
  backBtn: {
    background: 'transparent',
    color: '#4facfe',
    padding: 0,
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 4,
  },
  headerActions: {
    display: 'flex',
    gap: 12,
  },
  primaryBtn: {
    background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    boxShadow: '0 4px 16px rgba(79, 172, 254, 0.3)',
  },
  secondaryBtn: {
    background: '#252547',
    color: '#eee',
    padding: '12px 24px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 500,
    border: '1px solid #3a3a5c',
  },
  dangerBtn: {
    background: 'rgba(255, 107, 107, 0.15)',
    color: '#ff6b6b',
    padding: '12px 24px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 500,
    border: '1px solid rgba(255, 107, 107, 0.3)',
  },
  dropzoneHint: {
    background: 'rgba(79, 172, 254, 0.08)',
    border: '1px dashed rgba(79, 172, 254, 0.3)',
    borderRadius: 12,
    padding: '10px 16px',
    color: '#7ab8ff',
    fontSize: 13,
  },
  portfolioGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 20,
  },
  portfolioCard: {
    background: '#252547',
    borderRadius: 18,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid #3a3a5c',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    position: 'relative',
    top: 0,
  },
  cardCover: {
    position: 'relative',
    aspectRatio: '4 / 3',
    background: '#16213e',
    overflow: 'hidden',
  },
  coverImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.5s ease',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    color: '#5a5a80',
  },
  placeholderIcon: { fontSize: 48 },
  placeholderText: { fontSize: 13 },
  cardPhotoCount: {
    position: 'absolute',
    top: 12,
    right: 12,
    background: 'rgba(22, 33, 62, 0.85)',
    backdropFilter: 'blur(8px)',
    color: '#eee',
    fontSize: 12,
    padding: '5px 10px',
    borderRadius: 8,
    fontWeight: 500,
  },
  cardBody: {
    padding: 18,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 600,
    color: '#eee',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 13,
    color: '#a0a0b8',
    lineHeight: 1.6,
    marginBottom: 12,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  tagList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    background: 'rgba(79, 172, 254, 0.12)',
    color: '#4facfe',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 11,
    fontWeight: 500,
  },
  addCard: {
    background: 'transparent',
    border: '2px dashed #3a3a5c',
    borderRadius: 18,
    minHeight: 280,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    color: '#5a5a80',
  },
  addIcon: { fontSize: 40, fontWeight: 300 },
  addText: { fontSize: 14, fontWeight: 500 },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 14,
  },
  photoItem: {
    position: 'relative',
    aspectRatio: '1',
    borderRadius: 12,
    overflow: 'hidden',
    cursor: 'grab',
    border: '2px solid transparent',
    userSelect: 'none',
    touchAction: 'none',
    transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
  },
  photoCover: {
    borderColor: '#4facfe',
    boxShadow: '0 0 0 3px rgba(79, 172, 254, 0.15)',
  },
  photoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    pointerEvents: 'none',
  },
  coverBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
    color: '#fff',
    fontSize: 11,
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: 6,
  },
  photoOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: 10,
    opacity: 0,
    transition: 'opacity 0.25s ease',
  },
  photoActions: {
    display: 'flex',
    gap: 6,
    justifyContent: 'flex-end',
  },
  photoActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: 'rgba(79, 172, 254, 0.9)',
    color: '#fff',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  photoName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  photoSize: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
  },
  photoUploadTile: {
    aspectRatio: '1',
    borderRadius: 12,
    border: '2px dashed #3a3a5c',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    color: '#5a5a80',
    minHeight: 180,
  },
  uploadPlus: { fontSize: 36, fontWeight: 300 },
  uploadText: { fontSize: 13 },
  emptyUpload: {
    background: 'linear-gradient(135deg, #252547, #16213e)',
    border: '2px dashed rgba(79, 172, 254, 0.4)',
    borderRadius: 20,
    padding: '60px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    cursor: 'pointer',
    transition: 'all 0.25s ease',
  },
  emptyUploadIcon: { fontSize: 64 },
  emptyUploadText: {
    fontSize: 18,
    fontWeight: 600,
    color: '#eee',
  },
  emptyUploadSub: {
    fontSize: 13,
    color: '#7a7a95',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.65)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
    animation: 'fadeIn 0.2s ease',
  },
  modal: {
    background: '#252547',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 480,
    border: '1px solid #3a3a5c',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    animation: 'cardFadeIn 0.3s ease',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#eee',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: '#a0a0b8',
  },
  input: {
    background: '#16213e',
    border: '1px solid #3a3a5c',
    borderRadius: 10,
    padding: '11px 14px',
    color: '#eee',
    fontSize: 14,
    transition: 'border-color 0.2s ease',
  },
  textarea: {
    background: '#16213e',
    border: '1px solid #3a3a5c',
    borderRadius: 10,
    padding: '11px 14px',
    color: '#eee',
    fontSize: 14,
    resize: 'none',
    transition: 'border-color 0.2s ease',
  },
  modalActions: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 24,
  },
};
