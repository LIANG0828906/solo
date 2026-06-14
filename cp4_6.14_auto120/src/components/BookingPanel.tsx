import { useState, useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { useStore, type Course } from '@/store/useStore';
import BookingModal from './BookingModal';

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = WEEKDAYS[d.getDay()];
  return `${month}/${day} ${weekday}`;
}

function SlotCard({ course, onClick }: { course: Course; onClick: () => void }) {
  const remaining = course.capacity - course.bookings.length;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md hover:border-blue-300 transition-all duration-150"
    >
      <div className="font-medium text-gray-800 text-sm mb-1">{course.name}</div>
      <div className="text-xs text-gray-500 mb-2">{course.coach}</div>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold ${remaining > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
          剩余 {remaining}
        </span>
        <span className="text-xs text-gray-400">{course.capacity}人满</span>
      </div>
    </button>
  );
}

export default function BookingPanel() {
  const courses = useStore(s => s.courses);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const { dates, timeSlots } = useMemo(() => {
    const uniqueDates = [...new Set(courses.map(c => c.date))].sort();
    const slots: Course['timeSlot'][] = ['09:00', '14:00', '19:00'];
    return { dates: uniqueDates, timeSlots: slots };
  }, [courses]);

  const getCourse = (date: string, slot: Course['timeSlot']) =>
    courses.find(c => c.date === date && c.timeSlot === slot);

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
        <Calendar className="w-5 h-5 text-blue-500" />
        <h2 className="text-base font-semibold text-gray-800">课程预约</h2>
      </div>
      <div className="overflow-x-auto p-4">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-[100px_repeat(7,1fr)] gap-2 mb-2">
            <div />
            {dates.map(date => (
              <div key={date} className="text-center text-xs font-medium text-gray-500 py-2">
                {formatDateLabel(date)}
              </div>
            ))}
          </div>
          {timeSlots.map(slot => (
            <div key={slot} className="grid grid-cols-[100px_repeat(7,1fr)] gap-2 mb-2">
              <div className="flex items-center justify-center text-sm font-medium text-gray-600 bg-slate-50 rounded-lg">
                {slot}
              </div>
              {dates.map(date => {
                const course = getCourse(date, slot);
                return (
                  <div key={`${date}-${slot}`}>
                    {course ? (
                      <SlotCard course={course} onClick={() => setSelectedCourse(course)} />
                    ) : (
                      <div className="h-full bg-gray-50 rounded-lg p-3 text-xs text-gray-400">
                        无课程
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {selectedCourse && (
        <BookingModal course={selectedCourse} onClose={() => setSelectedCourse(null)} />
      )}
    </div>
  );
}
