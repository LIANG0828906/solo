import { MapPin, Calendar, Trash2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTripStore } from '../store/useTripStore';
import type { Trip } from '../types';
import { getDateRange } from '../utils/dateUtils';

interface TripCardProps {
  trip: Trip;
  index: number;
}

export const TripCard = ({ trip, index }: TripCardProps) => {
  const navigate = useNavigate();
  const { deleteTrip, filters, highlightedTripId } = useTripStore();
  
  const staggerClass = `stagger-${Math.min(index + 1, 8)}` as const;
  const isHighlighted = filters.keyword && trip.destination.toLowerCase().includes(filters.keyword.toLowerCase());
  const showHighlight = highlightedTripId === trip.id || (isHighlighted && filters.keyword);
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`确定要删除"${trip.destination}"旅行计划吗？`)) {
      deleteTrip(trip.id);
    }
  };
  
  return (
    <div
      onClick={() => navigate(`/trip/${trip.id}`)}
      className={`card cursor-pointer opacity-0 animate-fade-in-up ${staggerClass} ${
        showHighlight ? 'ring-4 ring-primary-400 ring-opacity-60 animate-highlight' : ''
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={trip.coverImage}
          alt={trip.destination}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        <button
          onClick={handleDelete}
          className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-warm-600 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-primary-700">
              <MapPin className="w-3.5 h-3.5" />
              {trip.destination}
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-center gap-2 text-warm-500 text-sm mb-3">
          <Calendar className="w-4 h-4" />
          <span>{getDateRange(trip.startDate, trip.endDate)}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-warm-400 text-sm">
            <Users className="w-4 h-4" />
            <span>{trip.activities.length} 个活动</span>
          </div>
          <div className="flex items-center gap-2 text-warm-400 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{trip.locations.length} 个地点</span>
          </div>
        </div>
      </div>
    </div>
  );
};
