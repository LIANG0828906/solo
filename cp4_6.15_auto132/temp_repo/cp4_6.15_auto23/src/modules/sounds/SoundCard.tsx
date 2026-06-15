import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SoundClip, CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_EMOJIS } from '../../types';
import { useAudioContext } from '../../context/AudioContext';
import { getComments, saveComment, getUserRating, setUserRating } from '../../utils/localStorage';
import type { Comment } from '../../types';

interface SoundCardProps {
  clip: SoundClip;
  onUpdateClip: (clip: SoundClip) => void;
}

function formatTime(s: number): string {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function StarRating({
  value,
  onChange,
  size = 20,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readonly?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const [pulse, setPulse] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value !== prevValue.current) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 600);
      prevValue.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= (hover || value) ? 'filled' : ''} ${pulse && star <= value ? 'pulse' : ''}`}
          style={{ fontSize: size }}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => !readonly && onChange?.(star)}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function AudioVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const { frequencyData, waveformData, isPlaying } = useAudioContext();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    if (isPlaying && frequencyData.length > 0) {
      const barCount = frequencyData.length;
      const barWidth = w / barCount;
      const gap = 1;

      for (let i = 0; i < barCount; i++) {
        const barH = frequencyData[i] * h * 0.85;
        const x = i * barWidth;
        const gradient = ctx.createLinearGradient(x, h, x, h - barH);
        gradient.addColorStop(0, 'rgba(0,210,255,0.8)');
        gradient.addColorStop(1, 'rgba(0,210,255,0.15)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x + gap / 2, h - barH, barWidth - gap, barH);
      }

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0,255,136,0.6)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < waveformData.length; i++) {
        const x = (i / waveformData.length) * w;
        const y = h / 2 + waveformData[i] * h * 0.35;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(0,210,255,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
    }

    animRef.current = requestAnimationFrame(draw);
  }, [frequencyData, waveformData, isPlaying]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return <canvas ref={canvasRef} className="audio-visualizer" />;
}

export default function SoundCard({ clip, onUpdateClip }: SoundCardProps) {
  const audio = useAudioContext();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setComments(getComments(clip.id));
    setNewRating(getUserRating(clip.id));
  }, [clip.id]);

  const handlePlayPause = () => {
    if (audio.currentSoundId === clip.id) {
      if (audio.isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
    } else {
      if (clip.audioUrl) {
        audio.loadAndPlay(clip.audioUrl, clip.id);
      }
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audio.duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.seek(ratio * audio.duration);
  };

  const handleRate = (rating: number) => {
    setNewRating(rating);
    setUserRating(clip.id, rating);
    const allRatings = [rating];
    const avgRating = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
    onUpdateClip({ ...clip, rating: Math.round(avgRating * 10) / 10 });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: `cmt_${Date.now()}`,
      soundClipId: clip.id,
      text: newComment.trim().slice(0, 200),
      rating: newRating,
      userId: 'user_1',
      userName: '探索者',
      createdAt: new Date().toISOString(),
    };
    saveComment(comment);
    setComments([...getComments(clip.id)]);
    setNewComment('');
  };

  const progress = audio.duration > 0 ? (audio.currentTime / audio.duration) * 100 : 0;
  const isCurrentPlaying = audio.currentSoundId === clip.id && audio.isPlaying;
  const displayCurrentTime = audio.currentSoundId === clip.id ? audio.currentTime : 0;
  const displayDuration = audio.currentSoundId === clip.id ? audio.duration : 0;

  return (
    <div className="sound-card">
      <div className="sound-card-header">
        <span
          className="category-badge"
          style={{ background: CATEGORY_COLORS[clip.category] + '22', color: CATEGORY_COLORS[clip.category], borderColor: CATEGORY_COLORS[clip.category] + '44' }}
        >
          {CATEGORY_EMOJIS[clip.category]} {CATEGORY_LABELS[clip.category]}
        </span>
        <span className="play-count">▶ {clip.playCount}</span>
      </div>

      <h2 className="sound-card-title">{clip.name}</h2>
      <p className="sound-card-desc">{clip.description}</p>

      <div className="sound-card-rating">
        <div className="avg-rating">
          <span className="avg-score">{clip.rating.toFixed(1)}</span>
          <StarRating value={Math.round(clip.rating)} readonly size={16} />
        </div>
        <div className="my-rating">
          <span className="my-rating-label">我的评分</span>
          <StarRating value={newRating} onChange={handleRate} size={20} />
        </div>
      </div>

      <div className="audio-player">
        <AudioVisualizer />
        <div className="audio-controls">
          <button className="play-btn" onClick={handlePlayPause}>
            {isCurrentPlaying ? '⏸' : '▶'}
          </button>
          <div className="progress-bar" ref={progressRef} onClick={handleProgressClick}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="time-display">
            {formatTime(displayCurrentTime)} / {formatTime(displayDuration)}
          </span>
        </div>
        {!clip.audioUrl && (
          <div className="no-audio-hint">暂无音频文件，可上传添加</div>
        )}
      </div>

      <div className="comments-section">
        <button className="comments-toggle" onClick={() => setShowComments(!showComments)}>
          💬 评论 ({comments.length}) {showComments ? '▲' : '▼'}
        </button>
        {showComments && (
          <div className="comments-list">
            {comments.map((c, idx) => (
              <div key={c.id} className="comment-item" style={{ animationDelay: `${idx * 60}ms` }}>
                <div className="comment-header">
                  <span className="comment-user">{c.userName}</span>
                  <span className="comment-time">
                    {new Date(c.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
                <p className="comment-text">{c.text}</p>
              </div>
            ))}
            <div className="comment-form">
              <textarea
                className="comment-input"
                placeholder="写下你的感受... (200字以内)"
                maxLength={200}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <div className="comment-form-footer">
                <span className={`char-count ${newComment.length >= 180 ? 'char-warn' : ''}`}>
                  {newComment.length}/200
                </span>
                <button className="comment-submit" onClick={handleAddComment}>
                  发送
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
