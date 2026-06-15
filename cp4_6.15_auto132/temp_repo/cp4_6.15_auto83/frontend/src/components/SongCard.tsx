import { Heart, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Song } from '@/types';

interface SongCardProps {
  song: Song;
  isFavorite?: boolean;
  isPlaying?: boolean;
  onPlay?: () => void;
  onToggleFavorite?: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function SongCard({
  song,
  isFavorite,
  isPlaying,
  onPlay,
  onToggleFavorite,
}: SongCardProps) {
  return (
    <div className="break-inside-avoid mb-4 group">
      <div className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
        <div className="relative aspect-square overflow-hidden">
          <img
            src={song.coverUrl}
            alt={song.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <button
            onClick={onPlay}
            className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 hover:bg-white"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-gray-800" fill="currentColor" />
            ) : (
              <Play className="w-5 h-5 text-gray-800 ml-0.5" fill="currentColor" />
            )}
          </button>

          <button
            onClick={onToggleFavorite}
            className={cn(
              'absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur transition-all duration-300',
              isFavorite
                ? 'bg-red-500/90 text-white'
                : 'bg-white/20 text-white opacity-0 group-hover:opacity-100 hover:bg-white/40'
            )}
          >
            <Heart className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-gray-900 truncate text-base mb-1">
            {song.title}
          </h3>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 truncate">{song.artist}</p>
            <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
              {formatDuration(song.duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
