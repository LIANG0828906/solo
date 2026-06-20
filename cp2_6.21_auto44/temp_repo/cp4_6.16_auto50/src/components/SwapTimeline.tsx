import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { SwapEvent, Item } from '@/types';
import { formatDate, getDaysDifference, getSwapLineColor, generateAvatar } from '@/utils/helpers';
import { ArrowRight, MessageCircle } from 'lucide-react';

interface SwapTimelineProps {
  itemId: string;
  item: Item | null;
  events: SwapEvent[];
}

export const SwapTimeline: React.FC<SwapTimelineProps> = ({ itemId, item, events }) => {
  const [sortedEvents, setSortedEvents] = useState<SwapEvent[]>([]);

  useEffect(() => {
    const sorted = [...events].sort((a, b) => a.swapDate.getTime() - b.swapDate.getTime());
    setSortedEvents(sorted);
  }, [events]);

  if (!item) {
    return <div className="text-center py-10 text-gray-500">物品不存在</div>;
  }

  const getLineColor = (index: number): string => {
    if (index >= sortedEvents.length - 1) return '#E8A87C';
    const current = sortedEvents[index].swapDate;
    const next = sortedEvents[index + 1].swapDate;
    const days = getDaysDifference(current, next);
    return getSwapLineColor(days);
  };

  const timelineEvents = sortedEvents.length > 0 ? sortedEvents : [];
  const initialHolder = timelineEvents.length > 0 ? timelineEvents[0].fromHolder : item.currentHolder;
  const initialAvatar = timelineEvents.length > 0 ? timelineEvents[0].fromAvatar : item.holderAvatar;

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{item.name}</h2>
        <p className="text-gray-600">共 {timelineEvents.length} 次交换记录</p>
      </motion.div>

      <div className="relative pl-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-8"
        >
          <div className="absolute left-[-24px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#E8A87C] border-4 border-white shadow-md z-10" />
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <img
                src={initialAvatar || generateAvatar(initialHolder)}
                alt={initialHolder}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-medium text-gray-800">{initialHolder}</p>
                <p className="text-sm text-[#E8A87C] font-medium">初始持有人</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">创建时间：{formatDate(item.createdAt)}</p>
          </div>
        </motion.div>

        {timelineEvents.length > 0 && (
          <div
            className="absolute left-[-17px] top-12 w-0.5"
            style={{
              height: `calc(100% - 3rem)`,
              background: `linear-gradient(to bottom, ${timelineEvents.map((_, i) => getLineColor(i)).join(', ')})`,
            }}
          />
        )}

        {timelineEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (index + 2) * 0.1 }}
            className="relative mb-8"
          >
            <div
              className="absolute left-[-24px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-white shadow-md z-10"
              style={{ backgroundColor: getLineColor(index) }}
            />
            
            {index < timelineEvents.length - 1 && (
              <div
                className="absolute left-[-17px] top-[calc(50%+8px)] w-0.5 h-[calc(100%+2rem)]"
                style={{ backgroundColor: getLineColor(index) }}
              />
            )}

            <motion.div
              layoutId={`event-${event.id}`}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-3">
                <img
                  src={event.fromAvatar || generateAvatar(event.fromHolder)}
                  alt={event.fromHolder}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">{event.fromHolder}</span>
                  <ArrowRight size={16} className="text-gray-400" />
                </div>
                <img
                  src={event.toAvatar || generateAvatar(event.toHolder)}
                  alt={event.toHolder}
                  className="w-10 h-10 rounded-full"
                />
                <span className="font-medium text-gray-700">{event.toHolder}</span>
              </div>

              <div className="text-sm text-gray-600 mb-2">
                <span className="font-medium">交换时间：</span>
                {formatDate(event.swapDate)}
              </div>

              {event.note && (
                <div className="flex items-start gap-2 p-3 bg-[#FFF1D0] rounded-lg">
                  <MessageCircle size={14} className="text-[#E8A87C] mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{event.note}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        ))}

        {timelineEvents.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-gray-500"
          >
            暂无交换记录，这是物品的起点！
          </motion.div>
        )}
      </div>
    </div>
  );
};
