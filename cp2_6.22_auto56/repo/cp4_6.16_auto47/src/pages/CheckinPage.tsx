import { useState, useEffect, useMemo } from 'react';
import { useDeskStore } from '@/stores/deskStore';
import { format, differenceInMinutes } from 'date-fns';
import { formatFullTime, formatDuration, getDateRangeForPicker } from '@/utils/dateUtils';
import type { CheckinRecord } from '@/types';

function TimelineCard({ record, index }: { record: CheckinRecord; index: number }) {
  const isCheckin = record.operationType === 'checkin';
  const isLeft = index % 2 === 0;

  return (
    <div
      className={`flex items-start gap-4 animate-fade-in-up ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
      style={{ animationDelay: `${index * 0.1}s`, opacity: 0 }}
    >
      <div className="flex flex-col items-center pt-1">
        <div className="timeline-dot"></div>
      </div>

      <div className={`flex-1 ${isLeft ? 'text-left' : 'text-right'}`}>
        <div
          className={`inline-block bg-white rounded-lg p-4 shadow-md max-w-[300px] ${
            isLeft ? 'text-left' : 'text-right'
          }`}
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                isCheckin ? 'bg-[#4CAF50]' : 'bg-[#FF9800]'
              }`}
            ></span>
            <span className="font-medium text-gray-800">
              {isCheckin ? '签到' : '签退'}
            </span>
          </div>
          <div className="text-sm text-gray-500 mb-1">
            工位 {record.deskId}
          </div>
          <div className="text-lg font-semibold text-gray-800">
            {formatFullTime(record.timestamp)}
          </div>
          {!isCheckin && record.workMinutes > 0 && (
            <div className="text-xs text-[#4CAF50] mt-2 font-medium">
              工作时长: {formatDuration(record.workMinutes)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <svg
        width="160"
        height="160"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mb-4"
      >
        <ellipse cx="100" cy="165" rx="60" ry="8" fill="#E0E0E0" />
        <rect x="60" y="140" width="80" height="6" rx="2" fill="#B0BEC5" />
        <rect x="50" y="130" width="10" height="20" rx="2" fill="#90A4AE" />
        <rect x="140" y="130" width="10" height="20" rx="2" fill="#90A4AE" />
        <circle cx="100" cy="95" r="28" fill="#FFE0B2" />
        <path d="M78 85 Q75 75 85 72 Q92 65 100 70 Q108 65 115 72 Q125 75 122 85" fill="#795548" />
        <ellipse cx="90" cy="95" rx="4" ry="5" fill="#333" />
        <ellipse cx="110" cy="95" rx="4" ry="5" fill="#333" />
        <path d="M88 108 Q100 118 112 108" stroke="#333" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M85 105 Q88 103 91 105" stroke="#666" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M109 105 Q112 103 115 105" stroke="#666" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <rect x="80" y="120" width="40" height="25" rx="4" fill="#64B5F6" />
        <rect x="60" y="122" width="25" height="15" rx="3" fill="#FFE0B2" />
        <rect x="115" y="122" width="25" height="15" rx="3" fill="#FFE0B2" />
        <circle cx="135" cy="128" r="3" fill="#FF8A65" />
        <path d="M135 115 L135 120" stroke="#FF8A65" strokeWidth="2" strokeLinecap="round" />
        <path d="M130 110 Q135 105 140 110" stroke="#FF8A65" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
      <div className="text-gray-500 text-lg font-medium mb-1">今天还没有签到记录</div>
      <div className="text-gray-400 text-sm">开始工作前，记得先签到哦～</div>
    </div>
  );
}

export default function CheckinPage() {
  const {
    currentUserId,
    desks,
    checkinRecords,
    checkin,
    checkout,
    initializeData,
    initialized,
    getRecordsByDate,
  } = useDeskStore();

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [currentTime, setCurrentTime] = useState(new Date());
  const dateRange = useMemo(() => getDateRangeForPicker(), []);

  useEffect(() => {
    if (!initialized) {
      initializeData();
    }
  }, [initialized, initializeData]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const myBookedDesk = desks.find(
    (d) => d.bookedBy === currentUserId && d.status === 'booked'
  );
  const myCheckedInDesk = desks.find(
    (d) => d.bookedBy === currentUserId && d.status === 'checked-in'
  );

  const dayRecords = getRecordsByDate(currentUserId, selectedDate);

  const handleCheckin = async () => {
    if (myBookedDesk) {
      await checkin(myBookedDesk.id);
    }
  };

  const handleCheckout = async () => {
    if (myCheckedInDesk) {
      await checkout(myCheckedInDesk.id);
    }
  };

  const elapsedMinutes = myCheckedInDesk?.checkinTime
    ? differenceInMinutes(currentTime, new Date(myCheckedInDesk.checkinTime))
    : 0;

  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[700px] mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">签到管理</h1>
        <p className="text-gray-500 text-sm">记录你的每日到离工时</p>
      </div>

      <div
        className="bg-white rounded-lg p-6 mb-6 shadow-md"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      >
        <div className="text-center mb-6">
          <div className="text-4xl font-mono font-bold text-gray-800 mb-2">
            {format(currentTime, 'HH:mm:ss')}
          </div>
          <div className="text-gray-500 text-sm">
            {format(currentTime, 'yyyy年MM月dd日 EEEE')}
          </div>
        </div>

        {myCheckedInDesk ? (
          <div className="text-center mb-4">
            <span className="inline-block px-3 py-1 bg-blue-50 text-[#2196F3] rounded-full text-sm font-medium">
              正在工位 {myCheckedInDesk.id} 工作中
            </span>
            <div className="text-gray-500 text-sm mt-2">
              已工作 {formatDuration(elapsedMinutes)}
            </div>
          </div>
        ) : myBookedDesk ? (
          <div className="text-center mb-4">
            <span className="inline-block px-3 py-1 bg-orange-50 text-[#FF9800] rounded-full text-sm font-medium">
              已预约工位 {myBookedDesk.id}
            </span>
          </div>
        ) : (
          <div className="text-center mb-4 text-gray-500 text-sm">
            暂无预约，请先在工位地图页预约
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={handleCheckin}
            disabled={!myBookedDesk}
            className={`btn px-8 py-3 rounded-lg font-medium text-white ${
              myBookedDesk
                ? 'bg-[#4CAF50] hover:bg-[#43A047]'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            签到
          </button>
          <button
            onClick={handleCheckout}
            disabled={!myCheckedInDesk}
            className={`btn px-8 py-3 rounded-lg font-medium text-white ${
              myCheckedInDesk
                ? 'bg-[#FF9800] hover:bg-[#FB8C00]'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            签退
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">签到记录</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={dateRange.min}
          max={dateRange.max}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
        />
      </div>

      <div
        className="bg-white rounded-lg p-6 shadow-md"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      >
        {dayRecords.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="relative pl-2">
            <div className="absolute left-[5px] top-1 bottom-1 w-0.5 bg-gray-200"></div>
            <div className="space-y-6">
              {dayRecords.map((record, index) => (
                <TimelineCard key={record.id} record={record} index={index} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
