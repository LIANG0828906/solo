import React, { useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Square, Plus, ZoomIn, ZoomOut, Users, Trash2 } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { audioEngine } from './AudioEngine';
import { sampleManager } from '../samples/SampleManager';
import { CollabManager } from '../collab/CollabManager';
import { Track } from './Track';
import { TrackItem } from './TrackItem';
import { Playhead } from './Playhead';
import { CollaboratorCursor } from '../collab/CollaboratorCursor';
import { InviteModal } from '../components/InviteModal';
import { IconButton } from '../components/IconButton';
import { Button } from '../components/Button';
import type { Sample } from '../types';
import {
  TRACK_HEIGHT,
  TRACK_WIDTH,
  PIXELS_PER_SECOND_BASE,
  GRID_INTERVAL,
  MIN_ZOOM,
  MAX_ZOOM,
  SAMPLE_PANEL_WIDTH,
} from '../types';

interface TimelineEditorProps {
  collabManager: CollabManager | null;
}

export const TimelineEditor: React.FC<TimelineEditorProps> = ({ collabManager }) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = React.useState(false);
  const [dragOverTrack, setDragOverTrack] = React.useState<string | null>(null);
  const [dragPosition, setDragPosition] = React.useState<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const {
    project,
    currentUserId,
    selectedTrackId,
    selectedClipId,
    playhead,
    isPlaying,
    zoom,
    scrollLeft,
    setSelectedTrackId,
    setSelectedClipId,
    setPlayhead,
    setIsPlaying,
    setZoom,
    setScrollLeft,
    addTrack,
    updateTrack,
    addClip,
    updateClip,
    deleteClip,
    applyOperation,
  } = useProjectStore();

  useEffect(() => {
    audioEngine.setOnPlayheadUpdate((time) => {
      setPlayhead(time);
    });

    return () => {
      audioEngine.setOnPlayheadUpdate(null);
    };
  }, [setPlayhead]);

  useEffect(() => {
    if (!collabManager) return;

    const unsubscribe = collabManager.subscribe((message) => {
      if (message.type === 'user-joined') {
        useProjectStore.getState().addCollaborator(message.user);
      } else if (message.type === 'user-left') {
        useProjectStore.getState().removeCollaborator(message.userId);
      } else if (message.type === 'operation-broadcast') {
        applyOperation(message.operation);
      }
    });

    return unsubscribe;
  }, [collabManager, applyOperation]);

  useEffect(() => {
    const preloadSamples = async () => {
      for (const clip of project.clips) {
        await audioEngine.loadSample(clip.sampleId, sampleManager.getSampleById(clip.sampleId)?.url || '');
      }
    };
    preloadSamples();
  }, [project.clips]);

  const handlePlayPause = async () => {
    await audioEngine.ensureContextRunning();

    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      const startTime = playhead;
      audioEngine.play(project.clips, project.tracks, startTime);
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    audioEngine.stop();
    setIsPlaying(false);
    setPlayhead(0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollLeft;
    const pixelsPerSecond = PIXELS_PER_SECOND_BASE * zoom;
    const time = x / pixelsPerSecond;
    const snappedTime = Math.round(time / GRID_INTERVAL) * GRID_INTERVAL;

    if (isPlaying) {
      audioEngine.pause();
      audioEngine.seek(Math.max(0, snappedTime));
      audioEngine.play(project.clips, project.tracks, Math.max(0, snappedTime));
    } else {
      audioEngine.seek(Math.max(0, snappedTime));
      setPlayhead(Math.max(0, snappedTime));
    }
  };

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta));
        setZoom(newZoom);
      } else {
        if (scrollContainerRef.current) {
          const newScrollLeft = Math.max(0, scrollLeft + e.deltaX + e.deltaY);
          setScrollLeft(newScrollLeft);
          scrollContainerRef.current.scrollLeft = newScrollLeft;
        }
      }
    },
    [zoom, scrollLeft, setZoom, setScrollLeft]
  );

  const handleDragOver = (e: React.DragEvent, trackId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTrack(trackId);

    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollLeft;
      const pixelsPerSecond = PIXELS_PER_SECOND_BASE * zoom;
      const time = x / pixelsPerSecond;
      const snappedTime = Math.round(time / GRID_INTERVAL) * GRID_INTERVAL;
      setDragPosition(Math.max(0, snappedTime));
    }

    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = () => {
    setDragOverTrack(null);
    setDragPosition(null);
  };

  const handleDrop = async (e: React.DragEvent, trackId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const sampleId = e.dataTransfer.getData('sampleId');
    if (!sampleId || !timelineRef.current) return;

    const sample = sampleManager.getSampleById(sampleId);
    if (!sample) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollLeft;
    const pixelsPerSecond = PIXELS_PER_SECOND_BASE * zoom;
    const time = x / pixelsPerSecond;
    const snappedTime = Math.round(time / GRID_INTERVAL) * GRID_INTERVAL;

    await audioEngine.loadSample(sample.id, sample.url);

    const clipData = {
      trackId,
      sampleId,
      start: Math.max(0, snappedTime),
      duration: sample.duration,
      fadeIn: 0.05,
      fadeOut: 0.05,
      volume: 1,
    };

    addClip(clipData);

    if (collabManager) {
      const newClip = useProjectStore.getState().project.clips[useProjectStore.getState().project.clips.length - 1];
      collabManager.broadcastClipAdd(newClip);
    }

    setDragOverTrack(null);
    setDragPosition(null);
  };

  const handleTrackSelect = (trackId: string) => {
    setSelectedTrackId(trackId);
    setSelectedClipId(null);
  };

  const handleClipSelect = (clipId: string) => {
    setSelectedClipId(clipId);
    setSelectedTrackId(null);
  };

  const handleClipMove = (clipId: string, newStart: number) => {
    updateClip(clipId, { start: newStart });
    if (collabManager) {
      collabManager.broadcastClipMove(clipId, { start: newStart });
    }
  };

  const handleFadeInChange = (clipId: string, value: number) => {
    updateClip(clipId, { fadeIn: value });
    if (collabManager) {
      collabManager.broadcastClipUpdate(clipId, { fadeIn: value });
    }
    const clip = project.clips.find((c) => c.id === clipId);
    if (clip) {
      audioEngine.setFade(clipId, value, clip.fadeOut, project.clips, project.tracks);
    }
  };

  const handleFadeOutChange = (clipId: string, value: number) => {
    updateClip(clipId, { fadeOut: value });
    if (collabManager) {
      collabManager.broadcastClipUpdate(clipId, { fadeOut: value });
    }
    const clip = project.clips.find((c) => c.id === clipId);
    if (clip) {
      audioEngine.setFade(clipId, clip.fadeIn, value, project.clips, project.tracks);
    }
  };

  const handleClipDelete = (clipId: string) => {
    deleteClip(clipId);
    if (collabManager) {
      collabManager.broadcastClipDelete(clipId);
    }
  };

  const handleVolumeChange = (trackId: string, volume: number) => {
    updateTrack(trackId, { volume });
    if (collabManager) {
      collabManager.broadcastTrackUpdate(trackId, { volume });
    }
    audioEngine.setVolume(trackId, volume, project.clips, project.tracks);
  };

  const handleMuteToggle = (trackId: string) => {
    const track = project.tracks.find((t) => t.id === trackId);
    if (track) {
      updateTrack(trackId, { muted: !track.muted });
      if (collabManager) {
        collabManager.broadcastTrackUpdate(trackId, { muted: !track.muted });
      }
      if (isPlaying) {
        audioEngine.pause();
        audioEngine.play(project.clips, project.tracks, playhead);
      }
    }
  };

  const handleSoloToggle = (trackId: string) => {
    const track = project.tracks.find((t) => t.id === trackId);
    if (track) {
      updateTrack(trackId, { solo: !track.solo });
      if (collabManager) {
        collabManager.broadcastTrackUpdate(trackId, { solo: !track.solo });
      }
      if (isPlaying) {
        audioEngine.pause();
        audioEngine.play(project.clips, project.tracks, playhead);
      }
    }
  };

  const handleNameChange = (trackId: string, name: string) => {
    updateTrack(trackId, { name });
    if (collabManager) {
      collabManager.broadcastTrackUpdate(trackId, { name });
    }
  };

  const handleAddTrack = () => {
    addTrack();
    if (collabManager) {
      const tracks = useProjectStore.getState().project.tracks;
      collabManager.broadcastTrackAdd(tracks[tracks.length - 1]);
    }
  };

  const handleZoomIn = () => {
    setZoom(Math.min(MAX_ZOOM, zoom + 0.25));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(MIN_ZOOM, zoom - 0.25));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!collabManager || !scrollContainerRef.current) return;
    const rect = scrollContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollLeft;
    const y = e.clientY - rect.top;
    collabManager.broadcastCursorMove({ x, y });
  };

  const handleMouseLeave = () => {
    if (collabManager) {
      collabManager.broadcastCursorMove(null);
    }
  };

  const renderGrid = () => {
    const pixelsPerSecond = PIXELS_PER_SECOND_BASE * zoom;
    const majorInterval = 1;
    const minorInterval = 0.5;
    const totalDuration = 60;
    const lines = [];

    for (let t = 0; t <= totalDuration; t += minorInterval) {
      const x = t * pixelsPerSecond;
      const isMajor = t % majorInterval === 0;
      lines.push(
        <div
          key={`grid-${t}`}
          style={{
            position: 'absolute',
            left: `${x}px`,
            top: 0,
            bottom: 0,
            width: isMajor ? '1px' : '1px',
            backgroundColor: isMajor ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
            pointerEvents: 'none',
          }}
        />
      );

      if (isMajor) {
        lines.push(
          <div
            key={`label-${t}`}
            style={{
              position: 'absolute',
              left: `${x + 4}px`,
              top: '4px',
              fontSize: '10px',
              fontFamily: 'var(--font-family-mono)',
              color: 'var(--color-text-muted)',
              pointerEvents: 'none',
            }}
          >
            {Math.floor(t / 60).toString().padStart(2, '0')}:
            {Math.floor(t % 60).toString().padStart(2, '0')}
          </div>
        );
      }
    }

    return lines;
  };

  const totalHeight = project.tracks.length * TRACK_HEIGHT + 32;
  const pixelsPerSecond = PIXELS_PER_SECOND_BASE * zoom;
  const totalWidth = Math.max(60 * pixelsPerSecond, (playhead + 10) * pixelsPerSecond);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          backgroundColor: 'var(--color-bg-secondary)',
          borderBottom: '1px solid var(--color-border)',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <IconButton onClick={handlePlayPause} title={isPlaying ? '暂停' : '播放'}>
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </IconButton>
          <IconButton onClick={handleStop} title="停止">
            <Square size={16} />
          </IconButton>
        </div>

        <div
          style={{
            fontFamily: 'var(--font-family-mono)',
            fontSize: '14px',
            color: 'var(--color-text)',
            backgroundColor: 'var(--color-bg-primary)',
            padding: '6px 12px',
            borderRadius: '6px',
            minWidth: '100px',
            textAlign: 'center',
          }}
        >
          {formatTime(playhead)}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <IconButton onClick={handleZoomOut} title="缩小" disabled={zoom <= MIN_ZOOM}>
            <ZoomOut size={16} />
          </IconButton>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--color-text-muted)',
              minWidth: '40px',
              textAlign: 'center',
            }}
          >
            {Math.round(zoom * 100)}%
          </span>
          <IconButton onClick={handleZoomIn} title="放大" disabled={zoom >= MAX_ZOOM}>
            <ZoomIn size={16} />
          </IconButton>
        </div>

        <Button onClick={handleAddTrack} size="sm">
          <Plus size={14} /> 添加音轨
        </Button>

        <Button
          onClick={() => setIsInviteModalOpen(true)}
          size="sm"
          variant="primary"
          disabled={project.collaborators.length >= 3}
        >
          <Users size={14} /> 邀请协作
        </Button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div
          style={{
            width: `${TRACK_WIDTH}px`,
            backgroundColor: 'var(--color-bg-primary)',
            borderRight: '1px solid var(--color-border)',
            padding: '16px 8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              height: '28px',
              marginBottom: '4px',
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '11px',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            音轨 ({project.tracks.length})
          </div>
          {project.tracks.map((track) => (
            <Track
              key={track.id}
              track={track}
              isSelected={selectedTrackId === track.id}
              onSelect={() => handleTrackSelect(track.id)}
              onVolumeChange={(v) => handleVolumeChange(track.id, v)}
              onMuteToggle={() => handleMuteToggle(track.id)}
              onSoloToggle={() => handleSoloToggle(track.id)}
              onNameChange={(name) => handleNameChange(track.id, name)}
            />
          ))}
        </div>

        <div
          ref={scrollContainerRef}
          style={{
            flex: 1,
            overflow: 'auto',
            position: 'relative',
            backgroundColor: 'var(--color-bg-primary)',
          }}
          onWheel={handleWheel}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onScroll={(e) => setScrollLeft((e.target as HTMLDivElement).scrollLeft)}
        >
          <div
            ref={timelineRef}
            style={{
              position: 'relative',
              width: `${totalWidth}px`,
              height: `${totalHeight}px`,
              minWidth: '100%',
            }}
            onClick={handleSeek}
          >
            <div
              style={{
                position: 'sticky',
                top: 0,
                height: '28px',
                backgroundColor: 'var(--color-bg-secondary)',
                borderBottom: '1px solid var(--color-border)',
                zIndex: 10,
              }}
            />

            {renderGrid()}

            {project.tracks.map((track, trackIndex) => (
              <div
                key={track.id}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: `${trackIndex * TRACK_HEIGHT + 32}px`,
                  height: `${TRACK_HEIGHT}px`,
                  borderBottom: '1px solid var(--color-border)',
                  backgroundColor:
                    dragOverTrack === track.id ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                  transition: 'background-color 0.15s ease',
                }}
                onDragOver={(e) => handleDragOver(e, track.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, track.id)}
              >
                {dragOverTrack === track.id && dragPosition !== null && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: `${dragPosition * pixelsPerSecond}px`,
                      width: '2px',
                      height: `${TRACK_HEIGHT - 16}px`,
                      backgroundColor: 'var(--color-accent)',
                      boxShadow: '0 0 8px var(--color-accent)',
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {project.clips
                  .filter((c) => c.trackId === track.id)
                  .map((clip) => (
                    <TrackItem
                      key={clip.id}
                      clip={clip}
                      sample={sampleManager.getSampleById(clip.sampleId)}
                      zoom={zoom}
                      isSelected={selectedClipId === clip.id}
                      trackIndex={trackIndex}
                      onSelect={() => handleClipSelect(clip.id)}
                      onMove={(start) => handleClipMove(clip.id, start)}
                      onFadeInChange={(v) => handleFadeInChange(clip.id, v)}
                      onFadeOutChange={(v) => handleFadeOutChange(clip.id, v)}
                      onDelete={() => handleClipDelete(clip.id)}
                    />
                  ))}
              </div>
            ))}

            <Playhead time={playhead} zoom={zoom} isPlaying={isPlaying} />

            {project.collaborators
              .filter((c) => c.id !== currentUserId && c.cursor)
              .map((collaborator) => (
                <CollaboratorCursor
                  key={collaborator.id}
                  collaborator={collaborator}
                  scrollLeft={scrollLeft}
                  scrollTop={scrollContainerRef.current?.scrollTop || 0}
                />
              ))}
          </div>
        </div>
      </div>

      {selectedClipId && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--color-bg-secondary)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            选中片段: {project.clips.find((c) => c.id === selectedClipId)?.sampleId}
          </span>
          <Button size="sm" variant="danger" onClick={() => handleClipDelete(selectedClipId)}>
            <Trash2 size={14} /> 删除
          </Button>
        </div>
      )}

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        inviteLink={collabManager?.generateInviteLink(project.id) || ''}
        maxCollaborators={3}
        currentCount={project.collaborators.length}
      />
    </div>
  );
};
