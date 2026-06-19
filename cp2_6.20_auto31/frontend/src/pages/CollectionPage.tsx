import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  getVinyls,
  searchVinyls,
  getVinyl,
  createVinyl,
  updateVinylRating,
  deleteVinyl,
} from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import type { Vinyl } from '../types';

const BACKGROUND_COLOR = '#1a1a2e';
const CARD_COLOR = '#16213e';
const PRIMARY_COLOR = '#e94560';
const TEXT_SECONDARY = 'rgba(255,255,255,0.6)';

const GENRE_OPTIONS = [
  '全部流派',
  'Rock',
  'Pop',
  'Jazz',
  'Electronic',
  'Hip-Hop',
  'Classical',
  'Soul',
  'Funk',
  'Folk',
  'Grunge',
];

const PAGE_LIMIT = 20;

const MOCK_FRIENDS = [
  { id: '1', name: 'Alice', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice' },
  { id: '2', name: 'Bob', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob' },
  { id: '3', name: 'Charlie', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie' },
  { id: '4', name: 'Diana', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana' },
  { id: '5', name: 'Eva', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eva' },
  { id: '6', name: 'Frank', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Frank' },
];

const VinylIcon = ({ style }: { style?: React.CSSProperties }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    style={{ ...style, color: TEXT_SECONDARY }}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="3" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </svg>
);

const SearchIcon = ({ style }: { style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const CloseIcon = ({ style }: { style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const PlusIcon = ({ style }: { style?: React.CSSProperties }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={style}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

const StarRating = ({
  rating,
  size = 16,
  interactive = false,
  onRate,
}: {
  rating: number;
  size?: number;
  interactive?: boolean;
  onRate?: (r: number) => void;
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const displayRating = hoverRating > 0 ? hoverRating : rating;

  return (
    <div
      style={{
        display: 'flex',
        gap: 2,
        position: 'relative',
      }}
      onMouseLeave={() => interactive && setHoverRating(0)}
    >
      {Array.from({ length: 10 }, (_, i) => {
        const starValue = i + 1;
        const isActive = starValue <= displayRating;
        return (
          <span
            key={i}
            style={{
              fontSize: size,
              color: isActive ? PRIMARY_COLOR : 'rgba(255,255,255,0.2)',
              cursor: interactive ? 'pointer' : 'default',
              transition: 'transform 0.15s ease',
              transform: interactive && hoverRating === starValue ? 'scale(1.2)' : 'scale(1)',
              userSelect: 'none',
              lineHeight: 1,
            }}
            onMouseEnter={() => interactive && setHoverRating(starValue)}
            onClick={() => {
              if (interactive && onRate) {
                onRate(starValue);
              }
            }}
          >
            ★
          </span>
        );
      })}
    </div>
  );
};

const SkeletonCard = () => (
  <div
    style={{
      backgroundColor: CARD_COLOR,
      borderRadius: 12,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.05)',
    }}
  >
    <div
      className="animate-shimmer"
      style={{
        width: '100%',
        aspectRatio: '1/1',
        background: 'linear-gradient(90deg, #1a1a2e 25%, #2a2a4e 50%, #1a1a2e 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
    <div style={{ padding: 16 }}>
      <div
        className="animate-shimmer"
        style={{
          height: 16,
          width: '70%',
          borderRadius: 4,
          marginBottom: 8,
          background: 'linear-gradient(90deg, #1a1a2e 25%, #2a2a4e 50%, #1a1a2e 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }}
      />
      <div
        className="animate-shimmer"
        style={{
          height: 13,
          width: '50%',
          borderRadius: 4,
          marginBottom: 12,
          background: 'linear-gradient(90deg, #1a1a2e 25%, #2a2a4e 50%, #1a1a2e 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }}
      />
      <div
        className="animate-shimmer"
        style={{
          height: 16,
          width: '40%',
          borderRadius: 4,
          background: 'linear-gradient(90deg, #1a1a2e 25%, #2a2a4e 50%, #1a1a2e 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }}
      />
    </div>
  </div>
);

interface VinylCardProps {
  vinyl: Vinyl;
  onClick: () => void;
  onRate: (id: string, rating: number) => void;
  animationDelay: number;
}

const VinylCard = ({ vinyl, onClick, onRate, animationDelay }: VinylCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isRating, setIsRating] = useState(false);

  return (
    <div
      className="animate-fadeIn"
      style={{
        backgroundColor: CARD_COLOR,
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.05)',
        cursor: 'pointer',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        opacity: 0,
        animationDelay: `${animationDelay}ms`,
        animationFillMode: 'forwards',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          '0 12px 32px rgba(233,69,96,0.25)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
      onClick={() => {
        if (!isRating) onClick();
      }}
    >
      <div
        style={{
          width: '100%',
          aspectRatio: '1/1',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#0f0f1e',
        }}
      >
        {vinyl.cover_url ? (
          <img
            src={vinyl.cover_url}
            alt={vinyl.title}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(false)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              aspectRatio: '1/1',
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.6s ease',
              display: imageLoaded ? 'block' : 'none',
            }}
          />
        ) : null}
        {(!vinyl.cover_url || !imageLoaded) && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 1,
              transition: 'opacity 0.6s ease',
            }}
          >
            <VinylIcon style={{ width: '40%', height: '40%' }} />
          </div>
        )}
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            color: '#fff',
          }}
          title={vinyl.title}
        >
          {vinyl.title}
        </h3>
        <p
          style={{
            fontSize: 13,
            color: TEXT_SECONDARY,
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={vinyl.artist}
        >
          {vinyl.artist}
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 4,
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: TEXT_SECONDARY,
            }}
          >
            {vinyl.release_year || '—'} · {vinyl.genre || '未知'}
          </span>
        </div>
        <div
          onClick={(e) => {
            e.stopPropagation();
          }}
          onMouseEnter={() => setIsRating(true)}
          onMouseLeave={() => setIsRating(false)}
          style={{ paddingTop: 4 }}
        >
          <StarRating
            rating={vinyl.rating || 0}
            size={14}
            interactive
            onRate={(newRating) => onRate(vinyl.id, newRating)}
          />
        </div>
      </div>
    </div>
  );
};

interface AddVinylModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddVinylModal = ({ onClose, onSuccess }: AddVinylModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    release_year: '',
    genre: 'Rock',
    rating: 5,
    notes: '',
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setError('只支持 JPG/PNG 格式的图片');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过 5MB');
      return;
    }
    setError('');
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCoverPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.artist.trim()) {
      setError('标题和艺术家不能为空');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('title', formData.title.trim());
      fd.append('artist', formData.artist.trim());
      if (formData.release_year) {
        fd.append('release_year', String(parseInt(formData.release_year) || new Date().getFullYear()));
      }
      fd.append('genre', formData.genre);
      fd.append('rating', String(formData.rating));
      if (formData.notes.trim()) {
        fd.append('notes', formData.notes.trim());
      }
      if (coverFile) {
        fd.append('cover_image', coverFile);
      }
      await createVinyl(fd);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || '提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="animate-fadeIn"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="animate-slideUp"
        style={{
          backgroundColor: CARD_COLOR,
          borderRadius: 16,
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            position: 'sticky',
            top: 0,
            backgroundColor: CARD_COLOR,
            zIndex: 1,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: '#fff',
            }}
          >
            添加新唱片
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.06)',
              color: TEXT_SECONDARY,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'rgba(255,255,255,0.12)';
              (e.currentTarget as HTMLButtonElement).style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'rgba(255,255,255,0.06)';
              (e.currentTarget as HTMLButtonElement).style.color = TEXT_SECONDARY;
            }}
          >
            <CloseIcon style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          {error && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                backgroundColor: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444',
                fontSize: 14,
                marginBottom: 20,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={labelStyle}>标题 *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例如：The Dark Side of the Moon"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>艺术家 *</label>
              <input
                type="text"
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                placeholder="例如：Pink Floyd"
                style={inputStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>发行年份</label>
                <input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData.release_year}
                  onChange={(e) => setFormData({ ...formData, release_year: e.target.value })}
                  placeholder="1973"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>流派</label>
                <select
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  style={inputStyle}
                >
                  {GENRE_OPTIONS.filter((g) => g !== '全部流派').map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                评分: <span style={{ color: PRIMARY_COLOR, fontWeight: 700 }}>{formData.rating}</span> / 10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={formData.rating}
                onChange={(e) =>
                  setFormData({ ...formData, rating: parseInt(e.target.value) })
                }
                style={{
                  width: '100%',
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  appearance: 'none' as const,
                  outline: 'none',
                  cursor: 'pointer',
                  accentColor: PRIMARY_COLOR,
                }}
              />
              <div style={{ marginTop: 8 }}>
                <StarRating rating={formData.rating} size={18} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>笔记</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="添加关于这张唱片的个人备注..."
                rows={4}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  minHeight: 100,
                  paddingTop: 12,
                  paddingBottom: 12,
                }}
              />
            </div>

            <div>
              <label style={labelStyle}>封面图片</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              {coverPreview ? (
                <div style={{ position: 'relative' }}>
                  <img
                    src={coverPreview}
                    alt="preview"
                    style={{
                      width: '100%',
                      aspectRatio: '1/1',
                      maxHeight: 240,
                      objectFit: 'cover',
                      borderRadius: 12,
                      border: '2px solid rgba(233,69,96,0.3)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCoverPreview('');
                      setCoverFile(null);
                    }}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CloseIcon style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    maxHeight: 200,
                    border: '2px dashed rgba(255,255,255,0.2)',
                    borderRadius: 12,
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    color: TEXT_SECONDARY,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = PRIMARY_COLOR;
                    (e.currentTarget as HTMLButtonElement).style.color = PRIMARY_COLOR;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      'rgba(255,255,255,0.2)';
                    (e.currentTarget as HTMLButtonElement).style.color = TEXT_SECONDARY;
                  }}
                >
                  <PlusIcon style={{ width: 28, height: 28 }} />
                  <span style={{ fontSize: 14 }}>点击上传封面 (JPG/PNG, ≤5MB)</span>
                </button>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 24,
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
                transition: 'all 0.2s ease',
                opacity: isSubmitting ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting)
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    'rgba(255,255,255,0.15)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  'rgba(255,255,255,0.08)';
              }}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '12px 32px',
                borderRadius: 8,
                backgroundColor: PRIMARY_COLOR,
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
                transition: 'all 0.2s ease',
                opacity: isSubmitting ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting)
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ff5975';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = PRIMARY_COLOR;
              }}
            >
              {isSubmitting ? '提交中...' : '添加唱片'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DetailModalProps {
  vinyl: Vinyl | null;
  onClose: () => void;
  onRate: (id: string, rating: number) => void;
}

const DetailModal = ({ vinyl, onClose, onRate }: DetailModalProps) => {
  const [detailVinyl, setDetailVinyl] = useState<Vinyl | null>(vinyl);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setDetailVinyl(vinyl);
  }, [vinyl]);

  useEffect(() => {
    const fetchDetail = async () => {
      if (vinyl?.id) {
        try {
          const res = await getVinyl(vinyl.id);
          if (res) {
            setDetailVinyl(res.vinyl || res);
          }
        } catch {
          // fall back to vinyl prop
        }
      }
    };
    fetchDetail();
  }, [vinyl?.id]);

  const handleDelete = async () => {
    if (!detailVinyl) return;
    if (!window.confirm('确定要删除这张唱片吗？此操作不可恢复。')) return;
    setIsDeleting(true);
    try {
      await deleteVinyl(detailVinyl.id);
      onClose();
    } catch {
      // error handled by interceptor
    } finally {
      setIsDeleting(false);
    }
  };

  const displayedVinyl = detailVinyl || vinyl;

  if (!displayedVinyl) return null;

  const friendsList = useMemo(
    () => MOCK_FRIENDS.slice(0, Math.floor(Math.random() * 4) + 2),
    [displayedVinyl.id]
  );

  return (
    <div
      className="animate-fadeIn"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="animate-slideUp"
        style={{
          backgroundColor: CARD_COLOR,
          borderRadius: 20,
          width: '100%',
          maxWidth: 900,
          maxHeight: '90vh',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: 16,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            position: 'relative',
          }}
        >
          <button
            onClick={onClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: 'rgba(255,255,255,0.06)',
              color: TEXT_SECONDARY,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              zIndex: 2,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'rgba(255,255,255,0.12)';
              (e.currentTarget as HTMLButtonElement).style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'rgba(255,255,255,0.06)';
              (e.currentTarget as HTMLButtonElement).style.color = TEXT_SECONDARY;
            }}
          >
            <CloseIcon style={{ width: 20, height: 20 }} />
          </button>
        </div>

        <div
          style={{
            overflowY: 'auto',
            padding: 24,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)',
            gap: 32,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              onClick={() => setIsZoomed(!isZoomed)}
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '1/1',
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: '#0f0f1e',
                cursor: 'zoom-in',
              }}
            >
              {displayedVinyl.cover_url ? (
                <img
                  src={displayedVinyl.cover_url}
                  alt={displayedVinyl.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    aspectRatio: '1/1',
                    transition: 'transform 0.4s ease',
                    transform: isZoomed ? 'scale(1.5)' : 'scale(1)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <VinylIcon style={{ width: '50%', height: '50%' }} />
                </div>
              )}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.4) 100%)',
                  pointerEvents: 'none',
                  opacity: isZoomed ? 0 : 1,
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <h1
                style={{
                  margin: '0 0 8px 0',
                  fontSize: 28,
                  fontWeight: 800,
                  color: '#fff',
                  lineHeight: 1.2,
                }}
              >
                {displayedVinyl.title}
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: 18,
                  color: TEXT_SECONDARY,
                }}
              >
                {displayedVinyl.artist}
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              {displayedVinyl.release_year && (
                <span style={tagStyle}>📅 {displayedVinyl.release_year}</span>
              )}
              {displayedVinyl.genre && (
                <span style={tagStyle}>🎵 {displayedVinyl.genre}</span>
              )}
            </div>

            <div>
              <div
                style={{
                  fontSize: 14,
                  color: TEXT_SECONDARY,
                  marginBottom: 8,
                  fontWeight: 600,
                }}
              >
                我的评分
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <StarRating
                  rating={displayedVinyl.rating || 0}
                  size={22}
                  interactive
                  onRate={(newRating) => onRate(displayedVinyl.id, newRating)}
                />
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: PRIMARY_COLOR,
                  }}
                >
                  {displayedVinyl.rating || 0}
                  <span style={{ fontSize: 14, color: TEXT_SECONDARY }}>/10</span>
                </span>
              </div>
            </div>

            {displayedVinyl.notes && (
              <div>
                <div
                  style={{
                    fontSize: 14,
                    color: TEXT_SECONDARY,
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  笔记
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.85)',
                    lineHeight: 1.7,
                    padding: 16,
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  {displayedVinyl.notes}
                </p>
              </div>
            )}

            <div>
              <div
                style={{
                  fontSize: 14,
                  color: TEXT_SECONDARY,
                  marginBottom: 12,
                  fontWeight: 600,
                }}
              >
                听过的朋友 ({friendsList.length})
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                {friendsList.map((friend) => (
                  <div
                    key={friend.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid rgba(255,255,255,0.1)',
                      }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        color: TEXT_SECONDARY,
                        maxWidth: 60,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {friend.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 16 }}>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(239,68,68,0.4)',
                  color: '#ef4444',
                  fontSize: 14,
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  opacity: isDeleting ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isDeleting) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                      'rgba(239,68,68,0.1)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#ef4444';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    'transparent';
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    'rgba(239,68,68,0.4)';
                }}
              >
                {isDeleting ? '删除中...' : '🗑️ 删除唱片'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: TEXT_SECONDARY,
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  backgroundColor: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#fff',
  fontSize: 14,
  transition: 'all 0.2s ease',
};

const tagStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 20,
  backgroundColor: 'rgba(255,255,255,0.06)',
  color: 'rgba(255,255,255,0.85)',
  fontSize: 13,
  border: '1px solid rgba(255,255,255,0.08)',
};

const CollectionPage = () => {
  const { ensureDemoUser } = useAuthStore();
  const [vinyls, setVinyls] = useState<Vinyl[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('全部流派');
  const [showAddModal, setShowAddModal] = useState(false);
  const [detailVinyl, setDetailVinyl] = useState<Vinyl | null>(null);
  const [listKey, setListKey] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    ensureDemoUser();
  }, [ensureDemoUser]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchVinyls = useCallback(
    async (page: number, reset = false) => {
      if (reset) {
        setIsLoading(true);
      } else if (page > 1) {
        setIsLoadingMore(true);
      }

      try {
        const genreParam = selectedGenre === '全部流派' ? undefined : selectedGenre;
        const hasSearch = debouncedSearch.trim() !== '' || genreParam;
        const params = {
          search: debouncedSearch.trim() || undefined,
          genre: genreParam,
          page,
          limit: PAGE_LIMIT,
        };

        const result = hasSearch
          ? await searchVinyls(params)
          : await getVinyls(params);

        if (reset || page === 1) {
          setVinyls(result.vinyls);
          setListKey((k) => k + 1);
        } else {
          setVinyls((prev) => [...prev, ...result.vinyls]);
        }
        setCurrentPage(result.page);
        setTotalPages(result.pages);
        setTotalCount(result.total);
      } catch (err) {
        console.error('Failed to fetch vinyls:', err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [debouncedSearch, selectedGenre]
  );

  useEffect(() => {
    initialLoadDone.current = false;
    fetchVinyls(1, true);
  }, [debouncedSearch, selectedGenre]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (
            !initialLoadDone.current &&
            !isLoading &&
            !isLoadingMore &&
            currentPage < totalPages
          ) {
            initialLoadDone.current = true;
            fetchVinyls(currentPage + 1).then(() => {
              setTimeout(() => {
                initialLoadDone.current = false;
              }, 500);
            });
          }
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isLoading, isLoadingMore, currentPage, totalPages, fetchVinyls]);

  const handleRate = async (id: string, rating: number) => {
    setVinyls((prev) =>
      prev.map((v) => (v.id === id ? { ...v, rating } : v))
    );
    if (detailVinyl?.id === id) {
      setDetailVinyl({ ...detailVinyl, rating });
    }
    try {
      await updateVinylRating(id, rating);
    } catch {
      setVinyls((prev) => {
        const original = vinyls.find((v) => v.id === id);
        return prev.map((v) => (v.id === id ? original || v : v));
      });
    }
  };

  const handleAddSuccess = () => {
    setShowAddModal(false);
    fetchVinyls(1, true);
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('toast', {
        detail: { message: '唱片添加成功！', type: 'success' },
      });
      window.dispatchEvent(event);
    }
  };

  const displayVinyls = vinyls;
  const hasMore = currentPage < totalPages;

  return (
    <div
      style={{
        padding: '100px 24px 40px',
        backgroundColor: BACKGROUND_COLOR,
        color: '#fff',
        minHeight: '100vh',
      }}
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #e94560;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 8px rgba(233,69,96,0.5);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #e94560;
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 2px 8px rgba(233,69,96,0.5);
        }
        input, textarea, select {
          color: #fff;
        }
        input::placeholder, textarea::placeholder {
          color: rgba(255,255,255,0.3);
        }
        input:focus, textarea:focus, select:focus {
          border-color: #e94560 !important;
          background-color: rgba(233,69,96,0.05) !important;
        }
        select option {
          background-color: #16213e;
          color: #fff;
        }
      `}</style>

      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
        }}
      >
        <div
          className="animate-fadeIn"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 32,
                fontWeight: 800,
                color: '#fff',
              }}
            >
              我的唱片收藏
            </h1>
            <span
              style={{
                padding: '4px 12px',
                borderRadius: 20,
                backgroundColor: `${PRIMARY_COLOR}20`,
                color: PRIMARY_COLOR,
                fontSize: 13,
                fontWeight: 600,
                border: `1px solid ${PRIMARY_COLOR}40`,
              }}
            >
              {totalCount} 张
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                alignItems: 'center',
                flex: 1,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: 320,
                  minWidth: 200,
                }}
              >
                <SearchIcon
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 18,
                    height: 18,
                    color: TEXT_SECONDARY,
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="搜索标题或艺术家..."
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: 10,
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff',
                    fontSize: 14,
                    transition: 'all 0.2s ease',
                  }}
                />
              </div>

              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                style={{
                  padding: '12px 36px 12px 14px',
                  borderRadius: 10,
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#fff',
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  appearance: 'none' as const,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a0a0b0' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 14px center',
                }}
              >
                {GENRE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '12px 20px',
                borderRadius: 8,
                backgroundColor: PRIMARY_COLOR,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
                flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ff5975';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow =
                  '0 6px 20px rgba(233,69,96,0.4)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = PRIMARY_COLOR;
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
              }}
            >
              <PlusIcon style={{ width: 18, height: 18 }} />
              添加唱片
            </button>
          </div>
        </div>

        {isLoading && displayVinyls.length === 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(1, 1fr)',
              gap: 24,
            }}
            className="vinyls-grid"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={`skeleton-${i}`} />
            ))}
          </div>
        ) : displayVinyls.length === 0 ? (
          <div
            className="animate-fadeIn"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 24px',
              textAlign: 'center',
            }}
          >
            <VinylIcon style={{ width: 80, height: 80, marginBottom: 20, opacity: 0.4 }} />
            <h3
              style={{
                margin: '0 0 8px 0',
                fontSize: 20,
                fontWeight: 700,
                color: '#fff',
              }}
            >
              {debouncedSearch || selectedGenre !== '全部流派'
                ? '没有找到匹配的唱片'
                : '你的收藏还是空的'}
            </h3>
            <p
              style={{
                margin: '0 0 24px 0',
                fontSize: 14,
                color: TEXT_SECONDARY,
                maxWidth: 400,
              }}
            >
              {debouncedSearch || selectedGenre !== '全部流派'
                ? '试试调整搜索关键词或筛选条件'
                : '点击右上角"添加唱片"按钮，开始建立你的黑胶收藏吧！'}
            </p>
            {!debouncedSearch && selectedGenre === '全部流派' && (
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  padding: '12px 24px',
                  borderRadius: 8,
                  backgroundColor: PRIMARY_COLOR,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#ff5975';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = PRIMARY_COLOR;
                }}
              >
                <PlusIcon style={{ width: 18, height: 18 }} />
                添加第一张唱片
              </button>
            )}
          </div>
        ) : (
          <>
            <div
              key={listKey}
              className="animate-fadeIn vinyls-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 24,
              }}
            >
              {displayVinyls.map((vinyl, index) => (
                <VinylCard
                  key={vinyl.id}
                  vinyl={vinyl}
                  onClick={() => setDetailVinyl(vinyl)}
                  onRate={handleRate}
                  animationDelay={Math.min(index * 50, 300)}
                />
              ))}
            </div>

            {isLoadingMore && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 24,
                  marginTop: 24,
                }}
                className="vinyls-grid"
              >
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonCard key={`loadmore-${i}`} />
                ))}
              </div>
            )}

            <div ref={sentinelRef} style={{ height: 40 }} />

            {!hasMore && displayVinyls.length > 0 && !isLoading && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 24px 0',
                  color: TEXT_SECONDARY,
                  fontSize: 14,
                }}
              >
                — 已加载全部 {totalCount} 张唱片 —
              </div>
            )}
          </>
        )}
      </div>

      {showAddModal && (
        <AddVinylModal onClose={() => setShowAddModal(false)} onSuccess={handleAddSuccess} />
      )}

      {detailVinyl && (
        <DetailModal
          vinyl={detailVinyl}
          onClose={() => setDetailVinyl(null)}
          onRate={handleRate}
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          .vinyls-grid {
            grid-template-columns: repeat(1, 1fr) !important;
          }
        }
        @media (min-width: 769px) and (max-width: 1024px) {
          .vinyls-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (min-width: 1025px) {
          .vinyls-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CollectionPage;
