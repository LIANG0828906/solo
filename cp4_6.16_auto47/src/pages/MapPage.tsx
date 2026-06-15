import React, { useState, useEffect, useRef, memo } from 'react';
import { useDeskStore } from '@/stores/deskStore';
import { format } from 'date-fns';
import type { Desk, TimeSlot } from '@/types';

const DeskCard = memo(function DeskCard({
  desk,
  onClick,
}: {
  desk: Desk;
  onClick: () => void;
}) {
  const statusClass =
    desk.status === 'free'
      ? 'desk-status-free'
      : desk.status === 'booked'
      ? 'desk-status-booked'
      : 'desk-status-checked-in';

  const statusLabel =
    desk.status === 'free' ? '空闲' : desk.status === 'booked' ? '已预订' : '已签到';

  return (
    <div
      className={`desk-card ${statusClass} cursor-pointer rounded-[2px] shadow-md flex items-center justify-center text-white font-medium text-sm relative group`}
      style={{ width: '60px', height: '60px' }}
      onClick={desk.status === 'free' ? onClick : undefined}
      title={`工位 ${desk.id} - ${statusLabel}`}
    >
      <span>{desk.id}</span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
        工位 {desk.id} - {statusLabel}
      </div>
    </div>
  );
});

function BookingModal({
  desk,
  onClose,
  onConfirm,
}: {
  desk: Desk;
  onClose: () => void;
  onConfirm: (date: string, timeSlot: TimeSlot) => void;
}) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [timeSlot, setTimeSlot] = useState<TimeSlot>('full');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(date, timeSlot);
  };

  return (
    <div
      className="fixed inset-0 modal-overlay flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 w-[400px] max-w-[90vw] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-800">预约工位 {desk.id}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">预约日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">预约时段</label>
            <div className="flex gap-2">
              {(['morning', 'afternoon', 'full'] as TimeSlot[]).map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setTimeSlot(slot)}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    timeSlot === slot
                      ? 'bg-[#4CAF50] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {slot === 'morning' ? '上午' : slot === 'afternoon' ? '下午' : '全天'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-[#4CAF50] text-white rounded-md font-medium hover:bg-[#43A047] transition-colors"
            >
              确认预约
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MapPage() {
  const { desks, bookDesk, initialized, initializeData } = useDeskStore();
  const [selectedDesk, setSelectedDesk] = useState<Desk | null>(null);
  const renderStartTime = useRef(performance.now());

  useEffect(() => {
    if (!initialized) {
      initializeData();
    }
  }, [initialized, initializeData]);

  useEffect(() => {
    if (desks.length > 0) {
      const renderTime = performance.now() - renderStartTime.current;
      console.log(`[MapPage] 初次渲染耗时: ${renderTime.toFixed(2)}ms`);
    }
  }, [desks.length]);

  const handleBookDesk = async (date: string, timeSlot: TimeSlot) => {
    if (!selectedDesk) return;
    await bookDesk(selectedDesk.id, date, timeSlot);
    setSelectedDesk(null);
  };

  const rows: Desk[][] = [];
  for (let i = 0; i < 5; i++) {
    rows.push(desks.slice(i * 6, i * 6 + 6));
  }

  if (!initialized || desks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[80%] mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">工位地图</h1>
        <p className="text-gray-500 text-sm">选择一个空闲工位进行预约</p>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded desk-status-free"></div>
          <span className="text-sm text-gray-600">空闲</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded desk-status-booked"></div>
          <span className="text-sm text-gray-600">已预订</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded desk-status-checked-in"></div>
          <span className="text-sm text-gray-600">已签到</span>
        </div>
      </div>

      <div
        className="bg-white rounded-lg p-6 shadow-md"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      >
        <div className="flex flex-col gap-4 items-center">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-4">
              {row.map((desk) => (
                <DeskCard
                  key={desk.id}
                  desk={desk}
                  onClick={() => setSelectedDesk(desk)}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="mt-6 text-center text-sm text-gray-400">
          共 30 个工位 · {desks.filter((d) => d.status === 'free').length} 个可用
        </div>
      </div>

      {selectedDesk && (
        <BookingModal
          desk={selectedDesk}
          onClose={() => setSelectedDesk(null)}
          onConfirm={handleBookDesk}
        />
      )}
    </div>
  );
}
