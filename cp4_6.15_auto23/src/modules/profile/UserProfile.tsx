import React, { useState, useMemo } from 'react';
import { SoundClip, CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_EMOJIS } from '../../types';
import { getUserProfile, updateUserProfile, deleteSoundClip } from '../../utils/localStorage';

interface UserProfileProps {
  soundClips: SoundClip[];
  onDeleteClip: (id: string) => void;
  onEditClip: (clip: SoundClip) => void;
  onSelectClip: (clip: SoundClip) => void;
}

const AVATAR_OPTIONS = ['🌍', '🎵', '🎧', '🏙️', '🎙️', '🎶', '🔊', '🌌', '🗺️', '🎤'];

const MAP_WIDTH = 800;
const MAP_HEIGHT = 400;

const lngLatToXY = (lng: number, lat: number): { x: number; y: number } => {
  const x = ((lng + 180) / 360) * MAP_WIDTH;
  const y = ((90 - lat) / 180) * MAP_HEIGHT;
  return { x, y };
};

const WorldMapThumbnail: React.FC<{ clips: SoundClip[] }> = ({ clips }) => {
  const points = useMemo(() => {
    return clips.map((clip) => ({
      ...lngLatToXY(clip.lng, clip.lat),
      color: CATEGORY_COLORS[clip.category],
      id: clip.id,
    }));
  }, [clips]);

  return (
    <div className="footprint-map-wrapper">
      <div className="footprint-map-title">🗺️ 我的足迹 ({clips.length})</div>
      <svg
        className="footprint-map"
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f3460" />
            <stop offset="100%" stopColor="#16213e" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#oceanGrad)" rx="8" />

        <g fill="#1e5631" opacity="0.75" stroke="#2d7a47" strokeWidth="0.5">
          <path d="M130,90 L160,75 L200,70 L240,80 L260,100 L250,130 L220,155 L180,170 L140,165 L115,140 L105,115 Z" />
          <path d="M240,170 L260,155 L280,150 L295,165 L290,200 L275,240 L260,280 L255,310 L270,335 L285,350 L270,360 L250,355 L235,330 L225,290 L220,250 L225,210 L235,180 Z" />
          <path d="M380,80 L410,65 L445,55 L480,60 L510,75 L540,95 L555,120 L545,145 L520,155 L490,148 L460,140 L430,142 L400,150 L375,145 L360,125 L365,100 Z" />
          <path d="M470,160 L495,155 L515,165 L520,185 L510,210 L490,220 L470,215 L455,195 L460,175 Z" />
          <path d="M540,100 L580,85 L620,75 L660,80 L700,95 L730,115 L745,140 L735,165 L700,180 L660,185 L620,180 L585,170 L555,155 L540,135 Z" />
          <path d="M620,195 L645,190 L670,200 L680,220 L675,245 L660,265 L640,270 L620,260 L610,240 L612,215 Z" />
          <path d="M700,270 L720,260 L740,265 L750,280 L745,300 L725,310 L705,305 L695,288 Z" />
          <path d="M60,150 L80,140 L100,145 L105,160 L95,175 L75,178 L58,170 L55,158 Z" />
          <path d="M720,130 L740,125 L755,135 L758,150 L748,162 L730,165 L715,158 L712,142 Z" />
          <path d="M290,70 L305,62 L320,68 L325,82 L315,95 L298,98 L285,92 L282,78 Z" />
          <path d="M500,55 L515,48 L530,55 L532,70 L522,82 L505,85 L492,78 L490,65 Z" />
          <path d="M155,320 L175,310 L195,318 L198,335 L185,348 L165,350 L150,342 L148,330 Z" />
        </g>

        <g stroke="rgba(0,210,255,0.08)" strokeWidth="0.5">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <line
              key={`h${i}`}
              x1="0"
              y1={(MAP_HEIGHT / 6) * i}
              x2={MAP_WIDTH}
              y2={(MAP_HEIGHT / 6) * i}
            />
          ))}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <line
              key={`v${i}`}
              x1={(MAP_WIDTH / 8) * i}
              y1="0"
              x2={(MAP_WIDTH / 8) * i}
              y2={MAP_HEIGHT}
            />
          ))}
        </g>

        {points.map((p) => (
          <g key={p.id} filter="url(#glow)">
            <circle cx={p.x} cy={p.y} r="8" fill={p.color} opacity="0.25">
              <animate
                attributeName="r"
                values="6;12;6"
                dur="2.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.35;0;0.35"
                dur="2.5s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx={p.x} cy={p.y} r="4" fill={p.color} />
          </g>
        ))}
      </svg>
    </div>
  );
};

export default function UserProfile({ soundClips, onDeleteClip, onEditClip, onSelectClip }: UserProfileProps) {
  const [profile, setProfile] = useState(() => getUserProfile());
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const myClips = useMemo(
    () => soundClips.filter((c) => c.userId === profile.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [soundClips, profile.id]
  );

  const stats = useMemo(() => {
    const totalClips = myClips.length;
    const totalPlays = myClips.reduce((s, c) => s + (c.playCount || 0), 0);
    const avgRating = totalClips > 0 ? myClips.reduce((s, c) => s + c.rating, 0) / totalClips : 0;
    const catCount: Record<string, number> = {};
    myClips.forEach((c) => {
      catCount[c.category] = (catCount[c.category] || 0) + 1;
    });
    const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0];
    return { totalClips, totalPlays, avgRating, topCategory: topCat ? topCat[0] : null };
  }, [myClips]);

  const handleSaveName = () => {
    const updated = { ...profile, name: nameInput.trim() || profile.name };
    updateUserProfile(updated);
    setProfile(updated);
    setEditingName(false);
  };

  const handleAvatarChange = (emoji: string) => {
    const updated = { ...profile, avatar: emoji };
    updateUserProfile(updated);
    setProfile(updated);
    setShowAvatarPicker(false);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    if (navigator.vibrate) {
      navigator.vibrate([30, 50, 30]);
    }
    setTimeout(() => {
      deleteSoundClip(id);
      onDeleteClip(id);
      setDeletingId(null);
    }, 500);
  };

  const getInitials = (name: string) => name.charAt(0).toUpperCase();

  return (
    <div className="user-profile">
      <div className="profile-header">
        <div className="avatar-container">
          <div
            className="avatar"
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
          >
            {profile.avatar ? (
              <span className="avatar-emoji">{profile.avatar}</span>
            ) : (
              <span className="avatar-letter">{getInitials(profile.name)}</span>
            )}
          </div>
          {showAvatarPicker && (
            <div className="avatar-picker">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  className="avatar-option"
                  onClick={() => handleAvatarChange(emoji)}
                >
                  {emoji}
                </button>
              ))}
              <button
                className="avatar-option letter-option"
                onClick={() => handleAvatarChange('')}
              >
                A
              </button>
            </div>
          )}
        </div>
        <div className="profile-name-area">
          {editingName ? (
            <div className="name-edit">
              <input
                className="name-input"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                autoFocus
              />
            </div>
          ) : (
            <h2 className="profile-name" onClick={() => setEditingName(true)}>
              {profile.name} ✏️
            </h2>
          )}
        </div>
      </div>

      <WorldMapThumbnail clips={myClips} />

      <div className="profile-stats">
        <div className="stat-card">
          <div className="stat-value">{stats.totalClips}</div>
          <div className="stat-label">标记数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalPlays}</div>
          <div className="stat-label">总播放量</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.avgRating.toFixed(1)}</div>
          <div className="stat-label">平均评分</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {stats.topCategory ? CATEGORY_EMOJIS[stats.topCategory as keyof typeof CATEGORY_EMOJIS] : '—'}
          </div>
          <div className="stat-label">
            {stats.topCategory ? CATEGORY_LABELS[stats.topCategory as keyof typeof CATEGORY_LABELS] : '暂无'}
          </div>
        </div>
      </div>

      <div className="profile-clip-list">
        <h3 className="clip-list-title">我的标记 ({myClips.length})</h3>
        {myClips.length === 0 ? (
          <div className="empty-hint">还没有标记，去地图上添加吧！</div>
        ) : (
          myClips.map((clip, idx) => (
            <div
              key={clip.id}
              className={`profile-clip-item ${deletingId === clip.id ? 'deleting' : ''}`}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="clip-item-main" onClick={() => onSelectClip(clip)}>
                <span
                  className="clip-category-dot"
                  style={{ background: CATEGORY_COLORS[clip.category] }}
                />
                <div className="clip-item-info">
                  <div className="clip-item-name">{clip.name}</div>
                  <div className="clip-item-meta">
                    {CATEGORY_LABELS[clip.category]} · ⭐{clip.rating} · ▶{clip.playCount}
                  </div>
                </div>
              </div>
              <div className="clip-item-actions">
                <button
                  className="action-btn edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditClip(clip);
                  }}
                >
                  ✏️
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(clip.id);
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
