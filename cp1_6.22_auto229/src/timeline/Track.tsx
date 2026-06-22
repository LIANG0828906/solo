import React from 'react';
import { Volume2, VolumeX, Headphones } from 'lucide-react';
import type { Track as TrackType } from '../types';
import { Slider } from '../components/Slider';
import { IconButton } from '../components/IconButton';
import { TRACK_HEIGHT, TRACK_WIDTH } from '../types';

interface TrackProps {
  track: TrackType;
  isSelected: boolean;
  onSelect: () => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onSoloToggle: () => void;
  onNameChange: (name: string) => void;
}

export const Track: React.FC<TrackProps> = ({
  track,
  isSelected,
  onSelect,
  onVolumeChange,
  onMuteToggle,
  onSoloToggle,
  onNameChange,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editName, setEditName] = React.useState(track.name);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleNameSubmit = () => {
    if (editName.trim()) {
      onNameChange(editName.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setEditName(track.name);
      setIsEditing(false);
    }
  };

  const trackStyle: React.CSSProperties = {
    width: `${TRACK_WIDTH}px`,
    height: `${TRACK_HEIGHT}px`,
    backgroundColor: 'var(--color-bg-secondary)',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    cursor: 'pointer',
    border: isSelected ? '2px solid var(--color-white)' : '2px solid transparent',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    animation: isSelected ? 'glow 0.2s ease' : 'none',
    position: 'relative',
    overflow: 'hidden',
  };

  const colorBarStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '4px',
    backgroundColor: track.color,
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    paddingLeft: '8px',
  };

  const nameStyle: React.CSSProperties = {
    flex: 1,
    fontSize: '13px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    fontSize: '13px',
    fontWeight: 500,
    backgroundColor: 'var(--color-bg-tertiary)',
    border: '1px solid var(--color-border)',
    borderRadius: '4px',
    padding: '2px 6px',
    color: 'var(--color-text)',
    outline: 'none',
  };

  const controlsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    paddingLeft: '8px',
  };

  return (
    <div style={trackStyle} onClick={onSelect}>
      <div style={colorBarStyle} />

      <div style={headerStyle}>
        {isEditing ? (
          <input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleKeyDown}
            style={inputStyle}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            style={nameStyle}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            {track.name}
          </div>
        )}

        <IconButton
          title={track.muted ? '取消静音' : '静音'}
          active={track.muted}
          onClick={(e) => {
            e.stopPropagation();
            onMuteToggle();
          }}
        >
          {track.muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </IconButton>

        <IconButton
          title={track.solo ? '取消独奏' : '独奏'}
          active={track.solo}
          onClick={(e) => {
            e.stopPropagation();
            onSoloToggle();
          }}
        >
          <Headphones size={14} />
        </IconButton>
      </div>

      <div style={controlsStyle}>
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', width: '28px' }}>
          {Math.round(track.volume * 100)}%
        </span>
        <div style={{ flex: 1 }} onClick={(e) => e.stopPropagation()}>
          <Slider value={track.volume} onChange={onVolumeChange} />
        </div>
      </div>
    </div>
  );
};
