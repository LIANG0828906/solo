import { formatDate } from '@/utils/formatters';

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
}

export default function Timeline({ events }: TimelineProps) {
  if (events.length === 0) {
    return <div className="text-gray-500 text-sm text-center py-8">暂无记录</div>;
  }

  return (
    <div className="relative pl-4">
      <div className="absolute left-[11px] top-1 bottom-1 w-0.5 bg-amber-200" />
      <div className="space-y-5">
        {events.map((event) => (
          <div key={event.id} className="relative">
            <div className="absolute -left-[19px] top-1.5 w-3 h-3 rounded-full bg-amber-700 -ml-[5px]" />
            <div className="pl-2">
              <p className="text-xs text-gray-500 mb-1">{formatDate(event.date)}</p>
              <p className="font-semibold text-navy-900 text-sm">{event.title}</p>
              {event.description && (
                <p className="text-gray-600 text-sm mt-1 leading-relaxed">{event.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
