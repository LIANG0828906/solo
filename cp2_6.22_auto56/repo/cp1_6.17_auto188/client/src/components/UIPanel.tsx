import { useState, useEffect, useRef, useCallback } from 'react';
import { LayoutMode, Card, CreateCardPayload } from '../types';

interface UIPanelProps {
  cards: Card[];
  layoutMode: LayoutMode;
  isModalOpen: boolean;
  enlargedCard: Card | null;
  onLayoutChange: (mode: LayoutMode) => void;
  onCardCreate: (payload: CreateCardPayload) => void;
  onModalToggle: (open: boolean) => void;
  onCardDelete: (id: string) => void;
  onExitEnlarge: () => void;
}

const PHOTO_SLIDESHOW_INTERVAL = 3000;
const PHOTO_FADE_DURATION = 1000;
const TYPEWRITER_SPEED = 80;

export default function UIPanel({
  cards,
  layoutMode,
  isModalOpen,
  enlargedCard,
  onLayoutChange,
  onCardCreate,
  onModalToggle,
  onCardDelete,
  onExitEnlarge,
}: UIPanelProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1440);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formPhoto, setFormPhoto] = useState<string | undefined>(undefined);
  const [dragOver, setDragOver] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [typewriterText, setTypewriterText] = useState('');
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  const [slideshowFade, setSlideshowFade] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const slideshowRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1440);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      requestAnimationFrame(() => setModalVisible(true));
    } else {
      setModalVisible(false);
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (!enlargedCard) {
      setTypewriterText('');
      setSlideshowIndex(0);
      setSlideshowFade(true);
      return;
    }

    setTypewriterText('');
    let charIdx = 0;
    const text = enlargedCard.content;
    typewriterRef.current = setInterval(() => {
      charIdx++;
      setTypewriterText(text.slice(0, charIdx));
      if (charIdx >= text.length && typewriterRef.current) {
        clearInterval(typewriterRef.current);
        typewriterRef.current = null;
      }
    }, TYPEWRITER_SPEED);

    return () => {
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
        typewriterRef.current = null;
      }
    };
  }, [enlargedCard]);

  const photos = enlargedCard?.photoUrl ? [enlargedCard.photoUrl] : [];

  useEffect(() => {
    if (!enlargedCard || photos.length <= 1) {
      if (slideshowRef.current) {
        clearInterval(slideshowRef.current);
        slideshowRef.current = null;
      }
      return;
    }

    slideshowRef.current = setInterval(() => {
      setSlideshowFade(false);
      setTimeout(() => {
        setSlideshowIndex((prev) => (prev + 1) % photos.length);
        setSlideshowFade(true);
      }, PHOTO_FADE_DURATION);
    }, PHOTO_SLIDESHOW_INTERVAL);

    return () => {
      if (slideshowRef.current) {
        clearInterval(slideshowRef.current);
        slideshowRef.current = null;
      }
    };
  }, [enlargedCard, photos.length]);

  useEffect(() => {
    if (!enlargedCard) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExitEnlarge();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [enlargedCard, onExitEnlarge]);

  const resetForm = useCallback(() => {
    setFormTitle('');
    setFormContent('');
    setFormPhoto(undefined);
    setDragOver(false);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!formTitle.trim()) return;
    onCardCreate({ title: formTitle, content: formContent, photoBase64: formPhoto });
    resetForm();
    onModalToggle(false);
  }, [formTitle, formContent, formPhoto, onCardCreate, onModalToggle, resetForm]);

  const handleFileRead = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormPhoto(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileRead(file);
    }
  }, [handleFileRead]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
  }, [handleFileRead]);

  const confirmDelete = useCallback(() => {
    if (deleteTarget) {
      onCardDelete(deleteTarget);
      setDeleteTarget(null);
    }
  }, [deleteTarget, onCardDelete]);

  const layoutButtons: { mode: LayoutMode; label: string }[] = [
    { mode: LayoutMode.GRID, label: '网格' },
    { mode: LayoutMode.TIMELINE, label: '时间轴' },
    { mode: LayoutMode.RANDOM, label: '随机' },
  ];

  const panelContent = (
    <div style={styles.panel}>
      <div style={styles.panelTitle}>记忆回廊</div>
      <div style={styles.panelSubtitle}>Memory Corridor</div>

      <button
        style={styles.createBtn}
        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        onClick={() => onModalToggle(true)}
      >
        ✦ 创建卡片
      </button>

      <div style={styles.layoutSection}>
        <div style={styles.layoutLabel}>布局模式</div>
        <div style={styles.layoutRow}>
          {layoutButtons.map(({ mode, label }) => (
            <button
              key={mode}
              style={{
                ...styles.layoutBtn,
                color: layoutMode === mode ? '#4A90D9' : '#5A7A9A',
              }}
              onClick={() => onLayoutChange(mode)}
            >
              {label}
              <div
                style={{
                  ...styles.layoutUnderline,
                  width: layoutMode === mode ? '100%' : '0%',
                }}
              />
            </button>
          ))}
        </div>
      </div>

      <div style={styles.cardCount}>共 {cards.length} 张卡片</div>
    </div>
  );

  return (
    <>
      {!isMobile && panelContent}

      {isMobile && !mobilePanelOpen && (
        <button style={styles.hamburger} onClick={() => setMobilePanelOpen(true)}>
          <div style={styles.hamburgerLine} />
          <div style={styles.hamburgerLine} />
          <div style={styles.hamburgerLine} />
        </button>
      )}

      {isMobile && mobilePanelOpen && (
        <>
          <div style={styles.mobileOverlay} onClick={() => setMobilePanelOpen(false)} />
          <div style={styles.mobilePanel}>{panelContent}</div>
        </>
      )}

      {isModalOpen && (
        <div style={styles.modalBackdrop} onClick={() => onModalToggle(false)}>
          <div
            style={{
              ...styles.modal,
              transform: modalVisible ? 'translateY(0)' : 'translateY(40px)',
              opacity: modalVisible ? 1 : 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>创建新卡片</span>
              <button style={styles.modalClose} onClick={() => onModalToggle(false)}>×</button>
            </div>

            <input
              style={styles.input}
              placeholder="标题"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#4A90D9';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(74,144,217,0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#B0C4DE';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />

            <textarea
              style={styles.textarea}
              placeholder="内容"
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#4A90D9';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(74,144,217,0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#B0C4DE';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />

            <div
              style={{
                ...styles.uploadArea,
                borderStyle: dragOver ? 'solid' : 'dashed',
                background: dragOver ? '#E6F7FF' : 'transparent',
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              拖拽照片到此处 或 点击选择
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />

            {formPhoto && (
              <div style={styles.thumbRow}>
                <img src={formPhoto} alt="" style={styles.thumb} />
                <button style={styles.thumbRemove} onClick={() => setFormPhoto(undefined)}>×</button>
              </div>
            )}

            <button style={styles.submitBtn} onClick={handleSubmit}>创建</button>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div style={styles.modalBackdrop} onClick={() => setDeleteTarget(null)}>
          <div style={styles.deleteDialog} onClick={(e) => e.stopPropagation()}>
            <div style={styles.deleteText}>确认删除这张卡片？</div>
            <div style={styles.deleteBtns}>
              <button style={styles.deleteCancel} onClick={() => setDeleteTarget(null)}>取消</button>
              <button
                style={styles.deleteConfirm}
                onClick={confirmDelete}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#B71C1C')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#D32F2F')}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {enlargedCard && (
        <div style={styles.enlargeBackdrop} onClick={onExitEnlarge}>
          <div style={styles.enlargeCard} onClick={(e) => e.stopPropagation()}>
            <div style={styles.enlargeTitle}>{enlargedCard.title}</div>

            {photos.length > 0 && (
              <div style={styles.enlargePhotoContainer}>
                <img
                  src={photos[slideshowIndex]}
                  alt=""
                  style={{
                    ...styles.enlargePhoto,
                    opacity: slideshowFade ? 1 : 0,
                    transition: `opacity ${PHOTO_FADE_DURATION}ms ease-in-out`,
                  }}
                />
              </div>
            )}

            <div style={styles.enlargeContent}>{typewriterText}</div>
          </div>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'fixed',
    left: 20,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 280,
    background: '#0D1B2A',
    opacity: 0.85,
    borderRadius: 12,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    zIndex: 100,
    boxSizing: 'border-box',
  },
  panelTitle: {
    fontSize: 22,
    color: '#B8C6DB',
    letterSpacing: 2,
    fontWeight: 600,
  },
  panelSubtitle: {
    fontSize: 12,
    color: '#5A7A9A',
    marginTop: -8,
  },
  createBtn: {
    width: '100%',
    height: 44,
    background: 'linear-gradient(135deg, #1B3A5C, #2E5984)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    cursor: 'pointer',
    transition: 'transform 150ms ease, box-shadow 150ms ease',
  },
  layoutSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  layoutLabel: {
    fontSize: 13,
    color: '#5A7A9A',
  },
  layoutRow: {
    display: 'flex',
    gap: 4,
  },
  layoutBtn: {
    width: 40,
    height: 32,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 300ms ease-out',
    padding: 0,
  },
  layoutUnderline: {
    height: 2,
    background: '#4A90D9',
    transition: 'width 300ms ease',
    marginTop: 2,
    borderRadius: 1,
  },
  cardCount: {
    fontSize: 13,
    color: '#5A7A9A',
  },
  hamburger: {
    position: 'fixed',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    background: '#0D1B2A',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    zIndex: 200,
  },
  hamburgerLine: {
    width: 20,
    height: 2,
    background: '#B8C6DB',
    borderRadius: 1,
  },
  mobileOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 150,
  },
  mobilePanel: {
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    zIndex: 160,
    paddingTop: 60,
    background: '#0D1B2A',
    opacity: 0.95,
    overflowY: 'auto',
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
  },
  modal: {
    width: 600,
    maxWidth: '90vw',
    maxHeight: '80vh',
    background: '#F0F4F8',
    borderRadius: 16,
    padding: 28,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    overflowY: 'auto',
    transition: 'transform 300ms ease-out, opacity 300ms ease-out',
    boxSizing: 'border-box',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 20,
    color: '#1C2541',
    fontWeight: 600,
  },
  modalClose: {
    background: 'transparent',
    border: 'none',
    fontSize: 24,
    color: '#6B7B8D',
    cursor: 'pointer',
    lineHeight: 1,
  },
  input: {
    width: '100%',
    height: 42,
    border: '1px solid #B0C4DE',
    borderRadius: 6,
    padding: '0 12px',
    fontSize: 14,
    color: '#1C2541',
    outline: 'none',
    transition: 'border-color 300ms ease-out, box-shadow 300ms ease-out',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    minHeight: 42,
    maxHeight: 200,
    border: '1px solid #B0C4DE',
    borderRadius: 6,
    padding: '10px 12px',
    fontSize: 14,
    color: '#1C2541',
    outline: 'none',
    resize: 'vertical',
    transition: 'border-color 300ms ease-out, box-shadow 300ms ease-out',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  uploadArea: {
    width: '100%',
    border: '2px dashed #B0C4DE',
    borderRadius: 8,
    padding: 40,
    textAlign: 'center' as const,
    color: '#6B7B8D',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'border-style 300ms ease-out, background 300ms ease-out',
    boxSizing: 'border-box',
  },
  thumbRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  thumb: {
    width: 80,
    height: 80,
    objectFit: 'cover',
    borderRadius: 4,
  },
  thumbRemove: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: 'none',
    background: '#D32F2F',
    color: '#fff',
    fontSize: 16,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  submitBtn: {
    width: '100%',
    height: 44,
    background: 'linear-gradient(135deg, #1B3A5C, #2E5984)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    cursor: 'pointer',
  },
  deleteDialog: {
    width: 360,
    maxWidth: '90vw',
    background: '#fff',
    borderRadius: 12,
    padding: 28,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    boxSizing: 'border-box',
  },
  deleteText: {
    fontSize: 16,
    color: '#1C2541',
    textAlign: 'center' as const,
  },
  deleteBtns: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
  },
  deleteCancel: {
    padding: '8px 24px',
    background: '#6B7B8D',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
  },
  deleteConfirm: {
    padding: '8px 24px',
    background: '#D32F2F',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 14,
    transition: 'background 300ms ease-out',
  },
  enlargeBackdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 400,
  },
  enlargeCard: {
    maxWidth: 600,
    width: '90vw',
    background: '#fff',
    borderRadius: 16,
    padding: 32,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    boxSizing: 'border-box',
  },
  enlargeTitle: {
    fontSize: 28,
    color: '#1C2541',
    fontWeight: 600,
  },
  enlargePhotoContainer: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  enlargePhoto: {
    maxWidth: '100%',
    maxHeight: 400,
    borderRadius: 8,
    objectFit: 'contain',
  },
  enlargeContent: {
    fontSize: 16,
    color: '#1C2541',
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap',
  },
};
