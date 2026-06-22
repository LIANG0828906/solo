import { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { AudioClip, Track, TrackClip, ProjectData } from './types';
import { getAudioFile } from './audioStore';

interface WaveformEditorProps {
  clips: AudioClip[];
}

const MAX_TRACKS = 8;

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

const TRACK_COLOR_NAMES = ['红色', '蓝色', '绿色', '橙色', '紫色', '青色', '深橙', '粉色'];

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

const isValidAudioClip = (obj: any): obj is AudioClip => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.audioId === 'string' &&
    typeof obj.fileName === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.startTime === 'number' &&
    typeof obj.endTime === 'number' &&
    typeof obj.duration === 'number'
  );
};

const isValidTrackClipMove = (obj: any): boolean => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.clip === 'object' &&
    typeof obj.clip.id === 'string' &&
    typeof obj.trackId === 'number'
  );
};

function WaveformEditor({ clips }: WaveformEditorProps) {
  const [tracks, setTracks] = useState<Track[]>(() =>
    Array.from({ length: MAX_TRACKS }, (_, i) => ({
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
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [activeTrackDrop, setActiveTrackDrop] = useState<number | null>(null);
  const [selectedClip, setSelectedClip] = useState<{ trackId: number; clipId: string } | null>(null);
  const [fadeInValue, setFadeInValue] = useState(0.5);
  const [fadeOutValue, setFadeOutValue] = useState(0.5);
  const [sidePanelOpen, setSidePanelOpen] = useState(true);

  const audioCacheRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const activeSourceNodesRef = useRef<MediaElementAudioSourceNode[]>([]);
  const projectFileInputRef = useRef<HTMLInputElement>(null);
  const dragClipRef = useRef<AudioClip | null>(null);
  const dragTrackClipRef = useRef<{ clip: TrackClip; trackId: number } | null>(null);
  const clipsRef = useRef<AudioClip[]>([]);

  clipsRef.current = clips;

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

  useEffect(() => {
    clips.forEach(async (clip) => {
      if (!audioCacheRef.current.has(clip.audioId)) {
        try {
          const blob = await getAudioFile(clip.audioId);
          if (blob) {
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.preload = 'auto';
            audioCacheRef.current.set(clip.audioId, audio);
          }
        } catch (e) {
          console.error('Failed to preload audio:', e);
        }
      }
    });
  }, [clips]);

  useEffect(() => {
    const handleGlobalDragEnd = () => {
      dragClipRef.current = null;
      dragTrackClipRef.current = null;
      setActiveTrackDrop(null);
    };
    document.addEventListener('dragend', handleGlobalDragEnd);

    const handleDocumentDrop = (e: DragEvent) => {
      if (e.target === document.body || e.target === document.documentElement) {
        setActiveTrackDrop(null);
      }
    };
    document.addEventListener('drop', handleDocumentDrop);

    const handleGlobalDragOver = (e: DragEvent) => {
      e.dataTransfer && (e.dataTransfer.dropEffect = 'none');
    };
    document.addEventListener('dragover', handleGlobalDragOver);

    return () => {
      document.removeEventListener('dragend', handleGlobalDragEnd);
      document.removeEventListener('drop', handleDocumentDrop);
      document.removeEventListener('dragover', handleGlobalDragOver);
    };
  }, []);

  const validateClipData = (dataStr: string): AudioClip | null => {
    try {
      const parsed = JSON.parse(dataStr);
      if (!isValidAudioClip(parsed)) return null;
      const existsInLibrary = clipsRef.current.some((c) => c.id === parsed.id);
      return existsInLibrary ? parsed : null;
    } catch {
      return null;
    }
  };

  const validateTrackClipMoveData = (dataStr: string): { clip: TrackClip; trackId: number } | null => {
    try {
      const parsed = JSON.parse(dataStr);
      if (!isValidTrackClipMove(parsed)) return null;
      const { trackId } = parsed;
      const srcTrack = tracks.find((t) => t.id === trackId);
      if (!srcTrack) return null;
      const clipExists = srcTrack.clips.some((c) => c.id === parsed.clip.id);
      return clipExists ? parsed : null;
    } catch {
      return null;
    }
  };

  const handleClipDragStart = (e: React.DragEvent, clip: AudioClip) => {
    dragClipRef.current = clip;
    dragTrackClipRef.current = null;
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/x-audio-clip', JSON.stringify(clip));
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.add('dragging');
    }
  };

  const handleClipDragEnd = (e: React.DragEvent) => {
    dragClipRef.current = null;
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.remove('dragging');
    }
    setActiveTrackDrop(null);
  };

  const handleTrackClipDragStart = (e: React.DragEvent, clip: TrackClip, trackId: number) => {
    dragTrackClipRef.current = { clip, trackId };
    dragClipRef.current = null;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/x-track-clip', JSON.stringify({ clip, trackId }));
    e.stopPropagation();
  };

  const handleTrackClipDragEnd = () => {
    dragTrackClipRef.current = null;
    setActiveTrackDrop(null);
  };

  const handleTrackDragOver = (e: React.DragEvent, trackId: number) => {
    const clipData = e.dataTransfer.types.includes('application/x-audio-clip');
    const moveData = e.dataTransfer.types.includes('application/x-track-clip');
    if (!clipData && !moveData) return;

    e.preventDefault();
    e.stopPropagation();

    if (clipData) {
      e.dataTransfer.dropEffect = 'copy';
    } else if (moveData) {
      e.dataTransfer.dropEffect = 'move';
    }

    if (activeTrackDrop !== trackId) {
      setActiveTrackDrop(trackId);
    }
  };

  const handleTrackDragLeave = (e: React.DragEvent, trackId: number) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setActiveTrackDrop((prev) => (prev === trackId ? null : prev));
    }
  };

  const handleTrackDrop = async (e: React.DragEvent, trackId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveTrackDrop(null);

    if (trackId >= MAX_TRACKS) return;

    const trackElement = e.currentTarget as HTMLElement;
    const rect = trackElement.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const trackWidth = rect.width;
    const dropTime = (relativeX / trackWidth) * totalDuration;

    const clipDataStr = e.dataTransfer.getData('application/x-audio-clip');
    const trackClipDataStr = e.dataTransfer.getData('application/x-track-clip');

    if (clipDataStr) {
      const clip = validateClipData(clipDataStr);
      if (!clip) return;

      const newTrackClip: TrackClip = {
        id: uuidv4(),
        clipId: clip.id,
        clipName: clip.name,
        fileName: clip.fileName,
        audioId: clip.audioId,
        startTime: clip.startTime,
        endTime: clip.endTime,
        trackStartTime: Math.max(0, dropTime - clip.duration / 2),
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

      if (!audioCacheRef.current.has(clip.audioId)) {
        try {
          const blob = await getAudioFile(clip.audioId);
          if (blob) {
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.preload = 'auto';
            audioCacheRef.current.set(clip.audioId, audio);
          }
        } catch (err) {
          console.error('Failed to load audio:', err);
        }
      }

      dragClipRef.current = null;
    } else if (trackClipDataStr) {
      const moveData = validateTrackClipMoveData(trackClipDataStr);
      if (!moveData) return;
      const { clip, trackId: srcTrackId } = moveData;
      if (srcTrackId === trackId) return;

      const movedClip: TrackClip = {
        ...clip,
        trackStartTime: Math.max(
          0,
          dropTime - (clip.endTime - clip.startTime) / 2
        ),
        color: TRACK_COLORS[trackId],
      };

      setTracks((prev) =>
        prev.map((t) => {
          if (t.id === srcTrackId) {
            return { ...t, clips: t.clips.filter((c) => c.id !== clip.id) };
          }
          if (t.id === trackId) {
            return { ...t, clips: [...t.clips, movedClip] };
          }
          return t;
        })
      );

      dragTrackClipRef.current = null;
    }
  };

  const handleVolumeChange = (trackId: number, rawPercent: number) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, volume: Math.round(rawPercent) } : t))
    );
  };

  const handleRemoveClip = (trackId: number, clipId: string) => {
    setTracks((prev) =>
      prev.map((t) =>
        t.id === trackId ? { ...t, clips: t.clips.filter((c) => c.id !== clipId) } : t
      )
    );
    if (selectedClip?.trackId === trackId && selectedClip?.clipId === clipId) {
      setSelectedClip(null);
    }
  };

  const handleClipClick = (trackId: number, clipId: string, clip: TrackClip) => {
    setSelectedClip({ trackId, clipId });
    setFadeInValue(clip.fadeIn);
    setFadeOutValue(clip.fadeOut);
  };

  const handleFadeInChange = (value: number) => {
    setFadeInValue(value);
    if (!selectedClip) return;
    const { trackId, clipId } = selectedClip;
    setTracks((prev) =>
      prev.map((t) =>
        t.id === trackId
          ? { ...t, clips: t.clips.map((c) => (c.id === clipId ? { ...c, fadeIn: value } : c))
          }
          : t
      )
    );
  };

  const handleFadeOutChange = (value: number) => {
    setFadeOutValue(value);
    if (!selectedClip) return;
    const { trackId, clipId } = selectedClip;
    setTracks((prev) =>
      prev.map((t) =>
        t.id === trackId
          ? { ...t, clips: t.clips.map((c) => (c.id === clipId ? { ...c, fadeOut: value } : c))
          }
          : t
      )
    );
  };

  const stopAllPlayback = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    activeSourceNodesRef.current.forEach((node) => {
      try {
        const el = (node as any).mediaElement as HTMLAudioElement;
        if (el) el.pause();
        node.disconnect();
      } catch {}
    });
    activeSourceNodesRef.current = [];
    audioCacheRef.current.forEach((audio) => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {}
    });
  }, []);

  const playAllTracks = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    stopAllPlayback();

    const now = ctx.currentTime;
    startTimeRef.current = now - pausedAtRef.current;
    activeSourceNodesRef.current = [];

    for (const track of tracks) {
      for (const clip of track.clips) {
        const clipDuration = clip.endTime - clip.startTime;
        const clipEndInTimeline = clip.trackStartTime + clipDuration;
        if (currentTime >= clipEndInTimeline) continue;

        const audio = audioCacheRef.current.get(clip.audioId);
        if (!audio) continue;

        try {
          const cloned = audio.cloneNode() as HTMLAudioElement;
          cloned.volume = 0;

          const source = ctx.createMediaElementSource(cloned);
          const gainNode = ctx.createGain();
          const trackVolumeMultiplier = (track.volume / 100) * (clip.volume / 100);

          const offset = Math.max(0, currentTime - clip.trackStartTime);
          const playDuration = clipDuration - offset;
          const audioOffset = clip.startTime + offset;

          gainNode.gain.setValueAtTime(0, now);

          const fadeInDur = Math.min(clip.fadeIn, playDuration);
          gainNode.gain.linearRampToValueAtTime(trackVolumeMultiplier, now + fadeInDur);

          const fadeOutDur = Math.min(clip.fadeOut, playDuration - fadeInDur);
          if (fadeOutDur > 0 && playDuration > fadeInDur) {
            gainNode.gain.setValueAtTime(trackVolumeMultiplier, now + playDuration - fadeOutDur);
            gainNode.gain.linearRampToValueAtTime(0, now + playDuration);
          }

          source.connect(gainNode);
          gainNode.connect(ctx.destination);

          cloned.currentTime = audioOffset;
          await cloned.play();

          activeSourceNodesRef.current.push(source);
        } catch (err) {
          console.error('Playback error for clip:', clip.clipName, err);
        }
      }
    }

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
  }, [tracks, currentTime, totalDuration, stopAllPlayback]);

  const pauseAllTracks = useCallback(() => {
    stopAllPlayback();
    pausedAtRef.current = currentTime;
    setIsPlaying(false);
  }, [currentTime, stopAllPlayback]);

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
    const clamped = Math.max(0, Math.min(newTime, totalDuration));
    setCurrentTime(clamped);
    pausedAtRef.current = clamped;
    if (isPlaying) {
      stopAllPlayback();
      setIsPlaying(false);
      setTimeout(async () => {
        setIsPlaying(true);
        await playAllTracks();
      }, 50);
    }
  };

  const buildProjectData = (): ProjectData => ({
    version: '1.0',
    createdAt: new Date().toISOString(),
    tracks,
    clips: clipsRef.current,
    totalDuration: getTotalDuration(),
  });

  const downloadProjectJson = () => {
    const projectData = buildProjectData();
    const jsonStr = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `podcast-project-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportAudio = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const progressSim = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 30) {
            clearInterval(progressSim);
            return 30;
          }
          return prev + 2;
        });
      }, 50);

      let exportSucceeded = false;

      try {
        const response = await fetch('/api/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tracks }),
        });

        clearInterval(progressSim);

        if (response.ok) {
          setExportProgress(55);

          const contentLength = response.headers.get('content-length');
          const total = contentLength ? parseInt(contentLength, 10) : 0;
          let received = 0;

          const reader = response.body?.getReader();
          const chunks: Uint8Array[] = [];

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value) {
                chunks.push(value);
                received += value.length;
                if (total > 0) {
                  setExportProgress(55 + Math.round((received / total) * 40));
                } else {
                  setExportProgress(Math.min(95, 55 + chunks.length * 4));
                }
              }
            }
          }

          setExportProgress(95);

          const blob = new Blob(chunks as BlobPart[], { type: 'audio/mpeg' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `podcast-export-${Date.now()}.mp3`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          setExportProgress(100);
          exportSucceeded = true;
        }
      } catch (err) {
        console.error('Backend export failed:', err);
      }

      if (!exportSucceeded) {
        clearInterval(progressSim);
        setExportProgress(60);
        downloadProjectJson();
        setExportProgress(100);
      } else {
        setTimeout(() => downloadProjectJson(), 500);
      }

      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 1500);
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleImportProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse((event.target?.result as string) || '{}') as ProjectData;
        if (data.tracks && Array.isArray(data.tracks) && data.tracks.length > 0) {
          const restoredTracks = Array.from({ length: MAX_TRACKS }, (_, i) => {
            const imported = data.tracks.find((t) => t.id === i);
            if (imported) {
              const validatedClips = imported.clips.map((c) => ({
                ...c,
                color: TRACK_COLORS[i],
              }));
              return {
                id: i,
                name: imported.name || `音轨 ${i + 1}`,
                color: TRACK_COLORS[i],
                volume: imported.volume ?? 100,
                clips: validatedClips,
              };
            }
            return {
              id: i,
              name: `音轨 ${i + 1}`,
              color: TRACK_COLORS[i],
              volume: 100,
              clips: [],
            };
          });
          setTracks(restoredTracks);
          setTotalDuration(data.totalDuration || 60);
          alert('项目导入成功！');
        } else {
          alert('导入成功，但没有检测到音轨数据');
        }
      } catch (error) {
        alert('导入失败：无效的项目文件格式');
      }
    };
    reader.onerror = () => {
      alert('导入失败：无法读取文件');
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
            fontFamily: 'monospace',
          }}
        >
          {formatTime(t)}
        </div>
      );
    }
    return marks;
  };

  const getVolumeColor = (volume: number): string => {
    if (volume <= 80) return '#2ecc71';
    if (volume <= 100) return '#27ae60';
    if (volume <= 150) return '#f39c12';
    return '#e74c3c';
  };

  const toggleSidePanel = () => setSidePanelOpen((v) => !v);

  return (
    <div className="main-layout" style={styles.container}>
      <button
        onClick={toggleSidePanel}
        style={styles.mobileToggle}
      >
        ☰
      </button>

      <div
        className={`clip-panel side-panel ${sidePanelOpen ? 'is-open' : 'is-closed'}`}
        style={styles.leftPanel}
      >
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
                  onDragStart={(e) => handleClipDragStart(e, clip)}
                  onDragEnd={handleClipDragEnd}
                  style={styles.clipCard}
                >
                  <div style={styles.clipInfo}>
                    <div style={styles.clipName}>{clip.name}</div>
                    <div style={styles.clipMeta}>
                      <span>⏱ {formatTime(clip.duration)}</span>
                      <span style={styles.clipFileName}>📄 {clip.fileName}</span>
                    </div>
                  </div>
                  <span style={styles.dragHandle}>⋮⋮</span>
                </div>
              ))
            )}
          </div>
        </div>

        {selectedClip && (
          <div style={styles.fadePanel}>
            <h3 style={styles.fadePanelTitle}>片段效果</h3>
            <div style={styles.fadeHeader}>
              <span style={styles.fadeClipName}>
                {
                  tracks
                    .find((t) => t.id === selectedClip.trackId)
                    ?.clips.find((c) => c.id === selectedClip.clipId)?.clipName
                }
              </span>
            </div>
            <div style={styles.fadeControl}>
              <label style={styles.fadeLabel}>淡入</label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={fadeInValue}
                onChange={(e) => handleFadeInChange(Number(e.target.value))}
                style={styles.fadeSlider}
              />
              <span style={styles.fadeValue}>{fadeInValue.toFixed(1)}s</span>
            </div>
            <div style={styles.fadeControl}>
              <label style={styles.fadeLabel}>淡出</label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={fadeOutValue}
                onChange={(e) => handleFadeOutChange(Number(e.target.value))}
                style={styles.fadeSlider}
              />
              <span style={styles.fadeValue}>{fadeOutValue.toFixed(1)}s</span>
            </div>
          </div>
        )}
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.toolbar}>
          <div style={styles.playControls}>
            <button style={styles.playButton} onClick={togglePlay}>
              {isPlaying ? '⏸ 暂停' : '▶ 播放'}
            </button>
            <button
              style={styles.stopButton}
              onClick={() => {
                stopAllPlayback();
                setIsPlaying(false);
                pausedAtRef.current = 0;
                setCurrentTime(0);
              }}
            >
              ⏹ 停止
            </button>
            <span style={styles.currentTimeDisplay}>
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </span>
          </div>
          <div style={styles.exportControls}>
            <input
              ref={projectFileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImportProject}
            />
            <button
              style={styles.exportButtonSecondary}
              onClick={() => projectFileInputRef.current?.click()}
            >
              📂 导入项目
            </button>
            <button style={styles.exportButtonSecondary} onClick={downloadProjectJson}>
              💼 导出项目
            </button>
            <button
              style={styles.exportButton}
              onClick={handleExportAudio}
              disabled={isExporting}
            >
              {isExporting ? (
                <span style={styles.spinnerWrap}>
                  <span style={styles.spinnerIcon}>⚙</span>
                  {' '}
                  导出中 {Math.round(exportProgress)}%
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

        <div className="tracks-container" style={styles.tracksContainer}>
          {tracks.map((track) => {
            const isDropTarget = activeTrackDrop === track.id;

            return (
              <div key={track.id} style={styles.trackRow}>
                <div
                  className="track-header-style"
                  style={{ ...styles.trackHeader, borderLeft: `4px solid ${track.color}` }}
                >
                  <div style={styles.trackHeaderTop}>
                    <span
                      style={{
                        ...styles.trackDot,
                        backgroundColor: track.color,
                      }}
                    />
                    <span style={styles.trackName}>{track.name}</span>
                    <span style={{ ...styles.trackColorLabel, color: track.color }}>
                      {TRACK_COLOR_NAMES[track.id]}
                    </span>
                  </div>
                  <div style={styles.volumeRow}>
                    <span style={styles.volumeIcon}>🔊</span>
                    <div style={styles.volumeSliderWrap}>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={track.volume}
                        onChange={(e) => handleVolumeChange(track.id, Number(e.target.value))}
                        style={styles.volumeSlider}
                      />
                      <div style={styles.volumeMarks}>
                        <span>0%</span>
                        <span style={{ color: '#00d2ff' }}>100%</span>
                        <span style={{ color: '#e74c3c' }}>200%</span>
                      </div>
                    </div>
                    <span
                      style={{
                        ...styles.volumeValue,
                        color: getVolumeColor(track.volume),
                      }}
                    >
                      {track.volume}%
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    ...styles.trackTimeline,
                    backgroundColor: isDropTarget
                      ? `${track.color}22`
                      : 'rgba(0, 0, 0, 0.1)',
                    borderColor: isDropTarget ? track.color : 'transparent',
                    borderStyle: isDropTarget ? 'dashed' : 'solid',
                    borderWidth: isDropTarget ? '2px' : '1px',
                  }}
                  onDragOver={(e) => handleTrackDragOver(e, track.id)}
                  onDragLeave={(e) => handleTrackDragLeave(e, track.id)}
                  onDrop={(e) => handleTrackDrop(e, track.id)}
                >
                  {track.clips.length === 0 && !isDropTarget && (
                    <div style={styles.emptyTrackHint}>拖拽片段到此处</div>
                  )}
                  {isDropTarget && <div style={styles.dropIndicator}>释放以添加到{track.name}</div>}
                  {track.clips.map((clip) => {
                    const duration = clip.endTime - clip.startTime;
                    const left = (clip.trackStartTime / totalDuration) * 100;
                    const width = (duration / totalDuration) * 100;
                    const isSelected =
                      selectedClip?.trackId === track.id && selectedClip?.clipId === clip.id;

                    return (
                      <div
                        key={clip.id}
                        draggable
                        onDragStart={(e) => handleTrackClipDragStart(e, clip, track.id)}
                        onDragEnd={handleTrackClipDragEnd}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClipClick(track.id, clip.id, clip);
                        }}
                        style={{
                          ...styles.trackClip,
                          left: `${left}%`,
                          width: `${Math.max(width, 1.5)}%`,
                          backgroundColor: `${track.color}33`,
                          borderColor: isSelected ? '#00d2ff' : track.color,
                          borderWidth: isSelected ? '3px' : '2px',
                          boxShadow: isSelected
                            ? `0 0 12px rgba(0, 210, 255, 0.5), inset 0 0 20px ${track.color}20`
                            : `inset 0 0 20px ${track.color}15`,
                        }}
                      >
                        {clip.fadeIn > 0 && (
                          <div
                            style={{
                              ...styles.fadeIndicator,
                              left: 0,
                              background: `linear-gradient(90deg, transparent, ${track.color}80)`,
                              width: `${Math.min((clip.fadeIn / duration) * 100, 40)}%`,
                            }}
                          />
                        )}
                        {clip.fadeOut > 0 && (
                          <div
                            style={{
                              ...styles.fadeIndicator,
                              right: 0,
                              background: `linear-gradient(270deg, transparent, ${track.color}80)`,
                              width: `${Math.min((clip.fadeOut / duration) * 100, 40)}%`,
                            }}
                          />
                        )}
                        <div style={styles.clipContent}>
                          <span style={styles.trackClipName}>{clip.clipName}</span>
                          <button
                            style={styles.removeClipBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveClip(track.id, clip.id);
                            }}
                          >
                            ×
                          </button>
                        </div>
                        <div style={styles.clipTimeLabel}>
                          {formatTime(clip.trackStartTime)} -{' '}
                          {formatTime(clip.trackStartTime + duration)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div style={styles.editorFooter}>
          <p style={styles.footerText}>
            💡 从左侧拖拽片段到音轨 · 最多 {MAX_TRACKS} 条音轨叠加 · 点击片段调整淡入淡出 · 点击进度条跳转
          </p>
        </div>
      </div>

      {isExporting && (
        <div style={styles.exportOverlay}>
          <div style={styles.exportModal}>
            <div style={styles.spinnerLargeWrap}>
              <span style={styles.spinnerLarge}>⚙</span>
            </div>
            <h3 style={styles.exportTitle}>正在导出混音...</h3>
            <div style={styles.exportProgressBar}>
              <div
                style={{
                  ...styles.exportProgressFill,
                  width: `${exportProgress}%`,
                }}
              />
            </div>
            <p style={styles.exportPercent}>{Math.round(exportProgress)}%</p>
            <p style={styles.exportHint}>
              {exportProgress < 30
                ? '正在准备音频数据...'
                : exportProgress < 60
                ? '正在执行 ffmpeg 混音处理...'
                : exportProgress < 95
                ? '正在生成 MP3 文件...'
                : '导出完成，正在下载...'}
            </p>
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
    position: 'relative',
  },
  mobileToggle: {
    display: 'none',
  },
  leftPanel: {
    width: '320px',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    gap: '16px',
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
    userSelect: 'none',
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
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    fontSize: '12px',
    color: '#8892b0',
  },
  clipFileName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  dragHandle: {
    color: '#533483',
    fontSize: '18px',
    marginLeft: '8px',
    letterSpacing: '2px',
  },
  fadePanel: {
    backgroundColor: '#16213e',
    borderRadius: '8px',
    padding: '16px 20px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
  },
  fadePanelTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: '#00d2ff',
    marginBottom: '12px',
  },
  fadeHeader: {
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #2a3f5f',
  },
  fadeClipName: {
    fontSize: '12px',
    color: '#ffffff',
    fontWeight: 500,
  },
  fadeControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px',
  },
  fadeLabel: {
    fontSize: '13px',
    color: '#8892b0',
    minWidth: '28px',
  },
  fadeSlider: {
    flex: 1,
    height: '20px',
  },
  fadeValue: {
    fontSize: '12px',
    color: '#00d2ff',
    fontFamily: 'monospace',
    minWidth: '36px',
    textAlign: 'right',
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
    gap: '12px',
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
  stopButton: {
    padding: '10px 16px',
    borderRadius: '8px',
    backgroundColor: '#0f3460',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  currentTimeDisplay: {
    fontSize: '14px',
    color: '#8892b0',
    fontFamily: 'monospace',
  },
  exportControls: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  exportButtonSecondary: {
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
  },
  spinnerWrap: {
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
    borderBottom: '1px solid rgba(0, 0, 0, 0.3)',
  },
  trackHeader: {
    width: '180px',
    padding: '10px 14px',
    backgroundColor: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flexShrink: 0,
    borderRight: '1px solid rgba(0, 0, 0, 0.3)',
  },
  trackHeaderTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  trackDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  trackName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#ffffff',
  },
  trackColorLabel: {
    fontSize: '11px',
    fontWeight: 500,
    marginLeft: 'auto',
  },
  volumeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  volumeIcon: {
    fontSize: '14px',
    flexShrink: 0,
  },
  volumeSliderWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  volumeSlider: {
    flex: 1,
    height: '20px',
  },
  volumeMarks: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '9px',
    color: '#5a6a8a',
    fontFamily: 'monospace',
  },
  volumeValue: {
    fontSize: '11px',
    fontWeight: 600,
    minWidth: '36px',
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  trackTimeline: {
    flex: 1,
    position: 'relative',
    minHeight: '80px',
    transition: 'all 0.2s ease',
  },
  emptyTrackHint: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: '#3a4a6a',
    fontSize: '12px',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
  },
  dropIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: '#00d2ff',
    fontSize: '13px',
    fontWeight: 600,
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    textShadow: '0 0 10px rgba(0, 210, 255, 0.5)',
  },
  trackClip: {
    position: 'absolute',
    top: '8px',
    height: '64px',
    borderRadius: '6px',
    borderStyle: 'solid',
    padding: '4px 8px',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'grab',
    overflow: 'hidden',
    transition: 'all 0.15s ease',
    userSelect: 'none',
  },
  fadeIndicator: {
    position: 'absolute',
    top: 0,
    height: '100%',
    pointerEvents: 'none',
  },
  clipContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    minWidth: 0,
  },
  trackClipName: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#ffffff',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    zIndex: 1,
    textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
  },
  removeClipBtn: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: 'rgba(231, 76, 60, 0.85)',
    color: '#ffffff',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    flexShrink: 0,
    marginLeft: '4px',
    padding: 0,
    lineHeight: 1,
  },
  clipTimeLabel: {
    fontSize: '9px',
    color: '#8892b0',
    fontFamily: 'monospace',
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  exportModal: {
    backgroundColor: '#16213e',
    borderRadius: '12px',
    padding: '48px 64px',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    minWidth: '360px',
    border: '1px solid #2a3f5f',
  },
  spinnerLargeWrap: {
    marginBottom: '20px',
  },
  spinnerLarge: {
    fontSize: '56px',
    display: 'inline-block',
    animation: 'spin 1s linear infinite',
    color: '#00d2ff',
  },
  exportTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#ffffff',
    marginBottom: '24px',
  },
  exportProgressBar: {
    height: '10px',
    backgroundColor: '#0f172a',
    borderRadius: '5px',
    overflow: 'hidden',
    marginBottom: '12px',
    border: '1px solid #2a3f5f',
  },
  exportProgressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #00d2ff, #533483)',
    borderRadius: '5px',
    transition: 'width 0.3s ease',
  },
  exportPercent: {
    fontSize: '16px',
    color: '#00d2ff',
    fontWeight: 700,
    fontFamily: 'monospace',
    marginBottom: '8px',
  },
  exportHint: {
    fontSize: '13px',
    color: '#8892b0',
  },
};

export default WaveformEditor;
