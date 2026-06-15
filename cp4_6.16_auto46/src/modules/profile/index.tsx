import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Camera, Edit3, Save, X, Plus, Trash2, Music, Instagram, Youtube, Twitter, Headphones } from 'lucide-react';
import { useStore } from '@/store';
import { Artist, SocialLink, ThemeType } from '@/types';
import { themeColors, themeNames } from '@/utils/theme';
import { fileToDataURL, validateImageFile } from '@/utils/image';
import './styles.css';

const platformIcons: Record<SocialLink['platform'], React.ReactNode> = {
  spotify: <Music size={20} />,
  instagram: <Instagram size={20} />,
  youtube: <Youtube size={20} />,
  twitter: <Twitter size={20} />,
  soundcloud: <Headphones size={20} />,
};

const platformColors: Record<SocialLink['platform'], string> = {
  spotify: '#1DB954',
  instagram: '#E4405F',
  youtube: '#FF0000',
  twitter: '#1DA1F2',
  soundcloud: '#FF5500',
};

const platforms: SocialLink['platform'][] = ['spotify', 'instagram', 'youtube', 'twitter', 'soundcloud'];

const ProfileModule: React.FC = () => {
  const { artist, updateArtist, setArtist } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Artist>>({});
  const [isUploading, setIsUploading] = useState(false);

  const handleEditClick = useCallback(() => {
    if (artist) {
      setEditData({ ...artist });
      setIsEditing(true);
    }
  }, [artist]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditData({});
  }, []);

  const handleSave = useCallback(() => {
    if (editData && artist) {
      updateArtist(editData);
      setIsEditing(false);
      setEditData({});
    }
  }, [editData, artist, updateArtist]);

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !validateImageFile(file)) {
      alert('请上传有效的图片文件');
      return;
    }

    setIsUploading(true);
    try {
      const dataUrl = await fileToDataURL(file);
      setEditData((prev) => ({ ...prev, avatar: dataUrl }));
    } catch (error) {
      console.error('上传头像失败:', error);
      alert('上传头像失败');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleBioChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditData((prev) => ({ ...prev, bio: e.target.value }));
  }, []);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditData((prev) => ({ ...prev, name: e.target.value }));
  }, []);

  const handleThemeChange = useCallback((theme: ThemeType) => {
    setEditData((prev) => ({ ...prev, theme }));
  }, []);

  const handleAddSocialLink = useCallback((platform: SocialLink['platform']) => {
    if (!editData.socialLinks || editData.socialLinks.length >= 5) {
      alert('最多只能添加5个社交媒体链接');
      return;
    }

    if (editData.socialLinks.some((link) => link.platform === platform)) {
      alert('该平台已添加');
      return;
    }

    const newLink: SocialLink = { platform, url: '' };
    setEditData((prev) => ({
      ...prev,
      socialLinks: [...(prev.socialLinks || []), newLink],
    }));
  }, [editData.socialLinks]);

  const handleSocialUrlChange = useCallback((index: number, url: string) => {
    setEditData((prev) => {
      if (!prev.socialLinks) return prev;
      const updated = [...prev.socialLinks];
      updated[index] = { ...updated[index], url };
      return { ...prev, socialLinks: updated };
    });
  }, []);

  const handleRemoveSocialLink = useCallback((index: number) => {
    setEditData((prev) => {
      if (!prev.socialLinks) return prev;
      const updated = prev.socialLinks.filter((_, i) => i !== index);
      return { ...prev, socialLinks: updated };
    });
  }, []);

  const renderMarkdown = (text: string) => {
    let html = text
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/\n/g, '<br />');
    return { __html: html };
  };

  if (!artist) {
    return <div className="profile-loading">加载中...</div>;
  }

  const displayData = isEditing ? editData : artist;
  const currentTheme = displayData.theme || 'night';
  const colors = themeColors[currentTheme];

  return (
    <div className="profile-module card fade-in">
      <div className="profile-header">
        <div className="profile-avatar-wrapper">
          <div
            className="profile-avatar"
            style={{
              background: displayData.avatar
                ? `url(${displayData.avatar}) center/cover`
                : `linear-gradient(135deg, ${colors.gradientStart}, ${colors.gradientEnd})`,
            }}
          >
            {!displayData.avatar && (
              <span className="avatar-placeholder">{displayData.name?.[0] || '?'}</span>
            )}
          </div>
          {isEditing && (
            <label className="avatar-upload-btn">
              <Camera size={18} />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
              {isUploading && <span className="uploading-text">上传中...</span>}
            </label>
          )}
        </div>

        <div className="profile-info">
          {isEditing ? (
            <input
              type="text"
              className="input profile-name-input"
              value={displayData.name || ''}
              onChange={handleNameChange}
              placeholder="输入艺名"
            />
          ) : (
            <h1 className="profile-name gradient-text">{displayData.name}</h1>
          )}
          
          <div className="profile-social-links">
            {artist.socialLinks?.map((link) => (
              <a
                key={link.platform}
                href={link.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link-btn"
                style={{ color: platformColors[link.platform] }}
                title={link.platform}
              >
                {platformIcons[link.platform]}
              </a>
            ))}
          </div>
        </div>

        <div className="profile-actions">
          {isEditing ? (
            <>
              <button className="btn btn-primary" onClick={handleSave}>
                <Save size={18} />
                保存
              </button>
              <button className="btn btn-secondary" onClick={handleCancel}>
                <X size={18} />
                取消
              </button>
            </>
          ) : (
            <button className="btn btn-secondary" onClick={handleEditClick}>
              <Edit3 size={18} />
              编辑资料
            </button>
          )}
        </div>
      </div>

      <div className="profile-bio">
        <h3 className="section-title">简介</h3>
        {isEditing ? (
          <textarea
            className="input bio-textarea"
            value={displayData.bio || ''}
            onChange={handleBioChange}
            placeholder="支持Markdown格式"
            rows={6}
          />
        ) : (
          <div
            className="markdown-content"
            dangerouslySetInnerHTML={renderMarkdown(artist.bio || '')}
          />
        )}
      </div>

      <div className="profile-theme">
        <h3 className="section-title">主题配色</h3>
        <div className="theme-selector">
          {(Object.keys(themeColors) as ThemeType[]).map((theme) => (
            <button
              key={theme}
              className={`theme-option ${currentTheme === theme ? 'active' : ''}`}
              onClick={() => isEditing && handleThemeChange(theme)}
              disabled={!isEditing}
              style={{
                background: `linear-gradient(135deg, ${themeColors[theme].gradientStart}, ${themeColors[theme].gradientEnd})`,
              }}
              title={themeNames[theme]}
            >
              {currentTheme === theme && <span className="theme-check">✓</span>}
            </button>
          ))}
        </div>
        <p className="theme-name">{themeNames[currentTheme]}</p>
      </div>

      {isEditing && (
        <div className="profile-social-edit">
          <h3 className="section-title">社交媒体链接 (最多5个)</h3>
          <div className="social-edit-list">
            {editData.socialLinks?.map((link, index) => (
              <div key={link.platform} className="social-edit-item">
                <span
                  className="social-icon"
                  style={{ color: platformColors[link.platform] }}
                >
                  {platformIcons[link.platform]}
                </span>
                <input
                  type="url"
                  className="input social-url-input"
                  value={link.url}
                  onChange={(e) => handleSocialUrlChange(index, e.target.value)}
                  placeholder="输入链接地址"
                />
                <button
                  className="btn btn-danger btn-small"
                  onClick={() => handleRemoveSocialLink(index)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          
          {(!editData.socialLinks || editData.socialLinks.length < 5) && (
            <div className="add-social-buttons">
              <span className="add-social-label">添加平台：</span>
              {platforms
                .filter((p) => !editData.socialLinks?.some((l) => l.platform === p))
                .map((platform) => (
                  <button
                    key={platform}
                    className="btn btn-secondary btn-small add-social-btn"
                    onClick={() => handleAddSocialLink(platform)}
                    style={{ color: platformColors[platform] }}
                    title={`添加${platform}`}
                  >
                    <Plus size={16} />
                    {platformIcons[platform]}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileModule;
