import React, { useState, useEffect, useRef } from 'react';
import {
  useTrackStore,
  parseDuration,
  formatDuration,
  type Track,
} from './store';
import { useCanvasStore } from '../canvas/store';
import { averageColors, complementaryColor } from '../utils/colorAnalysis';

const TrackRow: React.FC<{
  track: Track;
  index: number;
  isCurrent: boolean;
  gradient: string;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDragEnd: () => void;
  dragOverId: string | null;
}> = ({ track, index, isCurrent, gradient, onDragStart, onDragOver, onDragEnd, dragOverId }) => {
  const updateTrack = useTrackStore(s => s.updateTrack);
  const removeTrack = useTrackStore(s => s.removeTrack);
  const setCurrentTrack = useTrackStore(s => s.setCurrentTrack);
  const progress = useTrackStore(s => s.progress);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(track.title);
  const [durText, setDurText] = useState(formatDuration(track.durationSec));

  useEffect(() => {
    setTitle(track.title);
    setDurText(formatDuration(track.durationSec));
  }, [track.title, track.durationSec]);

  const commit = () => {
    const sec = parseDuration(durText.trim());
    updateTrack(track.id, {
      title: title.trim() || '未命名曲目',
      durationSec: sec > 0 ? sec : 180,
    });
    setEditing(false);
  };

  return (
    <div
      className={`track-row ${isCurrent ? 'is-current' : ''} ${dragOverId === track.id ? 'drag-over' : ''}`}
      draggable={!editing}
      onDragStart={() => onDragStart(track.id)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(track.id); }}
      onDragEnd={onDragEnd}
      onDoubleClick={() => setEditing(true)}
      onClick={() => setCurrentTrack(track.id)}
    >
      <div className="track-progress" style={{ width: isCurrent ? `${progress * 100}%` : '0%', background: gradient }} />

      <div className="track-number">
        {isCurrent ? (
          <div className="playing-indicator">
            <span />
            <span />
            <span />
          </div>
        ) : (
          index + 1
        )}
      </div>

      {editing ? (
        <div className="track-edit">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="曲名"
            autoFocus
            onPointerDown={(e) => e.stopPropagation()}
          />
          <input
            value={durText}
            onChange={(e) => setDurText(e.target.value)}
            placeholder="分:秒 (例 3:45)"
            onPointerDown={(e) => e.stopPropagation()}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') setEditing(false);
            }}
          />
          <button className="btn-mini" onClick={(e) => { e.stopPropagation(); commit(); }}>保存</button>
        </div>
      ) : (
        <>
          <div className="track-info">
            <div className="track-title">{track.title}</div>
            <div className="track-sub">{track.artist} · {track.albumTitle}</div>
          </div>
          <div className="track-duration">{formatDuration(track.durationSec)}</div>
          <button
            className="track-delete"
            onClick={(e) => { e.stopPropagation(); removeTrack(track.id); }}
            title="删除曲目"
          >
            ×
          </button>
        </>
      )}
    </div>
  );
};

const AddTrackForm: React.FC = () => {
  const covers = useCanvasStore(s => s.covers);
  const tracks = useTrackStore(s => s.tracks);
  const addTrack = useTrackStore(s => s.addTrack);
  const selectedId = useCanvasStore(s => s.selectedId);

  const [coverId, setCoverId] = useState('');
  const [title, setTitle] = useState('');
  const [durText, setDurText] = useState('3:30');

  useEffect(() => {
    if (selectedId && !coverId) setCoverId(selectedId);
    if (!selectedId && covers.length > 0 && !coverId) setCoverId(covers[0].id);
  }, [selectedId, covers, coverId]);

  const coverOptions = covers.map(c => ({
    id: c.id,
    label: `${c.album.artist} - ${c.album.title}`,
    count: tracks.filter(t => t.coverId === c.id).length,
    album: c.album,
  }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const cover = covers.find(c => c.id === coverId);
    if (!cover) return;
    const count = tracks.filter(t => t.coverId === coverId).length;
    if (count >= 3) return;
    const sec = parseDuration(durText.trim());
    if (sec <= 0) return;
    addTrack({
      coverId,
      albumTitle: cover.album.title,
      artist: cover.album.artist,
      title: title.trim() || '未命名曲目',
      durationSec: sec,
    });
    setTitle('');
  };

  if (covers.length === 0) {
    return (
      <div className="track-empty">
        <div>先在画布上添加唱片封面</div>
        <div className="track-empty-sub">之后即可为每张封面添加 1–3 首曲目</div>
      </div>
    );
  }

  return (
    <form className="add-track-form" onSubmit={submit}>
      <div className="form-title">添加曲目</div>
      <select
        value={coverId}
        onChange={(e) => setCoverId(e.target.value)}
      >
        {coverOptions.map(opt => (
          <option key={opt.id} value={opt.id} disabled={opt.count >= 3}>
            {opt.label} ({opt.count}/3)
          </option>
        ))}
      </select>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="曲名"
        required
      />
      <input
        value={durText}
        onChange={(e) => setDurText(e.target.value)}
        placeholder="分:秒 (如 3:45)"
        pattern="^\d+:[0-5]\d$"
        title="格式: 分:秒，如 3:45"
        required
      />
      <button type="submit" className="btn-primary">+ 添加</button>
    </form>
  );
};

const TrackList: React.FC = () => {
  const tracks = useTrackStore(s => s.tracks);
  const isPlaying = useTrackStore(s => s.isPlaying);
  const currentTrackId = useTrackStore(s => s.currentTrackId);
  const progress = useTrackStore(s => s.progress);
  const togglePlay = useTrackStore(s => s.togglePlay);
  const setCurrentTrack = useTrackStore(s => s.setCurrentTrack);
  const setProgress = useTrackStore(s => s.setProgress);
  const stopPlayback = useTrackStore(s => s.stopPlayback);
  const reorderTracks = useTrackStore(s => s.reorderTracks);
  const covers = useCanvasStore(s => s.covers);

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying || !currentTrackId) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    const tick = (ts: number) => {
      if (!lastTickRef.current) lastTickRef.current = ts;
      const dt = (ts - lastTickRef.current) / 1000;
      lastTickRef.current = ts;
      const current = tracks.find(t => t.id === currentTrackId);
      if (!current) {
        stopPlayback();
        return;
      }
      const nextProgress = progress + dt / Math.max(current.durationSec, 1);
      if (nextProgress >= 1) {
        const idx = tracks.findIndex(t => t.id === currentTrackId);
        if (idx < tracks.length - 1) {
          setCurrentTrack(tracks[idx + 1].id);
          setProgress(0);
        } else {
          stopPlayback();
          return;
        }
      } else {
        setProgress(nextProgress);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTickRef.current = 0;
    };
  }, [isPlaying, currentTrackId, progress, tracks, setCurrentTrack, setProgress, stopPlayback]);

  const gradient = (() => {
    const colors = covers.map(c => c.album.primaryColor);
    if (colors.length === 0) return 'linear-gradient(90deg, #5D4037, #8D6E63)';
    const avg = averageColors(colors);
    const comp = complementaryColor(avg);
    return `linear-gradient(90deg, ${avg}, ${comp})`;
  })();

  const handleDragStart = (id: string) => setDragId(id);
  const handleDragOver = (id: string) => setDragOverId(id);
  const handleDragEnd = () => {
    if (dragId && dragOverId && dragId !== dragOverId) {
      const ids = tracks.map(t => t.id);
      const from = ids.indexOf(dragId);
      const to = ids.indexOf(dragOverId);
      if (from >= 0 && to >= 0) {
        const [moved] = ids.splice(from, 1);
        ids.splice(to, 0, moved);
        reorderTracks(ids);
      }
    }
    setDragId(null);
    setDragOverId(null);
  };

  const currentTrack = tracks.find(t => t.id === currentTrackId);

  return (
    <div className="track-list">
      <div className="track-header">
        <div className="track-header-title">曲目列表</div>
        <div className="track-count">{tracks.length} 首</div>
      </div>

      {currentTrack && (
        <div className="now-playing">
          <div className="np-label">正在播放</div>
          <div className="np-info">
            <div className="np-title">{currentTrack.title}</div>
            <div className="np-sub">{currentTrack.artist} · {currentTrack.albumTitle}</div>
          </div>
          <div className="np-duration">
            {formatDuration(currentTrack.durationSec * progress)} / {formatDuration(currentTrack.durationSec)}
          </div>
          <div className="np-progress">
            <div className="np-progress-bar" style={{ width: `${progress * 100}%`, background: gradient }} />
          </div>
        </div>
      )}

      <div className="player-controls">
        <button
          className={`play-btn ${isPlaying ? 'playing' : ''}`}
          onClick={togglePlay}
          disabled={tracks.length === 0}
          style={{ background: gradient }}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
          <span>{isPlaying ? '暂停' : '播放'}</span>
        </button>
      </div>

      <AddTrackForm />

      <div className="tracks">
        {tracks.length === 0 && (
          <div className="track-empty">
            <div>还没有曲目</div>
            <div className="track-empty-sub">使用上方表单为封面添加曲目</div>
          </div>
        )}
        {tracks.map((track, idx) => (
          <TrackRow
            key={track.id}
            track={track}
            index={idx}
            isCurrent={track.id === currentTrackId}
            gradient={gradient}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            dragOverId={dragOverId}
          />
        ))}
      </div>
    </div>
  );
};

export default TrackList;
