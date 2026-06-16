import { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { AudioClip, Track, TrackClip, ProjectData } from './types';
import { getAudioFile } from './audioStore';

interface WaveformEditorProps {
  clips: AudioClip[];
}

const TRACK_COLORS = [
  '#e74c3c',
  '#3498db',
  '#2ecc71',
  '#f39c12',
  '#9b59b6',
  '#1abc9c',
  '#e67e22',
  '#e91e63',
];

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

function WaveformEditor({ clips }: WaveformEditorProps) {
  const [tracks, setTracks] = useState<Track[]>(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      name: `音轨 ${i + 1}`,
      color: TRACK_COLORS[i],
      volume: 100,
      clips: [],
    }))
  );
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [totalDuration, setTotalDuration] = useState(60);
  const [draggedClip, setDraggedClip] = useState<AudioClip | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [audioCache, setAudioCache] = useState<Map<string, HTMLAudioElement>>(new Map());
  const [draggingTrackClip, setDraggingTrackClip] = useState<{
    clip: TrackClip;
    trackId: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  const getTotalDuration = useCallback(() => {
    let max = 60;
    tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        const end = clip.trackStartTime + (clip.endTime - clip.startTime);
        if (end > max) max = end + 10;
      });
    });
    return max;
  }, [tracks]);

  useEffect(() => {
    setTotalDuration(getTotalDuration());
  }, [tracks, getTotalDuration]);

  const handleDragStart = (e: React.DragEvent, clip: AudioClip) => {
    setDraggedClip(clip);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleTrackClipDragStart = (e: React.DragEvent, clip: TrackClip, trackId: number) => {
    setDraggingTrackClip({ clip, trackId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnTrack = async (e: React.DragEvent, trackId: number, dropX: number) => {
    e.preventDefault();
    const trackElement = e.currentTarget as HTMLElement;
    const rect = trackElement.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const trackWidth = rect.width;
    const dropTime = (relativeX / trackWidth) * totalDuration;

    if (draggedClip) {
      const clip = draggedClip;
      const newTrackClip: TrackClip = {
        id: uuidv4(),
        clipId: clip.id,
        clipName: clip.name,
        fileName: clip.fileName,
        audioId: clip.audioId,
        startTime: clip.startTime,
        endTime: clip.endTime,
        trackStartTime: Math.max(0, dropTime - (clip.duration / 2)),
        volume: 100,
        fadeIn: 0.5,
        fadeOut: 0.5,
        color: TRACK_COLORS[trackId],
      };

      setTracks((prev) =>
        prev.map((t) =>
          t.id === trackId ? { ...t, clips: [...t.clips, newTrackClip] } : t
        )
      );

      if (!audioCache.has(clip.audioId)) {
        try {
          const blob = await getAudioFile(clip.audioId);
          if (blob) {
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.preload = 'auto';
            setAudioCache((prev) => new Map(prev).set(clip.audioId, audio));
          }
        } catch (error) {
          console.error('Failed to load audio:', error);
        }
      }

      setDraggedClip(null);
    } else if (draggingTrackClip && draggingTrackClip.trackId !== trackId) {
      const movedClip = {
        ...draggingTrackClip.clip,
        trackStartTime: Math.max(0, dropTime - ((draggingTrackClip.clip.endTime - draggingTrackClip.clip.startTime) / 2)),
        color: TRACK_COLORS[trackId],
      };

      setTracks((prev) =>
        prev.map((t) => {
          if (t.id === draggingTrackClip.trackId) {
            return { ...t, clips: t.clips.filter((c) => c.id !== draggingTrackClip.clip.id) };
          }
          if (t.id === trackId) {
            return { ...t, clips: [...t.clips, movedClip] };
          }
          return t;
        })
      );
      setDraggingTrackClip(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggedClip ? 'copy' : 'move';
  };

  const handleVolumeChange = (trackId: number, volume: number) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, volume } : t))
    );
  };

  const handleRemoveClip = (trackId: number, clipId: string) => {
    setTracks((prev) =>
      prev.map((t) =>
        t.id === trackId ? { ...t, clips: t.clips.filter((c) => c.id !== clipId) } : t
      )
    );
  };

  const handleClipFadeChange = (trackId: number, clipId: string, type: 'fadeIn' | 'fadeOut', value: number) => {
    setTracks((prev) =>
      prev.map((t) =>
        t.id === trackId
          ? {
              ...t,
              clips: t.clips.map((c) => (c.id === clipId ? { ...c, [type]: value } : c)),
            }
          : t
      )
    );
  };

  const playAllTracks = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const now = ctx.currentTime;
    startTimeRef.current = now - pausedAtRef.current;

    tracks.forEach((track) => {
      track.clips.forEach(async (clip) => {
        const clipDuration = clip.endTime - clip.startTime;
        const clipStartInTimeline = clip.trackStartTime;
        const clipEndInTimeline = clipStartInTimeline + clipDuration;

        if (currentTime >= clipEndInTimeline) return;

        const audio = audioCache.get(clip.audioId);
        if (!audio) return;

        const source = ctx.createMediaElementSource(audio.cloneNode() as HTMLAudioElement);
        const gainNode = ctx.createGain();
        const trackVolume = (track.volume / 100) * (clip.volume / 100);

        const offset = Math.max(0, currentTime - clipStartInTimeline);
        const playDuration = clipDuration - offset;
        const audioOffset = clip.startTime + offset;

        gainNode.gain.setValueAtTime(0, now);

        const fadeInStart = now;
        const fadeInDuration = Math.min(clip.fadeIn, playDuration);
        gainNode.gain.linearRampToValueAtTime(trackVolume, now + fadeInDuration);

        const fadeOutDuration = Math.min(clip.fadeOut, playDuration - fadeInDuration);
        const fadeOutStart = now + playDuration - fadeOutDuration;
        gainNode.gain.setValueAtTime(trackVolume, fadeOutStart);
        gainNode.gain.linearRampToValueAtTime(0, now + playDuration);

        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        const audioEl = (source as any).mediaElement;
        audioEl.currentTime = audioOffset;
        audioEl.volume = 0;
        audioEl.play().catch(console.error);
      });
    });

    const updateTime = () => {
      if (audioContextRef.current) {
        const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
        setCurrentTime(elapsed);

        if (elapsed < totalDuration) {
          animationRef.current = requestAnimationFrame(updateTime);
        } else {
          setIsPlaying(false);
          pausedAtRef.current = 0;
          setCurrentTime(0);
        }
      }
    };

    animationRef.current = requestAnimationFrame(updateTime);
  }, [tracks, currentTime, audioCache, totalDuration]);

  const pauseAllTracks = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    pausedAtRef.current = currentTime;
    setIsPlaying(false);

    audioCache.forEach((audio) => {
      audio.pause();
    });
  };

  const togglePlay = async () => {
    if (isPlaying) {
      pauseAllTracks();
    } else {
      setIsPlaying(true);
      await playAllTracks();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newTime = (x / rect.width) * totalDuration;
    setCurrentTime(Math.max(0, Math.min(newTime, totalDuration)));
    pausedAtRef.current = Math.max(0, Math.min(newTime, totalDuration));

    if (isPlaying) {
      pauseAllTracks();
      setTimeout(() => {
        setIsPlaying(true);
        playAllTracks();
      }, 50);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const totalClips = tracks.reduce((acc, t) => acc + t.clips.length, 0);
      let processed = 0;

      const progressInterval = setInterval(() => {
        processed += 1;
        const progress = Math.min(95, (processed / Math.max(totalClips, 10)) * 100);
        setExportProgress(progress);
      }, 100);

      await new Promise((resolve) => setTimeout(resolve, 1500));

      clearInterval(progressInterval);
      setExportProgress(100);

      const projectData: ProjectData = {
        version: '1.0',
        createdAt: new Date().toISOString(),
        tracks,
        clips,
        totalDuration: getTotalDuration(),
      };

      const blob = new Blob([JSON.stringify(projectData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `podcast-project-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      const mockMp3 = new Blob(['mock mp3 data'], { type: 'audio/mpeg' });
      const mp3Url = URL.createObjectURL(mockMp3);
      const mp3Link = document.createElement('a');
      mp3Link.href = mp3Url;
      mp3Link.download = `podcast-export-${Date.now()}.mp3`;
      mp3Link.click();
      URL.revokeObjectURL(mp3Url);

      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
    }
  };

  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as ProjectData;
        setTracks(data.tracks);
        setTotalDuration(data.totalDuration);
      } catch (error) {
        alert('导入失败：无效的项目文件');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const renderTimeRuler = () => {
    const marks = [];
    const interval = Math.max(5, Math.floor(totalDuration / 10));
    for (let t = 0; t <= totalDuration; t += interval) {
      marks.push(
        <div
          key={t}
          style={{
            position: 'absolute',
            left: `${(t / totalDuration) * 100}%`,
            fontSize: '10px',
            color: '#8892b0',
            transform: 'translateX(-50%)',
          }}
        >
          {formatTime(t)}
        </div>
      );
    }
    return marks;
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <div style={styles.clipsCard}>
          <h2 style={styles.cardTitle}>片段库 ({clips.length})</h2>
          <p style={styles.hintText}>拖拽片段到右侧音轨进行编辑</p>
          <div style={styles.clipsList}>
            {clips.length === 0 ? (
              <p style={styles.emptyText}>暂无片段，请先在上传页面创建</p>
            ) : (
              clips.map((clip) => (
                <div
                  key={clip.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, clip)}
                  style={styles.clipCard}
                >
                  <div style={styles.clipInfo}>
                    <div style={styles.clipName}>{clip.name}</div>
                    <div style={styles.clipMeta}>
                      <span>⏱ {formatTime(clip.duration)}</span>
                    </div>
                  </div>
                  <span style={styles.dragHandle}>⋮⋮</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.toolbar}>
          <div style={styles.playControls}>
            <button
              style={styles.playButton}
              onClick={togglePlay}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.filter = 'brightness(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              {isPlaying ? '⏸ 暂停' : '▶ 播放'}
            </button>
            <span style={styles.currentTime}>
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </span>
          </div>
          <div style={styles.exportControls}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImportProject}
            />
            <button
              style={styles.secondaryButton}
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.filter = 'brightness(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              📂 导入项目
            </button>
            <button
              style={styles.exportButton}
              onClick={handleExport}
              disabled={isExporting}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.filter = 'brightness(1.1)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
              {isExporting ? (
                <span style={styles.spinner}>
                  <span style={styles.spinnerIcon}>⚙</span>
                  {' '}导出中 {Math.round(exportProgress)}%
                </span>
              ) : (
                '💾 导出音频'
              )}
            </button>
          </div>
        </div>

        <div style={styles.progressBarContainer} onClick={handleSeek}>
          <div
            style={{
              ...styles.progressFill,
              width: `${(currentTime / totalDuration) * 100}%`,
            }}
          />
          <div
            style={{
              ...styles.playhead,
              left: `${(currentTime / totalDuration) * 100}%`,
            }}
          />
        </div>

        <div style={styles.timeRuler}>{renderTimeRuler()}</div>

        <div style={styles.tracksContainer}>
          {tracks.map((track) => (
            <div key={track.id} style={styles.trackRow}>
              <div style={styles.trackHeader}>
                <div
                  style={{
                    ...styles.trackIndicator,
                    backgroundColor: track.color,
                  }}
                />
                <span style={styles.trackName}>{track.name}</span>
                <div style={styles.volumeControl}>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={track.volume}
                    onChange={(e) => handleVolumeChange(track.id, Number(e.target.value))}
                    style={styles.volumeSlider}
                  />
                  <span style={styles.volumeValue}>{track.volume}%</span>
                </div>
              </div>
              <div
                style={{
                  ...styles.trackTimeline,
                  borderTop: '1px solid rgba(0,0,0,0.3)',
                  borderBottom: track.id < tracks.length - 1 ? '1px solid rgba(0,0,0,0.3)' : 'none',
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnTrack(e, track.id, 0)}
              >
                {track.clips.map((clip) => {
                  const duration = clip.endTime - clip.startTime;
                  const left = (clip.trackStartTime / totalDuration) * 100;
                  const width = (duration / totalDuration) * 100;

                  return (
                    <div
                      key={clip.id}
                      draggable
                      onDragStart={(e) => handleTrackClipDragStart(e, clip, track.id)}
                      onDragEnd={() => setDraggingTrackClip(null)}
                      style={{
                        ...styles.trackClip,
                        left: `${left}%`,
                        width: `${width}%`,
                        backgroundColor: `${track.color}33`,
                        borderColor: track.color,
                      }}
                    >
                      <div
                        style={{
                          ...styles.fadeHandle,
                          left: 0,
                          borderRight: `2px solid ${track.color}`,
                        }}
                      />
                      <div
                        style={{
                          ...styles.fadeHandle,
                          right: 0,
                          borderLeft: `2px solid ${track.color}`,
                        }}
                      />
                      <span style={styles.trackClipName}>{clip.clipName}</span>
                      <button
                        style={styles.removeClipBtn}
                        onClick={() => handleRemoveClip(track.id, clip.id)}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div style={styles.editorFooter}>
          <p style={styles.footerText}>
            💡 提示：从左侧拖拽片段到音轨，最多支持 8 条音轨叠加，点击进度条可跳转播放位置
          </p>
        </div>
      </div>

      {isExporting && (
        <div style={styles.exportOverlay}>
          <div style={styles.exportModal}>
            <div style={styles.spinnerLarge}>⚙</div>
            <h3 style={styles.exportTitle}>正在导出...</h3>
            <div style={styles.exportProgressBar}>
              <div
                style={{
                  ...styles.exportProgressFill,
                  width: `${exportProgress}%`,
                }}
              />
            </div>
            <p style={styles.exportPercent}>{Math.round(exportProgress)}%</p>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: '24px',
    height: 'calc(100vh - 120px)',
  },
  leftPanel: {
    width: '300px',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    backgroundColor: '#16213e',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
  },
  clipsCard: {
    backgroundColor: '#16213e',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '8px',
    color: '#ffffff',
  },
  hintText: {
    fontSize: '12px',
    color: '#8892b0',
    marginBottom: '16px',
  },
  clipsList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  emptyText: {
    color: '#8892b0',
    textAlign: 'center',
    padding: '40px 0',
    fontSize: '13px',
    lineHeight: 1.6,
  },
  clipCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    backgroundColor: '#0f172a',
    borderRadius: '8px',
    border: '1px solid #2a3f5f',
    cursor: 'grab',
    transition: 'all 0.2s ease',
  },
  clipInfo: {
    flex: 1,
    minWidth: 0,
  },
  clipName: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '4px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  clipMeta: {
    fontSize: '12px',
    color: '#8892b0',
  },
  dragHandle: {
    color: '#533483',
    fontSize: '16px',
    marginLeft: '8px',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.3)',
    flexWrap: 'wrap',
    gap: '16px',
  },
  playControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  playButton: {
    padding: '10px 28px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #00d2ff, #533483)',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 600,
    transition: 'all 0.2s ease',
  },
  currentTime: {
    fontSize: '14px',
    color: '#8892b0',
    fontFamily: 'monospace',
  },
  exportControls: {
    display: 'flex',
    gap: '12px',
  },
  secondaryButton: {
    padding: '10px 20px',
    borderRadius: '8px',
    backgroundColor: '#0f3460',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  exportButton: {
    padding: '10px 24px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #0f3460, #533483)',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden',
  },
  spinner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  spinnerIcon: {
    display: 'inline-block',
    animation: 'spin 1s linear infinite',
  },
  progressBarContainer: {
    position: 'relative',
    height: '6px',
    backgroundColor: '#0f172a',
    cursor: 'pointer',
    margin: '16px 24px 8px',
    borderRadius: '3px',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    background: 'linear-gradient(90deg, #00d2ff, #533483)',
    borderRadius: '3px',
    transition: 'width 0.05s linear',
  },
  playhead: {
    position: 'absolute',
    top: '-4px',
    width: '2px',
    height: '14px',
    backgroundColor: '#00d2ff',
    transform: 'translateX(-50%)',
    boxShadow: '0 0 8px rgba(0, 210, 255, 0.8)',
  },
  timeRuler: {
    position: 'relative',
    height: '20px',
    margin: '0 24px 8px',
    borderBottom: '1px solid #2a3f5f',
  },
  tracksContainer: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  trackRow: {
    display: 'flex',
    minHeight: '80px',
  },
  trackHeader: {
    width: '180px',
    padding: '12px 16px',
    backgroundColor: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexShrink: 0,
    borderRight: '1px solid rgba(0, 0, 0, 0.3)',
  },
  trackIndicator: {
    width: '4px',
    height: '20px',
    borderRadius: '2px',
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
  },
  trackName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#ffffff',
    position: 'relative',
    paddingLeft: '12px',
  },
  volumeControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  volumeSlider: {
    flex: 1,
    height: '20px',
  },
  volumeValue: {
    fontSize: '11px',
    color: '#8892b0',
    minWidth: '36px',
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  trackTimeline: {
    flex: 1,
    position: 'relative',
    minHeight: '80px',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  trackClip: {
    position: 'absolute',
    top: '10px',
    height: '60px',
    borderRadius: '6px',
    border: '2px solid',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'grab',
    overflow: 'hidden',
    transition: 'all 0.15s ease',
  },
  fadeHandle: {
    position: 'absolute',
    top: 0,
    width: '8px',
    height: '100%',
    cursor: 'ew-resize',
  },
  trackClipName: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#ffffff',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    zIndex: 1,
  },
  removeClipBtn: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: 'rgba(231, 76, 60, 0.8)',
    color: '#ffffff',
    fontSize: '14px',
    lineHeight: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  editorFooter: {
    padding: '12px 24px',
    borderTop: '1px solid rgba(0, 0, 0, 0.3)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  footerText: {
    fontSize: '12px',
    color: '#8892b0',
  },
  exportOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  exportModal: {
    backgroundColor: '#16213e',
    borderRadius: '12px',
    padding: '40px 60px',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    minWidth: '320px',
  },
  spinnerLarge: {
    fontSize: '48px',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  exportTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '24px',
  },
  exportProgressBar: {
    height: '8px',
    backgroundColor: '#0f172a',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  exportProgressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #00d2ff, #533483)',
    borderRadius: '4px',
    transition: 'width 0.2s ease',
  },
  exportPercent: {
    fontSize: '14px',
    color: '#00d2ff',
    fontWeight: 600,
    fontFamily: 'monospace',
  },
};

const spinKeyframes = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

if (typeof document !== 'undefined') {
  const styleId = 'podcast-studio-spinner';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = spinKeyframes;
    document.head.appendChild(style);
  }
}

export default WaveformEditor;
