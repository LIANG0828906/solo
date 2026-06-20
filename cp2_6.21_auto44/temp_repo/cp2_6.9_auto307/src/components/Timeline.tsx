import { motion } from 'framer-motion';
import type { OperationLog } from '../types';
import { Clock, FileText } from 'lucide-react';

interface TimelineProps {
  logs: OperationLog[];
}

const Timeline = ({ logs }: TimelineProps) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeColor = (timestamp: number) => {
    const hour = new Date(timestamp).getHours();
    return hour < 12 ? '#d4a373' : '#c19a6b';
  };

  const getTimePeriod = (timestamp: number) => {
    const hour = new Date(timestamp).getHours();
    return hour < 12 ? '上午' : '下午';
  };

  const recentLogs = logs.slice(0, 10);

  return (
    <div className="bg-white/50 rounded-lg p-4 card-shadow">
      <h3 className="text-lg font-bold text-[#3e2723] mb-4 traditional-font flex items-center gap-2">
        <FileText className="w-5 h-5 text-[#8d6e63]" />
        诊疗记录
      </h3>
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {recentLogs.map((log, index) => (
          <motion.div
            key={log.id}
            className="relative pl-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {index < recentLogs.length - 1 && (
              <div
                className="absolute left-[11px] top-6 w-0.5 h-full"
                style={{ backgroundColor: 'rgba(201, 169, 110, 0.3)' }}
              />
            )}
            
            <div
              className="absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: getTimeColor(log.timestamp) }}
            >
              <Clock className="w-3 h-3 text-white" />
            </div>

            <div className="bg-[#f5f0e0] rounded-lg p-3 ml-2 card-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#6d4c41]">
                  {formatTime(log.timestamp)} {getTimePeriod(log.timestamp)}
                </span>
                <span className="text-sm font-bold text-[#c9a96e]">
                  ¥{log.totalPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {log.medicines.map((med, i) => (
                  <span
                    key={i}
                    className="inline-block px-2 py-0.5 bg-[#c9a96e]/20 rounded text-xs text-[#3e2723]"
                  >
                    {med.name} {med.quantity}g
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;
