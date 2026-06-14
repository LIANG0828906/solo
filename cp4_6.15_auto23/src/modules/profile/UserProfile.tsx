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
