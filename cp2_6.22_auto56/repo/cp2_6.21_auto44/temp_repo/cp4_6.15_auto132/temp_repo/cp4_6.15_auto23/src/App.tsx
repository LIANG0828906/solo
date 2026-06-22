import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SoundClip, SoundCategory, CATEGORY_LABELS, CATEGORY_COLORS, CATEGORY_EMOJIS } from './types';
import MapView from './modules/map/MapView';
import SoundCard from './modules/sounds/SoundCard';
import UserProfile from './modules/profile/UserProfile';
import { AudioProvider } from './context/AudioContext';
import {
  getSoundClips,
  saveSoundClip,
  updateSoundClip,
  deleteSoundClip as removeSoundClip,
  getUserProfile,
  updateUserProfile,
} from './utils/localStorage';

type PanelView = 'none' | 'sound' | 'profile' | 'add' | 'edit';

const ALLOWED_AUDIO = ['.mp3', '.wav', '.ogg'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function generateId() {
  return `clip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function AddSoundForm({
  position,
  onSubmit,
  onCancel,
}: {
  position: { lat: number; lng: number };
  onSubmit: (clip: SoundClip) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SoundCategory>('other');
  const [description, setDescription] = useState('');
  const [rating, setRating] = useState(3);
  const [audioUrl, setAudioUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_AUDIO.includes(ext)) {
      alert('仅支持 mp3/wav/ogg 格式');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      alert('文件大小不能超过 10MB');
      return;
    }

    setFileName(file.name);
    setUploading(true);
    setUploadProgress(0);

    const reader = new FileReader();
    reader.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
      }
    };
    reader.onload = () => {
      setAudioUrl(reader.result as string);
      setUploadProgress(100);
      setTimeout(() => setUploading(false), 500);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const clip: SoundClip = {
      id: generateId(),
      lat: position.lat,
      lng: position.lng,
      name: name.trim(),
      category,
      description: description.trim(),
      rating,
      audioUrl,
      createdAt: new Date().toISOString(),
      userId: getUserProfile().id,
      playCount: 0,
    };
    saveSoundClip(clip);
    onSubmit(clip);
  };

  return (
    <form className="add-sound-form" onSubmit={handleSubmit}>
      <h3 className="form-title">📍 标记新声音</h3>
      <div className="form-coords">
        {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
      </div>

      <div className="form-group">
        <label>地点名称 *</label>
        <input
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="如：涩谷十字路口"
          required
        />
      </div>

      <div className="form-group">
        <label>上传音频</label>
        <div className="audio-upload">
          <input
            ref={fileRef}
            type="file"
            accept=".mp3,.wav,.ogg"
            onChange={handleFileChange}
            hidden
          />
          <button type="button" className="upload-btn" onClick={() => fileRef.current?.click()}>
            📁 选择文件
          </button>
          {fileName && <span className="file-name">{fileName}</span>}
        </div>
        {uploading && (
          <div className="upload-progress">
            <div className="progress-track">
              <div className="progress-bar-animated" style={{ width: `${uploadProgress}%` }} />
            </div>
            <div className="wave-loader">
              {[...Array(12)].map((_, i) => (
                <span key={i} className="wave-bar" style={{ animationDelay: `${i * 0.08}s` }} />
              ))}
            </div>
            <span className="progress-text">{uploadProgress}%</span>
          </div>
        )}
      </div>

      <div className="form-group">
        <label>声音分类</label>
        <div className="category-grid">
          {(Object.keys(CATEGORY_LABELS) as SoundCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-chip ${category === cat ? 'active' : ''}`}
              style={{
                borderColor: category === cat ? CATEGORY_COLORS[cat] : 'transparent',
                background: category === cat ? CATEGORY_COLORS[cat] + '22' : 'rgba(255,255,255,0.05)',
              }}
              onClick={() => setCategory(cat)}
            >
              {CATEGORY_EMOJIS[cat]} {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>简短描述</label>
        <textarea
          className="form-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="描述这个声音..."
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>主观评分</label>
        <div className="form-rating">
          {[1, 2, 3, 4, 5].map((s) => (
            <span
              key={s}
              className={`form-star ${s <= rating ? 'filled' : ''}`}
              onClick={() => setRating(s)}
            >
              ★
            </span>
          ))}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-cancel" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="btn btn-submit" disabled={!name.trim()}>
          提交标记
        </button>
      </div>
    </form>
  );
}

function EditSoundForm({
  clip,
  onSubmit,
  onCancel,
}: {
  clip: SoundClip;
  onSubmit: (clip: SoundClip) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(clip.name);
  const [category, setCategory] = useState<SoundCategory>(clip.category);
  const [description, setDescription] = useState(clip.description);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const updated: SoundClip = {
      ...clip,
      name: name.trim(),
      category,
      description: description.trim(),
    };
    updateSoundClip(updated);
    onSubmit(updated);
  };

  return (
    <form className="add-sound-form" onSubmit={handleSubmit}>
      <h3 className="form-title">✏️ 编辑声音</h3>

      <div className="form-group">
        <label>地点名称 *</label>
        <input
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>声音分类</label>
        <div className="category-grid">
          {(Object.keys(CATEGORY_LABELS) as SoundCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-chip ${category === cat ? 'active' : ''}`}
              style={{
                borderColor: category === cat ? CATEGORY_COLORS[cat] : 'transparent',
                background: category === cat ? CATEGORY_COLORS[cat] + '22' : 'rgba(255,255,255,0.05)',
              }}
              onClick={() => setCategory(cat)}
            >
              {CATEGORY_EMOJIS[cat]} {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>简短描述</label>
        <textarea
          className="form-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-cancel" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="btn btn-submit">
          保存修改
        </button>
      </div>
    </form>
  );
}

export default function App() {
  const [soundClips, setSoundClips] = useState<SoundClip[]>(() => getSoundClips());
  const [selectedClip, setSelectedClip] = useState<SoundClip | null>(null);
  const [panelView, setPanelView] = useState<PanelView>('none');
  const [newClipPos, setNewClipPos] = useState<{ lat: number; lng: number } | null>(null);
  const [editingClip, setEditingClip] = useState<SoundClip | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 1024);
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [panelHeight, setPanelHeight] = useState(0);
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setNewClipPos({ lat, lng });
    setSelectedClip(null);
    setEditingClip(null);
    setPanelView('add');
    if (isMobile) setPanelExpanded(true);
  }, [isMobile]);

  const handleMarkerClick = useCallback((clip: SoundClip) => {
    setSelectedClip(clip);
    setNewClipPos(null);
    setEditingClip(null);
    setPanelView('sound');
    if (isMobile) setPanelExpanded(true);
  }, [isMobile]);

  const handleAddClip = useCallback((clip: SoundClip) => {
    setSoundClips((prev) => [...prev, clip]);
    setSelectedClip(clip);
    setNewClipPos(null);
    setPanelView('sound');
  }, []);

  const handleUpdateClip = useCallback((clip: SoundClip) => {
    updateSoundClip(clip);
    setSoundClips((prev) => prev.map((c) => (c.id === clip.id ? clip : c)));
    setSelectedClip(clip);
  }, []);

  const handleDeleteClip = useCallback((id: string) => {
    removeSoundClip(id);
    setSoundClips((prev) => prev.filter((c) => c.id !== id));
    if (selectedClip?.id === id) {
      setSelectedClip(null);
      setPanelView('none');
    }
  }, [selectedClip]);

  const handleEditClip = useCallback((clip: SoundClip) => {
    setEditingClip(clip);
    setPanelView('edit');
  }, []);

  const handleEditSubmit = useCallback((clip: SoundClip) => {
    setSoundClips((prev) => prev.map((c) => (c.id === clip.id ? clip : c)));
    setSelectedClip(clip);
    setEditingClip(null);
    setPanelView('sound');
  }, []);

  const handleProfileSelectClip = useCallback((clip: SoundClip) => {
    setSelectedClip(clip);
    setPanelView('sound');
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragRef.current = { startY: touch.clientY, startH: panelHeight };
  }, [panelHeight]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragRef.current) return;
    const touch = e.touches[0];
    const delta = dragRef.current.startY - touch.clientY;
    const newH = Math.max(0, Math.min(window.innerHeight * 0.7, dragRef.current.startH + delta));
    setPanelHeight(newH);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (panelHeight > 200) {
      setPanelExpanded(true);
      setPanelHeight(window.innerHeight * 0.6);
    } else {
      setPanelExpanded(false);
      setPanelHeight(0);
    }
    dragRef.current = null;
  }, [panelHeight]);

  const showPanel = panelView !== 'none';

  const renderPanelContent = () => {
    switch (panelView) {
      case 'add':
        return newClipPos ? (
          <AddSoundForm
            position={newClipPos}
            onSubmit={handleAddClip}
            onCancel={() => { setPanelView('none'); setNewClipPos(null); }}
          />
        ) : null;
      case 'edit':
        return editingClip ? (
          <EditSoundForm
            clip={editingClip}
            onSubmit={handleEditSubmit}
            onCancel={() => { setEditingClip(null); setPanelView(selectedClip ? 'sound' : 'none'); }}
          />
        ) : null;
      case 'sound':
        return selectedClip ? (
          <SoundCard clip={selectedClip} onUpdateClip={handleUpdateClip} />
        ) : null;
      case 'profile':
        return (
          <UserProfile
            soundClips={soundClips}
            onDeleteClip={handleDeleteClip}
            onEditClip={handleEditClip}
            onSelectClip={handleProfileSelectClip}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AudioProvider>
      <div className="app-layout">
        <div className="map-area">
          <MapView
            soundClips={soundClips}
            onMapClick={handleMapClick}
            onMarkerClick={handleMarkerClick}
            showHeatmap={showHeatmap}
          />

          <div className="map-controls">
            <button
              className={`map-ctrl-btn ${showHeatmap ? 'active' : ''}`}
              onClick={() => setShowHeatmap(!showHeatmap)}
              title="热力图"
            >
              🌡️
            </button>
            <button
              className={`map-ctrl-btn ${panelView === 'profile' ? 'active' : ''}`}
              onClick={() => {
                if (panelView === 'profile') {
                  setPanelView('none');
                } else {
                  setPanelView('profile');
                  if (isMobile) setPanelExpanded(true);
                }
              }}
              title="个人中心"
            >
              👤
            </button>
          </div>

          <div className="map-stats">
            <span>📍 {soundClips.length} 个声音标记</span>
          </div>
        </div>

        {!isMobile && (
          <div className={`side-panel ${showPanel ? 'open' : ''}`}>
            <div className="panel-header">
              <div className="panel-tabs">
                <button
                  className={`panel-tab ${panelView === 'sound' || panelView === 'add' || panelView === 'edit' ? 'active' : ''}`}
                  onClick={() => { if (selectedClip) setPanelView('sound'); }}
                >
                  🎵 声音
                </button>
                <button
                  className={`panel-tab ${panelView === 'profile' ? 'active' : ''}`}
                  onClick={() => setPanelView('profile')}
                >
                  👤 个人
                </button>
              </div>
              {showPanel && (
                <button className="panel-close" onClick={() => setPanelView('none')}>
                  ✕
                </button>
              )}
            </div>
            <div className="panel-content">{renderPanelContent()}</div>
          </div>
        )}

        {isMobile && showPanel && (
          <div
            className="floating-panel"
            style={{ height: panelExpanded ? panelHeight || window.innerHeight * 0.6 : 120 }}
          >
            <div
              className="panel-drag-handle"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={() => {
                if (!panelExpanded) {
                  setPanelExpanded(true);
                  setPanelHeight(window.innerHeight * 0.6);
                } else {
                  setPanelExpanded(false);
                  setPanelHeight(0);
                }
              }}
            >
              <div className="drag-indicator" />
            </div>
            <div className="panel-mobile-header">
              <div className="panel-tabs">
                <button
                  className={`panel-tab ${panelView === 'sound' || panelView === 'add' || panelView === 'edit' ? 'active' : ''}`}
                  onClick={() => { if (selectedClip) setPanelView('sound'); }}
                >
                  🎵
                </button>
                <button
                  className={`panel-tab ${panelView === 'profile' ? 'active' : ''}`}
                  onClick={() => setPanelView('profile')}
                >
                  👤
                </button>
              </div>
              <button className="panel-close" onClick={() => { setPanelView('none'); setPanelExpanded(false); }}>
                ✕
              </button>
            </div>
            <div className="panel-content">{renderPanelContent()}</div>
          </div>
        )}
      </div>
    </AudioProvider>
  );
}
