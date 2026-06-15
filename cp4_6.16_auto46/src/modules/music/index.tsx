import React, { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Plus,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Upload,
  Image,
  Music,
  FileText,
  Trash2,
  X,
  Save,
  Eye,
} from 'lucide-react';
import { useStore } from '@/store';
import { MusicTrack, TrackStatus } from '@/types';
import { cropToSquare, fileToDataURL, validateImageFile, validateAudioFile } from '@/utils/image';
import './styles.css';

interface TrackFormData {
  title: string;
  coverImage: string;
  audioFile: string;
  lyrics: string;
  status: TrackStatus;
}

const MusicModule: React.FC = () => {
  const {
    artist,
    tracks,
    currentTrackIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    addTrack,
    updateTrack,
    deleteTrack,
    playTrack,
    pauseTrack,
    nextTrack,
    prevTrack,
    setCurrentTime,
    setVolume,
  } = useStore();

  const [showUploader, setShowUploader] = useState(false);
  const [formData, setFormData] = useState<TrackFormData>({
    title: '',
    coverImage: '',
    audioFile: '',
    lyrics: '',
    status: 'draft',
  });
  const [isCropping, setIsCropping] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);

  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);

  const publishedTracks = tracks.filter((t) => t.status === 'published');
  const currentTrack = currentTrackIndex >= 0 ? tracks[currentTrackIndex] : null;

  useEffect(() => {
    setIsMuted(volume === 0);
  }, [volume]);

  const handleCoverUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !validateImageFile(file)) {
      alert('请上传有效的图片文件');
      return;
    }

    setIsCropping(true);
    try {
      const croppedImage = await cropToSquare(file, 300);
      setFormData((prev) => ({ ...prev, coverImage: croppedImage }));
    } catch (error) {
      console.error('封面裁剪失败:', error);
      alert('封面裁剪失败');
    } finally {
      setIsCropping(false);
    }
  }, []);

  const handleAudioUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!validateAudioFile(file)) {
      alert('请上传MP3格式的音频文件，且大小不超过15MB');
      return;
    }

    setIsUploadingAudio(true);
    try {
      const dataUrl = await fileToDataURL(file);
      setFormData((prev) => ({ ...prev, audioFile: dataUrl }));
    } catch (error) {
      console.error('音频上传失败:', error);
      alert('音频上传失败');
    } finally {
      setIsUploadingAudio(false);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (!artist) return;

    if (!formData.title.trim()) {
      alert('请输入作品标题');
      return;
    }
    if (!formData.coverImage) {
      alert('请上传封面图片');
      return;
    }
    if (!formData.audioFile) {
      alert('请上传音频文件');
      return;
    }

    const track: MusicTrack = {
      id: uuidv4(),
      artistId: artist.id,
      title: formData.title,
      coverImage: formData.coverImage,
      audioFile: formData.audioFile,
      lyrics: formData.lyrics,
      status: formData.status,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addTrack(track);
    setShowUploader(false);
    setFormData({
      title: '',
      coverImage: '',
      audioFile: '',
      lyrics: '',
      status: 'draft',
    });
  }, [artist, formData, addTrack]);

  const handlePlayClick = useCallback(
    (index: number) => {
      const track = publishedTracks[index];
      const originalIndex = tracks.findIndex((t) => t.id === track.id);
      if (originalIndex !== -1) {
        if (currentTrackIndex === originalIndex && isPlaying) {
          pauseTrack();
        } else {
          playTrack(originalIndex);
        }
      }
    },
    [publishedTracks, tracks, currentTrackIndex, isPlaying, playTrack, pauseTrack]
  );

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || duration === 0) return;
      const rect = progressRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * duration;
      setCurrentTime(newTime);
    },
    [duration, setCurrentTime]
  );

  const handleVolumeClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!volumeRef.current) return;
      const rect = volumeRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setVolume(percent);
    },
    [setVolume]
  );

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setVolume(0.7);
    } else {
      setVolume(0);
    }
    setIsMuted(!isMuted);
  }, [isMuted, setVolume]);

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="music-module">
      <div className="music-header">
        <h2 className="section-title">作品墙</h2>
        <button className="btn btn-primary" onClick={() => setShowUploader(true)}>
          <Plus size={18} />
          发布作品
        </button>
      </div>

      {publishedTracks.length === 0 ? (
        <div className="empty-state card">
          <Music size={48} className="empty-icon" />
          <p>还没有已发布的作品</p>
          <p className="empty-hint">点击上方按钮发布你的第一首作品</p>
        </div>
      ) : (
        <div className="track-wall">
          {publishedTracks.map((track, index) => {
            const originalIndex = tracks.findIndex((t) => t.id === track.id);
            const isCurrentTrack = currentTrackIndex === originalIndex;
            return (
              <div
                key={track.id}
                className={`track-card card fade-in ${isCurrentTrack ? 'playing' : ''}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="track-cover-wrapper">
                  <img
                    src={track.coverImage}
                    alt={track.title}
                    className="track-cover"
                    loading="lazy"
                  />
                  <div className="track-overlay">
                    <button
                      className="play-btn"
                      onClick={() => handlePlayClick(index)}
                      title={isCurrentTrack && isPlaying ? '暂停' : '播放'}
                    >
                      {isCurrentTrack && isPlaying ? <Pause size={24} /> : <Play size={24} />}
                    </button>
                  </div>
                  {isCurrentTrack && isPlaying && (
                    <div className="playing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  )}
                </div>
                <div className="track-info">
                  <h3 className="track-title">{track.title}</h3>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showUploader && (
        <div className="uploader-modal-overlay" onClick={() => setShowUploader(false)}>
          <div className="uploader-modal scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>发布新作品</h3>
              <button className="close-btn" onClick={() => setShowUploader(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label>作品标题 *</label>
                <input
                  type="text"
                  className="input"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="输入作品标题"
                />
              </div>

              <div className="form-group">
                <label>封面图片 *</label>
                <div className="cover-upload-area">
                  {formData.coverImage ? (
                    <div className="cover-preview">
                      <img src={formData.coverImage} alt="封面预览" />
                      <label className="reupload-btn">
                        <Image size={16} />
                        重新上传
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverUpload}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="upload-placeholder">
                      <Upload size={32} />
                      <p>{isCropping ? '裁剪中...' : '点击上传封面图'}</p>
                      <p className="upload-hint">将自动裁剪为正方形</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>音频文件 (MP3, 最大15MB) *</label>
                <div className="audio-upload-area">
                  {formData.audioFile ? (
                    <div className="audio-uploaded">
                      <Music size={24} className="audio-icon" />
                      <span className="audio-name">已选择音频文件</span>
                      <label className="reupload-btn">
                        <Upload size={16} />
                        重新上传
                        <input
                          type="file"
                          accept="audio/mp3,audio/mpeg"
                          onChange={handleAudioUpload}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  ) : (
                    <label className="upload-placeholder">
                      <Music size={32} />
                      <p>{isUploadingAudio ? '上传中...' : '点击上传音频文件'}</p>
                      <input
                        type="file"
                        accept="audio/mp3,audio/mpeg"
                        onChange={handleAudioUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>
                  <FileText size={16} />
                  歌词 (可选)
                </label>
                <textarea
                  className="input"
                  value={formData.lyrics}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lyrics: e.target.value }))}
                  placeholder="输入歌词内容"
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>发布状态</label>
                <div className="status-options">
                  <label className="status-option">
                    <input
                      type="radio"
                      name="status"
                      value="draft"
                      checked={formData.status === 'draft'}
                      onChange={() => setFormData((prev) => ({ ...prev, status: 'draft' }))}
                    />
                    <span>草稿</span>
                  </label>
                  <label className="status-option">
                    <input
                      type="radio"
                      name="status"
                      value="published"
                      checked={formData.status === 'published'}
                      onChange={() => setFormData((prev) => ({ ...prev, status: 'published' }))}
                    />
                    <span>已发布</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowUploader(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                <Save size={18} />
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {currentTrack && (
        <div className="mini-player slide-up">
          <div className="player-content">
            <div className="player-track-info">
              <img src={currentTrack.coverImage} alt={currentTrack.title} className="player-cover" />
              <div className="player-details">
                <h4 className="player-title">{currentTrack.title}</h4>
                <p className="player-artist">{artist?.name}</p>
              </div>
              {currentTrack.lyrics && (
                <button
                  className="lyrics-btn"
                  onClick={() => setShowLyrics(!showLyrics)}
                  title={showLyrics ? '隐藏歌词' : '显示歌词'}
                >
                  <FileText size={18} />
                </button>
              )}
            </div>

            <div className="player-controls">
              <button className="control-btn" onClick={prevTrack} title="上一首">
                <SkipBack size={20} />
              </button>
              <button className="control-btn play-control" onClick={isPlaying ? pauseTrack : playTrack.bind(null, currentTrackIndex)}>
                {isPlaying ? <Pause size={28} /> : <Play size={28} />}
              </button>
              <button className="control-btn" onClick={nextTrack} title="下一首">
                <SkipForward size={20} />
              </button>
            </div>

            <div className="player-progress-section">
              <div className="player-progress" ref={progressRef} onClick={handleProgressClick}>
                <div className="progress-bar" style={{ width: `${progressPercent}%` }} />
                <div
                  className="progress-thumb"
                  style={{ left: `calc(${progressPercent}% - 6px)` }}
                />
              </div>
              <div className="time-display">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="player-volume-section">
              <button className="control-btn" onClick={toggleMute} title={isMuted ? '取消静音' : '静音'}>
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <div className="volume-slider" ref={volumeRef} onClick={handleVolumeClick}>
                <div className="volume-bar" style={{ width: `${(isMuted ? 0 : volume) * 100}%` }} />
              </div>
            </div>
          </div>

          {showLyrics && currentTrack.lyrics && (
            <div className="lyrics-panel scale-in">
              <div className="lyrics-content">
                <pre>{currentTrack.lyrics}</pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MusicModule;
