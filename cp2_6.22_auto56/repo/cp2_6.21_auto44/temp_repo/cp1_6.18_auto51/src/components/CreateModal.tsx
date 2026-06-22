import { useState, useRef } from 'react';
import { useBottleStore } from '../store/useBottleStore';

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    animation: 'fadeIn 0.3s ease-out'
  },
  modal: {
    width: '480px',
    maxWidth: '90%',
    backgroundColor: '#1E293B',
    borderRadius: '12px',
    padding: '28px',
    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.5)',
    animation: 'slideUp 0.3s ease-out',
    border: '1px solid #2D4A6C'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  title: {
    color: '#F1F5F9',
    fontSize: '18px',
    fontWeight: 600
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#64748B',
    fontSize: '22px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '6px',
    transition: 'all 0.3s ease-out',
    lineHeight: 1
  },
  textarea: {
    width: '100%',
    minHeight: '120px',
    padding: '14px',
    backgroundColor: '#0F1B2D',
    border: '1px solid #2D4A6C',
    borderRadius: '10px',
    color: '#E2E8F0',
    fontSize: '14px',
    lineHeight: 1.7,
    resize: 'vertical',
    outline: 'none',
    transition: 'border-color 0.3s ease-out',
    fontFamily: 'inherit',
    marginBottom: '14px'
  },
  uploadSection: {
    marginBottom: '16px'
  },
  uploadBtn: {
    display: 'inline-block',
    padding: '10px 20px',
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    border: '1px dashed #4ECDC4',
    borderRadius: '8px',
    color: '#4ECDC4',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.3s ease-out'
  },
  hiddenInput: {
    display: 'none'
  },
  previewContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '12px'
  },
  previewItem: {
    position: 'relative',
    width: '80px',
    height: '80px'
  },
  previewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '8px'
  },
  removeBtn: {
    position: 'absolute',
    top: '-6px',
    right: '-6px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#FF6B6B',
    border: 'none',
    color: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px'
  },
  charCount: {
    fontSize: '12px',
    color: '#64748B'
  },
  submitBtn: {
    padding: '10px 28px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#4ECDC4',
    color: '#0F1B2D',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease-out'
  }
};

const compressImage = (file: File, maxWidth: number = 300): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
};

function CreateModal() {
  const { closeCreateModal, createNewBottle, loading } = useBottleStore();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    if (!loading) closeCreateModal();
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= 1000) {
      setContent(val);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 5 - images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToProcess) {
      if (file.type.startsWith('image/')) {
        try {
          const compressed = await compressImage(file, 300);
          setImages(prev => [...prev, compressed]);
        } catch {
          continue;
        }
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) return;
    await createNewBottle(content.trim(), images);
    setContent('');
    setImages([]);
    closeCreateModal();
  };

  const canSubmit = (content.trim().length > 0 || images.length > 0) && !loading;

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>扔出新漂流瓶</h2>
          <button
            style={styles.closeBtn}
            onClick={handleClose}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            ×
          </button>
        </div>

        <textarea
          value={content}
          onChange={handleContentChange}
          placeholder="写下你此刻的灵感、想法或心情..."
          style={styles.textarea}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#4ECDC4'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#2D4A6C'; }}
          autoFocus
        />

        <div style={styles.uploadSection}>
          <label
            style={styles.uploadBtn}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(78, 205, 196, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(78, 205, 196, 0.15)';
            }}
          >
            📷 添加图片 ({images.length}/5)
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={styles.hiddenInput}
              onChange={handleFileSelect}
              disabled={images.length >= 5}
            />
          </label>

          {images.length > 0 && (
            <div style={styles.previewContainer}>
              {images.map((img, idx) => (
                <div key={idx} style={styles.previewItem}>
                  <img src={img} alt="" style={styles.previewImg} />
                  <button style={styles.removeBtn} onClick={() => handleRemoveImage(idx)}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <span style={styles.charCount}>{content.length}/1000</span>
          <button
            style={{
              ...styles.submitBtn,
              opacity: canSubmit ? 1 : 0.5,
              cursor: canSubmit ? 'pointer' : 'not-allowed'
            }}
            disabled={!canSubmit}
            onClick={handleSubmit}
            onMouseEnter={(e) => {
              if (canSubmit) {
                e.currentTarget.style.backgroundColor = '#6EE7E7';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (canSubmit) {
                e.currentTarget.style.backgroundColor = '#4ECDC4';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {loading ? '投递中...' : '投递漂流瓶'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateModal;
