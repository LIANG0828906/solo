import { Link } from 'react-router-dom';
import { CalendarDays, Users, ChevronRight } from 'lucide-react';
import type { Meeting } from '@/hooks/useMeetingStore';
import { cn } from '@/lib/utils';

interface MeetingCardProps {
  meeting: Meeting;
  className?: string;
}

export function MeetingCard({ meeting, className }: MeetingCardProps) {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const hasNotes = meeting.notes.trim().length > 0;

  return (
    <Link
      to={`/meeting/${meeting.id}`}
      className={cn(
        'group relative bg-background-card rounded-2xl p-5 border border-primary/10',
        'transition-all duration-300 ease-out',
        'hover:translate-y-[-2px] hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20',
        'animate-slide-up',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-text mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {meeting.title}
          </h3>

          <p className="text-sm text-text-light mb-4 line-clamp-2">
            {meeting.agenda}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-text-muted">
              <CalendarDays className="w-4 h-4 text-secondary" />
              <span>{formatDate(meeting.dateTime)}</span>
              <span className="text-primary font-medium">
                {formatTime(meeting.dateTime)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-text-muted">
              <Users className="w-4 h-4 text-secondary" />
              <span>{meeting.attendees.length} 人参与</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <ChevronRight
            className={cn(
              'w-5 h-5 text-text-muted transition-all duration-300',
              'group-hover:translate-x-1 group-hover:text-primary'
            )}
          />

          {hasNotes && (
            <span className="text-xs px-2 py-1 rounded-full bg-secondary/20 text-secondary-dark font-medium">
              已有笔记
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-primary/5 flex items-center justify-between">
        <div className="flex -space-x-2">
          {meeting.attendees.slice(0, 3).map((email, index) => (
            <div
              key={index}
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-background-card',
                index % 3 === 0
                  ? 'bg-primary'
                  : index % 3 === 1
                    ? 'bg-secondary'
                    : 'bg-primary-dark'
              )}
              title={email}
            >
              {email.charAt(0).toUpperCase()}
            </div>
          ))}
          {meeting.attendees.length > 3 && (
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary border-2 border-background-card">
              +{meeting.attendees.length - 3}
            </div>
          )}
        </div>

        <span className="text-xs text-text-muted">
          创建于 {new Date(meeting.createdAt).toLocaleDateString('zh-CN')}
        </span>
      </div>
    </Link>
  );
}
