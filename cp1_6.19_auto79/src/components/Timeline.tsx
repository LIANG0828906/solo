import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimeBlock as TimeBlockType, Category, ViewType, CATEGORY_COLORS } from '@/types/types';
import { getCurrentDate } from '@/data/store';
import TimeBlock from './TimeBlock';
import EditCard from './EditCard';

interface TimelineProps {
  viewType: ViewType;
  blocks: TimeBlockType[];
  onBlockCreate: (block: Omit<TimeBlockType, 'id'>) => void;
  onBlockEdit: (id: string, updates: Partial<TimeBlockType>) => void;
  onBlockDelete: (id: string) => void;
}

const SLOT_HEIGHT = 40;
const TOTAL_HEIGHT = 24 * 2 * SLOT_HEIGHT;

function snapToGrid(minutes: number): number {
  return Math.round(minutes / 30) * 30;
}

export default function Timeline({ viewType, blocks, onBlockCreate, onBlockEdit, onBlockDelete }: TimelineProps) {
  const [currentTime, setCurrentTime] = useState<number>(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ minutes: number; date: string } | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [editingBlock, setEditingBlock] = useState<TimeBlockType | null>(null);
  const [editPosition, setEditPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.getHours() * 60 + now.getMinutes());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current && viewType === 'day') {
      const scrollTop = (currentTime / 1440) * TOTAL_HEIGHT - 200;
      scrollContainerRef.current.scrollTop = Math.max(0, scrollTop);
    }
  }, []);

  const getDateForColumn = useCallback((columnIndex: number): string => {
    if (viewType === 'week') {
      const now = new Date();
      now.setDate(now.getDate() - (6 - columnIndex));
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return getCurrentDate();
  }, [viewType]);

  const getMinutesFromEvent = useCallback((e: React.MouseEvent | MouseEvent, rect: DOMRect): number => {
    const y = e.clientY - rect.top;
    const minutes = (y / TOTAL_HEIGHT) * 1440;
    return snapToGrid(Math.max(0, Math.min(1440, minutes)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, columnIndex: number) => {
    if (e.button !== 0) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const minutes = getMinutesFromEvent(e, rect);
    const date = getDateForColumn(columnIndex);
    setIsDragging(true);
    setDragStart({ minutes, date });
    setDragEnd(minutes + 30);
    e.preventDefault();
  }, [getMinutesFromEvent, getDateForColumn]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const minutes = getMinutesFromEvent(e, rect);
    if (dragStart && minutes !== dragStart.minutes) {
      setDragEnd(minutes);
    }
  }, [isDragging, dragStart, getMinutesFromEvent]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && dragStart && dragEnd !== null) {
      const startTime = Math.min(dragStart.minutes, dragEnd);
      const endTime = Math.max(dragStart.minutes, dragEnd);
      if (endTime - startTime >= 30) {
        onBlockCreate({
          startTime,
          endTime,
          category: Category.Other,
          color: CATEGORY_COLORS[Category.Other],
          name: '',
          note: '',
          date: dragStart.date,
        });
      }
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, dragStart, dragEnd, onBlockCreate]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleBlockClick = useCallback((block: TimeBlockType, e: React.MouseEvent) => {
    setEditingBlock(block);
    setEditPosition({ x: e.clientX, y: e.clientY });
  }, []);

  const calculateBlockPosition = useCallback((block: TimeBlockType) => {
    const top = (block.startTime / 1440) * TOTAL_HEIGHT;
    const height = Math.max(SLOT_HEIGHT, ((block.endTime - block.startTime) / 1440) * TOTAL_HEIGHT);
    return { top, height };
  }, []);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  const renderTimelineColumn = (columnIndex: number, date: string, showHeader: boolean = false) => {
    const columnBlocks = blocks.filter(b => b.date === date);
    const isToday = date === getCurrentDate();

    return (
      <div
        key={date}
        className="relative flex-1 h-full overflow-hidden"
        onMouseDown={(e) => handleMouseDown(e, columnIndex)}
        ref={columnIndex === 0 ? containerRef : null}
      >
        {showHeader && (
          <div className="h-8 flex items-center justify-center border-b border-[#3A3A5C] bg-[#1A1A2E]">
            <span className={`text-xs font-medium ${isToday ? 'text-[#6C63FF]' : 'text-gray-400'}`}>
              {viewType === 'week' ? weekDays[columnIndex] : '今天'}
            </span>
          </div>
        )}

        <div className="relative h-full">
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute w-full border-b border-[#3A3A5C]/30"
              style={{ top: `${(hour * 60 / 1440) * TOTAL_HEIGHT}px` }}
            >
              {hour % 2 === 0 && (
                <div className="absolute w-full border-b border-[#3A3A5C]/60" />
              )}
            </div>
          ))}

          {isToday && (
            <motion.div
              className="absolute left-0 right-0 h-0.5 bg-[#E74C3C] time-indicator z-20 pointer-events-none"
              style={{ top: `${(currentTime / 1440) * TOTAL_HEIGHT}px` }}
            >
              <div
                className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-[#2ECC71]"
                style={{ boxShadow: '0 0 8px #2ECC71' }}
              />
            </motion.div>
          )}

          {isDragging && dragStart && dragEnd !== null && dragStart.date === date && (
            <motion.div
              className="absolute left-10 right-4 z-30 pointer-events-none"
              style={{
                top: `${(Math.min(dragStart.minutes, dragEnd) / 1440) * TOTAL_HEIGHT}px`,
                height: `${Math.max(SLOT_HEIGHT, (Math.abs(dragEnd - dragStart.minutes) / 1440) * TOTAL_HEIGHT)}px`,
                backgroundColor: 'rgba(74, 144, 217, 0.5)',
                borderRadius: '8px',
              }}
              initial={{ opacity: 0.8 }}
            />
          )}

          {columnBlocks.map((block) => {
            const { top, height } = calculateBlockPosition(block);
            return (
              <TimeBlock
                key={block.id}
                block={block}
                top={top}
                height={height}
                onClick={(e) => handleBlockClick(block, e)}
                isWeekView={viewType === 'week'}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-10 flex-shrink-0 bg-[#0F0F23] z-10">
        {viewType !== 'statistics' && (
          <>
            <div className="h-8 border-b border-[#3A3A5C] bg-[#1A1A2E]" />
            <div className="relative" style={{ height: TOTAL_HEIGHT }}>
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute w-full flex items-start justify-end pr-1"
                  style={{ top: `${(hour * 60 / 1440) * TOTAL_HEIGHT}px` }}
                >
                  <span className="text-[10px] text-gray-500 font-mono">
                    {String(hour).padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide"
        style={{
          background: 'linear-gradient(180deg, #1A1A2E 0%, #16213E 100%)',
        }}
      >
        <AnimatePresence mode="wait">
          {viewType === 'day' && (
            <motion.div
              key="day"
              className="flex h-full"
              style={{ height: TOTAL_HEIGHT + 32 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex-1 flex flex-col h-full">
                {renderTimelineColumn(0, getCurrentDate(), true)}
              </div>
            </motion.div>
          )}

          {viewType === 'week' && (
            <motion.div
              key="week"
              className="flex h-full"
              style={{ height: TOTAL_HEIGHT + 32 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {Array.from({ length: 7 }, (_, i) => {
                const date = getDateForColumn(i);
                return (
                  <div key={date} className="flex-1 flex flex-col h-full relative">
                    {i > 0 && (
                      <div
                        className="absolute left-0 top-0 bottom-0 w-px border-l border-dashed border-[#3A3A5C] z-10"
                      />
                    )}
                    <div style={{ width: '75%' }} className="h-full">
                      {renderTimelineColumn(i, date, true)}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <EditCard
        block={editingBlock}
        position={editPosition}
        onSave={(updates) => editingBlock && onBlockEdit(editingBlock.id, updates)}
        onDelete={() => editingBlock && onBlockDelete(editingBlock.id)}
        onClose={() => setEditingBlock(null)}
      />
    </div>
  );
}
