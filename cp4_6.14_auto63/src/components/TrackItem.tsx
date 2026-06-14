import { useState, useRef } from 'react';
import { WaveformCanvas } from './WaveformCanvas';
import { TrackState, EffectState, MAX_EFFECTS_PER_TRACK, EFFECT_CONFIGS } from '@types/index';
import { useAudioEngine } from '@hooks/useAudioEngine';
import { useMixerStore } from '@store/useStore';

interface TrackItemProps {
  track: TrackState;
  index: number;
  isSelected: boolean;
  onSelect: (trackId: string) => void;
}

export function TrackItem({ track, index, isSelected, onSelect }: TrackItemProps) {
  const {
    setTrackVolume,
    setTrackPan,
    toggleTrackMute,
    toggleTrackSolo,
    removeTrack,
    renameTrack,
  } = useAudioEngine();

  const setSelectedEffect = useMixerStore((state) => state.setSelectedEffect);
  const selection = useMixerStore((state) => state.selection);
  const currentTime = useMixerStore((state) => state.playback.currentTime);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(track.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const panKnobRef = useRef<HTMLDivElement>(null);
  const isDraggingPanRef = useState(false);

  const bgColor = index % 2 === 0 ? '#f9fafb' : '#f3f4f6';
  const textColor = '#1e293b';
  const mutedTextColor = '#64748b';

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setTrackVolume(track.id, value);
  };

  const handlePanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setTrackPan(track.id, value);
  };

  const handlePanKnobMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingPanRef.current = true;
    const startY = e.clientY;
    const startPan = track.pan;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingPanRef.current) return;
      const deltaY = startY - moveEvent.clientY;
      const newPan = Math.max(-100, Math.min(100, startPan + deltaY * 0.5));
      setTrackPan(track.id, Math.round(newPan));

      if (panKnobRef.current) {
        panKnobRef.current.classList.add('vibrate');
        setTimeout(() => {
          panKnobRef.current?.classList.remove('vibrate');
        }, 150);
      }
    };

    const handleMouseUp = () => {
      isDraggingPanRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMuteClick = () => {
    toggleTrackMute(track.id);
  };

  const handleSoloClick = () => {
    toggleTrackSolo(track.id);
  };

  const handleNameDoubleClick = () => {
    setIsEditing(true);
    setEditName(track.name);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const handleNameBlur = () => {
    setIsEditing(false);
    if (editName.trim() && editName !== track.name) {
      renameTrack(track.id, editName.trim());
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(track.name);
    }
  };

  const handleEffectSlotClick = (slotIndex: number) => {
    const existingEffect = track.effects.find((e) => e.slotIndex === slotIndex);
    if (existingEffect) {
      setSelectedEffect(track.id, existingEffect.id);
    }
  };

  const handleRemoveTrack = () => {
    if (confirm(`确定要删除轨道 "${track.name}" 吗？`)) {
      removeTrack(track.id);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const effectType = e.dataTransfer.getData('effectType') as any;
    if (effectType && track.effects.length < MAX_EFFECTS_PER_TRACK) {
      // Will be handled by parent
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const panRotation = (track.pan / 100) * 135;

  const selectionStart = selection?.trackId === track.id ? selection.startTime : null;
  const selectionEnd = selection?.trackId === track.id ? selection.endTime : null;

  return (
    <div
      style={{
        backgroundColor: bgColor,
        borderBottom: '1px solid #e5e7eb',
        padding: '12px',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s ease',
        boxShadow: isSelected ? 'inset 3px 0 0 #a855f7' : 'none',
      }}
      onClick={() => onSelect(track.id)}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: '6px',
              height: '24px',
              backgroundColor: isSelected ? '#a855f7' : '#cbd5e1',
              borderRadius: '3px',
              flexShrink: 0,
            }}
          />
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleNameBlur}
              onKeyDown={handleNameKeyDown}
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: textColor,
                backgroundColor: 'transparent',
                border: '1px solid #a855f7',
                borderRadius: '4px',
                padding: '2px 6px',
                width: '100%',
                maxWidth: '150px',
                outline: 'none',
              }}
            />
          ) : (
            <span
              onDoubleClick={handleNameDoubleClick}
              style={{
                fontSize: '14px',
                fontWeight: 500,
                color: track.muted ? mutedTextColor : textColor,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                cursor: 'text',
              }}
              title={track.name}
            >
              {track.name}
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveTrack();
          }}
          style={{
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            borderRadius: '4px',
            fontSize: '16px',
            lineHeight: 1,
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#dc2626';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
          }}
        >
          ×
        </button>
      </div>

      <WaveformCanvas
        waveformData={track.waveformData}
        duration={track.duration}
        currentTime={currentTime}
        height={60}
        selectionStart={selectionStart}
        selectionEnd={selectionEnd}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', color: '#64748b' }}>音量</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>{Math.round(track.volume)}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={track.volume}
            onChange={handleVolumeChange}
            style={{
              width: '100%',
              '--value: `${track.volume}%`,
            } as React.CSSProperties}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>声像</span>
          <div
            ref={panKnobRef}
            onMouseDown={handlePanKnobMouseDown}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#1e293b,
              border: '2px solid #475569',
              position: 'relative',
              cursor: 'grab',
              userSelect: 'none',
              background: 'conic-gradient(#2563eb 0deg, #475569 0deg)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '2px',
                height: '12px',
                backgroundColor: '#ffffff',
                transformOrigin: 'center bottom',
                transform: `translateX(-50%) translateY(-100%) rotate(${panRotation}deg)`,
                borderRadius: '1px',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: '#334155',
              }}
            />
          </div>
          <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
            {track.pan === 0 ? 'C' : track.pan < 0 ? `L${Math.abs(track.pan)}` : `R${track.pan}`}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleMuteClick();
            }}
            style={{
              width: '40px',
              height: '24px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              transition: 'all 0.15s ease',
              backgroundColor: track.muted ? '#dc2626' : '#d1d5db',
              color: track.muted ? '#ffffff' : '#475569',
            }}
            onMouseEnter={(e) => {
              if (!track.muted) {
                e.currentTarget.style.backgroundColor = '#9ca3af';
              }
            }}
            onMouseLeave={(e) => {
              if (!track.muted) {
                e.currentTarget.style.backgroundColor = '#d1d5db';
              }
            }}
          >
            M
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSoloClick();
            }}
            style={{
              width: '40px',
              height: '24px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              transition: 'all 0.15s ease',
              backgroundColor: track.solo ? '#dc2626' : '#d1d5db',
              color: track.solo ? '#ffffff' : '#475569',
            }}
            onMouseEnter={(e) => {
              if (!track.solo) {
                e.currentTarget.style.backgroundColor = '#9ca3af';
              }
            }}
            onMouseLeave={(e) => {
              if (!track.solo) {
                e.currentTarget.style.backgroundColor = '#d1d5db';
              }
            }}
          >
            S
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
        {Array.from({ length: MAX_EFFECTS_PER_TRACK }).map((_, i) => {
          const effect = track.effects.find((e) => e.slotIndex === i);
          const config = effect ? EFFECT_CONFIGS[effect.type] : null;

          return (
            <div
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                handleEffectSlotClick(i);
              }}
              style={{
                flex: 1,
                height: '32px',
                borderRadius: '4px',
                backgroundColor: effect ? '#334155' : 'transparent',
                border: effect
                  ? `1px solid ${effect.bypassed ? '#64748b' : '#60a5fa'}`
                  : '1px dashed #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                color: effect ? '#e2e8f0' : '#94a3b8',
                cursor: effect ? 'pointer' : 'default',
                opacity: effect && effect.bypassed ? 0.5 : 1,
                transition: 'all 0.15s ease',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                padding: '0 4px',
              }}
              title={config?.name || `插槽 ${i + 1}`}
            >
              {effect ? config?.name.split(' ')[0] : `+`}
            </div>
          );
        })}
      </div>
    </div>
  );
}
