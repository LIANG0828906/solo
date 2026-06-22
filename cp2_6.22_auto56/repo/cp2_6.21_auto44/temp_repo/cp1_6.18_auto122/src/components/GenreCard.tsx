import { useMixerStore } from '@/store/useMixerStore';
import { Music } from 'lucide-react';

interface GenreCardProps {
  genreId: string;
}

export default function GenreCard({ genreId }: GenreCardProps) {
  const genre = useMixerStore((s) => s.genres.find((g) => g.id === genreId));
  const openRhythmEditor = useMixerStore((s) => s.openRhythmEditor);
  const setGenreVolume = useMixerStore((s) => s.setGenreVolume);

  if (!genre) return null;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('genreId', genre.id);
    e.dataTransfer.effectAllowed = 'copy';
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = '0.6';
    el.style.transform = 'translate(5px, 5px)';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = '1';
    el.style.transform = 'translate(0, 0)';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="genre-card relative flex flex-col overflow-hidden transition-all duration-200 ease-out cursor-grab active:cursor-grabbing select-none"
      style={{
        width: 200,
        height: 120,
        background: '#2D2D44',
        borderRadius: 8,
      }}
    >
      <div
        className="h-1.5 w-full"
        style={{ background: genre.color }}
      />
      <div className="flex-1 flex flex-col justify-between p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: genre.color }}
            />
            <span
              className="text-sm font-semibold"
              style={{ color: genre.color }}
            >
              {genre.name}
            </span>
          </div>
          <button
            onClick={() => openRhythmEditor(genre.id)}
            className="p-1.5 rounded-md transition-colors duration-200 ease-out"
            style={{ background: 'rgba(255,255,255,0.05)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
            }}
            title="编辑节奏"
          >
            <Music size={14} style={{ color: '#E0E0E0' }} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={100}
            value={genre.volume}
            onChange={(e) => setGenreVolume(genre.id, Number(e.target.value))}
            className="genre-slider flex-1 h-1 appearance-none rounded-full outline-none"
            style={{
              background: `linear-gradient(to right, ${genre.color} ${genre.volume}%, #3D3D5C ${genre.volume}%)`,
            }}
          />
          <span className="text-xs w-8 text-right" style={{ color: '#E0E0E0' }}>
            {genre.volume}%
          </span>
        </div>
      </div>
    </div>
  );
}
