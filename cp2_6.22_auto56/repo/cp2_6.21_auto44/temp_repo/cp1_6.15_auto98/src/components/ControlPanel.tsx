import React, { useRef, useCallback, useState } from 'react';
import { useMediaContext, type TransitionType } from '@/context/MediaContext';
import {
  Upload, Music, Play, Download, Trash2, Volume2,
  Timer, Sparkles, Palette, ChevronDown
} from 'lucide-react';

const TRANSITION_OPTIONS: { value: TransitionType; label: string }[] = [
  { value: 'fade', label: '淡入淡出' },
  { value: 'slideLeft', label: '左滑入' },
  { value: 'zoom', label: '缩放放大' },
  { value: 'rotate', label: '旋转进入' },
  { value: 'checkerboard', label: '棋盘格碎裂' },
];

const OVERLAY_COLORS = [
  'linear-gradient(135deg, #ff6b6b, #ee5a24)',
  'linear-gradient(135deg, #4a90d9, #0f3460)',
  'linear-gradient(135deg, #e8c3b9, #c49b8a)',
  'linear-gradient(135deg, #6c5ce7, #a29bfe)',
  'linear-gradient(135deg, #00b894, #00cec9)',
  'linear-gradient(135deg, #fdcb6e, #f39c12)',
];

const OVERLAY_SOLID = [
  '#ff6b6b',
  '#4a90d9',
  '#e8c3b9',
  '#6c5ce7',
  '#00b894',
  '#fdcb6e',
];

export default function ControlPanel() {
  const { state, dispatch } = useMediaContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const fileArray = Array.from(files);
    const total = state.photos.length + fileArray.length;
    if (total > 12) {
      alert('最多支持12张照片');
      return;
    }
    dispatch({ type: 'ADD_PHOTOS', payload: fileArray });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [state.photos.length, dispatch]);

  const handleAudioUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    dispatch({ type: 'SET_AUDIO', payload: { file, url } });
  }, [dispatch]);

  const handleRemoveAudio = useCallback(() => {
    dispatch({ type: 'SET_AUDIO', payload: null });
  }, [dispatch]);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    (e.currentTarget as HTMLElement).classList.add('dragging');
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove('dragging');
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (sourceIndex === targetIndex) return;
    const newPhotos = [...state.photos];
    const [moved] = newPhotos.splice(sourceIndex, 1);
    newPhotos.splice(targetIndex, 0, moved);
    dispatch({ type: 'REORDER_PHOTOS', payload: newPhotos.map((p, i) => ({ ...p, order: i })) });
  }, [state.photos, dispatch]);

  const handleOverlayColor = useCallback((_color: string, solid: string) => {
    dispatch({
      type: 'SET_OVERLAY_COLOR',
      payload: state.overlayColor === solid ? null : solid,
    });
  }, [state.overlayColor, dispatch]);

  return (
    <>
      <div className="control-panel-mobile">
        <button
          className="btn btn-sm"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Sparkles size={16} />
          控制面板
          <ChevronDown size={14} style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
        </button>
      </div>

      <div className={`control-panel glass ${menuOpen ? 'mobile-open' : ''}`}>
        <div className="panel-content">
          <div className="panel-section">
            <div className="section-label">
              <Upload size={12} style={{ display: 'inline', marginRight: 4 }} />
              照片上传 (6-12张)
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
            <button
              className="btn btn-sm"
              onClick={() => fileInputRef.current?.click()}
              style={{ width: '100%' }}
            >
              <Upload size={14} />
              选择照片 ({state.photos.length}/12)
            </button>

            {state.photos.length > 0 && (
              <div className="photo-grid">
                {state.photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="photo-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    style={{ width: 72, height: 72 }}
                  >
                    <img src={photo.url} alt={`照片 ${index + 1}`} />
                    <button
                      className="photo-remove"
                      onClick={() => dispatch({ type: 'REMOVE_PHOTO', payload: photo.id })}
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel-section">
            <div className="section-label">
              <Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} />
              转场效果
            </div>
            <select
              value={state.transitionType}
              onChange={(e) => dispatch({ type: 'SET_TRANSITION', payload: e.target.value as TransitionType })}
            >
              {TRANSITION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="panel-section">
            <div className="section-label">
              <Timer size={12} style={{ display: 'inline', marginRight: 4 }} />
              停留时间: {state.photoDuration.toFixed(1)}秒
            </div>
            <input
              type="range"
              min={2}
              max={4}
              step={0.5}
              value={state.photoDuration}
              onChange={(e) => dispatch({ type: 'SET_DURATION', payload: parseFloat(e.target.value) })}
            />
          </div>

          <div className="panel-section">
            <div className="section-label">
              <Palette size={12} style={{ display: 'inline', marginRight: 4 }} />
              叠加色块
            </div>
            <div className="color-palette">
              {OVERLAY_COLORS.map((gradient, i) => (
                <button
                  key={i}
                  className={`color-swatch ${state.overlayColor === OVERLAY_SOLID[i] ? 'active' : ''}`}
                  style={{ background: gradient }}
                  onClick={() => handleOverlayColor(gradient, OVERLAY_SOLID[i])}
                />
              ))}
            </div>
          </div>

          <div className="panel-section">
            <div className="section-label">
              <Music size={12} style={{ display: 'inline', marginRight: 4 }} />
              背景音乐
            </div>
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/mp3,audio/wav,audio/mpeg,audio/*"
              onChange={handleAudioUpload}
              style={{ display: 'none' }}
            />
            {state.audioFile ? (
              <div className="audio-info">
                <span className="audio-name">{state.audioFile.name}</span>
                <button className="btn btn-sm" onClick={handleRemoveAudio}>
                  <Trash2 size={12} />
                </button>
              </div>
            ) : (
              <button
                className="btn btn-sm"
                onClick={() => audioInputRef.current?.click()}
                style={{ width: '100%' }}
              >
                <Music size={14} />
                选择音频
              </button>
            )}
          </div>

          <div className="panel-section">
            <div className="section-label">
              <Volume2 size={12} style={{ display: 'inline', marginRight: 4 }} />
              音量: {state.volume}%
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={state.volume}
              onChange={(e) => dispatch({ type: 'SET_VOLUME', payload: parseInt(e.target.value) })}
              style={{
                background: `linear-gradient(90deg, var(--color-starblue) ${state.volume}%, rgba(255,255,255,0.1) ${state.volume}%)`,
              }}
            />
            <div className="toggle-row">
              <span className="toggle-label">淡入淡出</span>
              <div
                className={`toggle-switch ${state.fadeInOut ? 'active' : ''}`}
                onClick={() => dispatch({ type: 'SET_FADE_IN_OUT', payload: !state.fadeInOut })}
              />
            </div>
          </div>

          <div className="panel-actions">
            <button
              className="btn btn-primary btn-lg"
              disabled={state.photos.length < 2 || state.isExporting}
              style={{ width: '100%' }}
            >
              <Play size={18} />
              预览视频
            </button>

            {state.isExporting ? (
              <div style={{ width: '100%' }}>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${state.exportProgress}%` }} />
                </div>
                <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  导出中 {state.exportProgress}%
                </div>
              </div>
            ) : (
              <button
                className="btn btn-rosegold btn-lg"
                disabled={state.photos.length < 2}
                style={{ width: '100%' }}
              >
                <Download size={18} />
                生成并下载
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
