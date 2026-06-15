import React from 'react';
import { useAudioStore } from '@/store/useAudioStore';
import { Piano, Music, Music2, Drum, Zap, Waves } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Piano,
  Music,
  Music2,
  Drum,
  Zap,
  Waves,
};

const InstrumentDeck: React.FC = () => {
  const { tracks, selectedTrackId, setSelectedTrackId, toggleTrack } = useAudioStore();

  return (
    <div className="instrument-deck">
      <h2 className="deck-title">乐器</h2>
      <div className="instrument-list">
        {tracks.map((track) => {
          const IconComponent = iconMap[track.icon] || Music;
          const isSelected = selectedTrackId === track.id;
          return (
            <div
              key={track.id}
              className={`instrument-item ${isSelected ? 'selected' : ''} ${track.enabled ? 'enabled' : ''}`}
              onClick={() => {
                setSelectedTrackId(track.id);
                if (!track.enabled) {
                  toggleTrack(track.id);
                }
              }}
            >
              <div className="instrument-icon">
                <IconComponent className="icon" />
              </div>
              <div className="instrument-info">
                <span className="instrument-name">{track.name}</span>
                <span className="instrument-type">{track.type}</span>
              </div>
              <div className={`status-dot ${track.enabled ? 'active' : ''}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InstrumentDeck;
