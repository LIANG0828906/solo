import { CheckinLogItem } from '../types';
import { User, Clock, Hash } from 'lucide-react';

interface CheckinLogProps {
  logs: CheckinLogItem[];
}

export function CheckinLog({ logs }: CheckinLogProps) {
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <Clock className="w-12 h-12 mb-3 opacity-50" />
        <p>暂无签到记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
      {logs.map((log) => (
        <div
          key={log.id}
          className={`
            bg-white rounded-xl p-4 flex items-center gap-4
            transition-all duration-300
            ${log.isNew ? 'animate-checkin-flash' : ''}
          `}
        >
          <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
            <Hash className="w-5 h-5 text-success font-bold" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-primary truncate">{log.name}</span>
              <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full flex-shrink-0">
                #{log.checkinSequence}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(log.checkinTime)}</span>
            </div>
          </div>
          
          <div className="text-success text-lg">✓</div>
        </div>
      ))}
    </div>
  );
}
