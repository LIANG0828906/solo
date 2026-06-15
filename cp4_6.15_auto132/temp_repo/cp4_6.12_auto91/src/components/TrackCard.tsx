import { Link } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';
import type { TrackWithCounts } from '@/types';

interface TrackCardProps {
  track: TrackWithCounts;
}

export default function TrackCard({ track }: TrackCardProps) {
  return (
    <Link
      to={`/tracks/${track.id}`}
      className="block bg-[#16213e] rounded-2xl p-4 transition-all duration-250 ease hover:-translate-y-1 hover:shadow-2xl group"
    >
      <div className="relative overflow-hidden rounded-xl mb-4">
        <img
          src={track.coverUrl}
          alt={track.title}
          className="w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300" />
      </div>
      <h3 className="text-lg font-semibold text-[#e0e0e0] truncate">{track.title}</h3>
      <p className="text-sm text-gray-400 mt-1">{track.artist}</p>
      <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
        <span className="flex items-center gap-1">
          <Heart className="w-4 h-4 text-[#ff6b6b]" />
          {track.likes}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="w-4 h-4 text-[#4ecdc4]" />
          {track.commentCount}
        </span>
      </div>
    </Link>
  );
}
