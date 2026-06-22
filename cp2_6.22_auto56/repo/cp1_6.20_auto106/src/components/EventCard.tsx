import { Calendar, MapPin, Users } from 'lucide-react';
import { Event } from '../types';

interface EventCardProps {
  event: Event;
  onClick: () => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
  const remainingPercentage = (event.remainingCount / event.capacity) * 100;
  const isUrgent = remainingPercentage < 10 && event.remainingCount > 0;
  const isFull = event.remainingCount <= 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-xl shadow-md p-6 cursor-pointer
        transition-all duration-300 ease-out
        hover:scale-[1.02] hover:shadow-xl
        ${isUrgent ? 'border-2 border-warning animate-pulse-urgent' : 'border border-transparent'}
        ${isFull ? 'opacity-75' : ''}
      `}
    >
      <div className="h-32 bg-gradient-to-br from-primary to-primary-light rounded-lg mb-4 flex items-center justify-center">
        <span className="text-white text-2xl font-bold text-center px-4">
          {event.name.slice(0, 15)}
          {event.name.length > 15 ? '...' : ''}
        </span>
      </div>

      <h3 className="text-lg font-semibold text-primary mb-2 line-clamp-1">
        {event.name}
      </h3>

      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="line-clamp-1">{formatDate(event.date)}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="line-clamp-1">{event.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span
            className={`font-medium ${isUrgent ? 'text-warning' : isFull ? 'text-danger' : 'text-gray-600'}`}
          >
            {event.registeredCount}/{event.capacity}
          </span>
          {isUrgent && (
            <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full">
              即将满员
            </span>
          )}
          {isFull && (
            <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
              已满
            </span>
          )}
        </div>
      </div>

      <button
        disabled={isFull}
        onClick={(e) => {
          e.stopPropagation();
          if (!isFull) onClick();
        }}
        className={`
          w-full mt-4 py-2.5 px-4 rounded-lg font-medium
          transition-all duration-200
          hover:scale-[1.05] active:scale-[0.98]
          ${isFull
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-primary text-white hover:bg-primary-light'
          }
        `}
      >
        {isFull ? '名额已满' : '立即报名'}
      </button>
    </div>
  );
}
