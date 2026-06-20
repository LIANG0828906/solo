import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Blessing {
  id: string;
  nickname: string;
  content: string;
  mediaType?: 'image' | 'video';
  mediaData?: string;
  likes: number;
  createdAt: string;
}

interface Activity {
  id: string;
  birthdayPerson: string;
  birthdayDate: string;
  deadline: string;
  isPublic: boolean;
  creatorToken: string;
  createdAt: string;
  blessings: Blessing[];
}

const NICKNAMES = [
  '神秘花匠', '星光守护者', '月光诗人', '晨露使者', '暖阳精灵',
  '彩虹画师', '梦境旅人', '花语使者', '微风吟者', '星尘舞者',
  '云端漫步', '时光酿酒师', '幻彩织梦', '银河信使',
];

function getRandomNickname(): string {
  return NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)];
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  const months = Math.floor(days / 30);
  return `${months}个月前`;
}

function getDaysUntilBirthday(birthdayDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bd = new Date(birthdayDate);
  const nextBirthday = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
  if (nextBirthday < today) {
    nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
  }
  return Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function compressImage(file: File, maxSizeBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const maxDim = 1024;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width *= ratio;
          height *= ratio;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.8;
        const tryCompress = () => {
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const sizeBytes = Math.ceil((dataUrl.length - 'data:image/jpeg;base64,'.length) * 0.75);
          if (sizeBytes <= maxSizeBytes || quality < 0.1) {
            resolve(dataUrl);
          } else {
            quality -= 0.1;
            tryCompress();
          }
        };
        tryCompress();
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function compressVideo(file: File, maxSizeBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target!.result as string;
      const sizeBytes = Math.ceil((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75);
      if (sizeBytes <= maxSizeBytes) {
        resolve(dataUrl);
      } else {
        const video = document.createElement('video');
        video.preload = 'auto';
        video.muted = true;
        video.onloadeddata = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(video, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        video.onerror = () => resolve(dataUrl);
        video.src = URL.createObjectURL(file);
        setTimeout(() => {
          URL.revokeObjectURL(video.src);
          resolve(dataUrl);
        }, 5000);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function BlessingCardComponent({
  blessing,
  sessionId,
  onLike,
  isNew,
}: {
  blessing: Blessing;
  sessionId: string;
  onLike: (id: string) => void;
  isNew: boolean;
}) {
  const [liking, setLiking] = useState(false);
  const [localLikes, setLocalLikes] = useState(blessing.likes);

  useEffect(() => {
    setLocalLikes(blessing.likes);
  }, [blessing.likes]);

  const handleLike = async () => {
    if (liking || localLikes >= 10) return;
    setLiking(true);
    try {
      const res = await axios.post<Blessing>(
        `/api/activities/${blessing.id.split('_')[0]}/blessings/${blessing.id}/like`,
        { sessionId }
      );
      setLocalLikes(res.data.likes);
      onLike(blessing.id);
    } catch {
    } finally {
      setLiking(false);
    }
  };

  return (
    <div
      className="blessing-card"
      style={isNew ? {
        animation: 'slideUp 0.5s ease-out, fadeIn 0.5s ease-out',
      } : undefined}
    >
      <div className="author">{blessing.nickname}</div>
      {blessing.mediaType === 'image' && blessing.mediaData && (
        <div style={{ marginBottom: '8px' }}>
          <img
            src={blessing.mediaData}
            alt="祝福图片"
            style={{
              width: '100%',
              borderRadius: '8px',
              maxHeight: '200px',
              objectFit: 'cover',
            }}
          />
        </div>
      )}
      {blessing.mediaType === 'video' && blessing.mediaData && (
        <div style={{ marginBottom: '8px' }}>
          {blessing.mediaData.startsWith('data:video') ? (
            <video
              src={blessing.mediaData}
              controls
              style={{
                width: '100%',
                borderRadius: '8px',
                maxHeight: '200px',
              }}
            />
          ) : (
            <img
              src={blessing.mediaData}
              alt="祝福视频封面"
              style={{
                width: '100%',
                borderRadius: '8px',
                maxHeight: '200px',
                objectFit: 'cover',
              }}
            />
          )}
        </div>
      )}
      <div className="message">{blessing.content}</div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '8px',
      }}>
        <span className="timestamp">{timeAgo(blessing.createdAt)}</span>
        <button
          className={`like-btn${localLikes >= 10 ? '' : ''}`}
          onClick={handleLike}
          disabled={liking || localLikes >= 10}
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <span className="heart" style={{
            color: localLikes > 0 ? 'var(--color-primary)' : 'transparent',
            WebkitTextStroke: localLikes > 0 ? '0' : '1.5px var(--color-primary)',
            animation: localLikes > 0 ? 'pulse 0.3s ease-out' : 'none',
          }}>
            ❤
          </span>
          <span style={{
            fontSize: '0.8rem',
            color: localLikes > 0 ? 'var(--color-primary)' : '#aaa',
            fontWeight: 600,
          }}>
            {localLikes}
          </span>
        </button>
      </div>
    </div>
  );
}

export default function ActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [blessings, setBlessings] = useState<Blessing[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingBlessings, setLoadingBlessings] = useState(false);

  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const [copied, setCopied] = useState(false);
  const [newBlessingIds, setNewBlessingIds] = useState<Set<string>>(new Set());
  const sessionIdRef = useRef('');
  const [showCard, setShowCard] = useState(false);

  const isCreator = activity
    ? !!localStorage.getItem(`creatorToken_${activity.id}`)
    : false;
  const deadlinePassed = activity
    ? new Date(activity.deadline) < new Date()
    : false;

  useEffect(() => {
    if (!sessionIdRef.current) {
      let sid = localStorage.getItem('sessionId');
      if (!sid) {
        sid = `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem('sessionId', sid);
      }
      sessionIdRef.current = sid;
    }
  }, []);

  const fetchActivity = useCallback(async () => {
    if (!id) return;
    try {
      const res = await axios.get<Activity>(`/api/activities/${id}`);
      setActivity(res.data);
    } catch {
      setError('活动不存在或已删除');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchBlessings = useCallback(async (p: number) => {
    if (!id) return;
    setLoadingBlessings(true);
    try {
      const res = await axios.get(`/api/activities/${id}/blessings`, {
        params: { page: p, limit: 20 },
      });
      if (p === 1) {
        setBlessings(res.data.blessings);
      } else {
        setBlessings(prev => [...prev, ...res.data.blessings]);
      }
      setTotalPages(res.data.totalPages);
      setTotal(res.data.total);
    } catch {
    } finally {
      setLoadingBlessings(false);
    }
  }, [id]);

  useEffect(() => {
    fetchActivity();
    fetchBlessings(1);
  }, [fetchActivity, fetchBlessings]);

  useEffect(() => {
    if (!id) return;
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`/api/activities/${id}/blessings`, {
          params: { page: 1, limit: 20 },
        });
        setBlessings(prev => {
          const existingIds = new Set(prev.map(b => b.id));
          const newOnes = res.data.blessings.filter((b: Blessing) => !existingIds.has(b.id));
          if (newOnes.length > 0) {
            const newIds = new Set(newOnes.map((b: Blessing) => b.id));
            setNewBlessingIds(prev => {
              const next = new Set(prev);
              newIds.forEach(nid => next.add(nid));
              return next;
            });
            return [...newOnes, ...prev];
          }
          return prev.map(existing => {
            const updated = res.data.blessings.find((b: Blessing) => b.id === existing.id);
            return updated ? { ...existing, likes: updated.likes } : existing;
          });
        });
      } catch {
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (isImage) setMediaType('image');
    else if (isVideo) setMediaType('video');
    else setMediaType(undefined);

    const reader = new FileReader();
    reader.onload = (ev) => setMediaPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!id || !content.trim() || submitting) return;
    setSubmitting(true);
    try {
      let mediaData: string | undefined;
      if (mediaFile && mediaType) {
        if (mediaType === 'image') {
          mediaData = await compressImage(mediaFile, 1024 * 1024);
        } else {
          mediaData = await compressVideo(mediaFile, 1024 * 1024);
        }
      }

      const nickname = getRandomNickname();
      const res = await axios.post<Blessing>(`/api/activities/${id}/blessings`, {
        nickname,
        content: content.trim(),
        mediaType: mediaType || undefined,
        mediaData: mediaData || undefined,
      });

      setBlessings(prev => [res.data, ...prev]);
      setNewBlessingIds(prev => {
        const next = new Set(prev);
        next.add(res.data.id);
        return next;
      });
      setContent('');
      setMediaFile(null);
      setMediaPreview('');
      setMediaType(undefined);
      setTotal(prev => prev + 1);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    const link = window.location.href;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = link;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchBlessings(nextPage);
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="main-content fade-wrapper" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>😔</div>
        <p style={{ fontSize: '1.1rem', color: 'var(--color-text-light)' }}>{error || '活动不存在'}</p>
        <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => navigate('/')}>
          返回首页
        </button>
      </div>
    );
  }

  const daysLeft = getDaysUntilBirthday(activity.birthdayDate);

  return (
    <div className="main-content fade-wrapper">
      {showCard && (
        <BirthdayCardLazy
          activityId={activity.id}
          birthdayPerson={activity.birthdayPerson}
          blessings={blessings}
          onClose={() => setShowCard(false)}
        />
      )}

      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary), #ff8e8e)',
        borderRadius: 'var(--border-radius)',
        padding: '32px',
        color: 'var(--color-white)',
        marginBottom: '24px',
        textAlign: 'center',
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            color: 'white',
            fontSize: '1.1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ←
        </button>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '2rem',
          color: 'var(--color-white)',
          marginBottom: '8px',
        }}>
          🎂 {activity.birthdayPerson}
        </h1>
        <p style={{ opacity: 0.9, marginBottom: '16px' }}>
          生日: {new Date(activity.birthdayDate).toLocaleDateString('zh-CN')}
        </p>
        <div className="countdown-timer" style={{ justifyContent: 'center' }}>
          {daysLeft === 0 ? (
            <div style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '12px',
              padding: '16px 32px',
              fontSize: '1.2rem',
              fontWeight: 800,
            }}>
              🎉 今天是生日！
            </div>
          ) : (
            <div className="countdown-unit" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <span className="number" style={{ color: 'white' }}>{daysLeft}</span>
              <span className="label" style={{ color: 'rgba(255,255,255,0.8)' }}>天后生日</span>
            </div>
          )}
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}>
        <button
          className={`copy-link-btn${copied ? ' copied' : ''}`}
          onClick={handleCopy}
        >
          {copied ? '已复制！' : '🔗 复制链接'}
        </button>
        {isCreator && (
          <button
            className="btn btn-secondary"
            onClick={() => setShowCard(true)}
          >
            🎴 生成纪念贺卡
          </button>
        )}
      </div>

      {!deadlinePassed && (
        <div style={{
          background: 'var(--color-white)',
          borderRadius: 'var(--border-radius)',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 2px 12px var(--color-primary-shadow)',
        }}>
          <h3 style={{
            fontFamily: 'var(--font-heading)',
            color: 'var(--color-primary)',
            marginBottom: '16px',
            fontSize: '1.1rem',
          }}>
            ✍️ 写下你的祝福
          </h3>
          <div className="form-group">
            <textarea
              className="form-input"
              placeholder="写下你的祝福语..."
              value={content}
              onChange={e => setContent(e.target.value.slice(0, 200))}
              maxLength={200}
              rows={3}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '4px',
              fontSize: '0.75rem',
              color: '#aaa',
            }}>
              <span>匿名昵称将随机分配</span>
              <span>{content.length}/200</span>
            </div>
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
              📷 添加图片/视频（可选，压缩至&lt;1MB）
            </label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              style={{ fontSize: '0.85rem' }}
            />
            {mediaPreview && mediaType === 'image' && (
              <img
                src={mediaPreview}
                alt="预览"
                style={{
                  marginTop: '8px',
                  maxWidth: '200px',
                  maxHeight: '150px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                }}
              />
            )}
            {mediaPreview && mediaType === 'video' && (
              <video
                src={mediaPreview}
                controls
                style={{
                  marginTop: '8px',
                  maxWidth: '200px',
                  maxHeight: '150px',
                  borderRadius: '8px',
                }}
              />
            )}
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
          >
            {submitting ? '发送中...' : '💌 发送祝福'}
          </button>
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-light)',
            marginTop: '8px',
          }}>
            截止时间: {new Date(activity.deadline).toLocaleString('zh-CN')}
          </div>
        </div>
      )}

      {deadlinePassed && (
        <div style={{
          background: 'var(--color-primary-light)',
          borderRadius: 'var(--border-radius)',
          padding: '16px 24px',
          marginBottom: '24px',
          textAlign: 'center',
          color: 'var(--color-primary)',
          fontWeight: 700,
        }}>
          ⏰ 祝福收集已截止，以下是收到的祝福
        </div>
      )}

      <div style={{ marginBottom: '12px' }}>
        <h3 style={{
          fontFamily: 'var(--font-heading)',
          color: 'var(--color-primary)',
          fontSize: '1.2rem',
        }}>
          💝 祝福墙 ({total})
        </h3>
      </div>

      {blessings.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: 'var(--color-text-light)',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>💌</div>
          <p>还没有祝福，成为第一个送祝福的人吧！</p>
        </div>
      ) : (
        <>
          <div className="blessing-wall">
            {blessings.map(b => (
              <BlessingCardComponent
                key={b.id}
                blessing={b}
                sessionId={sessionIdRef.current}
                onLike={() => {}}
                isNew={newBlessingIds.has(b.id)}
              />
            ))}
          </div>
          {page < totalPages && (
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <button
                className="btn btn-secondary"
                onClick={handleLoadMore}
                disabled={loadingBlessings}
              >
                {loadingBlessings ? '加载中...' : '加载更多'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BirthdayCardLazy(props: {
  activityId: string;
  birthdayPerson: string;
  blessings: Blessing[];
  onClose: () => void;
}) {
  const [CardComponent, setCardComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    import('../components/BirthdayCard').then(mod => {
      setCardComponent(() => mod.default);
    });
  }, []);

  if (!CardComponent) {
    return (
      <div className="modal-overlay">
        <div className="loading-spinner" />
      </div>
    );
  }

  return <CardComponent {...props} />;
}
