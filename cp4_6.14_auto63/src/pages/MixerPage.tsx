import { useState, useRef, useEffect } from 'react';
import { MenuBar } from '@components/MenuBar';
import { TrackPanel } from '@components/TrackPanel';
import { EffectManager } from '@components/EffectManager';
import { MixerControls } from '@components/MixerControls';
import { EffectPanel } from '@components/EffectPanel';
import { useAudioEngine } from '@hooks/useAudioEngine';
import { useMixerStore } from '@store/useStore';
import { WaveformCanvas } from '@components/WaveformCanvas';
import { EFFECT_CONFIGS, EffectType, MAX_EFFECTS_PER_TRACK } from '@types/index';

export function MixerPage() {
  const { initialized, addTrackWithFile, addEffect, cutSelection, copySelection, pasteToTrack, pasteToNewTrack, deleteSelection, seek, setSelection } = useAudioEngine();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEffectsPanelOpen, setIsEffectsPanelOpen] = useState(true);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const tracks = useMixerStore((state) => state.tracks);
  const playback = useMixerStore((state) => state.playback);
  const selectedTrackId = useMixerStore((state) => state.selectedTrackId);
  const selection = useMixerStore((state) => state.selection);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth < 1024) {
        setIsEffectsPanelOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        await addTrackWithFile(files[i]);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedTrackId || !selection) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        cutSelection(selectedTrackId, selection.startTime, selection.endTime);
        setSelection(null);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        copySelection(selectedTrackId, selection.startTime, selection.endTime);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        if (e.shiftKey) {
          pasteToNewTrack(playback.currentTime);
        } else {
          pasteToTrack(selectedTrackId, playback.currentTime);
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelection(selectedTrackId, selection.startTime, selection.endTime);
        setSelection(null);
      } else if (e.key === ' ') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTrackId, selection, playback.currentTime, cutSelection, copySelection, pasteToTrack, pasteToNewTrack, deleteSelection, setSelection]);

  const handleMainWaveformSeek = (time: number) => {
    seek(time);
  };

  const selectedTrack = tracks.find((t) => t.id === selectedTrackId);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#0f172a',
      }}
    >
      <MenuBar onUploadClick={handleUploadClick} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <TrackPanel />

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0f172a',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {tracks.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  gap: '16px',
                }}
              >
                <div style={{ fontSize: '48px' }}>🎛️</div>
                <h2 style={{ fontSize: '20px', color: '#94a3b8' }}>欢迎使用 Audio Mixer Studio</h2>
                <p style={{ fontSize: '14px' }}>点击右上角"上传音频"按钮开始混音</p>
                <button
                  onClick={handleUploadClick}
                  style={{
                    marginTop: '8px',
                    padding: '10px 24px',
                    backgroundColor: '#a855f7',
                    color: '#ffffff',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#9333ea';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#a855f7';
                  }}
                >
                  导入音频文件
                </button>
              </div>
            ) : (
              tracks.map((track, index) => (
                <div
                  key={track.id}
                  style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    border: `1px solid ${selectedTrackId === track.id ? '#a855f7' : '#334155'}`,
                    padding: '16px',
                    transition: 'border-color 0.15s ease',
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const effectType = e.dataTransfer.getData('effectType') as EffectType;
                    if (effectType && track.effects.length < MAX_EFFECTS_PER_TRACK) {
                      const emptySlot = Array.from({ length: MAX_EFFECTS_PER_TRACK }).findIndex(
                        (_, i) => !track.effects.some((ef) => ef.slotIndex === i),
                      );
                      if (emptySlot !== -1) {
                        addEffect(track.id, effectType, emptySlot);
                      }
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <span
                      style={{
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#e2e8f0',
                      }}
                    >
                      {track.name}
                    </span>
                    <span
                      style={{
                        marginLeft: '12px',
                        fontSize: '11px',
                        color: '#64748b',
                        padding: '2px 8px',
                        backgroundColor: '#334155',
                        borderRadius: '4px',
                      }}
                    >
                      {track.duration.toFixed(2)}s
                    </span>
                  </div>
                  <WaveformCanvas
                    waveformData={track.waveformData}
                    duration={track.duration}
                    currentTime={playback.currentTime}
                    height={80}
                    selectionStart={selection?.trackId === track.id ? selection.startTime : null}
                    selectionEnd={selection?.trackId === track.id ? selection.endTime : null}
                    onSeek={handleMainWaveformSeek}
                    onSelectionChange={(start, end) => {
                      setSelection({
                        trackId: track.id,
                        startTime: Math.min(start, end),
                        endTime: Math.max(start, end),
                      });
                    }}
                    trackId={track.id}
                  />

                  {track.effects.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        marginTop: '12px',
                        flexWrap: 'wrap',
                      }}
                    >
                      {track.effects.map((effect) => {
                        const config = EFFECT_CONFIGS[effect.type];
                        return (
                          <div
                            key={effect.id}
                            onClick={() => {
                              useMixerStore.getState().setSelectedEffect(track.id, effect.id);
                            }}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: effect.bypassed ? '#334155' : 'rgba(99, 102, 241, 0.2)',
                              border: `1px solid ${effect.bypassed ? '#475569' : '#6366f1'}`,
                              borderRadius: '6px',
                              fontSize: '11px',
                              color: effect.bypassed ? '#64748b' : '#e2e8f0',
                              cursor: 'pointer',
                              opacity: effect.bypassed ? 0.5 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span>{config.icon}</span>
                            <span>{config.name.split(' ')[0]}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {windowWidth >= 1024 ? (
          <EffectManager isOpen={isEffectsPanelOpen} />
        ) : (
          <>
            <button
              onClick={() => setIsEffectsPanelOpen(!isEffectsPanelOpen)}
              style={{
                position: 'fixed',
                right: '16px',
                top: '64px',
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v18M5 8h14M5 16h14" />
              </svg>
            </button>
            {isEffectsPanelOpen && (
              <div
                style={{
                  position: 'fixed',
                  right: 0,
                  top: '48px',
                  bottom: 0,
                  zIndex: 99,
                  animation: 'slideInRight 250ms ease-out',
                }}
              >
                <EffectManager isOpen={true} />
              </div>
            )}
          </>
        )}
      </div>

      <MixerControls />

      <EffectPanel />

      <input
        ref={fileInputRef}
        type="file"
        accept=".wav,.mp3,audio/wav,audio/mpeg,audio/mp3"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
