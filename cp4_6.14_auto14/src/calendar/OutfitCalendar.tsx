import React, { useState } from 'react';
import { useWardrobeStore } from '@/store';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface OutfitCalendarProps {}

const OutfitCalendar: React.FC<OutfitCalendarProps> = () => {
  const { outfits, assignDailyOutfit, removeDailyOutfit, getOutfitForDate, items } = useWardrobeStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const formatDate = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const days: (number | null)[] = [];
  for (let i = 0; i < startingDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">穿搭日历</h1>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold">
            {year}年 {month + 1}月
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center py-2 text-sm font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dateStr = formatDate(day);
            const outfit = getOutfitForDate(dateStr);
            const isSelected = selectedDate === dateStr;

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                className={`aspect-square p-1 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-50 ring-2 ring-blue-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="h-full flex flex-col">
                  <span className="text-sm font-medium">{day}</span>
                  {outfit && outfit.items.length > 0 && (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="flex gap-0.5">
                        {outfit.items.slice(0, 3).map((itemId) => {
                          const item = items.find((i) => i.id === itemId);
                          return item ? (
                            <div
                              key={itemId}
                              className="w-4 h-4 rounded-full border border-white"
                              style={{ backgroundColor: item.color }}
                            />
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="mt-6 bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">{selectedDate}</h3>
          {getOutfitForDate(selectedDate) ? (
            <div>
              <p className="mb-4">
                已安排：<span className="font-medium">{getOutfitForDate(selectedDate)?.name}</span>
              </p>
              <button
                onClick={() => {
                  removeDailyOutfit(selectedDate);
                  setSelectedDate(null);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                移除安排
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-500 mb-4">选择一个穿搭安排到这一天：</p>
              {outfits.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {outfits.map((outfit) => (
                    <button
                      key={outfit.id}
                      onClick={() => {
                        assignDailyOutfit(selectedDate, outfit.id);
                        setSelectedDate(null);
                      }}
                      className="p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                    >
                      <p className="font-medium">{outfit.name}</p>
                      <div className="flex gap-1 mt-2">
                        {outfit.items.map((itemId) => {
                          const item = items.find((i) => i.id === itemId);
                          return item ? (
                            <div
                              key={itemId}
                              className="w-6 h-6 rounded-full border border-gray-200"
                              style={{ backgroundColor: item.color }}
                            />
                          ) : null;
                        })}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">暂无穿搭，请先创建穿搭</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OutfitCalendar;
