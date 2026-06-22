import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import WaveformCanvas from './WaveformCanvas';
import { Track } from '../types';

interface TrackPanelProps {
  track: Track;
  isHost: boolean;
  isPlaying: boolean;
  masterVolume: number;
  trackIds: string[];
  onVolumeChange: (volume: number) => void;
  onMute: () => void;
  onDelete: () => void;
  onReorder: (trackIds: string[]) => void;
}

interface DragItem {
  type: 'TRACK';
  trackId: string;
}

const TrackPanel: React.FC<TrackPanelProps> = ({
  track,
  isHost,
  isPlaying,
  masterVolume,
  trackIds,
  onVolumeChange,
  onMute,
  onDelete,
  onReorder,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag<DragItem, unknown, { isDragging: boolean }>({
    type: 'TRACK',
    item: { type: 'TRACK', trackId: track.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop<DragItem, unknown, { isOver: boolean }>({
    accept: 'TRACK',
    canDrop: (item) => item.trackId !== track.id,
    drop: (item) => {
      const fromIndex = trackIds.indexOf(item.trackId);
      const toIndex = trackIds.indexOf(track.id);
      if (fromIndex === -1 || toIndex === -1) return;

      const newIds = [...trackIds];
      const [removed] = newIds.splice(fromIndex, 1);
      newIds.splice(toIndex, 0, removed);
      onReorder(newIds);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver() && monitor.canDrop(),
    }),
  });

  drag(drop(ref));

  const trackIcon = {
    drum: '🥁',
    bass: '🎸',
    guitar: '🎶',
  }[track.type] || '🎵';

  return (
    <div
      ref={ref}
      className={`track-card ${track.muted ? 'track-muted' : ''} ${isDragging ? 'dragging' : ''} ${isOver ? 'drop-over' : ''}`}
    >
      <div className="track-drag-handle">⋮⋮</div>

      <div className="track-name">
        {trackIcon} {track.name}
      </div>

      <div className="waveform-container">
        <WaveformCanvas
          waveData={track.waveData}
          volume={track.volume}
          muted={track.muted}
          isPlaying={isPlaying}
          masterVolume={masterVolume}
        />
      </div>

      <div className="track-controls">
        <div className="volume-control">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={track.volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="volume-slider"
          />
          <span className="volume-value">{track.volume}</span>
        </div>

        <button
          className={`mute-btn ${track.muted ? 'active' : ''}`}
          onClick={onMute}
          title={track.muted ? '取消静音' : '静音'}
        >
          {track.muted ? '🔇' : '🔊'}
        </button>

        <button
          className="delete-btn"
          onClick={onDelete}
          disabled={!isHost}
          title={isHost ? '删除轨道' : '仅房主可删除'}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default TrackPanel;
