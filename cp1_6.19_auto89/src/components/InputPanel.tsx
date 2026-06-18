import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MoodType, Photo } from '../types';
import { MOOD_CONFIGS, MOOD_ORDER } from '../types';
import { HiX, HiPhotograph, HiTrash, HiCheck } from 'react-icons/hi';

interface InputPanelProps {
  position: { lat: number; lng: number };
  onClose: () => void;
  onSave: (data: { photos: Photo[]; note: string; mood: MoodType }) => void;
}

const STORAGE_KEY = 'travel_map_draft';
const MAX_PHOTOS = 5;
const MAX_NOTE_LENGTH = 150;

const MOOD_EMOJI: Record<MoodType, string> = {
  happy: '😄',
  touched: '🥹',
  surprised: '🎉',
  calm: '🌿',
  tired: '😮‍💨',
};

interface DraftData {
  photos: Photo[];
  note: string;
  mood: MoodType;
  position: { lat: number; lng: number };
  timestamp: number;
}

const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const compressImage = async (file: File, maxWidth = 800, quality = 0.82): Promise<string> => {
  const dataURL = await readFileAsDataURL(file);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(dataURL);
      }
    };
    img.onerror = () => resolve(dataURL);
    img.src = dataURL;
  });
};

const InputPanel: React.FC<InputPanelProps> = ({ position, onClose, onSave }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [note, setNote] = useState('');
  const [mood, setMood] = useState<MoodType>('happy');
  const [isDragging, setIsDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as DraftData;
        if (
          draft &&
          Date.now() - draft.timestamp < 1000 * 60 * 30 &&
          draft.position?.lat === position.lat &&
          draft.position?.lng === position.lng
        ) {
          setPhotos(draft.photos || []);
          setNote(draft.note || '');
          setMood(draft.mood || 'happy');
        }
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      const draft: DraftData = {
        photos,
        note,
        mood,
        position,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* ignore storage full */
    }
  }, [photos, note, mood, position]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArr.length === 0) return;

    const remaining = MAX_PHOTOS - photos.length;
    const toProcess = fileArr.slice(0, remaining);

    const newPhotos: Photo[] = [];
    for (const file of toProcess) {
      try {
        const url = await compressImage(file);
        newPhotos.push({
          id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          url,
        });
      } catch {
        /* skip failed */
      }
    }

    setPhotos(prev => [...prev, ...newPhotos]);
  }, [photos.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const canSave = photos.length > 0 || note.trim().length > 0;

  const handleSave = () => {
    if (!canSave || saving) return;
    setSaving(true);
    setTimeout(() => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch { /* ignore */ }
      onSave({ photos, note: note.trim(), mood });
    }, 300);
  };

  return (
    <>
      <style>{`
        .note-textarea::placeholder {
          color: var(--text-muted);
        }
      `}</style>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(45, 42, 38, 0.35)',
          backdropFilter: 'blur(3px)',
          zIndex: 950,
        }}
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.2, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.2, opacity: 0, y: 20 }}
        transition={{
          type: 'spring',
          duration: 0.3,
          bounce: 0.45,
          stiffness: 320,
          damping: 22,
        }}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '92%',
          maxWidth: '440px',
          maxHeight: '88vh',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '10px',
          boxShadow: '0 20px 60px rgba(45, 42, 38, 0.22), 0 4px 16px rgba(45, 42, 38, 0.08)',
          zIndex: 960,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--border-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              ✨ 记录这一刻
            </h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-sidebar)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            aria-label="关闭"
          >
            <HiX style={{ fontSize: '20px' }} />
          </button>
        </div>

        <div
          className="custom-scrollbar"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '18px 20px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                照片 ({photos.length}/{MAX_PHOTOS})
              </label>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={photos.length >= MAX_PHOTOS}
                style={{
                  fontSize: '12px',
                  color: photos.length >= MAX_PHOTOS ? 'var(--text-muted)' : '#667eea',
                  fontWeight: 500,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (photos.length < MAX_PHOTOS) {
                    e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                + 选择照片
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files) {
                  handleFiles(e.target.files);
                  e.target.value = '';
                }
              }}
            />

            <div
              ref={dropRef}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              style={{
                minHeight: photos.length === 0 ? '120px' : 'auto',
                padding: photos.length === 0 ? '0' : '0',
                borderRadius: 'var(--radius-md)',
                border: isDragging
                  ? '2px dashed #667eea'
                  : photos.length === 0
                    ? '2px dashed var(--border-soft)'
                    : 'none',
                backgroundColor: isDragging ? 'rgba(102, 126, 234, 0.05)' : 'transparent',
                transition: 'all 0.2s ease',
                cursor: photos.length >= MAX_PHOTOS ? 'not-allowed' : 'pointer',
              }}
              onClick={() => {
                if (photos.length < MAX_PHOTOS) {
                  fileInputRef.current?.click();
                }
              }}
            >
              <AnimatePresence>
                {photos.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      height: '120px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      color: isDragging ? '#667eea' : 'var(--text-muted)',
                    }}
                  >
                    <HiPhotograph style={{ fontSize: '28px' }} />
                    <p style={{ fontSize: '12px', fontWeight: 500 }}>
                      {isDragging ? '松开以上传照片' : '拖拽照片到这里'}
                    </p>
                    <p style={{ fontSize: '10px', opacity: 0.7 }}>或点击选择 · 最多5张</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="photos"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: photos.length === 1 ? '1fr' : 'repeat(3, 1fr)',
                      gap: '8px',
                    }}
                  >
                    {photos.map((photo, idx) => (
                      <motion.div
                        key={photo.id}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        style={{
                          position: 'relative',
                          borderRadius: 'var(--radius-sm)',
                          overflow: 'hidden',
                          aspectRatio: '1',
                        }}
                      >
                        <img
                          src={photo.url}
                          alt=""
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removePhoto(photo.id);
                          }}
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(4px)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(229, 72, 77, 0.9)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)';
                          }}
                          aria-label="删除照片"
                        >
                          <HiTrash style={{ fontSize: '12px' }} />
                        </button>
                      </motion.div>
                    ))}
                    {photos.length < MAX_PHOTOS && (
                      <div
                        style={{
                          aspectRatio: '1',
                          borderRadius: 'var(--radius-sm)',
                          border: '2px dashed var(--border-soft)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          color: 'var(--text-muted)',
                          fontSize: '20px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <HiPhotograph />
                        <span style={{ fontSize: '10px' }}>添加</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                旅行笔记
              </label>
              <span
                style={{
                  fontSize: '11px',
                  color: note.length >= MAX_NOTE_LENGTH ? '#E5484D' : 'var(--text-muted)',
                  fontWeight: 500,
                }}
              >
                {note.length}/{MAX_NOTE_LENGTH}
              </span>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE_LENGTH))}
              placeholder="写下这一刻的感受、故事或小细节…"
              rows={4}
              className="note-textarea"
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: '13px',
                lineHeight: 1.6,
                color: 'var(--text-primary)',
                backgroundColor: 'var(--bg-sidebar)',
                borderRadius: 'var(--radius-sm)',
                transition: 'all 0.15s ease',
                border: '1.5px solid transparent',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#667eea';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.backgroundColor = 'var(--bg-sidebar)';
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '10px' }}>
              此刻心情
            </label>
            <div
              style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'space-between',
              }}
            >
              {MOOD_ORDER.map((m) => {
                const config = MOOD_CONFIGS[m];
                const active = mood === m;
                return (
                  <button
                    key={m}
                    onClick={() => setMood(m)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '10px 4px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: active ? `${config.color}25` : 'transparent',
                      border: active ? `2px solid ${config.color}` : '2px solid transparent',
                      transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      transform: active ? 'scale(1.05)' : 'scale(1)',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = `${config.color}15`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <span
                      style={{
                        width: active ? '40px' : '34px',
                        height: active ? '40px' : '34px',
                        borderRadius: '50%',
                        backgroundColor: config.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: active ? '20px' : '16px',
                        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        boxShadow: active ? `0 4px 12px ${config.color}50` : 'none',
                      }}
                    >
                      {MOOD_EMOJI[m]}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: active ? 600 : 500,
                        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                      }}
                    >
                      {config.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: '14px 20px 18px',
            borderTop: '1px solid var(--border-soft)',
            display: 'flex',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--bg-sidebar)',
              color: 'var(--text-secondary)',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--border-soft)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-sidebar)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            style={{
              flex: 2,
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              background: !canSave
                ? 'var(--border-soft)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: !canSave ? 'var(--text-muted)' : '#ffffff',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
              boxShadow: !canSave ? 'none' : '0 4px 14px rgba(102, 126, 234, 0.35)',
              cursor: !canSave ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (canSave) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.45)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = !canSave ? 'none' : '0 4px 14px rgba(102, 126, 234, 0.35)';
            }}
          >
            <HiCheck style={{ fontSize: '16px' }} />
            {saving ? '保存中…' : '保存记忆'}
          </button>
        </div>
      </motion.div>
    </>
  );
};

export default InputPanel;
