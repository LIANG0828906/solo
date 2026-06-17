import { useMixerStore } from '@/store/useMixerStore';
import { Play, Square, X } from 'lucide-react';

interface TrackLaneProps {
  trackId: string;
}

export default function TrackLane({ trackId }: TrackLaneProps) {
  const track = useMixerStore((s) => s.tracks.find((t) => t.id === trackId));
  const genre = useMixerStore((s) =>
    track?.genreId ? s.genres.find((g) => g.id === track.genreId) : null
  );
  const assignGenreToTrack = useMixerStore((s) => s.assignGenreToTrack);
  const removeGenreFromTrack = useMixerStore((s) => s.removeGenreFromTrack);
  const setTrackVolume = useMixerStore((s) => s.setTrackVolume);
  const toggleTrack = useMixerStore((s) => s.toggleTrack);
  const initEngine = useMixerStore((s) => s.initEngine);

  if (!track) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const el = e.currentTarget as HTMLElement;
    if (genre) {
      el.style.border = `2px solid ${genre.color}`;
    } else {
      el.style.border = '2px solid #4ECDC4';
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.border = '2px solid transparent';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const genreId = e.dataTransfer.getData('genreId');
    if (genreId) {
      initEngine();
      assignGenreToTrack(trackId, genreId);
    }
    const el = e.currentTarget as HTMLElement;
    el.style.border = '2px solid transparent';
  };

  const handleToggle = () => {
    initEngine();
    toggleTrack(trackId);
  };

  return (
    <div
      className="track-lane flex items-center gap-3 px-4 transition-all duration-200 ease-out"
      style={{
        height: 100,
        background: '#16213E',
        borderRadius: 8,
        border: '2px solid transparent',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-2 w-16 shrink-0">
        <span className="text-xs font-medium" style={{ color: '#6B7280' }}>
          轨道 {trackId.split('-')[1]}
        </span>
      </div>

      <div className="flex-1 flex items-center min-w-0">
        {genre ? (
          <div className="flex items-center gap-3 w-full">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-md"
              style={{ background: `${genre.color}15` }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: genre.color }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: genre.color }}
              >
                {genre.name}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <input
                type="range"
                min={0}
                max={100}
                value={track.volume}
                onChange={(e) => setTrackVolume(trackId, Number(e.target.value))}
                className="track-slider flex-1 h-1 appearance-none rounded-full outline-none"
                style={{
                  background: `linear-gradient(to right, ${genre.color} ${track.volume}%, #3D3D5C ${track.volume}%)`,
                }}
              />
              <span className="text-xs w-8 text-right" style={{ color: '#E0E0E0' }}>
                {track.volume}%
              </span>
            </div>
            <button
              onClick={() => removeGenreFromTrack(trackId)}
              className="p-1 rounded transition-colors duration-200 ease-out"
              style={{ color: '#6B7280' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#FF6B6B';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = '#6B7280';
              }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div
            className="flex items-center justify-center w-full h-12 rounded-md border-2 border-dashed transition-colors duration-200 ease-out"
            style={{ borderColor: '#2D2D44', color: '#4B5563' }}
          >
            <span className="text-sm">拖拽流派到此处</span>
          </div>
        )}
      </div>

      <button
        onClick={handleToggle}
        disabled={!genre}
        className="track-toggle flex items-center justify-center rounded-full transition-all duration-200 ease-out shrink-0"
        style={{
          width: 32,
          height: 32,
          background: track.isPlaying ? '#4ECDC4' : genre ? '#FF6B6B' : '#2D2D44',
          opacity: genre ? 1 : 0.4,
          cursor: genre ? 'pointer' : 'not-allowed',
        }}
      >
        {track.isPlaying ? (
          <Square size={14} color="#0D0D1A" fill="#0D0D1A" />
        ) : (
          <Play size={14} color={genre ? '#0D0D1A' : '#6B7280'} fill={genre ? '#0D0D1A' : '#6B7280'} />
        )}
      </button>
    </div>
  );
}
