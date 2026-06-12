import { useState } from 'react';
import { Blessing, DataManager, EMOTION_META } from '../utils/DataManager';
import ImageLightbox from './ImageLightbox';

interface Props {
  blessings: Blessing[];
  onLiked: () => void;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const pad = (n: number) => String(n).padStart(2, '0');
  if (sameDay) {
    const diff = (now.getTime() - ts) / 1000;
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    return `今天 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  const yesterday = new Date(now.getTime() - 86400000);
  if (d.toDateString() === yesterday.toDateString()) {
    return `昨天 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface LightboxState {
  images: string[];
  index: number;
}

function MessageWall({ blessings, onLiked }: Props) {
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [pulses, setPulses] = useState<Record<string, boolean>>({});
  const [localLikes, setLocalLikes] = useState<Record<string, number>>({});
  const [localLiked, setLocalLiked] = useState<Record<string, boolean>>({});

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = DataManager.likeBlessing(id);
    setPulses(p => ({ ...p, [id]: true }));
    setLocalLikes(l => ({ ...l, [id]: res.likes }));
    setLocalLiked(l => ({ ...l, [id]: res.liked }));
    setTimeout(() => setPulses(p => ({ ...p, [id]: false })), 320);
    onLiked();
  };

  const openLightbox = (photos: string[], index: number) => {
    setLightbox({ images: photos, index });
  };

  return (
    <div className="message-wall">
      <div className="wall-header">
        <h2 className="wall-title">💐 祝福墙 <span className="wall-count">{blessings.length}</span></h2>
      </div>
      {blessings.length === 0 ? (
        <div className="wall-empty card">
          <div style={{ fontSize: 56 }}>💌</div>
          <div style={{ marginTop: 12, color: '#888' }}>还没有祝福，来写下第一条吧～</div>
        </div>
      ) : (
        <div className="wall-grid">
          {blessings.map((b, i) => {
            const meta = EMOTION_META[b.emotion];
            const likes = localLikes[b.id] ?? b.likes;
            const liked = localLiked[b.id] ?? b.likedByMe;
            const pulse = pulses[b.id];
            return (
              <div
                key={b.id}
                className="blessing-card card animate-fade-in-up"
                style={{ animationDelay: `${Math.min(i * 0.04, 0.4)}s` }}
              >
                <div className="card-top">
                  <div>
                    <div className="card-nick">{b.nickname}</div>
                    <div className="card-time">{formatTime(b.createdAt)} · {b.ip}</div>
                  </div>
                  <button
                    className={`like-btn ${pulse ? 'animate-pulse-scale' : ''} ${liked ? 'is-liked' : ''}`}
                    onClick={e => handleLike(b.id, e)}
                    aria-label="点赞"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="22"
                      height="22"
                      fill={liked ? 'var(--color-deep-pink)' : 'none'}
                      stroke={liked ? 'var(--color-deep-pink)' : '#ccc'}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <span className="like-count">{likes}</span>
                  </button>
                </div>

                <div className="card-content">{b.content}</div>

                {b.photos.length > 0 && (
                  <div className={`card-photos photo-grid-${b.photos.length}`}>
                    {b.photos.map((src, idx) => (
                      <div
                        key={idx}
                        className="photo-item"
                        onClick={() => openLightbox(b.photos, idx)}
                      >
                        <img src={src} alt="" loading="lazy" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="card-bottom">
                  <span
                    className="emotion-tag"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    {meta.emoji} {meta.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}

export default MessageWall;
