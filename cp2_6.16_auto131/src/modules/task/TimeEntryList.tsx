import { Clock, User } from 'lucide-react';
import type { TimeEntry } from '@/utils/types';
import { formatDate, formatHours } from '@/utils/time';

interface TimeEntryListProps {
  entries: TimeEntry[];
}

export default function TimeEntryList({ entries }: TimeEntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p className="text-sm">暂无工时记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, index) => (
        <div
          key={entry.id}
          className="flex items-center justify-between p-3 rounded-lg"
          style={{ backgroundColor: index % 2 === 0 ? '#fafafa' : '#fff' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">{entry.userName}</p>
              <p className="text-xs text-gray-400">{formatDate(entry.timestamp)}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800">
              +{formatHours(entry.duration)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
