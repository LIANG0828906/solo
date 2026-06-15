import { Bell, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function TopBar() {
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekDay = weekDays[now.getDay()];
    setCurrentDate(`${year}年${month}月${day}日 ${weekDay}`);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-6">
        <span className="text-sm text-gray-600">{currentDate}</span>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Sun size={18} className="text-amber-500" />
          <span>晴 22°C</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>
    </header>
  );
}
