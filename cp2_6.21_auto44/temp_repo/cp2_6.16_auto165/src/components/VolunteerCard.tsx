import Avatar from './Avatar';
import type { Volunteer } from '@/types';
import { formatRelativeTime } from '@/utils/formatters';
import { useEffect, useRef, useState } from 'react';

interface VolunteerCardProps {
  volunteer: Volunteer;
  onClick?: () => void;
}

export default function VolunteerCard({ volunteer, onClick }: VolunteerCardProps) {
  const prevBalance = useRef(volunteer.balance_hours);
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    if (prevBalance.current !== volunteer.balance_hours) {
      prevBalance.current = volunteer.balance_hours;
      setBounce(true);
      const timer = setTimeout(() => setBounce(false), 300);
      return () => clearTimeout(timer);
    }
  }, [volunteer.balance_hours]);

  return (
    <div
      className="card-hover bg-white rounded-card shadow-card p-4 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex flex-col items-center mb-4">
        <Avatar name={volunteer.name} size="lg" className="mb-3" />
        <div
          className={`text-green-600 font-bold text-lg ${bounce ? 'animate-bounce-number' : ''}`}
        >
          {volunteer.balance_hours} h
        </div>
      </div>

      <h3 className="text-lg font-semibold text-navy-900 text-center mb-3 truncate">
        {volunteer.name}
      </h3>

      <div className="flex flex-wrap gap-1 justify-center mb-4">
        {volunteer.tags.map((tag) => (
          <span
            key={tag}
            className="bg-amber-100 text-amber-800 rounded-full px-2 py-0.5 text-xs font-medium"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="border-t border-gray-100 pt-3 text-center text-sm text-gray-500">
        累计 <span className="text-navy-700 font-medium">{volunteer.completed_hours}h</span>
        <span className="mx-1">·</span>
        {formatRelativeTime(volunteer.last_active_at)}
      </div>
    </div>
  );
}
