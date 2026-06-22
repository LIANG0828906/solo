import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users } from 'lucide-react';
import type { Activity } from '@/types';

interface PartyCardProps {
  activity: Activity;
  index: number;
}

export default function PartyCard({ activity, index }: PartyCardProps) {
  const navigate = useNavigate();

  const emojiList = activity.materials
    .slice(0, 3)
    .map((m) => m.emoji)
    .join(' ');

  return (
    <div
      className="w-[300px] bg-purple-card/80 backdrop-blur-8 rounded-xl border border-purple-border/50 p-4 cursor-pointer will-change-transform transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(255,140,66,0.15)] animate-card-enter"
      style={{ animationDelay: `${index * 80}ms` }}
      onClick={() => navigate(`/party/${activity.id}`)}
    >
      <h3 className="font-display font-bold text-lg text-white truncate">
        {activity.name.length > 20 ? activity.name.slice(0, 20) + '…' : activity.name}
      </h3>

      <div className="mt-3 space-y-1.5 text-sm text-purple-border">
        <div className="flex items-center gap-1.5">
          <Calendar size={14} className="text-amber-primary shrink-0" />
          <span>{activity.date}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin size={14} className="text-amber-primary shrink-0" />
          <span className="truncate">
            {activity.location.length > 10 ? activity.location.slice(0, 10) + '…' : activity.location}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users size={14} className="text-amber-primary shrink-0" />
          <span>{activity.participants.length}/{activity.maxParticipants}</span>
        </div>
      </div>

      {emojiList && (
        <div className="mt-3 text-2xl leading-none tracking-wider">{emojiList}</div>
      )}
    </div>
  );
}
