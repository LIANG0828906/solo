import { useDiaryStore } from '@/features/useDiaryStore';
import { formatDate, formatDateDisplay } from '@/utils/helpers';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TimelineProps {
  dates: string[];
}

export const Timeline = ({ dates }: TimelineProps) => {
  const navigate = useNavigate();
  const { currentDiaryId, setCurrentDiaryId, diaryList } = useDiaryStore();
  const today = formatDate(new Date());
  const allDates = [...new Set([today, ...dates])].sort().reverse();

  const handleDateClick = (date: string) => {
    const diary = diaryList.find((d) => d.date === date);
    setCurrentDiaryId(diary?.id || null);
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[280px] bg-[#2B2D42] text-[#EDF2F4] overflow-y-auto">
      <div className="p-8">
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-wide mb-1">声音日记</h1>
          <p className="text-sm text-[#EDF2F4]/60">档案馆</p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="mb-8 flex items-center gap-2 text-[#EDF2F4]/70 hover:text-[#EDF2F4] transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          返回首页
        </button>

        <nav className="relative">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[#EDF2F4]/15" />
          
          <ul className="space-y-2">
            {allDates.map((date, index) => {
              const isToday = date === today;
              const hasDiary = dates.includes(date);
              const diary = diaryList.find((d) => d.date === date);
              const isSelected = diary && diary.id === currentDiaryId;

              return (
                <li key={date} className="relative">
                  <button
                    onClick={() => handleDateClick(date)}
                    className="w-full flex items-center gap-4 py-3 group"
                  >
                    <span className="relative z-10 flex items-center justify-center w-6 h-6 flex-shrink-0">
                      <span
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          isToday
                            ? 'bg-[#E63946] shadow-[0_0_12px_rgba(230,57,70,0.8)] animate-pulse'
                            : isSelected
                            ? 'bg-[#EDF2F4] scale-110'
                            : hasDiary
                            ? 'bg-[#EDF2F4]/60 group-hover:bg-[#EDF2F4]/90'
                            : 'bg-[#EDF2F4]/20 group-hover:bg-[#EDF2F4]/40'
                        }`}
                      />
                    </span>
                    <div className="flex-1 min-w-0 text-left">
                      <div className={`text-sm transition-colors ${
                        isSelected ? 'text-[#EDF2F4]' : 'text-[#EDF2F4]/70 group-hover:text-[#EDF2F4]'
                      }`}>
                        {isToday && <span className="text-[#E63946] font-semibold mr-1">今天</span>}
                        {formatDateDisplay(date)}
                      </div>
                      {!hasDiary && index === 0 && (
                        <div className="text-xs text-[#EDF2F4]/30 mt-0.5">点击记录今日</div>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
};
