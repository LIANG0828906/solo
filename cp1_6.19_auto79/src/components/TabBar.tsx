import { motion } from 'framer-motion';
import { FaCalendarDay, FaCalendarWeek, FaChartPie } from 'react-icons/fa';
import { ViewType } from '@/types/types';

interface TabBarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const tabs: Array<{ id: ViewType; label: string; icon: React.ReactNode }> = [
  { id: 'day', label: '日视图', icon: <FaCalendarDay size={18} /> },
  { id: 'week', label: '周视图', icon: <FaCalendarWeek size={18} /> },
  { id: 'statistics', label: '统计', icon: <FaChartPie size={18} /> },
];

export default function TabBar({ currentView, onViewChange }: TabBarProps) {
  const activeIndex = tabs.findIndex((t) => t.id === currentView);

  return (
    <div className="relative flex justify-around items-center h-16 bg-[#1E1E3F] border-t border-[#3A3A5C] px-4">
      {tabs.map((tab, index) => (
        <button
          key={tab.id}
          onClick={() => onViewChange(tab.id)}
          className="relative flex flex-col items-center justify-center gap-1 py-2 px-4 transition-colors duration-200 z-10 md:w-auto w-full"
        >
          <span
            className={`transition-colors duration-200 ${
              currentView === tab.id ? 'text-[#6C63FF]' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.icon}
          </span>
          <span
            className={`text-xs transition-colors duration-200 ${
              currentView === tab.id ? 'text-[#6C63FF] font-medium' : 'text-gray-400'
            }`}
          >
            {tab.label}
          </span>
        </button>
      ))}

      <motion.div
        className="absolute bottom-0 h-0.5 bg-[#6C63FF] rounded-t"
        initial={false}
        animate={{
          left: `${(activeIndex * 100) / tabs.length}%`,
          width: `${100 / tabs.length}%`,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.3 }}
        style={{ marginLeft: `${(100 / tabs.length) * 0.2}%`, width: `${(100 / tabs.length) * 0.6}%` }}
      />
    </div>
  );
}
