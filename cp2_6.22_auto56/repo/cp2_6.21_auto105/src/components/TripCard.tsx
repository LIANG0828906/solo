import { Heart, MessageCircle, Bookmark } from 'lucide-react';
import { Trip } from '@/data/mocks';

interface TripCardProps {
  trip: Trip;
  onLike?: (id: string) => void;
  onFavorite?: (id: string) => void;
  onClick?: (id: string) => void;
}

export default function TripCard({ trip, onLike, onFavorite, onClick }: TripCardProps) {
  return (
    <div
      className="card card-hover cursor-pointer"
      onClick={() => onClick?.(trip.id)}
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={trip.coverImage}
          alt={trip.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavorite?.(trip.id);
          }}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
        >
          <Bookmark
            size={18}
            className={trip.isFavorited ? 'fill-[#1a73e8] text-[#1a73e8]' : 'text-gray-600'}
          />
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-base mb-3 text-gray-900 line-clamp-1">
          {trip.name}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike?.(trip.id);
              }}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-500 transition-colors"
            >
              <Heart
                size={18}
                className={trip.isLiked ? 'fill-red-500 text-red-500' : ''}
              />
              <span>{trip.likes}</span>
            </button>
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <MessageCircle size={18} />
              <span>{trip.comments}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <img
              src={trip.author.avatar}
              alt={trip.author.username}
              className="w-6 h-6 rounded-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
