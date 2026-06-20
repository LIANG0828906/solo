import React, { useRef, useEffect, useState } from 'react';
import { useAudioEngine } from './AudioEngine';
import { formatTime, drawWaveform, validateAudioFile } from '../utils/audioUtils';

interface TrackCardProps {
  trackId: string;
}

const TrackCard: React.FC<TrackCardProps> = ({ trackId }) => {
  const { tracks, loadAudioFile, togglePlay, setTrackVolume } = useAudioEngine();
  const track = tracks.find((t) => t.id === trackId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (waveformCanvasRef.current && track && track.waveformData.length > 0) {
      const canvas = waveformCanvasRef.current;
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = 30;
      }
      drawWaveform(canvas, track.waveformData);
    }
  }, [track?.waveformData]);

  if (!track) return null;

  const handleFileSelect = async (file: File) => {
    const validation = validateAudioFile(file);
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    await loadAudioFile(file, trackId);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];

    const validation = validateAudioFile(file);
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer.slice(0));

      if (audioBuffer.duration > 30) {
        alert('音频文件时长不能超过30秒');
        return;
      }

      await loadAudioFile(file, trackId);
    } catch (error) {
      console.error('校验文件失败:', error);
      alert('音频文件校验失败');
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTrackVolume(trackId, parseInt(e.target.value, 10));
  };

  if (!track.isLoaded) {
    return (
      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClickUpload}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".wav,.mp3,audio/wav,audio/mp3,audio/mpeg"
          className="hidden-input"
          onChange={handleInputChange}
        />
        <span className="upload-zone-icon">+</span>
        <span className="upload-zone-text">点击或拖拽上传音频</span>
        <span className="upload-zone-hint">WAV/MP3，≤30秒</span>
      </div>
    );
  }

  return (
    <div
      className={`track-card ${isDragging ? 'dropzone-active' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".wav,.mp3,audio/wav,audio/mp3,audio/mpeg"
        className="hidden-input"
        onChange={handleInputChange}
      />
      <div className="track-header" onClick={handleClickUpload} style={{ cursor: 'pointer' }}>
        <span className="track-name" title={track.name}>
          {track.name}
        </span>
        <span className="track-duration">{formatTime(track.duration)}</span>
      </div>
      <div className="track-waveform">
        <canvas ref={waveformCanvasRef} style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="track-controls">
        <button
          className={`track-play-btn ${track.isPlaying ? 'playing' : ''}`}
          onClick={() => togglePlay(trackId)}
          title={track.isPlaying ? '暂停' : '播放'}
        >
          {track.isPlaying ? '⏸' : '▶'}
        </button>
        <div className="track-volume">
          <div className="slider-label">
            <span>音量</span>
            <span className="slider-value">{track.volume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={track.volume}
            onChange={handleVolumeChange}
          />
        </div>
      </div>
    </div>
  );
};

const TrackPanel: React.FC = () => {
  const { tracks, addEmptyTrack } = useAudioEngine();
  const MAX_TRACKS = 4;

  const handleAddTrack = () => {
    if (tracks.length < MAX_TRACKS) {
      addEmptyTrack();
    }
  };

  return (
    <div className="track-panel">
      {tracks.map((track) => (
        <TrackCard key={track.id} trackId={track.id} />
      ))}
      {tracks.length < MAX_TRACKS && (
        <div
          className="upload-zone"
          onClick={handleAddTrack}
          style={{ cursor: 'pointer' }}
        >
          <span className="upload-zone-icon">+</span>
          <span className="upload-zone-text">添加新轨道</span>
          <span className="upload-zone-hint">
            {tracks.length}/{MAX_TRACKS} 个轨道
          </span>
        </div>
      )}
    </div>
  );
};

export default TrackPanel;
